// Team request queue: Seller pastes customer asks, the Builder picks them up and marks them live.
// Private: requires the team key (?k=...). GET lists, POST adds, PATCH updates status.
const store = require("./_store");
const KEY = "iXhjLkNXrzi2";
const LIST = "asks";

module.exports = async (req, res) => {
  const k = (req.query && req.query.k) || (req.body && req.body.k);
  if (k !== KEY) return res.status(403).json({ error: "team key required" });
  if (!store.enabled) return res.status(503).json({ error: "storage not connected" });
  try {
    if (req.method === "GET") return res.json({ asks: await store.list(LIST) });
    if (req.method === "POST") {
      const b = req.body || {};
      const text = String(b.text || "").slice(0, 6000).trim();
      if (!text) return res.status(400).json({ error: "text required" });
      const all = await store.list(LIST);
      const ask = { id: all.length + 1, customer: String(b.customer || "").slice(0, 120), text, status: "queued", note: "", at: new Date().toISOString() };
      await store.push(LIST, ask);
      return res.json({ ok: true, ask });
    }
    if (req.method === "PATCH") {
      const b = req.body || {};
      const all = await store.list(LIST);
      const i = all.findIndex((a) => a.id === Number(b.id));
      if (i < 0) return res.status(404).json({ error: "no such ask" });
      const ask = { ...all[i], status: String(b.status || all[i].status).slice(0, 20), note: String(b.note ?? all[i].note).slice(0, 500), updated: new Date().toISOString() };
      await store.set(LIST, i, ask);
      return res.json({ ok: true, ask });
    }
    res.status(405).end();
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
