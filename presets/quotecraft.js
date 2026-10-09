window.PRESETS = window.PRESETS || {};
window.PRESETS.quotecraft = {
  name: "QuoteCraft",
  appUrl: "/app.html",
  tagline: "Quotes that win.",
  headline: "Send a priced, customer-ready quote in 2 minutes, already tested on AI buyers.",
  subhead:
    "Build an itemized quote with discounts and tax, or describe the job and let AI draft it. Then the Deal Room sends it to six AI buyer agents. They tell you who signs, who pushes back and why, and the price that earns you the most.",
  accent: "#22c55e",
  customer: "Agencies, consultants, IT providers, event companies, home-service firms and contractors: anyone sending 10+ quotes a month.",
  whyNow:
    "AI agents can now role-play realistic buyers in seconds. That makes testing a price before you send it cheap enough to do on every quote, not just in a yearly pricing study.",
  features: [
    { title: "Itemized in minutes", body: "Templates for 5 industries, AI drafting from a one-line job description, and live totals with discount and tax." },
    { title: "Deal Room: AI buyer panel", body: "Six buyer agents (owner, CFO, founder, enterprise, repeat client, skeptic) review the quote in parallel and name their real walk-away price." },
    { title: "Price optimizer", body: "Tries 29 price points against the panel and recommends the one that earns the most per deal. One click applies it." },
    { title: "Customer-ready proposal", body: "A clean, branded proposal with a signature line, ready to print or save as a PDF." },
  ],
  stats: [
    { value: "6", label: "AI buyer agents per quote" },
    { value: "29", label: "price points tested" },
    { value: "2 min", label: "from job to proposal" },
  ],
  testimonials: [],
  pricing: [
    { plan: "Solo", price: "$29/mo", items: ["Unlimited quotes", "AI drafting", "PDF proposals"] },
    { plan: "Team", price: "$99/mo", items: ["5 users", "Deal Room AI buyer panel", "Price optimizer"], highlight: true },
    { plan: "Business", price: "$299/mo", items: ["Unlimited users", "Custom buyer personas", "CRM export"] },
  ],
  demo: {
    title: "Try it: describe a job, get a quote",
    placeholder: "Catering for a 120-person company dinner in SF, 3 courses, open bar, 10 staff...",
    button: "Draft my quote",
    fallbackResult: [
      "QUOTE · Golden Fork Events → Lumen Labs",
      "Dinner, 3 courses        120 × $68     $8,160",
      "Open bar, 3 hrs          120 × $32     $3,840",
      "Event staff               10 × $280    $2,800",
      "Venue styling & rentals    1 × $2,600  $2,600",
      "Subtotal $17,400 · Tax 8.5% $1,479 · TOTAL $18,879",
      "",
      "Deal Room: 4 of 6 buyers accept. Best price $18,400 (+$1,100 expected per deal).",
      "→ Open the full app to edit, test with AI buyers and export a PDF.",
    ].join("\n"),
    systemPrompt:
      "You are QuoteCraft. Given a job description, output a compact itemized quote in plain text: a header line 'QUOTE · <seller> → <client>', 3-6 aligned line items as 'desc  qty × $unit  $amount' at realistic US rates, then 'Subtotal · Tax 8.5% · TOTAL' with correct arithmetic. End with: '→ Open the full app to test this quote with 6 AI buyer agents and find the best price.' Under 120 words.",
  },
  cta: { primary: "Sign a letter of intent", secondary: "Start subscription" },
  loiTerms:
    "We intend to subscribe to {product} on the {plan} plan for at least 12 months upon availability, subject to a successful 14-day trial. This letter is non-binding.",
  stripeLink: "",
  team: [
    { name: "Orri Bogdan", role: "CEO & fundraising. Co-founded ALL Labs (raised $5M, 1,000+ stores, exited 2024)." },
    { name: "Joseph Weinerman", role: "Sales. Co-founder & CTO of Founders Game; founding engineer at ALL Labs." },
    { name: "Imaan Soltanalipour", role: "Product & engineering. Built real-time AI software at UCLA; ex-Amgen, NASA NCAS." },
  ],
};
