// Template for a brand-new idea. Copy to presets/<name>.js, rename the key below,
// add <script src="presets/<name>.js"></script> to index.html, set ACTIVE in config.js.
// Fastest path: paste this file into your AI coding tool with a 2-line idea description.
window.PRESETS = window.PRESETS || {};
window.PRESETS.blank = {
  name: "ProductName",
  tagline: "One-line category.",
  headline: "The outcome your customer gets, in one sentence.",
  subhead: "What it is, who it's for, and how it works, in two sentences.",
  accent: "#3b82f6",
  customer: "Who pays.",
  whyNow: "What changed this year that makes this possible or urgent.",
  features: [
    { title: "Benefit 1", body: "Why it matters." },
    { title: "Benefit 2", body: "Why it matters." },
    { title: "Benefit 3", body: "Why it matters." },
    { title: "Benefit 4", body: "Why it matters." },
  ],
  stats: [
    { value: "10x", label: "faster" },
    { value: "$0", label: "setup" },
    { value: "5 min", label: "to value" },
  ],
  testimonials: [],
  pricing: [
    { plan: "Starter", price: "$99/mo", items: ["Item", "Item"] },
    { plan: "Pro", price: "$499/mo", items: ["Item", "Item"], highlight: true },
    { plan: "Enterprise", price: "Custom", items: ["Item", "Item"] },
  ],
  demo: {
    title: "Try it",
    placeholder: "Describe your problem...",
    button: "Run",
    fallbackResult: "A convincing sample output goes here.",
    systemPrompt: "You are ProductName. Given the user's input, produce the product's output. Terse, under 120 words.",
  },
  cta: { primary: "Sign a letter of intent", secondary: "Pre-order" },
  loiTerms: "We intend to purchase {product} at the {plan} tier upon availability. This letter is non-binding.",
  stripeLink: "",
  team: [
    { name: "Builder", role: "Product & engineering" },
    { name: "Seller", role: "Customers & revenue" },
    { name: "Fundraiser", role: "Capital & story" },
  ],
};
