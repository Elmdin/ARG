// Landing-page demo. Model keys: see api/_llm.js. No key -> 503 and the page shows the canned result.
const llm = require("./_llm");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { input = "", system = "" } = req.body || {};
  const text = await llm.complete(String(system).slice(0, 4000), String(input).slice(0, 8000));
  if (!text) return res.status(503).json({ error: "no key or empty response" });
  res.json({ text });
};
