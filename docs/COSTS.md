# What each feature costs to run (1 October 2026)

For deciding what belongs in Free, Premium and Premium Plus. Figures are what each vendor publishes today — check before relying on them, the same caveat as everywhere else in this project. Two kinds of cost: **fixed**, which doesn't change with a rider's own behaviour, and **per use**, which does, and so needs a rate limit or a tier line drawn around it.

## Running the site at all (fixed, not a tier decision)

| Item | Driver | Rough cost |
|---|---|---|
| Hosting (Vercel) | Traffic and build minutes | Pro plan from about £16/month |
| Database (Neon) | Compute hours, storage | A few pounds to about £20/month at today's size |
| Photo storage (Vercel Blob) | GB stored and downloaded | Pennies at current scale |
| Maps (MapTiler) | Every map load and tile request, on any page, any tier | Flex plan $30/month covers 25,000 loads; this is the cost most likely to grow with traffic |
| Domain | — | About £8–12/year |

## Features with a real per-use cost

| Feature | What drives the cost | Rough cost | Fits |
|---|---|---|---|
| Road routing between routes | A new stretch looked up (cached after that) | Free tier is non-commercial; paid plans from about €20/month | Already decided: unlimited trips is a Premium perk |
| Elevation profile and gradient | One lookup per route, done once and stored, not per view | Free (OpenTopoData) to a paid Open-Meteo plan if volume needs it | Free — it's a one-off cost per route, not per rider |
| 3D fly-through preview | Map tiles loaded per playback, far more than an ordinary map view | Same MapTiler allowance, each preview costs roughly what several page views would | Premium, already decided |
| Road closures (National Highways) | — | Free | Free — this is safety information |
| Email (new routes announced, warnings) | Emails sent | Free up to 3,000 a month (Resend) | Needed for a few features either way, not tier-specific itself |
| **The AI route-finder agent** | Anthropic API tokens, per message | See below | New — recommend Premium, with a monthly cap |
| **Video ride recaps** | Per minute of rendered video | See below | Premium Plus, but needs its own cap — see the note |
| Offline map packs | Storage, and possibly a different tile plan | Not known yet — depends on checking MapTiler's terms | Premium, pending that check |
| Affiliate links | — | None — this earns, it doesn't cost | Any tier |
| Taking a payment at all | Stripe's cut | About 1.5% plus 20p per UK card payment | Cost of charging anyone, not a feature |

## The AI agent, worked through

A full back-and-forth — a question, one clarifying follow-up, an answer with suggestions — is roughly three model calls. A quick check for whether the question is even on-topic is cheap (Claude Haiku, a fraction of a penny). The two real turns, written and reasoned by Claude Sonnet at today's published rate of $2 per million input tokens and $10 per million output tokens, come to roughly **1 to 2 pence for a whole conversation**, including the system prompt, the tool results, and the reply.

That's comfortably affordable inside a £2.99-a-month subscription even generously used — twenty full conversations in a month is still only around 20 to 40 pence — but it still needs a cap, the same reasoning as the existing limit on `/api/route`, so the worst case is "a very chatty rider," not an open bill.

## Video ride recaps — the one that stands apart

This is the most expensive single feature on the list, by a wide margin, and worth looking at on its own before promising it inside a flat Premium Plus fee. A rendering service such as Shotstack charges **$0.40 a minute of finished video** on pay-as-you-go pricing, or about half that once there's enough volume to be on a subscription plan. A 60–90 second recap is **40 to 60 pence each, every time one is made** — nothing like the fraction of a penny the other features cost. A handful of recaps a month from one subscriber already eats a meaningful share of the £59.99 Premium Plus brings in for the whole year.

Worth deciding on purpose, not by default: a strict cap (a small number a year, the same shape as the already-planned "two custom route requests a year"), or treating it as its own small purchase on top of Premium Plus rather than unlimited within it.

## A rough rule of thumb

Keeping the *variable* cost of a Premium subscriber comfortably under 50 pence a month leaves a healthy margin once Stripe's cut and the fixed site costs are accounted for. The AI agent, capped sensibly, fits inside that easily. Video recaps, capped at even a few a year, do not — they need either a real limit or their own price.
