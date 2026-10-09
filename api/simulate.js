// Deal Room: runs a panel of AI buyer agents against a quote, in parallel.
// The model plays each buyer and names a walk-away price. Code (not the model) then
// sweeps candidate prices and picks the one that maximizes expected revenue.
const llm = require("./_llm");

const PERSONAS = [
  { id: "owner", name: "Dana", role: "Owner-operator, price-sensitive", stance: "watches every dollar, compares 3 quotes, pushes back on anything vague", factor: 0.86 },
  { id: "cfo", name: "Marcus", role: "CFO / procurement", stance: "wants itemization, clear payment terms and no surprise fees; will pay for certainty", factor: 1.04 },
  { id: "founder", name: "Priya", role: "Time-pressed founder", stance: "values speed and quality over price; hates back-and-forth", factor: 1.22 },
  { id: "enterprise", name: "Tom", role: "Enterprise buyer with a vendor shortlist", stance: "benchmarks against market rates, expects volume discounts", factor: 0.97 },
  { id: "repeat", name: "Lena", role: "Repeat customer", stance: "trusts you, but notices if prices crept up since last time", factor: 1.1 },
  { id: "skeptic", name: "Raj", role: "Skeptical first-time buyer", stance: "burned by a vendor before; wants guarantees and a smaller first step", factor: 0.9 },
];

const SYSTEM = `You are role-playing a B2B buyer receiving a quote. Stay in character.
Reply with ONLY a JSON object, no prose:
{"decision":"accept"|"negotiate"|"reject","walkaway_price":<number: the most you would actually pay in total>,"objection":"<main concern, max 15 words>","says":"<what you'd say to the seller, max 25 words>","would_fix":"<one specific change that would win you, max 15 words>"}`;

function fallback(p, total) {
  const w = Math.round(total * p.factor);
  return {
    decision: w >= total ? "accept" : w >= total * 0.92 ? "negotiate" : "reject",
    walkaway_price: w,
    objection: w >= total ? "None. Clear and fairly priced." : "Total is above what I budgeted.",
    says: w >= total ? "Looks good. Send the contract." : `If you can get closer to $${w.toLocaleString()}, we can talk.`,
    would_fix: w >= total ? "Nothing" : "Split into phases or add a payment plan",
  };
}

function optimize(total, panel) {
  const prices = [];
  for (let f = 0.7; f <= 1.401; f += 0.025) prices.push(Math.round(total * f));
  const curve = prices.map((price) => {
    const wins = panel.filter((b) => b.walkaway_price >= price).length;
    const winRate = wins / panel.length;
    return { price, winRate, expected: Math.round(price * winRate) };
  });
  const best = curve.reduce((a, b) => (b.expected > a.expected ? b : a));
  const current = curve.reduce((a, b) => (Math.abs(b.price - total) < Math.abs(a.price - total) ? b : a));
  return { curve, best, current: { ...current, price: total, winRate: panel.filter((b) => b.walkaway_price >= total).length / panel.length } };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const q = req.body || {};
  const total = Number(q.total) || 0;
  if (!total) return res.status(400).json({ error: "quote total required" });

  const summary = [
    `Seller: ${q.seller || "a vendor"}. Industry: ${q.industry || "services"}. Client: ${q.client || "your company"}.`,
    "Line items:",
    ...(q.items || []).slice(0, 30).map((i) => `- ${i.desc}: ${i.qty} x $${i.price}`),
    `Discount: ${q.discount || 0}%. Tax: ${q.tax || 0}%. TOTAL: $${total}.`,
    q.notes ? `Terms/notes: ${q.notes}` : "",
  ].join("\n");

  const t0 = Date.now();
  const panel = await Promise.all(
    PERSONAS.map(async (p) => {
      let v = null, raw = "";
      if (llm.enabled) {
        const prompt = `You are ${p.name}, ${p.role}: ${p.stance}.\n\nThe quote you received:\n${summary}`;
        raw = await llm.complete(SYSTEM, prompt, 400);
        v = llm.json(raw);
      }
      const live = Boolean(v && Number(v.walkaway_price) > 0);
      if (!live) v = fallback(p, total);
      if (!live && llm.enabled) console.error("simulate fallback", p.id, llm.lastError || "", raw.slice(0, 200));
      return { ...p, ...v, walkaway_price: Math.round(Number(v.walkaway_price)), live, ...(live ? {} : { why: (llm.lastError || raw.slice(0, 160) || "empty").slice(0, 200) }) };
    })
  );

  res.json({
    panel,
    ...optimize(total, panel),
    mode: panel.some((b) => b.live) ? "live" : "simulated",
    ms: Date.now() - t0,
  });
};
