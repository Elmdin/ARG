// Vercel serverless function behind the live demo.
// Set ONE of these in Vercel > Settings > Environment Variables, then Redeploy:
//   ANTHROPIC_API_KEY  (preferred)    optional ANTHROPIC_MODEL, default claude-haiku-5-5
//   OPENAI_API_KEY     (fallback)     optional OPENAI_MODEL, default gpt-4o-mini
// With neither set, the page shows the preset's demo.fallbackResult.
async function anthropic(key, system, input) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: input }],
    }),
  });
  const j = await r.json();
  return (j.content || []).map((c) => c.text || "").join("");
}

async function openai(key, system, input) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { input = "", system = "" } = req.body || {};
  const text = String(input).slice(0, 8000);
  const sys = String(system).slice(0, 4000);
  try {
    let out = "";
    if (process.env.ANTHROPIC_API_KEY) out = await anthropic(process.env.ANTHROPIC_API_KEY, sys, text);
    if (!out && process.env.OPENAI_API_KEY) out = await openai(process.env.OPENAI_API_KEY, sys, text);
    if (!out) return res.status(503).json({ error: "no key or empty response" });
    res.json({ text: out });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
