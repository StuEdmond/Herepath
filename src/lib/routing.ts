import { createHash } from "node:crypto";
import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { roadRouteCache } from "@/db/schema";
import type { LatLng } from "./geo";
import { simplifyTrack } from "./gpx";
import { linkKey, type RoadLinkResponse } from "./road-link";

/**
 * Road routing between two points, behind a small interface so the service behind it can be swapped without touching the planner.
 * To use another service, write one more `RoutingProvider` below and choose it in `selectProvider`.
 *
 * Settings (environment variables):
 * - `ROUTING_PROVIDER`: `ors`, `osrm` or `none`. If unset: `ors` when `ORS_API_KEY` is set; otherwise `osrm` outside production
 *   (a public demo server, for testing only) and no routing in production.
 * - `ORS_API_KEY`: an openrouteservice.org key.
 * - `ROUTING_DAILY_LIMIT`: the most new routes to ask the service for in a day (default 2000, under openrouteservice's free 2,500).
 */

export interface RoutedPath {
  /** [lng, lat] points along the road. */
  coordinates: [number, number][];
  meters: number;
  seconds: number;
}

export type ProviderFailure = "no-route" | "limit" | "failed";

export interface RoutingProvider {
  /** Recorded with each cached answer, so changing provider asks the new one. */
  id: string;
  /** Shown beside routes on the site, as the service's terms ask. */
  attribution: string;
  route(from: LatLng, to: LatLng): Promise<RoutedPath | ProviderFailure>;
}

const TIMEOUT_MS = 9000;
/** Roads change slowly, but not never. */
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
/** How many points of a road to keep. Plenty to draw it, and keeps the cache and the pages small. */
const MAX_LINE_POINTS = 700;
/** A route's start or finish can sit off the road a little, so the service may snap to any road within this many metres. */
const SNAP_METRES = 2000;
const METERS_PER_MILE = 1609.344;

const USER_AGENT = `Herepath/1.0 (${process.env.NEXT_PUBLIC_SITE_URL ?? "https://herepath.vercel.app"})`;

function isPath(value: unknown): value is { coordinates: [number, number][]; meters: number; seconds: number } {
  const v = value as RoutedPath | null;
  return !!v && Array.isArray(v.coordinates) && v.coordinates.length >= 2 && Number.isFinite(v.meters) && Number.isFinite(v.seconds);
}

/** openrouteservice.org: free for light use (2,500 requests a day), paid plans for more. The car profile; it has no motorcycle one. */
function orsProvider(apiKey: string): RoutingProvider {
  return {
    id: "ors",
    attribution: "Road routes by openrouteservice.org, © OpenStreetMap contributors",
    async route(from, to) {
      const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Authorization: apiKey, "Content-Type": "application/json", "User-Agent": USER_AGENT },
        body: JSON.stringify({
          coordinates: [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ],
          radiuses: [SNAP_METRES, SNAP_METRES],
          instructions: false,
        }),
      });
      if (response.status === 429) return "limit";
      // 404 with a routing error means there's no road route between the points (or none near one of them).
      if (response.status === 404 || response.status === 400) return "no-route";
      if (!response.ok) return "failed";
      const data = (await response.json()) as {
        features?: { geometry?: { coordinates?: [number, number][] }; properties?: { summary?: { distance?: number; duration?: number } } }[];
      };
      const feature = data.features?.[0];
      const path = { coordinates: feature?.geometry?.coordinates ?? [], meters: feature?.properties?.summary?.distance ?? NaN, seconds: feature?.properties?.summary?.duration ?? NaN };
      return isPath(path) ? path : "failed";
    },
  };
}

/** The public OSRM demo server: no key and no promises. For trying the planner locally, not for a live site. */
function osrmDemoProvider(): RoutingProvider {
  return {
    id: "osrm-demo",
    attribution: "Road routes by OSRM, © OpenStreetMap contributors",
    async route(from, to) {
      const url =
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=full&geometries=geojson&radiuses=${SNAP_METRES};${SNAP_METRES}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": USER_AGENT } });
      if (response.status === 429) return "limit";
      if (response.status === 400) return "no-route";
      if (!response.ok) return "failed";
      const data = (await response.json()) as { code?: string; routes?: { geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }[] };
      if (data.code === "NoRoute" || data.code === "NoSegment") return "no-route";
      const route = data.routes?.[0];
      const path = { coordinates: route?.geometry?.coordinates ?? [], meters: route?.distance ?? NaN, seconds: route?.duration ?? NaN };
      return isPath(path) ? path : "failed";
    },
  };
}

/** The routing service in use, or null when there isn't one (the planner then keeps its straight-line estimates). */
export function selectProvider(): RoutingProvider | null {
  const choice = (process.env.ROUTING_PROVIDER ?? "").trim().toLowerCase();
  const orsKey = process.env.ORS_API_KEY?.trim();
  if (choice === "none") return null;
  if (choice === "ors" || (!choice && orsKey)) return orsKey ? orsProvider(orsKey) : null;
  if (choice === "osrm" || (!choice && process.env.NODE_ENV !== "production")) return osrmDemoProvider();
  return null;
}

export type RoadRouteOutcome = { ok: true; route: RoadLinkResponse } | { ok: false; reason: "not-configured" | ProviderFailure };

function dailyLimit(): number {
  const value = Number(process.env.ROUTING_DAILY_LIMIT);
  return Number.isFinite(value) && value > 0 ? value : 2000;
}

function toResponse(provider: RoutingProvider, row: { line: [number, number][]; distanceMeters: number; durationSeconds: number }): RoadLinkResponse {
  return { miles: row.distanceMeters / METERS_PER_MILE, minutes: row.durationSeconds / 60, line: row.line, attribution: provider.attribution };
}

/** A road route from one point to another. Answers come from the cache when there's a fresh one; the service is asked only for a new stretch. */
export async function getRoadRoute(from: LatLng, to: LatLng): Promise<RoadRouteOutcome> {
  const provider = selectProvider();
  if (!provider) return { ok: false, reason: "not-configured" };

  const key = createHash("sha1").update(`${provider.id}|${linkKey(from, to)}`).digest("hex");
  const [cached] = await db.select().from(roadRouteCache).where(eq(roadRouteCache.key, key));
  if (cached && Date.now() - cached.fetchedAt.getTime() < MAX_AGE_MS) return { ok: true, route: toResponse(provider, cached) };

  // A stale answer is better than none if the service can't be used right now.
  const fallback = (reason: ProviderFailure): RoadRouteOutcome => (cached ? { ok: true, route: toResponse(provider, cached) } : { ok: false, reason });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [today] = await db.select({ n: sql<number>`count(*)::int` }).from(roadRouteCache).where(gte(roadRouteCache.fetchedAt, startOfDay));
  if ((today?.n ?? 0) >= dailyLimit()) return fallback("limit");

  let result: RoutedPath | ProviderFailure;
  try {
    result = await provider.route(from, to);
  } catch {
    return fallback("failed");
  }
  if (typeof result === "string") return result === "no-route" ? { ok: false, reason: "no-route" } : fallback(result);

  const line = simplifyTrack(result.coordinates, MAX_LINE_POINTS).map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))] as [number, number]);
  const row = { key, provider: provider.id, line, distanceMeters: Math.round(result.meters), durationSeconds: Math.round(result.seconds), fetchedAt: new Date() };
  await db
    .insert(roadRouteCache)
    .values(row)
    .onConflictDoUpdate({ target: roadRouteCache.key, set: { provider: row.provider, line: row.line, distanceMeters: row.distanceMeters, durationSeconds: row.durationSeconds, fetchedAt: row.fetchedAt } });
  return { ok: true, route: toResponse(provider, row) };
}
