# Setup checklist: accounts, keys, settings

Do these on **your laptop** before 11:00. Each line is something only you can do (logins and payment), in priority order.

## Must have (about 15 min)

| # | What | Where | Done when |
|---|---|---|---|
| 1 | **GitHub** logged in, with push access to `Elmdin/ARG` | github.com | `git push` works from your laptop |
| 2 | **Vercel** account (Sign up with GitHub) | vercel.com | Account exists |
| 3 | **Deploy the site**: Add New → Project → Import `Elmdin/ARG` → Framework **Other** → Deploy. Under Settings → Git, set the production branch to `claude/wonderful-brahmagupta-wcwt2f`, or merge it into `main`. | vercel.com | The URL opens on your phone |
| 4 | **Anthropic API key**: create a key, add about $10 of credit, and set a monthly spend limit | console.anthropic.com → API Keys, and Billing → Limits | Key copied to your password manager |
| 5 | **Put the key in Vercel**: Settings → Environment Variables → `ANTHROPIC_API_KEY` (all environments) → then Deployments → ⋯ → **Redeploy** | vercel.com | The demo returns a *new* answer each time, not the canned one |
| 6 | **AI coding tool** logged in and working (Claude Code, Cursor, or similar), with the repo cloned locally | your laptop | It can edit `presets/*.js` and you can push |
| 7 | **Redeploy drill**: edit a tagline → commit → push → time it until it's live | | Under 60 seconds |

## Nice to have

| What | Why | How |
|---|---|---|
| `OPENAI_API_KEY` in Vercel | Backup if the Anthropic key has trouble | platform.openai.com → API keys. The demo tries Anthropic first, then OpenAI. |
| **Vercel CLI** (`npm i -g vercel` → `vercel login` → `vercel link` in the repo) | Deploy with `vercel --prod` even if the GitHub hook is slow | Terminal |
| **Stripe test-mode Payment Link** | A real-looking checkout instead of the built-in mock | dashboard.stripe.com → Test mode → Payment Links → create one per plan → paste it into the preset's `stripeLink` |
| **Phone hotspot** tested | Venue wifi will be crowded | Settings on your phone |
| **Shared notes with teammates** | Seller logs objections, Fundraiser logs terms | A shared Google Doc or group chat |

## Do NOT

- Commit any key to the repo. Keys go **only** in Vercel environment variables.
- Use a real Stripe live key. Everything in the game is play money.
- Spend the first 10 minutes of the quest on setup. That's what this checklist is for.

## Verify (2 min, on your phone)

1. Open `https://<your-app>.vercel.app/?p=evalue`, then `?p=captain60` and `?p=lareo`. All three presets should render.
2. Run the demo twice with different input. The output should differ, which means the key works.
3. Sign a test LOI, then open `/deals.html`. You should see 1 LOI. Clear it before the game.
4. In Vercel → Logs, filter for `DEAL`. Your test LOI should be there.
