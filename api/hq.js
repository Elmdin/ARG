// Team HQ: one shared state for every teammate and every Claude session.
// Read:  GET /api/hq?k=KEY            (JSON)   or  &format=md  (plain text for any agent)
// Write: POST /api/hq {k, type, ...}   or GET with &op=... (for agents that can only open URLs)
//   type/op "customer": name, status, needs, notes, owner   (upsert by company, the part before " · ")
//   type/op "note":     title, body, author                   (append)
//   type/op "ask":      customer, text                        (adds to the build queue, see /api/ask)
//   type/op "investor": name, firm, stage, amount, cap, equity, conditions, open, owner   (upsert by name)
//   type/op "deal":     company, kind (signed|loi|preorder), arr, collected, plan, by, source   (adds to /deals.html)
//   type/op "meta":     equity_floor, milestone, raise_ask, valuation   (team-wide numbers for the pitch)
const store = require("./_store");
const KEY = "iXhjLkNXrzi2";
const STATUSES = ["not contacted", "talking", "building", "in review", "won", "lost", "skip"];
const STAGES = ["pitched", "interested", "terms offered", "closed", "passed"];
const ACTIVE = ["talking", "building", "in review", "won"];
const STALE_MIN = 20;
const clip = (v, n) => String(v ?? "").slice(0, n);
// Company key: "Maumee Valley Auto Care · Travis Hendricks" and "Maumee Valley Auto Care" are the same customer.
const ckey = (s) => String(s || "").split(/\s+[·|-]\s+/)[0].toLowerCase().replace(/[^a-z0-9& ]/g, "").replace(/\b(ltd|llc|inc|co)\b/g, "").replace(/\s+/g, " ").trim();
// "$125K", "1.5M", "28,000", "$99/mo" -> number (NaN if none)
const num = (v) => {
  const m = String(v ?? "").replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)\s*([kKmM])?/);
  return m ? Number(m[1]) * (m[2] ? (/k/i.test(m[2]) ? 1e3 : 1e6) : 1) : NaN;
};
const usd = (n) => (Number.isFinite(n) ? "$" + Math.round(n).toLocaleString("en-US") : "unknown");
const pct = (n) => (Number.isFinite(n) ? `${Math.round(n * 100) / 100}%` : "unknown");
const mins = (iso) => (iso ? Math.round((Date.now() - Date.parse(iso)) / 60000) : null);

async function upsertCustomer(b) {
  const name = clip(b.name, 120).trim();
  if (!name) throw new Error("name required");
  const all = await store.list("customers");
  const idx = all.map((c, j) => (ckey(c.name) === ckey(name) ? j : -1)).filter((j) => j >= 0);
  const i = idx.length ? idx[0] : -1;
  const prev = i >= 0 ? all[i] : { name, status: "not contacted", needs: "", notes: "", owner: "" };
  const next = { ...prev, updated: new Date().toISOString() };
  if (name.length > prev.name.length) next.name = name; // keep the fuller "Company · Buyer" form
  for (const f of ["needs", "notes", "owner"]) if (b[f] != null && b[f] !== "") next[f] = clip(b[f], 3000);
  if (b.status) next.status = STATUSES.includes(String(b.status).toLowerCase()) ? String(b.status).toLowerCase() : clip(b.status, 30);
  // Write every duplicate row so old rows for the same company converge on this update.
  if (idx.length) await Promise.all(idx.map((j) => store.set("customers", j, next)));
  else await store.push("customers", next);
  return next;
}

async function upsertInvestor(b) {
  const name = clip(b.name, 120).trim();
  if (!name) throw new Error("name required");
  const all = await store.list("investors");
  const i = all.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
  const next = { ...(i >= 0 ? all[i] : { name, stage: "pitched" }), updated: new Date().toISOString() };
  for (const f of ["firm", "amount", "cap", "equity", "conditions", "open", "owner"]) if (b[f] != null && b[f] !== "") next[f] = clip(b[f], 2000);
  if (b.stage) next.stage = STAGES.includes(String(b.stage).toLowerCase()) ? String(b.stage).toLowerCase() : clip(b.stage, 30);
  if (i >= 0) await store.set("investors", i, next);
  else await store.push("investors", next);
  return next;
}

async function addDeal(b) {
  const company = clip(b.company, 120).trim();
  if (!company) throw new Error("company required");
  const kind = ["signed", "loi", "preorder"].includes(b.kind) ? b.kind : "signed";
  const deal = {
    kind, company, id: "HQ-" + Math.random().toString(36).slice(2, 7).toUpperCase(), at: new Date().toISOString(),
    arr: num(b.arr) || 0, collected: num(b.collected) || 0, plan: clip(b.plan, 40), name: clip(b.by, 60),
    source: clip(b.source || "logged in HQ (off-site deal)", 200),
  };
  await store.add(deal);
  return deal;
}

async function setMeta(b) {
  const all = await store.list("meta");
  const next = { ...(all[0] || {}), updated: new Date().toISOString() };
  for (const f of ["equity_floor", "milestone", "raise_ask", "valuation"]) if (b[f] != null && b[f] !== "") next[f] = clip(b[f], 500);
  if (all.length) await store.set("meta", 0, next);
  else await store.push("meta", next);
  return next;
}

async function addNote(b) {
  const body = clip(b.body, 8000).trim();
  if (!body) throw new Error("body required");
  const n = { title: clip(b.title, 160) || "Note", body, author: clip(b.author, 60), at: new Date().toISOString() };
  await store.push("notes", n);
  return n;
}

async function addAsk(b) {
  const text = clip(b.text, 6000).trim();
  if (!text) throw new Error("text required");
  const all = await store.list("asks");
  const ask = { id: all.length + 1, customer: clip(b.customer, 120), text, status: "queued", note: "", at: new Date().toISOString() };
  await store.push("asks", ask);
  return ask;
}

// Merge duplicate rows (same company), then attach flags the team should act on.
function customersView(rows, deals) {
  const by = new Map();
  for (const c of rows) {
    const k = ckey(c.name);
    (by.get(k) || by.set(k, []).get(k)).push(c);
  }
  const dealKeys = deals.filter((d) => ["signed", "loi", "preorder"].includes(d.kind)).map((d) => ckey(d.company));
  return [...by.values()].map((group) => {
    group.sort((a, b) => (Date.parse(b.updated || 0) || 0) - (Date.parse(a.updated || 0) || 0));
    const c = { ...group[0] };
    for (const o of group.slice(1)) for (const f of ["needs", "notes"]) if (!c[f] && o[f]) c[f] = o[f];
    if (group.length > 1) c.name = group.map((g) => g.name).sort((a, b) => b.length - a.length)[0];
    const owners = [...new Set(group.map((g) => (g.owner || "").trim()).filter(Boolean))];
    c.owner = owners.join(" + ");
    const flags = [];
    if (group.length > 1) flags.push(`${group.length} duplicate rows`);
    if (owners.length > 1) flags.push("two owners");
    const sts = [...new Set(group.map((g) => g.status))];
    if (sts.length > 1) flags.push(`conflicting status (${sts.join(" vs ")}), showing latest`);
    if (ACTIVE.includes(c.status) && !owners.length) flags.push("no owner");
    const age = mins(c.updated);
    if (["talking", "in review"].includes(c.status) && (age == null || age >= STALE_MIN)) flags.push(age == null ? "never timestamped" : `stale ${age} min`);
    if (c.status === "won" && !dealKeys.includes(ckey(c.name))) flags.push("won but no deal on /deals.html");
    return { ...c, age, flags };
  });
}

function numbers(s) {
  const deals = s.deals.filter((d) => d.kind !== "test");
  const signed = deals.filter((d) => d.kind === "signed"), lois = deals.filter((d) => d.kind === "loi"), pre = deals.filter((d) => d.kind === "preorder");
  const accepted = deals.filter((d) => d.kind === "accepted");
  const preDollars = pre.reduce((a, d) => a + (num(d.price) || 0), 0) + signed.reduce((a, d) => a + (Number(d.collected) || 0), 0);
  const arr = signed.reduce((a, d) => a + (Number(d.arr) || 0), 0);
  const custKeys = s.customers.map((c) => ckey(c.name));
  const orphanDeals = [...signed, ...lois, ...pre].filter((d) => !custKeys.includes(ckey(d.company)));
  const closed = s.investors.filter((i) => i.stage === "closed");
  const raised = closed.reduce((a, i) => a + (num(i.amount) || 0), 0);
  const eq = (i) => (Number.isFinite(num(i.equity)) ? num(i.equity) : num(i.amount) / num(i.cap) * 100);
  const sold = closed.reduce((a, i) => a + (eq(i) || 0), 0);
  const unknownEq = closed.filter((i) => !Number.isFinite(eq(i))).map((i) => i.name);
  const floor = num(s.meta.equity_floor);
  const lastCap = closed.map((i) => num(i.cap)).filter(Number.isFinite).pop();
  return {
    signed: signed.length, lois: lois.length, preorders: pre.length, accepted: accepted.length, preDollars, arr,
    notable: [...new Set(signed.map((d) => d.company))], orphanDeals: orphanDeals.map((d) => d.company),
    raised, sold, founders: 100 - sold, floor, unknownEq,
    valuation: s.meta.valuation || (lastCap ? usd(lastCap) + " post-money cap (last SAFE)" : ""),
  };
}

function markdown(s) {
  const n = numbers(s), cs = customersView(s.customers, s.deals);
  const L = ["# Team Quotax HQ", `Updated ${new Date().toISOString()}`, "",
    "Live product: https://arg-foundergame.vercel.app/app.html", "",
    "## Numbers (computed from /deals.html and the investor list; quote these, nothing else)",
    `- Signed deals: ${n.signed} · LOIs: ${n.lois} · Pre-orders: ${n.preorders} · Quote acceptances (review tests, not deals): ${n.accepted}`,
    `- Pre-order / collected dollars: ${usd(n.preDollars)} · Booked ARR: ${usd(n.arr)}`,
    `- Raised: ${usd(n.raised)} · Equity sold: ${pct(n.sold)} · Founders keep: ${pct(n.founders)} · Minimum founder ownership: ${Number.isFinite(n.floor) ? pct(n.floor) : "NOT SET (set it: &op=meta&equity_floor=...)"}`];
  if (Number.isFinite(n.floor) && n.founders < n.floor) L.push(`- ⚠ BELOW THE EQUITY FLOOR (${pct(n.founders)} < ${pct(n.floor)})`);
  if (n.unknownEq.length) L.push(`- ⚠ Equity unknown for: ${n.unknownEq.join(", ")}`);
  if (n.orphanDeals.length) L.push(`- ⚠ Deals with no HQ customer: ${n.orphanDeals.join(", ")}`);
  L.push("", "## Finals pitch blanks",
    `- LOIs: ${n.lois + n.signed}${n.lois + n.signed ? "" : " (WEAK)"}`,
    `- Pre-orders: ${usd(n.preDollars)}${n.preDollars ? "" : " (WEAK)"}`,
    `- Notable customers: ${n.notable.join(", ") || "none recorded (WEAK)"}`,
    `- Raise: ${usd(n.raised)}${s.meta.raise_ask ? " · asking " + s.meta.raise_ask : ""}`,
    `- Valuation: ${n.valuation || "unknown"}`,
    `- Milestone: ${s.meta.milestone || "MISSING (set it: &op=meta&milestone=...)"}`);
  const flagged = cs.filter((c) => c.flags.length);
  L.push("", "## Needs attention");
  for (const c of flagged) L.push(`- **${c.name}** [${c.status}]: ${c.flags.join("; ")}`);
  if (!flagged.length) L.push("- (nothing flagged)");
  const queued = s.asks.filter((a) => a.status === "queued");
  for (const a of queued) L.push(`- Build queue #${a.id} still queued (${a.customer}), ${mins(a.at)} min old`);

  L.push("", "## Customers");
  for (const c of cs) L.push(`- **${c.name}** [${c.status}]${c.owner ? " · owner " + c.owner : " · NO OWNER"}${c.age != null ? ` · touched ${c.age} min ago` : ""}${c.needs ? "\n  - Needs: " + c.needs : ""}${c.notes ? "\n  - Notes: " + c.notes : ""}`);
  if (!cs.length) L.push("- (none yet)");
  L.push("", "## Investors");
  for (const i of s.investors) L.push(`- **${i.name}**${i.firm ? " (" + i.firm + ")" : ""} [${i.stage}] amount ${i.amount || "unknown"} · cap ${i.cap || "unknown"} · equity ${i.equity || "unknown"}${i.owner ? " · owner " + i.owner : " · NO OWNER"}${i.conditions ? "\n  - Conditions: " + i.conditions : ""}${i.open ? "\n  - Open question: " + i.open : ""}`);
  if (!s.investors.length) L.push("- (none tracked; add with &op=investor&name=...&stage=...&amount=...&cap=...)");
  L.push("", "## Build queue");
  for (const a of s.asks) L.push(`- #${a.id} [${a.status}] ${a.customer}: ${a.text.replace(/\s+/g, " ").slice(0, 400)}${a.note ? "\n  - Builder: " + a.note : ""}`);
  if (!s.asks.length) L.push("- (empty)");
  L.push("", "## Notes");
  for (const x of s.notes.slice().reverse()) L.push(`### ${x.title}${x.author ? " (" + x.author + ")" : ""} · ${x.at}`, x.body, "");
  if (!s.notes.length) L.push("(none yet)");
  return L.join("\n");
}

module.exports = async (req, res) => {
  const q = req.query || {}, body = req.body || {};
  if ((q.k || body.k) !== KEY) return res.status(403).json({ error: "team key required" });
  if (!store.enabled) return res.status(503).json({ error: "storage not connected" });
  try {
    const op = req.method === "POST" ? body.type : q.op;
    const args = req.method === "POST" ? body : q;
    if (op) {
      const fn = { customer: upsertCustomer, note: addNote, ask: addAsk, investor: upsertInvestor, deal: addDeal, meta: setMeta }[op];
      if (!fn) return res.status(400).json({ error: "unknown type; use customer, note, ask, investor, deal or meta" });
      return res.json({ ok: true, saved: await fn(args) });
    }
    const [customers, asks, notes, investors, meta, deals] = await Promise.all(
      ["customers", "asks", "notes", "investors", "meta"].map((k) => store.list(k)).concat(store.all()));
    const s = { customers, asks, notes, investors, meta: meta[0] || {}, deals };
    if (q.format === "md") {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.status(200).send ? res.status(200).send(markdown(s)) : res.end(markdown(s));
    }
    res.json({ ...s, view: customersView(customers, deals), numbers: numbers(s) });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
};
