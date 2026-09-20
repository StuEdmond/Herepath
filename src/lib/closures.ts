import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db/client";
import { roadClosures, roadClosureSync, routes } from "@/db/schema";
import { boundsOf, boundsOverlap, closureOnRide } from "./closure-match";
import { fetchNationalHighwaysClosures, type ParsedClosure } from "./closures/national-highways";

/**
 * Road closures on the rides. National Highways' feed is read into the database and matched to each ride's line when a page needs it.
 * With no `NATIONAL_HIGHWAYS_API_KEY` none of this does anything and no closures are shown.
 */

const SOURCE = "national-highways";
/** Read the feed again when what we have is older than this. */
const STALE_MS = 30 * 60 * 1000;
/** After a try (successful or not), leave the feed alone for this long, so a failing feed isn't hammered by every visitor. */
const RETRY_MS = 5 * 60 * 1000;
/** A refresh that hasn't finished by then is assumed to have died, and another may start. */
const LOCK_MS = 3 * 60 * 1000;
const WRITE_CHUNK = 40;

type Line = [number, number][];

/** A closure as the pages show it. Dates are ISO strings so it can be passed to the browser. */
export interface RideClosure {
  id: string;
  roads: string;
  comment: string;
  locationText: string;
  status: "active" | "planned" | "suspended";
  startsAt: string | null;
  endsAt: string | null;
  lines: Line[];
}

function apiKey(): string | null {
  return process.env.NATIONAL_HIGHWAYS_API_KEY?.trim() || null;
}

export function closuresConfigured(): boolean {
  return apiKey() !== null;
}

function boundsOfClosure(closure: ParsedClosure) {
  return boundsOf(closure.lines)!;
}

async function save(closures: ParsedClosure[], seenAt: Date) {
  for (let i = 0; i < closures.length; i += WRITE_CHUNK) {
    const rows = closures.slice(i, i + WRITE_CHUNK).map((closure) => {
      const bounds = boundsOfClosure(closure);
      return {
        id: closure.id,
        source: SOURCE,
        roads: closure.roads.join(", "),
        comment: closure.comment,
        locationText: closure.locationText,
        status: closure.status,
        startsAt: closure.startsAt,
        endsAt: closure.endsAt,
        lines: closure.lines,
        ...bounds,
        sourceUpdatedAt: closure.updatedAt,
        seenAt,
      };
    });
    await db
      .insert(roadClosures)
      .values(rows)
      .onConflictDoUpdate({
        target: roadClosures.id,
        set: {
          roads: sql`excluded.roads`,
          comment: sql`excluded.comment`,
          locationText: sql`excluded.location_text`,
          status: sql`excluded.status`,
          startsAt: sql`excluded.starts_at`,
          endsAt: sql`excluded.ends_at`,
          lines: sql`excluded.lines`,
          minLat: sql`excluded.min_lat`,
          maxLat: sql`excluded.max_lat`,
          minLng: sql`excluded.min_lng`,
          maxLng: sql`excluded.max_lng`,
          sourceUpdatedAt: sql`excluded.source_updated_at`,
          seenAt: sql`excluded.seen_at`,
        },
      });
  }
}

export type RefreshOutcome = { ok: true; count: number } | { ok: false; reason: "not-configured" | "busy" | "failed"; message?: string };

/** Reads National Highways' feed and replaces what we hold. Only one refresh runs at a time; a second one is told it's busy. */
export async function refreshClosures(): Promise<RefreshOutcome> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "not-configured" };

  const now = new Date();
  await db.insert(roadClosureSync).values({ source: SOURCE }).onConflictDoNothing();
  // Take the lock only if nobody holds a live one.
  const locked = await db
    .update(roadClosureSync)
    .set({ lockedUntil: new Date(now.getTime() + LOCK_MS), attemptedAt: now })
    .where(and(eq(roadClosureSync.source, SOURCE), or(isNull(roadClosureSync.lockedUntil), lt(roadClosureSync.lockedUntil, now))))
    .returning({ source: roadClosureSync.source });
  if (locked.length === 0) return { ok: false, reason: "busy" };

  try {
    const closures = await fetchNationalHighwaysClosures(key);
    await save(closures, now);
    // Anything the feed no longer lists has been cancelled or finished; anything long over is cleared out too.
    await db.delete(roadClosures).where(and(eq(roadClosures.source, SOURCE), lt(roadClosures.seenAt, now)));
    await db.delete(roadClosures).where(and(eq(roadClosures.source, SOURCE), lt(roadClosures.endsAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))));
    await db.update(roadClosureSync).set({ fetchedAt: new Date(), lockedUntil: null, closureCount: closures.length, lastError: null }).where(eq(roadClosureSync.source, SOURCE));
    return { ok: true, count: closures.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.update(roadClosureSync).set({ lockedUntil: null, lastError: message.slice(0, 300) }).where(eq(roadClosureSync.source, SOURCE));
    return { ok: false, reason: "failed", message };
  }
}

/**
 * Called by pages that show closures. If what we hold is old, the feed is read again after the page has been sent, so the visitor never
 * waits for it. (The very first visit after set-up sees no closures; the next one does.)
 */
export async function ensureClosuresFresh(): Promise<void> {
  if (!apiKey()) return;
  const [sync] = await db.select().from(roadClosureSync).where(eq(roadClosureSync.source, SOURCE));
  const now = Date.now();
  const fresh = sync?.fetchedAt && now - sync.fetchedAt.getTime() < STALE_MS;
  const triedRecently = sync?.attemptedAt && now - sync.attemptedAt.getTime() < RETRY_MS;
  if (fresh || triedRecently) return;
  try {
    after(async () => {
      await refreshClosures();
    });
  } catch {
    // Not inside a request (a script, say): leave it for the scheduled refresh.
  }
}

/** Closures in force now or coming up. */
async function currentClosures(): Promise<RideClosure[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(roadClosures)
    .where(and(eq(roadClosures.source, SOURCE), or(isNull(roadClosures.endsAt), gt(roadClosures.endsAt, now))));
  return rows.map((row) => ({
    id: row.id,
    roads: row.roads,
    comment: row.comment,
    locationText: row.locationText,
    status: row.status as RideClosure["status"],
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    lines: row.lines,
  }));
}

/** The closures on every published route, by route id, for the planner. Uses each route's full track, not the thinned copy the map draws. */
export async function getClosuresForPublishedRoutes(): Promise<Map<string, RideClosure[]>> {
  if (!apiKey()) return new Map();
  const rows = await db.select({ id: routes.id, geometry: routes.geometry }).from(routes).where(eq(routes.status, "published"));
  const rides = rows.flatMap((row) => {
    const line = row.geometry as GeoJSON.LineString | null;
    return line?.type === "LineString" && Array.isArray(line.coordinates) && line.coordinates.length >= 2 ? [{ key: row.id, lines: [line.coordinates as Line] }] : [];
  });
  return getClosuresForRides(rides);
}

const STATUS_ORDER = { active: 0, suspended: 1, planned: 2 } as const;

/** The closures on each ride, by ride key. `rides` is each ride's key and its line(s). Rides with none are left out of the answer. */
export async function getClosuresForRides(rides: { key: string; lines: Line[] }[]): Promise<Map<string, RideClosure[]>> {
  const result = new Map<string, RideClosure[]>();
  if (!apiKey() || rides.length === 0) return result;

  const closures = await currentClosures();
  if (closures.length === 0) return result;
  const closureBounds = closures.map((closure) => boundsOf(closure.lines)!);

  for (const ride of rides) {
    const rideBounds = boundsOf(ride.lines);
    if (!rideBounds) continue;
    const found = closures.filter((closure, i) => boundsOverlap(rideBounds, closureBounds[i]) && closureOnRide(closure.lines, ride.lines));
    if (found.length === 0) continue;
    found.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
    result.set(ride.key, found);
  }
  return result;
}
