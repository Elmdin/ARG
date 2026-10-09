// Open /api/health on the live site to see which services are connected. Never returns secrets.
const store = require("./_store");

module.exports = async (req, res) => {
  const e = process.env;
  let storage = "off (deals saved per device + Vercel logs)";
  if (store.enabled) {
    try {
      await store.ping();
      storage = `on (${store.backend}, reachable)`;
    } catch (err) {
      storage = `configured (${store.backend}) but unreachable: ${String(err.message || err).slice(0, 80)}`;
    }
  }
  res.json({
    deployed: true,
    ai_demo: e.ANTHROPIC_API_KEY ? "anthropic" : e.OPENAI_API_KEY ? "openai" : "off (canned sample shown)",
    shared_deal_storage: storage,
    region: e.VERCEL_REGION || null,
    commit: (e.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
  });
};
