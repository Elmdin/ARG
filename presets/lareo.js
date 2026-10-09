window.PRESETS = window.PRESETS || {};
window.PRESETS.lareo = {
  name: "Lareo",
  tagline: "Real-home data for robot learning.",
  headline: "The household data humanoids are missing, captured in real homes.",
  subhead:
    "Contributors wear slim camera glasses and wrist cuffs while doing chores. Lareo delivers stereo egocentric video, 3D hand and wrist motion, and grip signals, consented and licensed to physical-AI labs.",
  accent: "#f59e0b",
  customer: "Humanoid robotics companies and physical-AI / world-model labs.",
  whyNow:
    "Robot foundation models are data-starved: the internet has text and video, but no first-person hand motion with force. Humanoids are shipping into homes now.",
  features: [
    { title: "Real homes, not labs", body: "Thousands of kitchens and laundry rooms, not one staged set." },
    { title: "Hands with force", body: "Measured 3D wrist and finger motion plus grip and muscle signals." },
    { title: "Consent built in", body: "Wearers review and approve every clip before upload, and share in re-licensing." },
    { title: "Order by task", body: "Spec the tasks, homes and hours you need; we schedule capture." },
  ],
  stats: [
    { value: "10k+ hrs", label: "capture capacity / month (est.)" },
    { value: "3", label: "launch cities" },
    { value: "100%", label: "contributor-approved clips" },
  ],
  testimonials: [],
  pricing: [
    { plan: "Sample", price: "$5,000", items: ["50 hours", "Standard task set", "2-week delivery"] },
    { plan: "Lab", price: "$50,000/mo", items: ["1,000 hours/mo", "Custom task list", "Force + EMG channels"], highlight: true },
    { plan: "Exclusive", price: "Custom", items: ["Exclusive tasks", "On-site capture", "Dedicated cohort"] },
  ],
  demo: {
    title: "Spec a dataset: what should your robot learn?",
    placeholder: "Folding laundry and loading a dishwasher, varied kitchens, both hands, 200 hours...",
    button: "Get dataset quote",
    fallbackResult: [
      "DATASET SPEC  #LR-2048",
      "Tasks: laundry folding (120 h), dishwasher loading (80 h)",
      "Homes: 140 distinct homes across SF / LA / NYC",
      "Channels: stereo egocentric 1080p60 · 3D wrist + 21-joint hand pose · grip force · forearm EMG",
      "Annotations: action segments, object masks, success/failure labels",
      "Delivery: first 50 h in 10 days, full set in 4 weeks",
      "",
      "QUOTE: $38,000  (Lab tier pricing)",
    ].join("\n"),
    systemPrompt:
      "You are Lareo's dataset scoping assistant. Lareo captures household-chore data in real homes with stereo camera glasses and wrist cuffs (3D hand pose, grip force, EMG), licensed to robotics labs. Given a customer's request, return a terse DATASET SPEC: tasks with hours, number of homes and cities, channels, annotations, delivery timeline, then a QUOTE in dollars (about $150-250 per hour). Plain text, under 130 words.",
  },
  cta: { primary: "Sign a letter of intent", secondary: "Reserve data" },
  loiTerms:
    "We intend to license data from {product} at the {plan} tier upon delivery of a satisfactory sample set. This letter is non-binding.",
  stripeLink: "",
  team: [
    { name: "Builder", role: "Product & engineering" },
    { name: "Seller", role: "Lab partnerships" },
    { name: "Fundraiser", role: "Capital & story" },
  ],
};
