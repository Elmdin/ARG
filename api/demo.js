// Vercel serverless function. Set ANTHROPIC_API_KEY in Vercel > Settings > Environment Variables
// to make the demo live. Without it the page falls back to config.demo.fallbackResult.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "no key" });
  const { input = "", system = "" } = req.body || {};
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.MODEL || "claude-haiku-5-5",
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: String(input).slice(0, 8000) }],
      }),
    });
    const j = await r.json();
    const text = (j.content || []).map((c) => c.text || "").join("");
    if (!text) return res.status(502).json({ error: j.error || "empty" });
    res.json({ text });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
