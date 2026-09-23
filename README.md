# Herepath

A UK motorcycle route guide — curated routes, day rides and multi-day tours with honest difficulty and bike-suitability ratings, GPX export, and hand-off to Google/Apple Maps. Riders can save rides, keep a diary and share them. Made by Dead Cylinder Co.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL (Drizzle ORM), Auth.js and MapLibre GL.

## What's in it

- **Public site:** home, Explore (search, filters, map view), route / day ride / tour pages, Pricing, FAQ, About, Contact, Privacy.
- **Rider accounts:** sign up, saved rides, ride diary with photos, reviews, sharing.
- **Advice (`/advice`):** guides on maintenance, camping, tool kits and gear, written in admin (drafts stay hidden until published). `npm run db:advice-starters` loads three starter drafts to edit.
- **Advertise with us (`/advertise`):** businesses send an enquiry (stored under **Admin > Advertising**, with a hidden-field bot trap and a limit of three per email per day). There are no payments: you reply by email, then run a sponsored listing by ticking **Sponsored** on that business's place under Places. Sponsored places show a clear "Sponsored" label on day ride and tour pages. The page wording is editable under Site content.
- **Community guidelines:** live in the FAQ page (`/faq#guidelines`, `/guidelines` redirects there); the rules are in `src/lib/guidelines.ts`.
- **Rider blog (`/blog`):** signed-in riders write posts (optional cover photo and link to a ride, ticking the community guidelines). Nothing is public until a moderator approves it in **Admin > Blog posts**, where you can approve, reject with a note the rider sees, take a live post down, or handle reports. Editing a live post sends it back for review, and each rider can have three posts waiting at once.
- **Rider tips on places:** when logging a ride, riders can leave a one-line tip for the cafes, hotels and campsites on it; tips appear on those places. Signed-in riders can report a tip; reported tips are flagged first under Admin > Place tips (and on the dashboard), where you can delete the tip or dismiss the reports.
- **Admin (`/admin`):** routes, day rides, tours, places, landmarks, regions, collections, advice articles, place tips, search chips, **Site content** (edit page wording and images), contact messages, users (free/premium tier), and the Premium waitlist.
- **Account menu:** signed in, the name and avatar in the header (`src/components/layout/account-menu.tsx`) open a panel from the right with Profile, Your rides, Saved rides, Settings and Sign out.

## Running it locally

You need Node 20+ and a PostgreSQL database.

```bash
npm install
```

Create `.env.local` in the project root (it is git-ignored):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/herepath
ADMIN_PASSWORD=choose-a-password
ADMIN_SESSION_SECRET=<long random string>
AUTH_SECRET=<long random string>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate the two secrets with `npx auth secret` or `openssl rand -base64 32`.

Then set up the database and start the app:

```bash
npm run db:migrate   # create the tables
npm run db:seed      # load the sample routes, day rides and tours (wipes existing content)
npm run dev          # http://localhost:3000
```

Admin lives at `/admin`; log in with `ADMIN_PASSWORD`.

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `ADMIN_PASSWORD` | yes | Password for `/admin` — use a strong one in production |
| `ADMIN_SESSION_SECRET` | yes | Secret for the admin login cookie |
| `AUTH_SECRET` | yes | Secret for rider sign-in sessions |
| `NEXT_PUBLIC_SITE_URL` | yes | Public address of the site (used in share links and metadata) |
| `NEXT_PUBLIC_MAP_STYLE_URL` | production | MapLibre style URL from a tile provider (MapTiler, Stadia…) including its API key. Without it the app falls back to OpenStreetMap's public tiles, which aren't allowed for production traffic. If it's a MapTiler URL (`…/maps/streets-v2/style.json?key=…`), riders also get a Map / Contour Map / Satellite switch on the maps (the `outdoor-v2` and `hybrid` styles, same key); otherwise the switch is hidden |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | production | Set automatically when you connect a Vercel Blob store to the project (Storage tab). Without one, uploads save to `public/uploads` locally and **fail on Vercel** |
| `CRON_SECRET` | production | Any long random string. Vercel sends it with the daily job that refreshes the fuel, food and stay pins (`vercel.json`); without it that job is refused |
| `ORS_API_KEY` | production | A free key from openrouteservice.org. Turns on real road routing between routes in the trip planner (see Content). Without it the planner keeps its straight-line estimates in production |
| `ROUTING_PROVIDER` | no | `ors`, `osrm` or `none`. Defaults to `ors` when `ORS_API_KEY` is set; otherwise the public OSRM demo server outside production (for testing only) and no routing in production |
| `ROUTING_DAILY_LIMIT` | no | The most new road routes to ask the routing service for in a day. Default 2000, under openrouteservice's free 2,500 |
| `NATIONAL_HIGHWAYS_API_KEY` | production | A free key from developer.data.nationalhighways.co.uk (subscribe to Road and Lane Closures). Turns on road closure warnings. Without it no closures are shown |
| `PREMIUM_LIVE` | no | Set to `on` to launch Premium: riders can subscribe and the free-plan limits apply. Leave it unset and the site behaves as if there were no plans (nothing limited, no buying, Premium shows a waitlist) |
| `STRIPE_SECRET_KEY` | for payments | Stripe secret key (`sk_test_…` for testing, `sk_live_…` for real). Without it nobody can subscribe |
| `STRIPE_WEBHOOK_SECRET` | for payments | The signing secret (`whsec_…`) of the Stripe webhook that points at `<site>/api/stripe/webhook` |
| `NEXT_PUBLIC_DEAD_CYLINDER_URL` | no | Link target for the "Dead Cylinder Co." mentions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables Google sign-in. Redirect URI: `<site>/api/auth/callback/google` |

## Database

Schema lives in `src/db/schema/`. After changing it:

```bash
npm run db:generate  # writes a new migration into drizzle/
npm run db:migrate   # applies it
```

To run migrations or the seed against another database (for example the hosted one), set `DATABASE_URL` in the shell first. It takes priority over `.env.local`:

```powershell
$env:DATABASE_URL = "postgresql://..."
npm run db:migrate
```

`npm run db:seed` deletes existing routes, day rides, tours and related content before inserting the samples, so don't run it against a database holding real content.

## Content

- Ride content is edited in admin. Sample rides are flagged "Sample content" until replaced.
- Page wording and images (home, pricing, FAQ, About, contact) are edited in **Admin → Site content**. Defaults live in `src/lib/site-content.ts`.
- **Map thumbnails:** hovering or tapping a pin on a ride's map, the trip planner, or the Explore map view shows a small card with a name and, where one is set, a thumbnail — a route, day ride or tour's hero image (**Admin → that ride → Hero image**), or a place's own photo (**Admin → Places → Photo**). OpenStreetMap's own places never show a photo, so nothing from there is embedded as a picture.
- **Fuel, food and stay pins** on ride maps come from two sources: OpenStreetMap (looked up by `/api/places-along` through the free Overpass service and saved in the `osm_place_cache` table, so only the very first request for a ride can wait 10 to 25 seconds; **Admin → Places → Preload** does that for every ride, and a daily Vercel cron, `/api/cron/refresh-places`, re-asks the oldest answers older than 10 days, a few rides each day, using its 60 second limit. Riders are never shown an answer older than a month if OpenStreetMap can be reached, and if it can't they still get the old answer) and your own places in **Admin → Places**. A place needs a latitude and longitude to appear; tick **Sponsored** to label it and ring its pin. An OpenStreetMap place within 80 m of one of yours is treated as the same place and hidden.
- **Bulk GPX importer** (**Admin → Routes → Import GPX files**): choose up to 30 GPX files you have the right to use (a file with several tracks becomes several routes), say where they came from and their licence, check each row, and import. Every route is created as an unpublished draft marked **Needs review**, and can't be published until someone has checked it and unticked **Still needs review**. Source, author, link and licence are stored on the route and shown as a credit line on its page when the licence needs one. A route that looks the same as one already on the site (same ends and length, either direction) is left out. Nothing is fetched from other websites: files must be supplied by you.
  - **Route details from another source** (the same page, step 3): if the routes came with their own description, ratings or other details, download a spreadsheet template already matched to the GPX files you've just chosen, fill it in and upload it, instead of retyping the same details into up to 30 review cards by hand. It can fill in the name, region, difficulty, surface, riding time, start and finish names, both paragraphs of the description, hazards, best time, a stop-off, suited and caution bike types, links to existing landmarks, and a per-route source override (`src/lib/route-import.ts`: `applyDetailsCsv`, `buildDetailsTemplate`; the parser is `src/lib/csv.ts`). Matched to the GPX rows by filename (a "track" column disambiguates a file with several tracks) or, failing that, by name. Nothing it can't make sense of is fatal — an unmatched row, an unknown region, bike type or landmark name, or an invalid difficulty, surface or licence is explained in a warning and left for you to fix by hand, and it never bypasses the review a route needs before publishing. A beginner bike marked "suited" on a route too demanding for it (the same rule the route form enforces, in `src/lib/bike-types.ts`) is moved to "caution" instead, noted in the import result.
- **Road closures** (`src/lib/closures.ts`, `src/lib/closures/national-highways.ts`): National Highways' Road and Lane Closures feed (motorways and major A roads in England) is read into the `road_closures` table for the next 30 days, keeping only closures where the road itself is shut (not lane closures or slip roads). A page that shows closures reads the feed again after it has been sent if what we hold is over 30 minutes old (at most one read every 5 minutes), and a daily cron (`/api/cron/refresh-closures`) is a backstop. A closure counts as being on a ride when at least 300 m of it (or half, if shorter) runs within 50 m of the ride's line (`src/lib/closure-match.ts`), so a ride that just crosses a closed road doesn't count. Matches show as a warning on route, day ride and tour pages and on the trip planner (red on the map, a badge in the route list, a warning for the trip). The feed gives only an overall start and end, not the hours, so long closures are labelled as possibly overnight only. The API allows 10 calls a minute per key; a refresh uses 2.
- **Plans and payments** (`src/lib/plans.ts`, `src/lib/membership.ts`, `src/lib/billing.ts`, `src/app/billing/actions.ts`, `src/app/api/stripe/webhook/route.ts`): Free, Premium (£2.99 a month or £24.99 a year, charged through Stripe Checkout) and Premium Plus (shown as coming soon, with its own waitlist). Prices, feature lists and limits are all in `plans.ts`, so the pricing page and the checkout can't disagree. Stripe's webhook keeps the `subscriptions` table in step; a rider's level is the higher of what an admin set by hand (Admin → Users) and any paid subscription, so ending a subscription never takes away a level someone was given. Cancelling is done on Stripe's customer portal (Settings → Manage billing), and deleting an account cancels its subscription first. Nothing is limited or on sale until `PREMIUM_LIVE=on`. Free-plan limits: one saved trip, 20 diary entries with 3 photos each, no whole-tour GPX or printable tour sheet, no GPX import into the diary, and no roads between routes in a trip's GPX. Setting Stripe up: create a Stripe account, put its keys in the environment variables above, add a webhook endpoint for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`, and turn on the customer portal in Stripe's settings. Test with `sk_test_` keys and Stripe's test card 4242 4242 4242 4242 before switching to live keys.
- **Freshness and road reports:** each route, day ride and tour shows when our team last checked it (set **Last checked on** in its admin form; unchecked rides say so) and an optional dated **Current conditions** warning. Signed-in riders can **Report a problem** (up to 5 a day); reports arrive under **Admin → Road reports** and are never shown publicly. If one holds up, add a conditions note to the ride, then mark the report dealt with.
- **Ratings rule:** admin refuses to save a route that is difficulty 4 or 5, or has a poor surface, with Cruiser or 125cc marked as suited (the route form warns first).
- **Trip planner** (`/plan`): riders join published routes into their own day ride or tour, split it into days, ask for round trips from a start point, save up to 10 trips (`saved_trips` table), and download a GPX. A start point can be found by searching an address, postcode or place name (`/api/geocode`: postcodes.io for postcodes, MapTiler geocoding for other places using the key in `NEXT_PUBLIC_MAP_STYLE_URL`, or OpenStreetMap search when there is no MapTiler key), tapped on the map, or taken from the phone's location. The stretches between routes are real road routes when a routing service is set up (`/api/route`, `src/lib/routing.ts`: openrouteservice by default, swappable by adding a `RoutingProvider`; answers are cached in `road_route_cache` and at Vercel's edge, and the GPX includes them), and straight-line estimates when it isn't or can't find the road (`src/lib/trip-planner.ts`), not roads. Real road routing and a round-trip generator are scoped in [`docs/ROADMAP.md`](docs/ROADMAP.md).
- The sample routes use road-snapped geometry from `src/db/sample-geometries.json`, generated once by `scripts/generate-snapped-geometries.ts`. Uploading a real GPX to a route in admin replaces it.

## Deploying (Vercel)

1. Push to GitHub and import the repository in Vercel.
2. Create a hosted Postgres database (for example Neon) and a Vercel Blob store.
3. Add the environment variables above to the Vercel project.
4. Run `db:migrate` (and `db:seed` if you want the sample content) against the hosted database.
5. Deploy. Vercel redeploys on every push to `main`.

Vercel limits request bodies to about 4.5MB, so very large photo uploads will fail there.

## Mobile app (Android)

The Android app is a Capacitor shell around the live website (`capacitor.config.ts`); the project is in `android/`. It loads `https://herepath.vercel.app`, so website changes reach the app without a new release. `mobile-web/` holds only the offline fallback page. The app adds `HerepathApp` to its user agent, which the site uses to hide the "Get the app" badges inside the app. The site sends `viewport-fit=cover` and pads the header and bottom bar by the safe-area insets, so on Android the page's own colour fills the status bar; `NativeSystemBars` then sets the status/gesture bar icon colour from the rider's Light/Dark choice. These are website changes, so no new app build is needed.

The one piece of app-specific native code is `android/app/src/main/java/com/herepath/SocialSharePlugin.java`, which the Instagram and TikTok screens in the share pop-up use to send the ride image straight into those apps (skipping the share sheet). It only exists in app builds made after it was added; older builds, or phones without the app, fall back to the normal share sheet automatically.

To build and run it you need [Android Studio](https://developer.android.com/studio) (it installs Java and the Android SDK).

```bash
npm run android:sync   # after changing capacitor.config.ts or adding a plugin
npm run android:open   # opens the project in Android Studio; press Run to start it on an emulator or phone
```

To test against the dev server on this computer instead of the live site, start `npm run dev` and sync with the emulator's address for this computer:

```powershell
$env:CAP_SERVER_URL = "http://10.0.2.2:3000"
npm run android:sync
```

Run `npm run android:sync` again without that variable before building a release. The app id (`com.herepath`) is permanent once published to Google Play.

## Useful commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npx tsc --noEmit   # type-check
npm run db:studio  # browse the database
```
