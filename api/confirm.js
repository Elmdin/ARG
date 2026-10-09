// Confirm & Backfill: text-to-confirm appointments with a cutoff, plus a waitlist backfill.
// GET  ?s=<studio>            desk view (studio settings, appointments with computed status, waitlist)
// GET  ?t=<token>             client view (one appointment or one backfill offer)
// POST {action, ...}          create | cancel | wl_add | wl_remove | backfill | accept | studio
// Status is computed on read: no timers. "First to accept wins" uses SET NX on cb:fill:<apptId>.
const crypto = require("crypto");
const store = require("./_store");

const DEFAULT_TERMS = "Cancel or reschedule at least 48 hours ahead or a $100 late-cancellation fee applies.";
const DEMO = {
  seawall: {
    name: "Seawall Salon & Skin",
    terms: DEFAULT_TERMS,
    treatments: [
      { name: "Botox / injectables", price: 450 },
      { name: "Laser hair removal", price: 350 },
      { name: "IPL photofacial", price: 600 },
    ],
    deposit: 100,
    depositTerms: "A $100 deposit holds your spot and is applied to your treatment. We don't charge it here; the studio will collect it.",
  },
};

const clean = (v, n = 200) => String(v == null ? "" : v).trim().slice(0, n);
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
  const base = DEMO[s] || {
    name: s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    terms: DEFAULT_TERMS,
    treatments: [],
    deposit: 0,
    depositTerms: "",
  };
  return { id: s, ...base, ...(saved || {}) };
}

function statusOf(a, now = Date.now()) {
  if (a.filledBy) return "FILLED";
  if (a.acceptedAt) return "CONFIRMED";
  if (a.cancelledAt) return "CANCELLED";
  if (now > Date.parse(a.cutoff)) return "UNCONFIRMED";
  return "PENDING";
}
const withStatus = (a) => ({ ...a, status: statusOf(a) });

async function loadAppts(s) {
  const ids = await store.list(K.appts(s));
  const rows = await store.mget(ids.map((x) => K.appt(x)));
  return rows.filter(Boolean).map(withStatus).sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

const sameTreatment = (want, t) => {
  const w = clean(want).toLowerCase();
  return !w || w === "any" || w === clean(t).toLowerCase();
};

module.exports = async (req, res) => {
  try {
    if (!store.enabled) return res.status(503).json({ error: "Storage is not connected, so appointments can't be saved yet." });
    const q = req.query || {};

    if (req.method === "GET") {
      if (q.t) {
        const tok = await store.get(K.tok(clean(q.t, 40)));
        if (!tok) return res.status(404).json({ error: "This link isn't valid. Please contact the studio." });
        const a = await store.get(K.appt(tok.a));
        if (!a) return res.status(404).json({ error: "This appointment no longer exists." });
        const st = await studio(a.s);
        const status = statusOf(a);
        let state; // what this visitor should see
        if (tok.k === "c") {
          state = a.acceptedAt ? "accepted" : a.cancelledAt || a.filledBy ? "cancelled" : status === "UNCONFIRMED" ? "lapsed" : "open";
        } else {
          state = a.filledBy ? (a.filledBy.t === q.t ? "won" : "taken") : "open";
        }
        return res.json({
          kind: tok.k === "c" ? "confirm" : "offer",
          state,
          studio: st.name,
          name: tok.k === "c" ? a.client : tok.name,
          treatment: a.treatment,
          price: a.price,
          at: a.at,
          cutoff: a.cutoff,
          terms: a.terms,
          deposit: a.deposit,
          depositTerms: a.depositTerms,
          acceptedAt: tok.k === "c" ? a.acceptedAt || null : a.filledBy && a.filledBy.t === q.t ? a.filledBy.at : null,
        });
      }
      const s = sid(q.s);
      if (!s) return res.status(400).json({ error: "Add a studio id to the address, e.g. ?s=seawall" });
      const [st, appts, wl] = await Promise.all([studio(s), loadAppts(s), store.get(K.wl(s))]);
      return res.json({ studio: st, appts, waitlist: wl || [], now: new Date().toISOString() });
    }

    if (req.method !== "POST") return res.status(405).end();
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const act = b.action;

    if (act === "accept") {
      const t = clean(b.t, 40);
      const name = clean(b.name, 80);
      if (!name) return res.status(400).json({ error: "Please type your name to accept." });
      const tok = await store.get(K.tok(t));
      if (!tok) return res.status(404).json({ error: "This link isn't valid. Please contact the studio." });
      const a = await store.get(K.appt(tok.a));
      if (!a) return res.status(404).json({ error: "This appointment no longer exists." });
      const now = new Date().toISOString();
      if (tok.k === "c") {
        if (a.acceptedAt) return res.json({ ok: true, state: "accepted", acceptedAt: a.acceptedAt });
        if (a.cancelledAt || a.filledBy) return res.status(409).json({ ok: false, state: "cancelled", error: "This appointment was cancelled. Please contact the studio." });
        if (statusOf(a) === "UNCONFIRMED") return res.status(409).json({ ok: false, state: "lapsed", error: "The confirmation deadline has passed. Please call the studio to keep your spot." });
        a.acceptedAt = now;
        a.acceptedName = name;
        await store.put(K.appt(a.id), a);
        return res.json({ ok: true, state: "accepted", acceptedAt: now });
      }
      // Backfill offer: atomic first-accept-wins.
      const st = statusOf(a);
      if (st === "CONFIRMED" || st === "PENDING") return res.status(409).json({ ok: false, state: "taken", error: "Sorry, it's taken." });
      const won = await store.setnx(K.fill(a.id), { t, at: now });
      if (!won) {
        const f = await store.get(K.fill(a.id));
        if (f && f.t === t) return res.json({ ok: true, state: "won", acceptedAt: f.at });
        return res.status(409).json({ ok: false, state: "taken", error: "Sorry, it's taken." });
      }
      a.filledBy = { t, name, phone: tok.phone, offeredTo: tok.name, at: now };
      await store.put(K.appt(a.id), a);
      const wl = (await store.get(K.wl(a.s))) || [];
      await store.put(K.wl(a.s), wl.filter((w) => w.id !== tok.w));
      return res.json({ ok: true, state: "won", acceptedAt: now });
    }

    const s = sid(b.s);
    if (!s) return res.status(400).json({ error: "Missing studio id." });

    if (act === "studio") {
      const st = {
        name: clean(b.name, 80) || (await studio(s)).name,
        terms: clean(b.terms, 500),
        deposit: Number(b.deposit) || 0,
        depositTerms: clean(b.depositTerms, 500),
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
      const hours = b.cutoffHours === "" || b.cutoffHours == null ? 48 : Number(b.cutoffHours);
      const missing = [!client && "client name", !phone && "phone", !treatment && "treatment", !at && "date/time"].filter(Boolean);
      if (missing.length) return res.status(400).json({ error: "Please fill in: " + missing.join(", ") + "." });
      if (!(hours >= 0 && hours <= 720)) return res.status(400).json({ error: "Cutoff must be between 0 and 720 hours." });
      const a = {
        id: id(6),
        s,
        client,
        phone,
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

    if (act === "cancel") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Appointment not found." });
      if (!a.filledBy && !a.cancelledAt) {
        a.cancelledAt = new Date().toISOString();
        await store.put(K.appt(a.id), a);
      }
      return res.json({ ok: true, appt: withStatus(a) });
    }

    if (act === "wl_add") {
      const w = { id: id(5), name: clean(b.name, 80), phone: clean(b.phone, 30), treatment: clean(b.treatment, 60) || "Any", added: new Date().toISOString() };
      if (!w.name || !w.phone) return res.status(400).json({ error: "Waitlist needs a name and phone." });
      const wl = (await store.get(K.wl(s))) || [];
      wl.push(w);
      await store.put(K.wl(s), wl);
      return res.json({ ok: true, waitlist: wl });
    }

    if (act === "wl_remove") {
      const wl = ((await store.get(K.wl(s))) || []).filter((w) => w.id !== b.id);
      await store.put(K.wl(s), wl);
      return res.json({ ok: true, waitlist: wl });
    }

    if (act === "backfill") {
      const a = await store.get(K.appt(clean(b.id, 20)));
      if (!a || a.s !== s) return res.status(404).json({ error: "Appointment not found." });
      const st = statusOf(a);
      if (st === "FILLED") return res.status(409).json({ error: "This slot is already filled." });
      if (st !== "UNCONFIRMED" && st !== "CANCELLED")
        return res.status(409).json({ error: `Only UNCONFIRMED or CANCELLED slots can be backfilled (this one is ${st}). Cancel it first if the client dropped.` });
      const wl = (await store.get(K.wl(s))) || [];
      const offered = new Set(a.offers.map((o) => o.w));
      const max = Math.min(Math.max(Number(b.count) || 3, 1), 10);
      const pick = wl.filter((w) => !offered.has(w.id) && sameTreatment(w.treatment, a.treatment)).slice(0, max);
      if (!pick.length)
        return res.json({ ok: true, offers: [], appt: withStatus(a), message: `No one new on the waitlist wants ${a.treatment}. Add people to the waitlist, then tap Backfill again.` });
      const offers = [];
      for (const w of pick) {
        const o = { t: id(9), w: w.id, name: w.name, phone: w.phone, at: new Date().toISOString() };
        await store.put(K.tok(o.t), { a: a.id, k: "o", w: w.id, name: w.name, phone: w.phone });
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
