import { PLACE_KINDS, type PlaceKind } from "@/lib/place-kinds";
import { REFRESH_AFTER_MS, getPlacesAlong, getPublishedRides, getRideLines, savedAnswerAgeMs } from "@/lib/places-along";

// Vercel runs this once a day (see vercel.json). It can't get through every ride in one go, so it works
// through the stalest first and the rest get their turn on the following days.
export const maxDuration = 60;

const TIME_BUDGET_MS = 52_000;
/** Not worth starting another lookup with less time than this left. */
const MIN_TIME_FOR_LOOKUP_MS = 12_000;
const PAUSE_BETWEEN_LOOKUPS_MS = 1200;

export async function GET(request: Request) {
  // Vercel sends the CRON_SECRET environment variable as a bearer token. With none set, the endpoint stays closed.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }

  const deadline = Date.now() + TIME_BUDGET_MS;

  const stale: { type: string; slug: string; kind: PlaceKind; age: number; lines: [number, number][][] }[] = [];
  let checked = 0;
  for (const ride of await getPublishedRides()) {
    const lines = await getRideLines(ride.type, ride.slug);
    if (!lines) continue;
    for (const kind of PLACE_KINDS) {
      checked++;
      const age = await savedAnswerAgeMs(kind.id, lines);
      if (age >= REFRESH_AFTER_MS) stale.push({ type: ride.type, slug: ride.slug, kind: kind.id, age, lines });
    }
  }
  stale.sort((a, b) => b.age - a.age);

  let refreshed = 0;
  let failed = 0;
  let timedOut = false;
  for (const job of stale) {
    if (deadline - Date.now() < MIN_TIME_FOR_LOOKUP_MS) {
      timedOut = true;
      break;
    }
    const result = await getPlacesAlong(job.kind, job.lines, { maxAgeMs: REFRESH_AFTER_MS, deadline });
    if (result.failed > 0) failed++;
    else if (result.asked > 0) refreshed++;
    if (result.asked > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_LOOKUPS_MS));
  }

  return Response.json({ checked, stale: stale.length, refreshed, failed, leftForTomorrow: timedOut ? stale.length - refreshed - failed : 0 });
}
