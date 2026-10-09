// POST: record an LOI / pre-order. GET: list all deals (shared storage only).
// Every deal is also logged: Vercel > Project > Logs, filter "DEAL".
const store = require("./_store");

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const deal = req.body || {};
      console.log("DEAL", JSON.stringify(deal));
      if (store.enabled) await store.add(deal);
      return res.json({ ok: true, stored: store.enabled });
    }
    if (req.method === "GET") {
      if (!store.enabled) return res.status(503).json({ error: "storage not connected" });
      return res.json({ deals: await store.all() });
    }
    res.status(405).end();
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
