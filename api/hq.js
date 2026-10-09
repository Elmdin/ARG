// Team HQ: one shared state for every teammate and every Claude session.
// Read:  GET /api/hq?k=KEY            (JSON)   or  &format=md  (plain text for any agent)
// Write: POST /api/hq {k, type, ...}   or GET with &op=... (for agents that can only open URLs)
//   type/op "customer": name, status, needs, notes, owner   (upsert by name)
//   type/op "note":     title, body, author                   (append)
//   type/op "ask":      customer, text                        (adds to the build queue, see /api/ask)
const store = require("./_store");
const KEY = "iXhjLkNXrzi2";
const STATUSES = ["not contacted", "talking", "building", "in review", "won", "lost", "skip"];
const clip = (v, n) => String(v ?? "").slice(0, n);

async function upsertCustomer(b) {
  const name = clip(b.name, 120).trim();
  if (!name) throw new Error("name required");
  const all = await store.list("customers");
  const i = all.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
  const prev = i >= 0 ? all[i] : { name, status: "not contacted", needs: "", notes: "", owner: "" };
  const next = { ...prev, updated: new Date().toISOString() };
  for (const f of ["needs", "notes", "owner"]) if (b[f] != null && b[f] !== "") next[f] = clip(b[f], 3000);
  if (b.status) next.status = STATUSES.includes(String(b.status).toLowerCase()) ? String(b.status).toLowerCase() : clip(b.status, 30);
  if (i >= 0) await store.set("customers", i, next);
  else await store.push("customers", next);
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

function markdown(s) {
  const L = ["# Team Quotax HQ", `Updated ${new Date().toISOString()}`, "",
    "Live product: https://arg-foundergame.vercel.app/app.html", "", "## Customers"];
  for (const c of s.customers) L.push(`- **${c.name}** [${c.status}]${c.owner ? " · owner " + c.owner : ""}${c.needs ? "\n  - Needs: " + c.needs : ""}${c.notes ? "\n  - Notes: " + c.notes : ""}`);
  if (!s.customers.length) L.push("- (none yet)");
  L.push("", "## Build queue");
  for (const a of s.asks) L.push(`- #${a.id} [${a.status}] ${a.customer}: ${a.text.replace(/\s+/g, " ").slice(0, 400)}${a.note ? "\n  - Builder: " + a.note : ""}`);
  if (!s.asks.length) L.push("- (empty)");
  L.push("", "## Notes");
  for (const n of s.notes.slice().reverse()) L.push(`### ${n.title}${n.author ? " (" + n.author + ")" : ""} · ${n.at}`, n.body, "");
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
      const fn = { customer: upsertCustomer, note: addNote, ask: addAsk }[op];
      if (!fn) return res.status(400).json({ error: "unknown type; use customer, note or ask" });
      return res.json({ ok: true, saved: await fn(args) });
    }
    const [customers, asks, notes] = await Promise.all([store.list("customers"), store.list("asks"), store.list("notes")]);
    const s = { customers, asks, notes };
    if (q.format === "md") {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.status(200).send ? res.status(200).send(markdown(s)) : res.end(markdown(s));
    }
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
};
