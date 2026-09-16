import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { routes, routeFuelStops, places } from "@/db/schema";
import { generateGpx, type GpxWaypoint } from "@/lib/gpx";
import { slugify } from "@/lib/slug";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [route] = await db.select().from(routes).where(eq(routes.slug, slug));
  if (!route || !route.geometry) notFound();

  const fuelStops = await db
    .select({ mileMarker: routeFuelStops.mileMarker, placeName: places.name, lat: places.lat, lng: places.lng })
    .from(routeFuelStops)
    .innerJoin(places, eq(routeFuelStops.placeId, places.id))
    .where(eq(routeFuelStops.routeId, route.id));

  const waypoints: GpxWaypoint[] = [];
  if (route.startPoint) waypoints.push({ lat: route.startPoint.lat, lng: route.startPoint.lng, name: "Start" });
  for (const stop of fuelStops) {
    if (stop.lat && stop.lng) waypoints.push({ lat: Number(stop.lat), lng: Number(stop.lng), name: stop.placeName });
  }
  if (route.endPoint) waypoints.push({ lat: route.endPoint.lat, lng: route.endPoint.lng, name: "Finish" });

  const gpx = generateGpx({
    name: route.name,
    geometry: route.geometry as GeoJSON.LineString,
    waypoints,
  });

  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${slugify(route.name)}.gpx"`,
    },
  });
}
