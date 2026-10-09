// One place for model calls. Anthropic first, OpenAI fallback. Returns "" when no key or on failure.
async function anthropic(key, system, input, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: input }],
    }),
  });
  const j = await r.json();
  if (j.error) module.exports.lastError = `anthropic ${r.status}: ${j.error.type || ""} ${j.error.message || ""}`.slice(0, 200);
  return (j.content || []).map((c) => c.text || "").join("");
}

async function openai(key, system, input, maxTokens) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

async function complete(system, input, maxTokens = 600) {
  const e = process.env;
  let out = "";
  try {
    if (e.ANTHROPIC_API_KEY) out = await anthropic(e.ANTHROPIC_API_KEY, system, input, maxTokens);
  } catch (err) {
    module.exports.lastError = String(err).slice(0, 200);
  }
  try {
    if (!out && e.OPENAI_API_KEY) out = await openai(e.OPENAI_API_KEY, system, input, maxTokens);
  } catch (_) {}
  return out;
}

// Pull the first JSON object or array out of a model reply.
function json(text) {
  const m = String(text).match(/[\[{][\s\S]*[\]}]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (_) {
    return null;
  }
}

module.exports = { complete, json, enabled: Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) };
