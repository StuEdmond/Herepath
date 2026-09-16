import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { dayRides, dayRideStages, routes, places } from "@/db/schema";
import { generateGpx, type GpxWaypoint } from "@/lib/gpx";
import { slugify } from "@/lib/slug";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [dayRide] = await db.select().from(dayRides).where(eq(dayRides.slug, slug));
  if (!dayRide || !dayRide.geometry) notFound();

  const stages = await db
    .select({ stage: dayRideStages, routeName: routes.name, routeStart: routes.startPoint, placeName: places.name, placeLat: places.lat, placeLng: places.lng })
    .from(dayRideStages)
    .leftJoin(routes, eq(dayRideStages.routeId, routes.id))
    .leftJoin(places, eq(dayRideStages.placeId, places.id))
    .where(eq(dayRideStages.dayRideId, dayRide.id))
    .orderBy(dayRideStages.position);

  const waypoints: GpxWaypoint[] = [];
  for (const row of stages) {
    if (row.stage.kind === "start" && row.stage.location) {
      const coords = (dayRide.geometry as GeoJSON.LineString).coordinates[0];
      waypoints.push({ lat: coords[1], lng: coords[0], name: `Start: ${row.stage.location}` });
    } else if (row.stage.kind === "finish" && row.stage.location) {
      const coords = (dayRide.geometry as GeoJSON.LineString).coordinates.at(-1)!;
      waypoints.push({ lat: coords[1], lng: coords[0], name: `Finish: ${row.stage.location}` });
    } else if (row.stage.kind === "route" && row.routeName && row.routeStart) {
      waypoints.push({ lat: row.routeStart.lat, lng: row.routeStart.lng, name: row.routeName });
    } else if (row.stage.kind === "stop" && row.placeName && row.placeLat && row.placeLng) {
      waypoints.push({ lat: Number(row.placeLat), lng: Number(row.placeLng), name: row.placeName });
    }
  }

  const gpx = generateGpx({
    name: dayRide.name,
    geometry: dayRide.geometry as GeoJSON.LineString,
    waypoints,
  });

  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${slugify(dayRide.name)}.gpx"`,
    },
  });
}

