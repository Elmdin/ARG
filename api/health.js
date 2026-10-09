// Open /api/health on the live site to see which services are connected. Never returns secrets.
const store = require("./_store");

module.exports = (req, res) => {
  const e = process.env;
  res.json({
    deployed: true,
    ai_demo: e.ANTHROPIC_API_KEY ? "anthropic" : e.OPENAI_API_KEY ? "openai" : "off (canned sample shown)",
    shared_deal_storage: store.enabled ? "on" : "off (deals saved per device + Vercel logs)",
    region: e.VERCEL_REGION || null,
    commit: (e.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
  });
};
