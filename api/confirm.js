// Confirm & Backfill: text-to-confirm appointments with a cutoff, plus a waitlist backfill.
// GET  ?s=<location>          desk view (settings, appointments with computed status, waitlist)
// GET  ?t=<token>             client view (one appointment or one backfill offer)
// POST {action, ...}          create | cancel | reminded | wl_add | wl_remove | backfill | accept | studio
// Status is computed on read (no timers). "First to accept wins" uses SET NX on cb:fill:<apptId>.
const crypto = require("crypto");
const store = require("./_store");

const DEFAULT_TERMS = "Cancel or reschedule at least 48 hours ahead or a $100 late-cancellation fee applies.";
const DEFAULT_TERMS_ES = "Cancele o cambie su cita con al menos 48 horas de anticipación o se aplicará un cargo de $100 por cancelación tardía.";
const DEMO = {
  seawall: {
    name: "Seawall Salon & Skin",
    terms: DEFAULT_TERMS,
    termsEs: DEFAULT_TERMS_ES,
    treatments: [
      { name: "Botox / injectables", price: 450 },
      { name: "Laser hair removal", price: 350 },
      { name: "IPL photofacial", price: 600 },
    ],
    deposit: 100,
    depositTerms: "A $100 deposit holds your spot and is applied to your treatment. We don't charge it here; the studio will collect it.",
    depositTermsEs: "Un depósito de $100 reserva su lugar y se aplica a su tratamiento. No se cobra aquí; el estudio lo cobrará.",
  },
  mesaclara: {
    name: "Mesa Clara Community Health Center, Main site",
    terms: "Please cancel or reschedule at least 48 hours ahead so another patient can have this time.",
    termsEs: "Por favor cancele o cambie su cita con al menos 48 horas de anticipación para que otro paciente pueda usar este horario.",
    treatments: [
      { name: "Primary care visit", price: 0 },
      { name: "Dental cleaning", price: 0 },
      { name: "Pediatric check-up", price: 0 },
      { name: "Behavioral health intake", price: 0 },
    ],
    deposit: 0,
    depositTerms: "",
    waitlist: [
      { name: "Maria Lopez", phone: "555-301-0101", lang: "es", treatment: "Primary care visit" },
      { name: "Jose Hernandez", phone: "555-301-0102", lang: "es", treatment: "Dental cleaning" },
      { name: "Ana Garcia", phone: "555-301-0103", lang: "es", treatment: "Pediatric check-up" },
      { name: "Sam Taylor", phone: "555-301-0104", lang: "en", treatment: "Primary care visit" },
      { name: "Luis Ramirez", phone: "555-301-0105", lang: "es", treatment: "Any" },
    ],
  },
  elimu: {
    name: "Elimu Plus Learning Centres",
    mode: "roster",
    currency: "KES",
    perCentre: true,
    cutoffDays: 21,
    centres: ["Westlands", "Kasarani", "Rongai"],
    terms: "Your child's seat is held until the confirmation deadline. Unconfirmed seats are offered to families on the waitlist.",
    termsEs: "",
    payNote: "Pay via M-Pesa Paybill 400200, Account: student name (or bank transfer).",
    treatments: [],
    deposit: 0,
    depositTerms: "",
    waitlist: [
      { name: "Grace Njeri (for Brian, Grade 5)", phone: "0712 555 101", lang: "en", treatment: "Any", centre: "Westlands" },
      { name: "Peter Otieno (for Faith, Grade 4)", phone: "0712 555 102", lang: "en", treatment: "Any", centre: "Westlands" },
      { name: "Aisha Mohamed (for Yusuf, Grade 6)", phone: "0712 555 103", lang: "en", treatment: "Any", centre: "Kasarani" },
      { name: "John Mwangi (for Ivy, Grade 3)", phone: "0712 555 104", lang: "en", treatment: "Any", centre: "Rongai" },
    ],
  },
};
DEMO.halcyon = {
  name: "Halcyon Shore Hotels",
  mode: "hire",
  autoAdvance: true,
  properties: ["Halcyon Shore Santa Monica", "Halcyon Shore Laguna Beach"],
  roles: ["Front desk agent", "Housekeeper", "Line cook", "Banquet server"],
  terms: "", termsEs: "", treatments: [], deposit: 0, depositTerms: "",
};
// Demo roster for Elimu: Term 1 2027 starts in ~6 weeks; confirm by 3 weeks before.
const ELIMU_ROSTER = [
  ["Wanjiru Kamau", "Achieng (Grade 4)", "Westlands", 58500, { accepted: true }],
  ["David Kiprop", "Kevin (Grade 6)", "Westlands", 58500, { missed: true }],
  ["Mary Wambui", "Joy (Grade 3)", "Westlands", 52000, {}],
  ["Hassan Ali", "Amina (Grade 5)", "Westlands", 58500, { lapsed: true }],
  ["Esther Chebet", "Collins (Grade 7)", "Kasarani", 61000, { complaint: true }],
  ["Samuel Ndungu", "Mercy (Grade 4)", "Kasarani", 58500, { accepted: true }],
  ["Lucy Atieno", "Tom (Grade 5)", "Kasarani", 58500, {}],
  ["Paul Mutua", "Ann (Grade 6)", "Rongai", 58500, { accepted: true }],
];

const clean = (v, n = 200) => String(v == null ? "" : v).trim().slice(0, n);
const lang = (v) => (v === "es" ? "es" : "en");
const sid = (v) => {
  const s = String(v || "").toLowerCase();
  return /^[a-z0-9-]{1,40}$/.test(s) ? s : null;
};
const id = (n = 8) => crypto.randomBytes(n).toString("base64url");
const K = {
  studio: (s) => `cb:studio:${s}`,
  appts: (s) => `cb:appts:${s}`,
  appt: (a) => `cb:appt:${a}`,
  wl: (s) => `cb:wl:${s}`,
  tok: (t) => `cb:tok:${t}`,
  fill: (a) => `cb:fill:${a}`,
};

async function studio(s) {
  const saved = await store.get(K.studio(s));
  const { waitlist: _w, ...base } = DEMO[s] || {
    name: s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    terms: DEFAULT_TERMS,
    termsEs: DEFAULT_TERMS_ES,
    treatments: [],
    deposit: 0,
    depositTerms: "",
  };
  return { id: s, deskPhone: "", cutoffHours: 48, backfillN: 3, ...base, ...(saved || {}) };
}

async function waitlist(s) {
  let wl = await store.get(K.wl(s));
  if (wl == null && DEMO[s] && DEMO[s].waitlist) {
    wl = DEMO[s].waitlist.map((w) => ({ id: id(5), earliest: "", added: new Date().toISOString(), ...w }));
    await store.put(K.wl(s), wl);
  }
  return wl || [];
}

function statusOf(a, now = Date.now()) {
  if (a.cancelledAt && (!a.filledBy || a.cancelledAt > a.filledBy.at)) return "CANCELLED";
  if (a.filledBy) return "FILLED";
  if (a.acceptedAt) return "CONFIRMED";
  if (now > Date.parse(a.cutoff)) return "LAPSED";
  return "PENDING";
}
// One reminder, offered once we're past the halfway point between booking and the cutoff.
const reminderDue = (a, now = Date.now()) =>
  statusOf(a, now) === "PENDING" && !a.reminderSentAt && now >= (Date.parse(a.created) + Date.parse(a.cutoff)) / 2;
const withStatus = (a) => ({ ...a, lang: lang(a.lang), status: statusOf(a), reminderDue: reminderDue(a) });

async function loadAppts(s) {
  const ids = await store.list(K.appts(s));
  const rows = await store.mget(ids.map((x) => K.appt(x)));
  return rows.filter(Boolean).map(withStatus).sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

const sameTreatment = (want, t) => {
  const w = clean(want).toLowerCase();
  return !w || w === "any" || w === clean(t).toLowerCase();
};
const availableBy = (w, at) => !w.earliest || Date.parse(w.earliest) <= Date.parse(at);

function rosterEntry(s, f, opts = {}) {
  const at = Date.parse(f.at);
  const days = f.cutoffDays === "" || f.cutoffDays == null ? 21 : Number(f.cutoffDays);
  const a = {
    id: id(6), s, client: clean(f.client, 80), phone: clean(f.phone, 30), lang: lang(f.lang),
    treatment: `${clean(f.term, 40) || "Term"} seat · ${clean(f.seat, 60)}`,
    term: clean(f.term, 40), seat: clean(f.seat, 60), centre: clean(f.centre, 40),
    price: Number(f.price) || 0, currency: clean(f.currency, 6) || "KES",
    at: new Date(at).toISOString(), cutoffHours: days * 24, cutoff: new Date(at - days * 86400e3).toISOString(),
    terms: clean(f.terms, 500), payNote: clean(f.payNote, 200),
    risk: { missed: !!f.missed, complaint: !!f.complaint },
    created: opts.created || new Date().toISOString(), token: id(9), offers: [],
  };
  return a;
}
async function saveNew(s, a) {
  await store.put(K.tok(a.token), { a: a.id, k: "c" });
  await store.put(K.appt(a.id), a);
  await store.push(K.appts(s), a.id);
}
function hireEntry(s, f, kind, opts = {}) {
  const now = Date.now();
  const hours = Number(f.cutoffHours) || (kind === "offer" ? 48 : 72);
  return {
    id: id(6), s, kind, client: clean(f.client, 80), phone: clean(f.phone, 30), lang: lang(f.lang),
    property: clean(f.property, 60), role: clean(f.role, 60),
    treatment: `${clean(f.role, 60)} at ${clean(f.property, 60)}`,
    start: kind === "offer" ? clean(f.start, 30) : "", pay: kind === "offer" ? clean(f.pay, 40) : "",
    candidate: f.candidate || "", price: 0,
    created: opts.created || new Date(now).toISOString(),
    cutoffHours: hours, cutoff: new Date(Date.parse(opts.created || new Date(now).toISOString()) + hours * 3600e3).toISOString(),
    at: kind === "offer" && Date.parse(f.start) ? new Date(Date.parse(f.start)).toISOString() : new Date(Date.parse(opts.created || new Date(now).toISOString()) + hours * 3600e3).toISOString(),
    token: id(9), offers: [],
  };
}
async function seedHalcyon() {
  if ((await store.list(K.appts("halcyon"))).length) return;
  if (!(await store.setnx("cb:seeded:halcyon", { at: Date.now() }))) return;
  const now = Date.now(), h = (n) => new Date(now - n * 3600e3).toISOString();
  const P = DEMO.halcyon.properties;
  const rows = [
    ["Marisol Vega", "310 555 0141", P[0], "Front desk agent", 30, true],
    ["Jordan Lee", "310 555 0142", P[0], "Front desk agent", 20, true],
    ["Priya Nair", "310 555 0143", P[0], "Front desk agent", 5, false],
    ["Carlos Ruiz", "949 555 0144", P[1], "Line cook", 50, true],
    ["Dana Brooks", "949 555 0145", P[1], "Housekeeper", 80, false],
    ["Tomas Silva", "949 555 0146", P[1], "Line cook", 10, true],
  ];
  const made = [];
  for (const [client, phone, property, role, ago, confirmed] of rows) {
    const a = hireEntry("halcyon", { client, phone, property, role }, "intake", { created: h(ago) });
    if (confirmed) { a.acceptedAt = h(ago - 2); a.acceptedName = client; }
    await saveNew("halcyon", a); made.push(a);
  }
  // An offer to Marisol that lapsed, so auto-advance has something to show.
  const o = hireEntry("halcyon", { client: "Marisol Vega", phone: "310 555 0141", property: P[0], role: "Front desk agent", start: new Date(now + 10 * 86400e3).toISOString().slice(0, 10), pay: "$24/hr", candidate: made[0].id }, "offer", { created: h(50) });
  await saveNew("halcyon", o);
}
async function seedHalcyonRetention() {
  if (!(await store.setnx("cb:seeded:halcyon-ret", { at: Date.now() }))) return;
  const now = Date.now(), d = (n) => new Date(now - n * 86400e3).toISOString();
  const P = DEMO.halcyon.properties;
  const hires = [
    ["Leah Morgan", "310 555 0151", P[0], "Housekeeper", 75, { 7: "good", 30: "good", 60: "good" }],
    ["Andre Wilson", "310 555 0152", P[0], "Banquet server", 40, { 7: "good", 30: "schedule" }],
    ["Sofia Reyes", "949 555 0153", P[1], "Front desk agent", 95, { 7: "good", 30: "good", 60: "good", 90: "good" }],
    ["Ben Carter", "949 555 0154", P[1], "Housekeeper", 33, { 7: "leaving" }],
    ["Grace Kim", "949 555 0155", P[1], "Line cook", 12, { 7: "good" }],
  ];
  for (const [client, phone, property, role, daysIn, ci] of hires) {
    const c = hireEntry("halcyon", { client, phone, property, role }, "intake", { created: d(daysIn + 14) });
    c.acceptedAt = d(daysIn + 13); c.acceptedName = client;
    await saveNew("halcyon", c);
    const o = hireEntry("halcyon", { client, phone, property, role, start: d(daysIn).slice(0, 10), pay: "$21/hr", candidate: c.id }, "offer", { created: d(daysIn + 10) });
    o.acceptedAt = d(daysIn + 9); o.acceptedName = client; o.dayOneAt = d(daysIn);
    o.checkins = Object.fromEntries(Object.entries(ci).map(([day, answer]) => [day, { answer, note: answer === "schedule" ? "Keep getting split shifts I didn't sign up for" : answer === "leaving" ? "Resort down the road offered more hours" : "", at: d(daysIn - Number(day)) }]));
    await saveNew("halcyon", o);
  }
}
// Hiring: when an offer lapses, offer the same job to the next confirmed candidate (property + role), newest reply first.
async function autoAdvance(s, appts) {
  const st = await studio(s);
  if (!st.autoAdvance) return false;
  let changed = false;
  for (const o of appts.filter((a) => a.kind === "offer" && a.status === "LAPSED" && !a.advancedTo)) {
    const offered = new Set(appts.filter((a) => a.kind === "offer" && a.property === o.property && a.role === o.role).map((a) => a.candidate));
    const next = appts.filter((a) => a.kind === "intake" && a.status === "CONFIRMED" && a.property === o.property && a.role === o.role && !offered.has(a.id))
      .sort((x, y) => Date.parse(y.acceptedAt) - Date.parse(x.acceptedAt))[0];
    if (!(await store.setnx("cb:adv:" + o.id, { at: Date.now() }))) continue;
    const raw = await store.get(K.appt(o.id));
    if (next) {
      const n = hireEntry(s, { client: next.client, phone: next.phone, lang: next.lang, property: o.property, role: o.role, start: o.start, pay: o.pay, candidate: next.id }, "offer");
      n.autoFrom = o.client;
      await saveNew(s, n);
      raw.advancedTo = next.client;
    } else raw.advancedTo = "(no confirmed candidate left)";
    await store.put(K.appt(o.id), raw);
    changed = true;
  }
  return changed;
}

async function seedElimu() {
  if ((await store.list(K.appts("elimu"))).length) return;
  if (!(await store.setnx("cb:seeded:elimu", { at: Date.now() }))) return;
  const d = DEMO.elimu, now = Date.now(), start = new Date(now + 42 * 86400e3);
  start.setHours(8, 0, 0, 0);
  for (const [client, seat, centre, price, o] of ELIMU_ROSTER) {
    const a = rosterEntry("elimu", { client, phone: "0722 " + String(100000 + Math.floor(Math.random() * 899999)).slice(0, 3) + " " + String(Math.floor(Math.random() * 900) + 100), lang: "en", term: "Term 1 2027", seat, centre, price, currency: d.currency, at: start.toISOString(), cutoffDays: d.cutoffDays, terms: d.terms, payNote: d.payNote, missed: o.missed, complaint: o.complaint }, { created: new Date(now - 30 * 86400e3).toISOString() });
    if (o.accepted) { a.acceptedAt = new Date(now - 2 * 86400e3).toISOString(); a.acceptedName = client; }
    if (o.lapsed) { a.cutoff = new Date(now - 86400e3).toISOString(); a.cutoffHours = Math.round((Date.parse(a.at) - Date.parse(a.cutoff)) / 3600e3); }
    await saveNew("elimu", a);
  }
}

module.exports = async (req, res) => {
  try {
    if (!store.enabled) return res.status(503).json({ error: "Storage is not connected, so appointments can't be saved yet." });
    const q = req.query || {};

    if (req.method === "GET") {
      if (q.t) {
        const tok = await store.get(K.tok(clean(q.t, 40)));
        if (!tok) return res.status(404).json({ error: "This link isn't valid. Please contact the office. / Este enlace no es válido. Comuníquese con la oficina." });
        const a = await store.get(K.appt(tok.a));
        if (!a) return res.status(404).json({ error: "This appointment no longer exists. / Esta cita ya no existe." });
        if (tok.k === "ci") {
          const st0 = await studio(a.s), got = (a.checkins || {})[tok.day];
          return res.json({ kind: "checkin", studio: st0.name, name: a.client, role: a.role, property: a.property, day: tok.day, answered: got || null });
        }
        const st = await studio(a.s);
        const status = statusOf(a);
        let state; // what this visitor should see
        if (tok.k === "c") {
          state = status === "CONFIRMED" ? "accepted" : status === "CANCELLED" || status === "FILLED" ? "cancelled" : status === "LAPSED" ? "lapsed" : "open";
        } else {
          state = a.filledBy ? (a.filledBy.t === q.t ? "won" : "taken") : status === "CANCELLED" || status === "LAPSED" ? "open" : "taken";
        }
        return res.json({
          kind: tok.k === "c" ? "confirm" : "offer",
          lang: lang(tok.k === "c" ? a.lang : tok.lang),
          state,
          studio: st.name,
          name: tok.k === "c" ? a.client : tok.name,
          treatment: a.treatment,
          price: a.price,
          currency: a.currency || "",
          centre: a.centre || "",
          seat: a.seat || "",
          term: a.term || "",
          payNote: a.payNote || "",
          hire: a.kind || "",
          role: a.role || "",
          property: a.property || "",
          start: a.start || "",
          pay: a.pay || "",
          at: a.at,
          cutoff: a.cutoff,
          terms: a.terms,
          deposit: a.deposit,
          depositTerms: a.depositTerms,
          acceptedAt: tok.k === "c" ? a.acceptedAt || null : a.filledBy && a.filledBy.t === q.t ? a.filledBy.at : null,
        });
      }
      const s = sid(q.s);
      if (!s) return res.status(400).json({ error: "Add a location id to the address, e.g. ?s=seawall" });
      if (s === "elimu") await seedElimu();
      if (s === "halcyon") { await seedHalcyon(); await seedHalcyonRetention(); }
      let [st, appts, wl] = await Promise.all([studio(s), loadAppts(s), waitlist(s)]);
      if (appts.some((a) => a.kind === "offer") && (await autoAdvance(s, appts))) appts = await loadAppts(s);
      return res.json({ studio: st, appts, waitlist: wl, now: new Date().toISOString() });
    }

    if (req.method !== "POST") return res.status(405).end();
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const act = b.action;

    if (act === "accept") {
      const t = clean(b.t, 40);
      const name = clean(b.name, 80);
      if (!name) return res.status(400).json({ error: "name" });
      const tok = await store.get(K.tok(t));
      if (!tok) return res.status(404).json({ state: "invalid" });
      const a = await store.get(K.appt(tok.a));
      if (!a) return res.status(404).json({ state: "invalid" });
      const now = new Date().toISOString();
      const st = statusOf(a);
      if (tok.k === "c") {
        if (a.acceptedAt && st === "CONFIRMED") return res.json({ ok: true, state: "accepted", acceptedAt: a.acceptedAt });
        if (st === "CANCELLED" || st === "FILLED") return res.status(409).json({ ok: false, state: "cancelled" });
        if (st === "LAPSED") return res.status(409).json({ ok: false, state: "lapsed" });
        a.acceptedAt = now;
        a.acceptedName = name;
        await store.put(K.appt(a.id), a);
        return res.json({ ok: true, state: "accepted", acceptedAt: now });
      }
      // Backfill offer: atomic first-accept-wins.
      if (st !== "LAPSED" && st !== "CANCELLED") {
        if (a.filledBy && a.filledBy.t === t) return res.json({ ok: true, state: "won", acceptedAt: a.filledBy.at });
        return res.status(409).json({ ok: false, state: "taken" });
      }
      const won = await store.setnx(K.fill(a.id), { t, at: now });
      if (!won) {
        const f = await store.get(K.fill(a.id));
        if (f && f.t === t) return res.json({ ok: true, state: "won", acceptedAt: f.at });
        return res.status(409).json({ ok: false, state: "taken" });
      }
      a.filledBy = { t, name, phone: tok.phone, offeredTo: tok.name, lang: lang(tok.lang), at: now };
      await store.put(K.appt(a.id), a);
      const wl = await waitlist(a.s);
      await store.put(K.wl(a.s), wl.filter((w) => w.id !== tok.w));
      return res.json({ ok: true, state: "won", acceptedAt: now });
    }

    if (act === "ci_answer") {
      const tok = await store.get(K.tok(clean(b.t, 40)));
      if (!tok || tok.k !== "ci") return res.status(404).json({ error: "This link isn't valid." });
      const a = await store.get(K.appt(tok.a));
      if (!a) return res.status(404).json({ error: "Not found." });
      const answer = ["good", "schedule", "leaving"].includes(b.answer) ? b.answer : "good";
      a.checkins = { ...(a.checkins || {}), [tok.day]: { answer, note: clean(b.note, 300), at: new Date().toISOString() } };
      await store.put(K.appt(a.id), a);
      return res.json({ ok: true, answer });
    }

    const s = sid(b.s);
    if (!s) return res.status(400).json({ error: "Missing location id." });

    if (act === "studio") {
      const st = {
        name: clean(b.name, 80) || (await studio(s)).name,
        terms: clean(b.terms, 500),
        deposit: Number(b.deposit) || 0,
        depositTerms: clean(b.depositTerms, 500),
        termsEs: clean(b.termsEs, 500),
        depositTermsEs: clean(b.depositTermsEs, 500),
        deskPhone: clean(b.deskPhone, 30),
        cutoffHours: Math.min(Math.max(b.cutoffHours === "" || b.cutoffHours == null ? 48 : Number(b.cutoffHours) || 0, 0), 720),
        backfillN: Math.min(Math.max(Number(b.backfillN) || 3, 1), 10),
        ...(b.autoAdvance != null ? { autoAdvance: b.autoAdvance === true || b.autoAdvance === "true" } : {}),
        ...(b.perCentre != null ? { perCentre: b.perCentre === true || b.perCentre === "true" } : {}),
        treatments: (Array.isArray(b.treatments) ? b.treatments : [])
          .map((x) => ({ name: clean(x.name, 60), price: Number(x.price) || 0 }))
          .filter((x) => x.name)
          .slice(0, 30),
      };
      await store.put(K.studio(s), st);
      return res.json({ ok: true, studio: await studio(s) });
    }

    if (act === "create") {
      const client = clean(b.client, 80);
      const phone = clean(b.phone, 30);
      const treatment = clean(b.treatment, 60);
      const at = Date.parse(b.at);
      const hours = b.cutoffHours === "" || b.cutoffHours == null ? (await studio(s)).cutoffHours : Number(b.cutoffHours);
      const missing = [!client && "name", !phone && "phone", !treatment && "appointment type", !at && "date/time"].filter(Boolean);
      if (missing.length) return res.status(400).json({ error: "Please fill in: " + missing.join(", ") + "." });
      if (!(hours >= 0 && hours <= 720)) return res.status(400).json({ error: "Cutoff must be between 0 and 720 hours." });
      const a = {
        id: id(6),
        s,
        client,
        phone,
        lang: lang(b.lang),
        treatment,
        price: Number(b.price) || 0,
        at: new Date(at).toISOString(),
        cutoffHours: hours,
        cutoff: new Date(at - hours * 3600e3).toISOString(),
        terms: clean(b.terms, 500),
        deposit: Number(b.deposit) || 0,
        depositTerms: clean(b.depositTerms, 500),
        created: new Date().toISOString(),
        token: id(9),
        offers: [],
      };
      await store.put(K.tok(a.token), { a: a.id, k: "c" });
      await store.put(K.appt(a.id), a);
      await store.push(K.appts(s), a.id);
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "intake" || act === "offer") {
      let f = b;
      if (act === "offer") {
        const c = await store.get(K.appt(clean(b.candidate, 20)));
        if (!c || c.s !== s) return res.status(404).json({ error: "Candidate not found." });
        f = { ...b, client: c.client, phone: c.phone, lang: c.lang, property: c.property, role: c.role, candidate: c.id };
        if (!clean(b.start) || !clean(b.pay)) return res.status(400).json({ error: "Please fill in: start date, pay." });
      }
      const missing = [!clean(f.client) && "name", !clean(f.phone) && "phone", !clean(f.property) && "property", !clean(f.role) && "role"].filter(Boolean);
      if (missing.length) return res.status(400).json({ error: "Please fill in: " + missing.join(", ") + "." });
      const a = hireEntry(s, f, act);
      await saveNew(s, a);
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "create_roster") {
      const st = await studio(s);
      const fams = (Array.isArray(b.families) ? b.families : [b]).slice(0, 200);
      const out = [];
      for (const f of fams) {
        const missing = [!clean(f.client) && "parent name", !clean(f.phone) && "phone", !clean(f.seat) && "child / class", !Date.parse(f.at) && "term start"].filter(Boolean);
        if (missing.length) return res.status(400).json({ error: "Please fill in: " + missing.join(", ") + "." });
        const a = rosterEntry(s, { currency: st.currency, terms: st.terms, payNote: st.payNote, cutoffDays: st.cutoffDays, ...f });
        await saveNew(s, a);
        out.push(withStatus(a));
      }
      return res.json({ ok: true, appts: out });
    }

    if (act === "checkin") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Not found." });
      const day = [7, 30, 60, 90].includes(Number(b.day)) ? Number(b.day) : 7;
      a.ciTokens = a.ciTokens || {};
      if (!a.ciTokens[day]) { a.ciTokens[day] = id(9); await store.put(K.tok(a.ciTokens[day]), { a: a.id, k: "ci", day }); }
      a.ciSent = { ...(a.ciSent || {}), [day]: new Date().toISOString() };
      await store.put(K.appt(a.id), a);
      return res.json({ ok: true, token: a.ciTokens[day], appt: withStatus(a) });
    }

    if (act === "left") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Not found." });
      a.leftAt = b.undo ? null : new Date().toISOString();
      await store.put(K.appt(a.id), a);
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "dayone" || act === "touch") {
      // Hiring: record that an offer-accepted hire showed up on day one, or that someone followed up with a candidate.
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Not found." });
      if (act === "dayone") a.dayOneAt = b.undo ? null : new Date().toISOString();
      else a.touchedAt = new Date().toISOString();
      await store.put(K.appt(a.id), a);
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "cancel" || act === "reminded") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Appointment not found." });
      const field = act === "cancel" ? "cancelledAt" : "reminderSentAt";
      if (act === "cancel" ? statusOf(a) !== "CANCELLED" : !a.reminderSentAt) {
        a[field] = new Date().toISOString();
        await store.put(K.appt(a.id), a);
      }
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "wl_add") {
      const earliest = Date.parse(b.earliest);
      const w = {
        id: id(5),
        name: clean(b.name, 80),
        phone: clean(b.phone, 30),
        lang: lang(b.lang),
        treatment: clean(b.treatment, 60) || "Any",
        centre: clean(b.centre, 40),
        earliest: earliest ? new Date(earliest).toISOString() : "",
        added: new Date().toISOString(),
      };
      if (!w.name || !w.phone) return res.status(400).json({ error: "Waitlist needs a name and phone." });
      const wl = await waitlist(s);
      wl.push(w);
      await store.put(K.wl(s), wl);
      return res.json({ ok: true, waitlist: wl });
    }

    if (act === "wl_remove") {
      const wl = (await waitlist(s)).filter((w) => w.id !== b.id);
      await store.put(K.wl(s), wl);
      return res.json({ ok: true, waitlist: wl });
    }

    if (act === "backfill") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Appointment not found." });
      const st = statusOf(a);
      if (st === "FILLED") return res.status(409).json({ error: "This slot is already filled." });
      if (a.filledBy) return res.status(409).json({ error: "This slot was filled and then cancelled. Add a new appointment for that time instead." });
      if (st !== "LAPSED" && st !== "CANCELLED")
        return res.status(409).json({ error: `Only LAPSED or CANCELLED slots can be backfilled (this one is ${st}). Tap Cancel first if the patient dropped.` });
      const wl = await waitlist(s);
      const offered = new Set(a.offers.map((o) => o.w));
      const max = Math.min(Math.max(Number(b.count) || (await studio(s)).backfillN || 3, 1), 10);
      const stc = await studio(s);
      const centreOk = (w) => !a.centre || !stc.perCentre || clean(w.centre).toLowerCase() === a.centre.toLowerCase();
      const pick = wl.filter((w) => !offered.has(w.id) && (a.centre ? true : sameTreatment(w.treatment, a.treatment)) && centreOk(w) && availableBy(w, a.at)).slice(0, max);
      if (!pick.length)
        return res.json({ ok: true, offers: [], appt: withStatus(a), message: `No one new on the waitlist matches ${a.treatment} at that time. Add people to the waitlist, then tap Backfill again.` });
      const offers = [];
      for (const w of pick) {
        const o = { t: id(9), w: w.id, name: w.name, phone: w.phone, lang: lang(w.lang), at: new Date().toISOString() };
        await store.put(K.tok(o.t), { a: a.id, k: "o", w: w.id, name: w.name, phone: w.phone, lang: o.lang });
        offers.push(o);
      }
      a.offers = a.offers.concat(offers);
      await store.put(K.appt(a.id), a);
      return res.json({ ok: true, offers, appt: withStatus(a) });
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    console.error("confirm", e && e.message);
    res.status(502).json({ error: "Something went wrong saving that. Please try again." });
  }
};
