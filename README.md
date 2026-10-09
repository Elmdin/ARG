# Founder Game: Builder kit

A static, config-driven startup site for **The Founder Game** (Inception Studio, #SFTechWeek, Fri Oct 9, 11am to 3pm).
It contains everything AI customers need to click through and convert:

- **Hero** with headline, why-now and stats
- **Live demo**: real Claude output if `ANTHROPIC_API_KEY` is set, a canned result if not
- **Letter of intent** form that produces a signed, numbered LOI on screen
- **Pre-order** checkout: a built-in mock, or your Stripe test link
- **`/deals.html`**: the LOIs and pre-orders signed on this device, for the Seller and Fundraiser to quote

No build step. Pick a preset in `config.js`, push, and it's live.

**Accounts, API keys and settings: see [SETUP.md](SETUP.md).**

## Before 11:00: one-time setup (about 10 min)

1. **Deploy:** go to vercel.com → Add New → Project → import `Elmdin/ARG` → Framework preset **Other** → Deploy. Copy the URL.
2. **Live demo (optional but strong):** Vercel → Settings → Environment Variables → `ANTHROPIC_API_KEY` = your key → Redeploy.
   Without a key the demo shows `demo.fallbackResult`.
3. **Test the redeploy loop:** change `tagline` in `config.js`, commit, push, and time it. Aim for under 60s.
4. Open the live URL on your phone. Click Demo → LOI → Pre-order.
5. Pack your laptop, charger and phone hotspot.

Local preview: `python3 -m http.server` then open http://localhost:8000.

## At 12:00: rebrand in 5 minutes

Choosing the idea: preview presets live with `?p=evalue`, `?p=captain60` or `?p=lareo`, then set `ACTIVE` in `config.js`.
For a brand-new idea, copy `presets/blank.js`, give your AI tool the 2-line idea, and let it fill in the file.

Edit **only the active preset** (`presets/<name>.js`): `name`, `tagline`, `headline`, `subhead`, `accent`, `customer`, `whyNow`, `features`, `pricing`, `demo.*`, `team`.
The most important one is `demo.systemPrompt`, because it turns the demo into the product.

During the game:

| Event | Change in the active preset |
|---|---|
| Seller closes a deal | Add to `testimonials` and bump `stats` |
| Customer objection ("too expensive", "security?") | Add a feature or a cheaper plan that answers it |
| Curveball: new model release | Add a feature: "Re-run on every model release" |
| Curveball: regulation change | Add a feature: "Compliance report (EU AI Act / SOC 2)" |
| Fundraise lands | Nothing. Focus on the product and stay out of the way. |

## Idea shortlist from your repos

| Rank | Idea | Source | Why / why not |
|---|---|---|---|
| **1** | **Evalue** (`?p=evalue`): an agent that stress-tests your AI agent and reports failures with evidence | `Elmdin/evals` | **Default.** B2B, AI-native, and the demo is the product. Strong "why now". Curveballs like a new model release *help* the pitch. AI customers are themselves agents, so the story is very meta. |
| 2 | **Captain60** (`?p=captain60`): multilingual AI intake agent for social-service agencies (web, SMS, phone) | `wimaan3/Cap60Agent` | Good impact story and a live chat demo is easy. Government buyers sell slowly, so it's a weaker VC story. |
| 3 | **Lareo** (`?p=lareo`): wearable capture data licensed to humanoid / physical-AI labs | `Elmdin/lareo` | Very hot fundraising narrative and existing renders. Hardware means no live product to click, so the site becomes a data marketplace plus a waitlist. |
| 4 | AutoApply: an AI job-application copilot | `Elmdin/AutoApply` | Consumer, crowded, and platform-ToS risk. Skip unless the team loves it. |
| - | NeuralForge, Triomni | | Deep science or research. Too slow to explain in 90 seconds. |

Bring the shortlist to the team, but **decide in under 5 minutes**. A Seller or Fundraiser idea is fine if they have domain insight; the kit rebrands to anything.

## Brief your teammates (11:00 to 11:45)

- **Seller (Knight):** owns the live URL. They walk customers to **Demo → LOI**, and send every objection to the Builder right away. Close on the Team tier and record each deal.
- **Fundraiser (Healer):** raises early and small to buy runway, then raises again on traction from `/deals.html`. They must keep enough equity to keep investors engaged, so write the minimum equity number down before the first pitch.
- **Builder (you):** has v1 live by 12:10. After that, ship only what the Seller hears customers asking for. Freeze the product by about 1:30.

## 90-second finals pitch (no deck)

> **[Hook, 10s]** Every company is shipping AI agents, and none of them know where those agents break.
> **[Product, 20s]** {Name} points an agent at your agent: it writes attacks, runs them, and returns ranked failures with transcript proof. *(Show the live demo on the laptop.)*
> **[Customers, 20s]** In the last 90 minutes: {N} LOIs, {$} in pre-orders, from {notable names}.
> **[Why now, 10s]** New models ship monthly and every release changes agent behaviour. Evals have to be continuous and automatic.
> **[Team, 15s]** {Builder} shipped it, {Seller} sold it, {Fundraiser} funded it, all today.
> **[Ask, 15s]** We're raising {$} at {valuation} to {milestone}.

Have answers ready for the Whale's moves. **Due Diligence:** show the live URL and the deals page. **Why Now?:** model churn and the agent boom. **Hard Pass:** respond with traction, not adjectives.
