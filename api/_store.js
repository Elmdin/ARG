// Shared deal storage. Picks whichever Redis the Vercel Storage integration injected:
//   REDIS_URL                                   (Redis Cloud: TCP via node-redis)
//   KV_REST_API_* or UPSTASH_REDIS_REST_*       (Upstash: REST over fetch)
// With neither set, storage is off and deals live per device + Vercel logs.
const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_URL = process.env.REDIS_URL;
const KEY = "deals";

let client; // reused across warm invocations
async function tcp() {
  if (!client) {
    const { createClient } = require("redis");
    client = createClient({ url: REDIS_URL, socket: { connectTimeout: 5000 } });
    client.on("error", (e) => console.error("redis", e.message));
    await client.connect();
  }
  return client;
}

async function rest(args) {
  const r = await fetch(REST_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${REST_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  return (await r.json()).result;
}

const backend = REDIS_URL ? "redis" : REST_URL && REST_TOKEN ? "upstash" : null;

module.exports = {
  enabled: Boolean(backend),
  backend,
  add: async (deal) =>
    backend === "redis" ? (await tcp()).rPush(KEY, JSON.stringify(deal)) : rest(["RPUSH", KEY, JSON.stringify(deal)]),
  all: async () => {
    const rows = backend === "redis" ? await (await tcp()).lRange(KEY, 0, -1) : (await rest(["LRANGE", KEY, "0", "-1"])) || [];
    return rows.map((s) => JSON.parse(s));
  },
  // Raw command, e.g. cmd(["HSET", "asks", id, json]). Used by api/asks.js.
  cmd: async (args) => (backend === "redis" ? (await tcp()).sendCommand(args.map(String)) : rest(args.map(String))),
  ping: async () => (backend === "redis" ? (await tcp()).ping() : rest(["PING"])),
};
