// Team inbox for customer asks and review results.
// GET: all asks, newest first. POST {customer, kind, text}: add one.
// PATCH {id, status, note}: status is new | building | live | dropped.
const store = require("./_store");
const KEY = "asks";
const STATUSES = ["new", "building", "live", "dropped"];

async function all() {
  const flat = (await store.cmd(["HGETALL", KEY])) || [];
  const out = [];
  if (Array.isArray(flat)) for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]));
  else for (const v of Object.values(flat)) out.push(JSON.parse(v));
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

module.exports = async (req, res) => {
  try {
    if (!store.enabled) return res.status(503).json({ error: "storage not connected" });
    if (req.method === "GET") return res.json({ asks: await all() });
    const b = req.body || {};
    if (req.method === "POST") {
      const text = String(b.text || "").trim().slice(0, 8000);
      if (!text) return res.status(400).json({ error: "text required" });
      const ask = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        at: new Date().toISOString(),
        customer: String(b.customer || "").trim().slice(0, 120),
        kind: b.kind === "review" ? "review" : "ask",
        text,
        status: "new",
        note: "",
      };
      await store.cmd(["HSET", KEY, ask.id, JSON.stringify(ask)]);
      return res.json({ ok: true, ask });
    }
    if (req.method === "PATCH") {
      const cur = await store.cmd(["HGET", KEY, String(b.id || "")]);
      if (!cur) return res.status(404).json({ error: "not found" });
      const ask = JSON.parse(cur);
      if (STATUSES.includes(b.status)) ask.status = b.status;
      if (typeof b.note === "string") ask.note = b.note.slice(0, 2000);
      ask.updated = new Date().toISOString();
      await store.cmd(["HSET", KEY, ask.id, JSON.stringify(ask)]);
      return res.json({ ok: true, ask });
    }
    res.status(405).end();
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
