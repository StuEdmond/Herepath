import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRides, routes, tourDays, tours } from "@/db/schema";
import { getPlacesAlong } from "@/lib/places-along";
import { PLACE_KINDS, type PlaceKind } from "@/lib/place-kinds";

// OpenStreetMap can take a while to answer for a long tour.
export const maxDuration = 30;

type Line = [number, number][];

function asLine(geometry: unknown): Line | null {
  const line = geometry as GeoJSON.LineString | null;
  return line?.type === "LineString" && Array.isArray(line.coordinates) ? (line.coordinates as Line) : null;
}

/** The track(s) of a published ride: one for a route or day ride, one per day for a tour. */
async function linesFor(type: string, slug: string): Promise<Line[] | null> {
  if (type === "route") {
    const [route] = await db.select({ geometry: routes.geometry }).from(routes).where(and(eq(routes.slug, slug), eq(routes.status, "published")));
    const line = route && asLine(route.geometry);
    return line ? [line] : null;
  }
  if (type === "day-ride") {
    const [dayRide] = await db
      .select({ geometry: dayRides.geometry })
      .from(dayRides)
      .where(and(eq(dayRides.slug, slug), eq(dayRides.status, "published")));
    const line = dayRide && asLine(dayRide.geometry);
    return line ? [line] : null;
  }
  if (type === "tour") {
    const [tour] = await db.select({ id: tours.id }).from(tours).where(and(eq(tours.slug, slug), eq(tours.status, "published")));
    if (!tour) return null;
    const days = await db
      .select({ geometry: dayRides.geometry })
      .from(tourDays)
      .innerJoin(dayRides, eq(tourDays.dayRideId, dayRides.id))
      .where(eq(tourDays.tourId, tour.id))
      .orderBy(asc(tourDays.dayNumber));
    const lines = days.map((d) => asLine(d.geometry)).filter((l): l is Line => !!l);
    return lines.length > 0 ? lines : null;
  }
  return null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "";
  const slug = params.get("slug") ?? "";
  const kind = params.get("kind") ?? "";

  if (!slug || !PLACE_KINDS.some((k) => k.id === kind)) {
    return Response.json({ error: "Unknown ride or kind of place." }, { status: 400 });
  }

  const lines = await linesFor(type, slug);
  if (!lines) return Response.json({ error: "Ride not found." }, { status: 404 });

  const result = await getPlacesAlong(kind as PlaceKind, lines);
  return Response.json(result, {
    // Places barely change day to day, so browsers and Vercel's edge can keep a copy for a while.
    headers: { "Cache-Control": result.osmOk ? "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" : "no-store" },
  });
}
