import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { routes } from "@/db/schema";
import { haversineMiles, type LatLng } from "@/lib/geo";
import { generateMultiTrackGpx, type GpxWaypoint } from "@/lib/gpx";
import { inUk, MAX_LINK_STRAIGHT_MILES, MIN_LINK_MILES } from "@/lib/road-link";
import { getRoadRoute } from "@/lib/routing";
import { slugify } from "@/lib/slug";
import { MAX_TRIP_ROUTES } from "@/lib/trip-planner";

// Finding the road for a stretch we haven't been asked about before can take a few seconds.
export const maxDuration = 30;
/** Stop asking the routing service after this long and leave the remaining stretches out, as the file always did. */
const ROUTING_BUDGET_MS = 20000;

/**
 * A GPX file for a trip built in the planner: one track per route, in riding order (a `~` after a route's slug means it's ridden
 * from its finish back to its start), with a waypoint where each route begins. The stretches between routes (and to and from the start
 * point) are added as their own tracks, in riding order, when the routing service can find the road for them; any it can't are
 * left out, and the rider's navigation app finds its own way across.
 *
 * Example: /api/trip-gpx?name=My%20trip&r=snake-pass-a57&r=winnats-pass~&start=53.44,-1.95&home=53.44,-1.95
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = params.getAll("r").slice(0, MAX_TRIP_ROUTES + 1);
  if (requested.length === 0 || requested.length > MAX_TRIP_ROUTES) {
    return Response.json({ error: `Choose between 1 and ${MAX_TRIP_ROUTES} routes.` }, { status: 400 });
  }
  const entries = requested.map((value) => ({ slug: value.replace(/~$/, ""), reversed: value.endsWith("~") }));

  const rows = await db
    .select()
    .from(routes)
    .where(
      and(
        inArray(
          routes.slug,
          entries.map((e) => e.slug),
        ),
        eq(routes.status, "published"),
      ),
    );
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  if (entries.some((e) => !bySlug.get(e.slug)?.geometry)) {
    return Response.json({ error: "One of those routes isn't available." }, { status: 404 });
  }

  const name = (params.get("name") ?? "").trim().slice(0, 80) || "Herepath trip";
  const tracks: { name: string; geometry: GeoJSON.LineString }[] = [];
  const waypoints: GpxWaypoint[] = [];

  const start = (params.get("start") ?? "").split(",").map(Number);
  if (start.length === 2 && start.every(Number.isFinite) && Math.abs(start[0]) <= 90 && Math.abs(start[1]) <= 180) {
    waypoints.push({ lat: start[0], lng: start[1], name: "Start and finish" });
  }

  const startPoint: LatLng | null = start.length === 2 && start.every(Number.isFinite) && Math.abs(start[0]) <= 90 && Math.abs(start[1]) <= 180 ? { lat: start[0], lng: start[1] } : null;
  const homeParts = (params.get("home") ?? "").split(",").map(Number);
  const homePoint: LatLng | null = homeParts.length === 2 && homeParts.every(Number.isFinite) && Math.abs(homeParts[0]) <= 90 && Math.abs(homeParts[1]) <= 180 ? { lat: homeParts[0], lng: homeParts[1] } : null;
  const routingDeadline = Date.now() + ROUTING_BUDGET_MS;

  /** The road from one point to another as a track, or nothing if it isn't worth routing or the service can't find it. */
  async function linkTrack(name: string, from: LatLng | null, to: LatLng | null) {
    if (!from || !to || !inUk(from) || !inUk(to) || Date.now() > routingDeadline) return;
    const straight = haversineMiles(from, to);
    if (straight < MIN_LINK_MILES || straight > MAX_LINK_STRAIGHT_MILES) return;
    try {
      const outcome = await getRoadRoute(from, to);
      if (outcome.ok) tracks.push({ name, geometry: { type: "LineString", coordinates: outcome.route.line } });
    } catch {
      // Leave this stretch out.
    }
  }

  let position: LatLng | null = startPoint;
  for (const [index, entry] of entries.entries()) {
    const route = bySlug.get(entry.slug)!;
    const line = route.geometry as GeoJSON.LineString;
    const coordinates = entry.reversed ? [...line.coordinates].reverse() : line.coordinates;
    const [lng, lat] = coordinates[0];
    const [endLng, endLat] = coordinates[coordinates.length - 1];

    await linkTrack(`Link to ${index + 1}. ${route.name}`, position, { lat, lng });
    tracks.push({ name: `${index + 1}. ${route.name}${entry.reversed ? " (reversed)" : ""}`, geometry: { type: "LineString", coordinates } });
    waypoints.push({ lat, lng, name: `${index + 1}. ${route.name} (start)` });
    position = { lat: endLat, lng: endLng };
  }
  await linkTrack("Ride home", position, homePoint);

  const gpx = generateMultiTrackGpx({ name, tracks, waypoints });
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${slugify(name) || "herepath-trip"}.gpx"`,
    },
  });
}
