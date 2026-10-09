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

// Pull the first parseable JSON object or array out of a model reply.
function json(text) {
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "{" && s[i] !== "[") continue;
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === "{" || c === "[") depth++;
      else if (c === "}" || c === "]") {
        if (--depth === 0) {
          try { return JSON.parse(s.slice(i, j + 1)); } catch (_) { break; }
        }
      }
    }
  }
  return null;
}

module.exports = { complete, json, enabled: Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) };
