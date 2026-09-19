import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { routes } from "@/db/schema";
import { generateMultiTrackGpx, type GpxWaypoint } from "@/lib/gpx";
import { slugify } from "@/lib/slug";
import { MAX_TRIP_ROUTES } from "@/lib/trip-planner";

/**
 * A GPX file for a trip built in the planner: one track per route, in riding order (a `~` after a route's slug means it's ridden
 * from its finish back to its start), with a waypoint where each route begins. Riders' navigation apps find their own way
 * between the routes, so the stretches linking them aren't drawn into the file.
 *
 * Example: /api/trip-gpx?name=My%20trip&r=snake-pass-a57&r=winnats-pass~&start=53.44,-1.95
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

  entries.forEach((entry, index) => {
    const route = bySlug.get(entry.slug)!;
    const line = route.geometry as GeoJSON.LineString;
    const coordinates = entry.reversed ? [...line.coordinates].reverse() : line.coordinates;
    tracks.push({ name: `${index + 1}. ${route.name}${entry.reversed ? " (reversed)" : ""}`, geometry: { type: "LineString", coordinates } });
    const [lng, lat] = coordinates[0];
    waypoints.push({ lat, lng, name: `${index + 1}. ${route.name} (start)` });
  });

  const gpx = generateMultiTrackGpx({ name, tracks, waypoints });
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${slugify(name) || "herepath-trip"}.gpx"`,
    },
  });
}
