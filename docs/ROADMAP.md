# Roadmap: ideas kept for later

Things we have talked through and scoped but not built. Each says what it is, why it's waiting, and where it would plug into the code.

## Trip planner: real road routing (Option 2) and a round-trip generator (Option 3)

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

## Smaller ideas noted along the way
- **Stay near the end of each day** in the trip planner: today the Stay pins show along all the trip's routes. Looking up places around an arbitrary point needs a limit on how many distinct places can be searched, so a visitor can't flood the free OpenStreetMap service.
- **Making the main "Download GPX" buttons work inside the Android app.** The app's web view can't download files, so those buttons probably do nothing there. The "Send to a navigation app" share button works around it.
- **Supporting FIT, TCX and KML files** when importing a ride on Log a ride. Only GPX is read today.
- **A weekly refresh with more headroom** for the places cache. The daily Vercel cron only gets through about 3 to 5 lookups a day on the free plan (60 seconds); a longer time limit or more frequent runs would let it keep pace as the catalogue grows.
