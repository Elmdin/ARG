// Shared deal storage. Uses Upstash Redis over REST when Vercel's Storage integration
// has injected its env vars (KV_REST_API_* or UPSTASH_REDIS_REST_*). Otherwise: no-op.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "deals";

async function cmd(args) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  return (await r.json()).result;
}

module.exports = {
  enabled: Boolean(URL_ && TOKEN),
  add: (deal) => cmd(["RPUSH", KEY, JSON.stringify(deal)]),
  all: async () => ((await cmd(["LRANGE", KEY, "0", "-1"])) || []).map((s) => JSON.parse(s)),
};
