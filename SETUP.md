# Setup: everything the game needs

The code already handles each service: once one is connected, it switches on automatically.
Your only part is signing in and pasting keys. There are no config files to edit and nothing to code.

**Check your progress anytime:** open `https://<your-app>.vercel.app/api/health`. It shows what's connected and never shows a secret.

## Tier 1: required (about 1 min)

| Service | What it does in the game | Your steps |
|---|---|---|
| **Vercel** (hosting + backend) | The live production site AI customers click through. Serverless functions in `api/` are the backend. Every push redeploys. | Open https://vercel.com/new/import?s=https://github.com/Elmdin/ARG → **Continue with GitHub** → **Deploy**. |

That's enough to play. The demo shows a fixed sample result, and deals are saved on each device plus in Vercel logs.

## Tier 2: recommended (about 3 min, all inside Vercel)

| Service | What it switches on | Your steps |
|---|---|---|
| **Anthropic API key** | The demo generates a *real* answer for each customer's input | 1. https://console.anthropic.com → sign in → **Billing**: add $5–10, then **Limits**: set a monthly cap, e.g. $20. 2. **API Keys** → Create key → copy it. 3. Vercel project → **Settings → Environment Variables** → Name `ANTHROPIC_API_KEY`, paste the value → Save. |
| **Shared deal storage** (Upstash Redis, free tier) | `/deals.html` shows every LOI and pre-order from **all** devices: live traction for the Seller and Fundraiser to quote | Vercel project → **Storage** tab → **Create Database** → **Upstash for Redis** → Free → Create → **Connect to project**. The keys are injected automatically. |
| **Redeploy** | Makes the two items above take effect | Vercel → **Deployments** → newest → **⋯** → **Redeploy**. Or tell me and I'll push a commit, which triggers a redeploy. |

## Tier 3: optional, only if the game calls for it

| Service | When it's worth it | Your steps |
|---|---|---|
| `OPENAI_API_KEY` | Backup if Anthropic has trouble. The demo uses Anthropic first, then OpenAI. | platform.openai.com → API keys → add it in Vercel as in Tier 2 |
| **Stripe test-mode payment link** | If you want a real Stripe checkout instead of the built-in mock (play money either way) | dashboard.stripe.com → toggle **Test mode** → Payment Links → New → copy the link and send it to me. I'll put it in the preset. |
| **Vercel Analytics** | Shows how many people and agents visited, which is handy proof for the Fundraiser | Vercel project → **Analytics** tab → Enable |

## Not needed

- **A custom domain.** `*.vercel.app` is a real production HTTPS URL.
- **A database server, auth, or email service.** The game doesn't require any of them.
- **A separate backend host.** The `api/` folder *is* the backend, and Vercel runs it.

## Rules

- Keys go **only** in Vercel → Environment Variables. Never paste a key into chat, code or a commit.
- Stripe stays in **test mode**. All money in the game is play money.

## 2-minute check, on your phone

1. `/api/health` should show `ai_demo: "anthropic"` and `shared_deal_storage: "on"` (or "off" if you skipped Tier 2).
2. On the home page, run the demo twice with different input. The answers should differ.
3. Sign a test LOI, then open `/deals.html`. It should show 1 LOI. Delete test data before the game: ask me, or use Upstash console → Data Browser → delete `deals`.
4. Try the presets: `/?p=evalue`, `/?p=captain60`, `/?p=lareo`.
