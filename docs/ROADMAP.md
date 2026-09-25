# Roadmap: ideas kept for later

Things we have talked through and scoped but not built. Each says what it is, why it's waiting, and where it would plug into the code.

## Trip planner: real road routing (Option 2) and a round-trip generator (Option 3)

**Update (September 2026): the first part of Option 2 is built.** The stretches between routes (from the start point, between routes, and home) now use real road routes from a swappable routing service (`src/lib/routing.ts`, `/api/route`, `road_route_cache` table). It defaults to openrouteservice (needs `ORS_API_KEY`), falls back to straight-line estimates when the service is missing or fails, is drawn solid on the map and included in the GPX. Still to do: a motorcycle profile (the car profile is used now), settling commercial terms and Premium before the public launch, letting riders add their own point-to-point stops (not only Herepath routes) and drag via points, and making round-trip suggestions use real roads.

**Where things stand.** The trip planner (`/plan`) joins Herepath's own routes end to end. The stretches *between* routes are straight-line estimates (distance × 1.3, at 30 mph), drawn as dashed lines and labelled as estimates. Round-trip suggestions are found by chaining whole routes that lie near the rider's start point. Nothing calls an outside routing service, so it costs nothing to run.

### Option 2: real routes between any two points
What it would add:
- A rider picks a start and a stop (and via points) and gets an actual road route, not only our curated routes.
- The connecting stretches in the trip planner become real roads with a real distance and time, instead of estimates.

What it needs: a road routing service. What we found (September 2026; check each vendor's current page before deciding):

| Service | Motorcycle / curvy roads | Cost and terms |
|---|---|---|
| GraphHopper | A motorcycle profile that favours curves is available through the Kurviger package, on paid plans only | Free plan is non-commercial and has no motorcycle profile. The Kurviger add-on uses 10× credits per request |
| OpenRouteService | Car, bike and foot profiles as far as we saw; motorcycle not confirmed | Free: 2,500 requests a day, 40,000 a month. Fine for a beta. Round trips capped at 100 km. Paid plan needed for commercial volumes |
| Stadia Maps (Valhalla) | Has a motorcycle routing profile | Pricing not confirmed |
| Self-hosted Valhalla or GraphHopper | Full control | We would run and pay for a server, and keep map data up to date |

Decisions to make first:
- Commercial terms: free tiers are usually non-commercial, so this must be settled before the public launch.
- Should it be Premium only? It fits the "Premium is coming" plan on the pricing page.
- Caching: store results (like the `osm_place_cache` table) so the same request isn't paid for twice.

Where it plugs in: `linkBetween()` in `src/lib/trip-planner.ts` returns a straight-line estimate. Give it an async version that asks the routing service, keep the straight-line estimate as the fallback when the service is down, and the rest of the planner (totals, days, GPX) keeps working. The GPX download (`src/app/api/trip-gpx/route.ts`) would then include the linking stretches as real tracks.

### Option 3: an automatic round-trip generator
"Give me 150 miles of good roads from here", like Calimoto, Kurviger and Beeline sell. It needs Option 2's routing service, ideally one with a curvy-roads profile. Notes:
- OpenRouteService's round-trip limit (100 km) is too short for a day ride.
- GraphHopper supports round trips; with the Kurviger package it can favour twisty roads.
- Herepath's edge is curated, honestly rated routes, so a generator should probably *complement* the catalogue (fill the gaps between routes) rather than replace it.
- Good candidate for a Premium feature.

Where it plugs in: the "Round trip from where you start" panel in `src/components/plan/trip-builder.tsx`. It already takes a start point and target distance. Today it calls `suggestRoundTrips()` (whole routes only); a generator would be a second source of suggestions.

## Road closures: what is built and what is next
**Built (September 2026):** National Highways closures (motorways and major A roads in England), shown on ride pages and the trip planner. See the README for how it works.

**Next:**
- **Street Manager (DfT)** covers roadworks and closures by councils and utilities on minor roads in England, which is where most riders' roads close. Free but needs registration and receiving a data stream, so it is a bigger job. LiveRoad and similar services sell it ready-made.
- **Scotland, Wales and Northern Ireland** have their own feeds (Traffic Scotland, Traffic Wales, TrafficWatch NI).
- **Rider road reports** could be shown as a "closure reported by riders" flag on the ride (they are private today).
- **Lane closures and slip roads** are ignored on purpose. They could be shown as a lighter "delays likely" note.
- **Unplanned closures** are fetched with the planned ones but were empty when we tested (a Sunday afternoon). Check the output when one is live.
- **Licence and credit:** the pages say "Source: National Highways". Check National Highways' terms page for any wording they require.

## Premium's "coming soon" list, worked through

Everything below is marked `soon` in `src/lib/plans.ts` (`PLAN_FEATURES`) and shown on the pricing page with a "Coming soon" tag, not sold as included. This is the order I'd tackle them in, and why. Nothing here is committed to a date — it's a starting point to look at and reprioritise.

### Phase 0: one decision this blocks two features on

**Pick a transactional email service.** Nothing in Herepath can send an email today — I checked. The contact form, blog approvals and admin password resets all rely on someone checking the admin dashboard or being handed a password directly; there's no `nodemailer`/Resend/Postmark/SES anywhere in the code. Two Premium features need a real message to land in someone's inbox (below), so this has to be chosen before either can be built. Resend and Postmark both have a small free tier and a straightforward API; either would do. This is a business decision (which service, and the cost once past its free tier) as much as a technical one.

### Phase 1: cheap, code-only, ship first

These don't need Phase 0, don't cost anything extra to run, and each is a solid week or so of focused work, so they're the natural way to make Premium feel finished before touching anything bigger.

1. ~~**Early access to new tours before they're public.**~~ **Dropped (owner's decision, September 2026).** All riders see new routes and tours the moment they're available, and they are announced to everyone by a blog post and a subscriber email (which needs Phase 0). See `WORK-LIST.md` item B1.
2. **Roadbook PDFs — worth clarifying first.** The printable tour sheet (`/tours/[slug]/print`) already exists and is Premium; a phone or laptop can already save it as a PDF through its own print dialog. If "Roadbook PDF" means something more (a proper generated PDF file to download in one tap, rather than print-to-PDF), say so and I'll scope it properly — likely a PDF library run on the server, `pdf-lib` or similar, which is a bounded, knowable job once the shape is agreed. If it just means "make sure Print works well as a PDF," that's closer to done already and worth a quick pass rather than new engineering.
3. **Founding member badge, and a direct line for feature requests.** A flag on the rider's account and a small badge component next to their name on reviews and tips (same pattern as the existing "Sponsored" tag). The "direct line" can be as simple as a dedicated contact-form option or a named email alias once Phase 0 exists to send from — until then, a note to check the contact messages admin page more often for these riders.
4. **Dead Cylinder Co. discount and a welcome pack.** The discount is a Stripe coupon code, a few minutes' work. The patch or sticker pack is fulfilment (buy them, post them), not code — I'd log new subscribers somewhere you check monthly, unless you want a small admin page to tick off "pack sent."

### Phase 2: needs Phase 0 (email)

5. ~~**Route watchlist.**~~ **Dropped (owner's decision, September 2026).** Kept below only for the record: a rider follows a saved route; a message goes out when its "last checked" date changes, a conditions note is added, or a closure is matched to it. Needs a small `route_watches` table and a job that compares against what changed since the last email — the road-closures refresh (`src/lib/closures.ts`) and the admin route form are exactly where the trigger would sit. Blocked on Phase 0.
6. **Advance notice on new region launches.** *Undecided: it is the same kind of early-sight perk as the two dropped above, so it may go too.* The lightest version of this needs no code at all: export Premium subscribers' emails from Stripe and send one manually. A built version (a "subscribe to be told" list per region, or just all Premium riders) is Phase 2 work once Phase 0 exists, but I'd start with the manual version and only build it once you're doing it often enough to be worth automating.

### Phase 3: bigger, and worth deferring until there are paying subscribers to justify them

7. **Offline ride packs.** I'd split this in two, because only half of it is actually hard:
   - **The easy half:** a route's GPX, its notes and its list of places, bundled into one downloadable file (or cached for the Android app to use with no signal). This has no external blocker and is a moderate build.
   - **The hard half — offline maps themselves.** This needs checking MapTiler's terms allow downloading and caching map tiles for offline use; a lot of tile providers explicitly forbid it. I flagged this as unconfirmed back when Premium was first designed, and it's still unconfirmed. Check that before promising it, since it might mean a different map provider or a paid tile-caching plan.
   - Nationwide offline (Premium Plus) is the same feature at a bigger scale — same blocker, do it after the regional version works.
8. **Video ride recaps (Premium Plus).** The biggest single build here. It needs a rendering service (something like Remotion or a hosted API such as Shotstack), a real per-render cost that has to be metered so one rider can't run up a large bill, and a decision on whether recaps include music (a licensing question) or stay silent/photo-and-map only for a first version. I'd start with the silent version.
9. **Ride-outs (Premium Plus).** New tables for the event and who's going, a joining link, and a group GPX pack — all reasonably ordinary building on top of the existing trip planner and diary. The part that takes longer than the code is everything around it: a real-world meeting point tied to a real date is a different privacy and moderation question to a route page, so the community guidelines and privacy policy need to cover it, which are both already waiting on `info@herepath.com`.
10. **Group trip planning (Premium Plus).** Extends the existing trip planner (`src/components/plan/trip-builder.tsx`) to a shared itinerary with per-rider notes and a printable pack per person. Builds on solid ground, but comes after ride-outs make sense to prioritise since they likely share people, not just because of build order.
11. **Custom route request, two a year (Premium Plus).** Small to build (a request form, a per-rider yearly counter, an admin queue) but a real recurring cost in your own time, not money — worth costing that against what Premium Plus actually brings in before promising it to every subscriber.

### My suggested order

Phase 0 → Phase 1 (all four, in roughly the order above) → Phase 2 → then revisit Phase 3 once Premium has real subscribers and real content behind it, at which point I'd do the offline GPX pack before video, and video before ride-outs, since each is progressively more expensive to get wrong.

## Google and Apple Maps links (need a test on real phones)
- **Google:** Google's Maps URL documentation allows 3 waypoints on mobile browsers and 9 otherwise. `src/lib/map-links.ts` sends 8 per leg (plus a start and a finish). **Tested by the owner (September 2026):** on the routes checked, Google Maps showed 8 stops plus the start and end, so all 8 waypoints are kept and no change is needed. This was in Google Maps on a phone, which is where riders will use it, so the documented 3-waypoint limit for mobile browsers doesn't affect us in practice. The buttons still say "approximate" because Google picks its own roads between waypoints.
- **Apple:** the buttons now say "start and end only". Apple's newer unified URL format (`maps.apple.com/directions?source=…&destination=…&waypoint=…`) is reported to accept repeated `waypoint` parameters, but we couldn't read Apple's page to confirm the names, any limit, or which iOS versions. Test one link on an iPhone or Mac before switching `buildAppleMapsUrl()` to it.
- **Legs at natural stops:** day rides already store lunch and fuel stops with mile markers, so leg boundaries could fall there. Longer legs mean fewer waypoints per mile, so this trades fidelity for fewer phone touches.
- **Bulk GPX importer with a source and licence field per route**, to replace the sample content faster.

## Affiliate links on hotels, campsites, pubs and restaurants (waiting on feedback, September 2026)

Click a place's listing and it opens a small page or panel with its details, plus a link through to book it on a site like booking.com. Scoped but not started, while the owner gets feedback from others first.

**Only Herepath's own places could carry this**, not the OpenStreetMap-sourced pins: an OSM point has no admin record behind it and no reliable way to match it to the right listing on a booking site.

What it needs, roughly in order:
1. **Decide on a provider (or a few) and apply.** Booking.com's own partner programme needs an application; going through an aggregator (Awin, Travelpayouts) is the easier route but takes a cut and adds a middleman. Restaurants would more likely use OpenTable or TheFork; campsites, Pitchup.com — Booking.com doesn't cover those well.
2. **A new field or two on `places`**: an affiliate link (or one per provider), and which provider it is. Small schema change.
3. **A real detail page or panel** for a place — today a listing is just a few lines of text in "Where to stay" with nowhere to click through to. Similar in size to the account panel already built.
4. **Wire listings and the map popup to it.** The map popup already supports a website link when a place has one (`src/components/map/place-card.ts`); a detail page just needs linking in from there and from the ride-page lists.
5. **A clear affiliate disclosure**, as the ASA's rules on affiliate marketing require — a wording and a small label, not a big build.
6. **A privacy policy update**, since the current draft says "We don't use analytics, advertising or tracking cookies. If that changes, we'll ask for your consent first" — a click-through sets a cookie on the other site's domain, not Herepath's, so this is mostly a line explaining that, alongside the disclosure above.
7. **Matching each of your own places to its real listing, by hand**, once it's built — not something to automate, since getting it wrong sends a rider to the wrong hotel.

None of it is hard engineering; the slow part is the provider applications, the disclosure wording, and matching places by hand, not the code.

## Elevation profile and a 3D fly-through preview (scoped September 2026, not started)

Like AllTrails' route preview: pick a route and a "Preview" button plays a 3D animation of the camera following the road, with the hills showing. **Owner's decision: the fly-through belongs in Premium** (it costs real map-tile requests each time it runs, which is the line already drawn for what Premium pays for). The elevation profile and gradient figures are safety-relevant and cheap once stored, so the intention is that they stay free. The pricing page has not been changed; add the fly-through to Premium's "coming soon" list in `src/lib/plans.ts` when the tiers are settled.

**The gap first: Herepath stores no elevation.** `src/lib/gpx.ts` never reads or writes an elevation value, routes are stored as flat longitude/latitude pairs, and exported GPX files carry no `<ele>`. Nothing below works until routes have it.

### Step A: get elevation onto routes (useful on its own, no per-view cost)
- Work out each route's elevation once, when it is imported or saved, and store it with the route (a per-point value alongside the geometry, or a thinned profile — the choice isn't made).
- Show an elevation profile chart on ride pages, with total ascent, descent and the steepest gradient. The steepest gradient matters to riders: Hardknott and Wrynose are defined by it, and it supports the honest-difficulty ratings.
- Put `<ele>` into exported GPX files, which some sat-navs use for climb information.
- **Where the numbers would come from** (September 2026; check each current page before deciding):
  - The GPX file's own `<ele>` when present. Real recordings usually have it, but GPS height is noisy, and the sample routes have none.
  - A terrain-model lookup done once per route: **Open-Meteo** (free only for non-commercial use, so a paid plan once charging), **OpenTopoData** (public service allows 100 points a request, 1 request a second, 1,000 a day, plenty for a few hundred routes; its commercial-use terms weren't confirmed, or self-host it), or **MapTiler's own terrain tiles** (already paid for, but read MapTiler's terms on storing values derived from their tiles first, the same open question as offline maps).
- Terrain models aren't road surveys: tunnels, cuttings and bridges can read a little off and a short steep pitch can be smoothed out. Word it as approximate.

### Step B: the 3D fly-through (Premium), built on Step A
- MapLibre (already in use, `maplibre-gl` 6.x) supports 3D terrain, and MapTiler serves terrain tiles (`terrain-rgb-v2`, Terrarium encoding) up to a fairly detailed zoom. The animation is a camera moving along the stored route, tilted and turning with the road, with the relief slightly exaggerated, and a marker moving along the elevation chart in step. Play, pause, speed and scrub controls; respect "reduce motion".
- **It costs per use.** A fly-through loads far more tiles than a normal map view, each counting against the MapTiler allowance, so it only runs when someone presses Preview, never automatically.
- **Phones may struggle** with 3D terrain (older devices, battery), so it needs a fallback to the flat map.
- **Testing:** the in-app browser pane can't render maps reliably, so the numbers and controls can be checked here, but smoothness has to be judged on a real phone.

## Smaller ideas noted along the way
- **Stay near the end of each day** in the trip planner: today the Stay pins show along all the trip's routes. Looking up places around an arbitrary point needs a limit on how many distinct places can be searched, so a visitor can't flood the free OpenStreetMap service.
- **Making the main "Download GPX" buttons work inside the Android app.** The app's web view can't download files, so those buttons probably do nothing there. The "Send to a navigation app" share button works around it.
- **Supporting FIT, TCX and KML files** when importing a ride on Log a ride. Only GPX is read today.
- **A weekly refresh with more headroom** for the places cache. The daily Vercel cron only gets through about 3 to 5 lookups a day on the free plan (60 seconds); a longer time limit or more frequent runs would let it keep pace as the catalogue grows.
