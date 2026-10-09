// Shared costed menu: one place to re-cost every platter; store quotes (app.html?t=office&m=<id>) read it live.
// GET ?m=<id>   POST {m, action: "ingredient", name, price} | "bump" {pct} | "price" {name, price} | "floor" {floor}
const store = require("./_store");
const clean = (v, n = 120) => String(v == null ? "" : v).trim().slice(0, n);
const mid = (v) => (/^[a-z0-9-]{1,40}$/.test(String(v || "").toLowerCase()) ? String(v).toLowerCase() : null);
const r2 = (n) => Math.round(n * 100) / 100;
// Ingredients at today's price; platters are built from ingredients per head, so cost is always computed.
const DEMO = {
  wattlebrook: {
    name: "Wattlebrook Fresh Kitchen · platter menu costing",
    currency: "AUD", floor: 35, pin: "1968",
    ingredients: [
      { name: "Roast chicken", unit: "kg", price: 13.8 },
      { name: "Avocado", unit: "each", price: 2.4 },
      { name: "Sushi rice", unit: "kg", price: 4.9 },
      { name: "Salmon (sashimi grade)", unit: "kg", price: 42 },
      { name: "Bread & wraps", unit: "kg", price: 6.5 },
      { name: "Leaf & salad veg", unit: "kg", price: 9.5 },
      { name: "Cured meats & cheese", unit: "kg", price: 31 },
      { name: "Olive oil", unit: "L", price: 14 },
      { name: "Eggs", unit: "dozen", price: 8.9 },
      { name: "Seasonal fruit", unit: "kg", price: 5.2 },
      { name: "Packaging & platter", unit: "each", price: 0.9 },
      { name: "Kitchen labour", unit: "hour", price: 38 },
    ],
    // Prices set years ago (priceSet). qty = amount of the ingredient per head.
    platters: [
      { name: "Gourmet sandwich & wrap platter", price: 14.5, priceSet: "2019", parts: [["Bread & wraps", 0.12], ["Roast chicken", 0.09], ["Avocado", 0.5], ["Eggs", 0.12], ["Leaf & salad veg", 0.06], ["Olive oil", 0.01], ["Packaging & platter", 1], ["Kitchen labour", 0.12]] },
      { name: "Sushi platter, made in store today", price: 12, priceSet: "2020", parts: [["Sushi rice", 0.16], ["Salmon (sashimi grade)", 0.07], ["Avocado", 0.5], ["Leaf & salad veg", 0.02], ["Packaging & platter", 1], ["Kitchen labour", 0.1]] },
      { name: "Roast chicken & salad bowl", price: 16, priceSet: "2019", parts: [["Roast chicken", 0.22], ["Leaf & salad veg", 0.18], ["Avocado", 0.5], ["Olive oil", 0.02], ["Packaging & platter", 1], ["Kitchen labour", 0.08]] },
      { name: "Antipasto & deli platter", price: 13, priceSet: "2022", parts: [["Cured meats & cheese", 0.12], ["Bread & wraps", 0.05], ["Olive oil", 0.015], ["Packaging & platter", 1], ["Kitchen labour", 0.06]] },
      { name: "Seasonal fruit platter", price: 5.5, priceSet: "2021", parts: [["Seasonal fruit", 0.3], ["Packaging & platter", 1], ["Kitchen labour", 0.05]] },
    ],
  },
};
// Platter cost per head from ingredient prices.
function withCosts(menu) {
  const by = Object.fromEntries((menu.ingredients || []).map((i) => [i.name, i.price]));
  const platters = (menu.platters || []).map((p) => {
    const cost = r2(p.parts.reduce((s, [n, q]) => s + (by[n] || 0) * q, 0));
    const margin = p.price ? (p.price - cost) / p.price * 100 : 0;
    return { ...p, cost, margin: Math.round(margin * 10) / 10, needPrice: r2(cost / (1 - (menu.floor || 0) / 100)) };
  });
  return { ...menu, platters };
}
const key = (m) => `menu:${m}`;
async function load(m) {
  const saved = await store.get(key(m));
  if (saved) return saved;
  const d = DEMO[m] || { name: m + " menu", currency: "AUD", floor: 30, items: [] };
  return { ...d, updated: null };
}
module.exports = async (req, res) => {
  try {
    if (!store.enabled) return res.status(503).json({ error: "Storage is not connected." });
    if (req.method === "GET") {
      const m = mid((req.query || {}).m);
      if (!m) return res.status(400).json({ error: "Add ?m=<menu id>" });
      const { pin: _p, ...pub } = withCosts(await load(m));
      return res.json(pub);
    }
    if (req.method !== "POST") return res.status(405).end();
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const m = mid(b.m);
    if (!m) return res.status(400).json({ error: "Missing menu id." });
    const cur = await load(m);
    // Head office only: every change needs the menu's PIN. Store screens never get it.
    if (cur.pin && String(b.pin || "") !== cur.pin) return res.status(403).json({ error: "Head office PIN required to change the menu. Stores can quote from it but can't edit it." });
    if (b.action === "ingredient") {
      const ing = (cur.ingredients || []).find((i) => i.name === clean(b.name));
      if (!ing) return res.status(404).json({ error: "No such ingredient." });
      ing.price = Math.max(0, Number(b.price) || 0);
    } else if (b.action === "bump") {
      const pct = Number(b.pct);
      if (!(pct > -50 && pct < 200)) return res.status(400).json({ error: "Enter a % between -50 and 200." });
      cur.ingredients = (cur.ingredients || []).map((i) => ({ ...i, price: r2(i.price * (1 + pct / 100)) }));
    } else if (b.action === "price") {
      const p = (cur.platters || []).find((x) => x.name === clean(b.name));
      if (!p) return res.status(404).json({ error: "No such platter." });
      p.price = Math.max(0, Number(b.price) || 0); p.priceSet = String(new Date().getFullYear());
    } else if (b.action === "add_ingredient") {
      const name = clean(b.name, 60);
      if (!name) return res.status(400).json({ error: "Ingredient needs a name." });
      if ((cur.ingredients || []).some((i) => i.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: "That ingredient is already on the list." });
      cur.ingredients = (cur.ingredients || []).concat({ name, unit: clean(b.unit, 12) || "kg", price: Math.max(0, Number(b.price) || 0) });
    } else if (b.action === "add_platter") {
      const name = clean(b.name, 80);
      if (!name) return res.status(400).json({ error: "Menu item needs a name." });
      cur.platters = (cur.platters || []).concat({ name, price: Math.max(0, Number(b.price) || 0), priceSet: String(new Date().getFullYear()), parts: [] });
    } else if (b.action === "part") {
      // Set (or remove with qty 0) one component of a recipe.
      const p = (cur.platters || []).find((x) => x.name === clean(b.platter, 80));
      if (!p) return res.status(404).json({ error: "No such menu item." });
      const ing = clean(b.name, 60), qty = Math.max(0, Number(b.qty) || 0);
      if (!(cur.ingredients || []).some((i) => i.name === ing)) return res.status(404).json({ error: "Add that ingredient to the list first." });
      p.parts = p.parts.filter(([n]) => n !== ing);
      if (qty > 0) p.parts.push([ing, qty]);
    } else if (b.action === "floor") {
      cur.floor = Math.min(Math.max(Number(b.floor) || 0, 0), 90);
    } else return res.status(400).json({ error: "Unknown action." });
    cur.updated = new Date().toISOString();
    await store.put(key(m), cur);
    const { pin: _p2, ...pub } = withCosts(cur);
    res.json(pub);
  } catch (e) {
    console.error("menu", e && e.message);
    res.status(502).json({ error: "Couldn't save that. Try again." });
  }
};
