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
- **Fuel, food and stay pins** on ride maps come from two sources: OpenStreetMap (looked up by `/api/places-along` through the free Overpass service and saved in the `osm_place_cache` table, so only the very first request for a ride can wait 10 to 25 seconds; **Admin → Places → Preload** does that for every ride, and a daily Vercel cron, `/api/cron/refresh-places`, re-asks the oldest answers older than 10 days, a few rides each day, using its 60 second limit. Riders are never shown an answer older than a month if OpenStreetMap can be reached, and if it can't they still get the old answer) and your own places in **Admin → Places**. A place needs a latitude and longitude to appear; tick **Sponsored** to label it and ring its pin. An OpenStreetMap place within 80 m of one of yours is treated as the same place and hidden.
- **Trip planner** (`/plan`): riders join published routes into their own day ride or tour, split it into days, ask for round trips from a start point, save up to 10 trips (`saved_trips` table), and download a GPX. The stretches between routes are straight-line estimates (`src/lib/trip-planner.ts`), not roads. Real road routing and a round-trip generator are scoped in [`docs/ROADMAP.md`](docs/ROADMAP.md).
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
