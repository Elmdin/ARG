// "Describe the job" -> line items. Model drafts, code validates and clamps.
const llm = require("./_llm");

const SYSTEM = `You draft itemized business quotes. Given a job description, reply with ONLY JSON:
{"client":"<client name if mentioned, else empty>","industry":"<industry>","items":[{"desc":"<line item>","qty":<number>,"price":<unit price USD>}],"notes":"<payment terms / timeline, max 25 words>"}
Use 3-8 realistic line items at realistic US market rates.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const job = String((req.body || {}).job || "").slice(0, 3000);
  if (!job) return res.status(400).json({ error: "job required" });
  const d = llm.json(await llm.complete(SYSTEM, job, 700));
  if (!d || !Array.isArray(d.items)) return res.status(503).json({ error: "draft unavailable" });
  d.items = d.items
    .slice(0, 12)
    .map((i) => ({ desc: String(i.desc || "Item").slice(0, 120), qty: Math.max(0, Number(i.qty) || 1), price: Math.max(0, Number(i.price) || 0) }));
  res.json(d);
};
