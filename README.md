# Herepath

A UK motorcycle route guide — curated routes, day rides and multi-day tours with honest difficulty and bike-suitability ratings, GPX export, and hand-off to Google/Apple Maps. Riders can save rides, keep a diary and share them. Made by Dead Cylinder Co.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL (Drizzle ORM), Auth.js and MapLibre GL.

## What's in it

- **Public site:** home, Explore (search, filters, map view), route / day ride / tour pages, Pricing, FAQ, About, Contact, Privacy.
- **Rider accounts:** sign up, saved rides, ride diary with photos, reviews, sharing.
- **Admin (`/admin`):** routes, day rides, tours, places, landmarks, regions, collections, search chips, **Site content** (edit page wording and images), contact messages, users (free/premium tier), and the Premium waitlist.

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
| `NEXT_PUBLIC_MAP_STYLE_URL` | production | MapLibre style URL from a tile provider (MapTiler, Stadia…) including its API key. Without it the app falls back to OpenStreetMap's public tiles, which aren't allowed for production traffic |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | production | Set automatically when you connect a Vercel Blob store to the project (Storage tab). Without one, uploads save to `public/uploads` locally and **fail on Vercel** |
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
- The sample routes use road-snapped geometry from `src/db/sample-geometries.json`, generated once by `scripts/generate-snapped-geometries.ts`. Uploading a real GPX to a route in admin replaces it.

## Deploying (Vercel)

1. Push to GitHub and import the repository in Vercel.
2. Create a hosted Postgres database (for example Neon) and a Vercel Blob store.
3. Add the environment variables above to the Vercel project.
4. Run `db:migrate` (and `db:seed` if you want the sample content) against the hosted database.
5. Deploy. Vercel redeploys on every push to `main`.

Vercel limits request bodies to about 4.5MB, so very large photo uploads will fail there.

## Useful commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npx tsc --noEmit   # type-check
npm run db:studio  # browse the database
```
