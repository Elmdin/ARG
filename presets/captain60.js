window.PRESETS = window.PRESETS || {};
window.PRESETS.captain60 = {
  name: "Captain60",
  tagline: "AI intake for social services.",
  headline: "Every family screened for every program in 10 minutes, in their language.",
  subhead:
    "Captain60 is a multilingual AI intake agent for Community Action Agencies and nonprofits. It answers web chat, SMS and phone calls, checks eligibility across programs, and writes a ready-to-approve case file into your system of record.",
  accent: "#14b8a6",
  customer: "Community Action Agencies, county social-service offices, and multi-program nonprofits.",
  whyNow:
    "Caseworker shortages and benefit-cliff complexity mean 40-minute waits. Voice and multilingual AI got good enough this year to answer the phone.",
  features: [
    { title: "Web, SMS and phone", body: "One agent across every channel families already use." },
    { title: "Every program at once", body: "LIHEAP, Head Start, rental aid, weatherization: screened in one conversation." },
    { title: "Inside your system of record", body: "Writes the case file directly. No new portal for staff to check." },
    { title: "Human in the loop", body: "Caseworkers approve every determination. The agent drafts, people decide." },
  ],
  stats: [
    { value: "10 min", label: "average intake" },
    { value: "30+", label: "languages" },
    { value: "24/7", label: "availability" },
  ],
  testimonials: [],
  pricing: [
    { plan: "Pilot", price: "$1,500/mo", items: ["1 site", "Web chat + SMS", "Up to 500 intakes"] },
    { plan: "Agency", price: "$6,000/mo", items: ["All sites", "Phone line included", "System-of-record sync"], highlight: true },
    { plan: "State", price: "Custom", items: ["Multi-agency", "Custom programs", "Audit & compliance pack"] },
  ],
  demo: {
    title: "Try it: tell us your situation",
    placeholder: "Hi, I'm a single mom with two kids, I just lost my job and my electric bill is overdue...",
    button: "Start intake",
    fallbackResult: [
      "Thanks for reaching out. I'm sorry you're dealing with this. Based on what you told me:",
      "",
      "LIKELY ELIGIBLE",
      "  • LIHEAP energy assistance: can cover the overdue electric bill",
      "  • SNAP: household of 3, recent job loss",
      "  • Head Start / child care assistance",
      "",
      "NEXT: I need your ZIP code, household income for the last 30 days, and a photo of the utility bill.",
      "A caseworker will review your file within 1 business day. ¿Prefiere continuar en español?",
    ].join("\n"),
    systemPrompt:
      "You are Captain60, a warm multilingual intake agent for a Community Action Agency. Reply in the user's language. Given their situation, list the programs they are LIKELY ELIGIBLE for (LIHEAP, SNAP, Head Start, rental assistance, weatherization, WIC, etc.) with one line each on why, then a NEXT section asking for the 2-3 documents or facts needed, and say a caseworker will review within 1 business day. Under 140 words. Never promise approval.",
  },
  cta: { primary: "Sign a letter of intent", secondary: "Start pilot" },
  loiTerms:
    "Our agency intends to deploy {product} at the {plan} tier upon completion of a successful 30-day pilot. This letter is non-binding.",
  stripeLink: "",
  team: [
    { name: "Builder", role: "Product & engineering" },
    { name: "Seller", role: "Agencies & partnerships" },
    { name: "Fundraiser", role: "Capital & story" },
  ],
};
