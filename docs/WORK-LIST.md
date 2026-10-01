# Work list (25 September 2026)

Everything on the roadmap ([ROADMAP.md](ROADMAP.md)) that is still to do, numbered so items can be picked by number. It is an aid for deciding the order, not a plan with dates.

**Sizes** are rough estimates of the build: **S** = a session or less, **M** = a few sessions, **L** = a large build (weeks). **You** marks things only the owner can do (accounts, decisions, testing on a phone). "Needs" says what has to happen first.

## A. Decisions and set-up (only you can do these, and they unblock the rest)

| # | Item | Size | Notes |
|---|---|---|---|
| A1 | **Settle the Premium and Premium Plus lineup** | S once decided | The route watchlist and early access are dropped (your decision). Still open: whether "advance notice on new region launches" goes too, and what else changes. Then I update `plans.ts` and the pricing page. The 3D fly-through gets added to Premium's list at the same time. |
| A2 | **Choose an email-sending service** (Resend or Postmark, both have a small free tier) | You, then S | Herepath cannot send any email today. Needed for B1, and easier for B3. |
| A3 | **Routing provider and commercial terms** | You | openrouteservice's free plan is non-commercial. Decide a paid plan or another provider, and whether to pay for a motorcycle profile. Needed before the public launch. |
| A4 | **Where elevation numbers come from, and its terms** | You | OpenTopoData (self-host or public), Open-Meteo (paid for commercial use), or MapTiler. Needed before C1. |
| A5 | **Check MapTiler's terms on offline tiles and on storing values derived from their tiles** | You | Blocks B6, and one of the options for A4. |
| A6 | **Affiliate links: wait for the feedback you're gathering, then pick a provider and apply** | You | Booking.com directly or through an aggregator; Pitchup for campsites; OpenTable or TheFork for restaurants. Needed before E1. |
| A7 | **Say what "Roadbook PDF" should be** | You | The printable tour sheet already exists and saves as a PDF from a phone's print dialog. If you meant more than that, B2 is a real build. |
| A8 | **An Anthropic API key, and a rate limit you're comfortable with** | You | Needed before G2. Priced per use, like MapTiler and routing. |

## B. Premium and Premium Plus features

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| B1 | **Announce new routes to everyone** (blog post plus a subscriber email, no gating) | M | A2 for the email (the blog post needs nothing) | Replaces the dropped watchlist and early access. |
| B2 | **Roadbook PDFs** | S to M | A7 | Only a real build if it means more than print-to-PDF. |
| B3 | **Founding member badge, and a direct line for feature requests** (Plus) | S | A2 helps with the direct line | Small flag and badge on reviews and tips. |
| B4 | **Dead Cylinder Co. discount and welcome pack** (Plus) | S | Plus on sale | The discount is a Stripe coupon. The pack is buying and posting, not code. |
| B5 | **Offline ride pack, the easy half**: a route's GPX, notes and places in one bundle | M | Nothing | No outside blocker. |
| B6 | **Offline maps** (Premium), then **nationwide offline** (Plus) | L | A5 | Might mean a different map provider or plan. |
| B7 | **Video ride recaps** (Plus) | L | A rendering service | Real cost per render, so it needs metering. Start silent, no music. |
| B8 | **Ride-outs** (Plus) | L | Privacy policy and guidelines wording, which wait on `info@herepath.com` | A real meeting point on a real date is a bigger privacy and moderation question than a route page. |
| B9 | **Group trip planning** (Plus) | M to L | Best after B8 | Extends the trip planner with a shared itinerary. |
| B10 | **Custom route request, two a year** (Plus) | S to build | Your time, ongoing | A request form, a yearly counter and an admin queue. The real cost is your hours. |
| B11 | **3D route fly-through** (Premium) | L | C1, A1 | Costs map tiles each time it runs, so only when someone presses Preview. |

## C. Elevation, the trip planner and routing

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| C1 | **Elevation on routes**: profile chart, ascent, descent, steepest gradient, and elevation in exported GPX (free) | M | A4 | Useful on its own, and B11 depends on it. |
| C2 | **Riders add their own start and stop points** in the planner, not only Herepath routes | M | Nothing | Routing already exists. |
| C3 | **Round-trip suggestions that use real roads** | M | Nothing | Today the search still uses straight-line estimates. |
| C4 | **Round-trip generator** ("150 miles of good roads from here") | L | A3 | A good Premium candidate. |
| C5 | **Motorcycle routing profile** | S | A3 | A paid upgrade. |
| C6 | **Stay pins near the end of each day** | M | A limit on OpenStreetMap lookups | Stops a visitor flooding the free service. |
| C7 | **Google Maps legs at natural stops** (lunch and fuel) | S to M | Nothing | Fewer waypoints per mile. |

## D. Road closures

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| D1 | **Street Manager**, England's roadworks on minor roads | L | Registration | Where most riders' roads actually close. Free but a data stream, or buy it ready-made. |
| D2 | **Scotland, Wales and Northern Ireland** feeds | M each | Registration | |
| D3 | **Show rider road reports** as a "reported by riders" flag | S to M | A moderation decision | They are private today. |
| D4 | **A lighter "delays likely" note** for lane closures and slip roads | S to M | Nothing | Ignored on purpose today. |
| D5 | **Check unplanned closures once one is live, and National Highways' credit wording** | S | Waiting | Unplanned closures were empty when tested. |

## E. Places

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| E1 | **Affiliate links, with a place detail page** | M, plus set-up | A6, disclosure wording, privacy policy line | Only your own places, not OpenStreetMap's. Each one matched to its real listing by hand. |

## G. The conversational route-finder agent

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| G1 | **A plain recommendation list** — routes similar to what a rider has already ridden, no AI | M | Nothing | Instant, free to run, no risk of a wrong answer. Build this before G2 regardless of what else is decided. |
| G2 | **The conversational agent**: search by free text, ask a follow-up question when something's missing, off-topic gate, message logging | L | A8 | Sign-in only. The off-topic/misuse distinction and the flagged-message log should be in from day one, not added later. |
| G3 | **A real day plan and a map in the reply**: reuses `summariseTrip()`/`splitIntoDays()` and the existing `TrackMap` component | M | G2 | Where "home location" comes from (ask each time, a saved profile field, or inferred from the diary) is still undecided. |
| G4 | **Hand off several suggested routes to the real planner** (`/plan?add=`, extended to take a short list) | S | G2 | Today it only takes one route. |
| G5 | **Admin → Flagged assistant messages** queue | S to M | G2 | Same pattern as Place tips and blog reports. A person decides every warning. |
| G6 | **Admin-side account closure** | S to M | Nothing | Doesn't exist yet — today's account deletion is rider-initiated only. A real decision each time, not automatic. |
| G7 | **The warning email itself** | S | A2, G5 | Sent by hand until A2 is chosen. |

## F. Small ideas and tests

| # | Item | Size | Needs | Notes |
|---|---|---|---|---|
| F1 | **Test the Apple Maps waypoint link** on an iPhone or Mac | S | You | Then I upgrade the button from "start and end only". |
| F2 | **Make the "Download GPX" buttons work in the Android app** | S to M | Nothing | The share button covers it meanwhile. |
| F3 | **Import FIT, TCX and KML files** into the diary | M | Nothing | Only GPX today. |
| F4 | **More headroom for the places cache refresh** | S | Nothing | Only matters as the catalogue grows. |

## Not on the roadmap, but still outstanding

- **`info@herepath.com`**, then committing the privacy policy, terms and guidelines (Stripe wording is in the draft).
- **Going live with payments**: Stripe test keys, the webhook, a test payment, then `PREMIUM_LIVE=on`.
- **Real routes** to replace the sample content, before charging anyone. The bulk importer and its details spreadsheet are ready.
- **Commercial terms** for MapTiler and routing (see A3), and rotating the exposed Neon password.
- **Trying the Android app on a real phone**: the direct Instagram and TikTok send.

## If it helps to order them

- **Do soonest:** A1 (minutes once you decide) and A2, since they unblock the most.
- **Best value for effort:** C1 (free for riders, and B11 stands on it), then C2 and C3. G1 belongs here too — cheap, no AI, genuinely useful.
- **Wait until there are paying subscribers:** B6 to B9, and G2 onward — a large build, worth doing once there's a reason to believe riders want it.
