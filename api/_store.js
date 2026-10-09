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
  // Generic list helpers (used by the request queue).
  push: async (key, obj) =>
    backend === "redis" ? (await tcp()).rPush(key, JSON.stringify(obj)) : rest(["RPUSH", key, JSON.stringify(obj)]),
  list: async (key) => {
    const rows = backend === "redis" ? await (await tcp()).lRange(key, 0, -1) : (await rest(["LRANGE", key, "0", "-1"])) || [];
    return rows.map((s) => JSON.parse(s));
  },
  set: async (key, i, obj) =>
    backend === "redis" ? (await tcp()).lSet(key, i, JSON.stringify(obj)) : rest(["LSET", key, String(i), JSON.stringify(obj)]),
  // Key/value helpers (used by Confirm & Backfill). Values are JSON.
  get: async (key) => {
    const v = backend === "redis" ? await (await tcp()).get(key) : await rest(["GET", key]);
    return v == null ? null : JSON.parse(v);
  },
  mget: async (keys) => {
    if (!keys.length) return [];
    const rows = backend === "redis" ? await (await tcp()).mGet(keys) : (await rest(["MGET", ...keys])) || [];
    return rows.map((v) => (v == null ? null : JSON.parse(v)));
  },
  put: async (key, obj) =>
    backend === "redis" ? (await tcp()).set(key, JSON.stringify(obj)) : rest(["SET", key, JSON.stringify(obj)]),
  // Atomic "first writer wins": true only for the caller that created the key.
  setnx: async (key, obj) => {
    const r = backend === "redis"
      ? await (await tcp()).set(key, JSON.stringify(obj), { NX: true })
      : await rest(["SET", key, JSON.stringify(obj), "NX"]);
    return r === "OK";
  },
  ping: async () => (backend === "redis" ? (await tcp()).ping() : rest(["PING"])),
};
