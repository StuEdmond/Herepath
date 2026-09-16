import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { tours, tourDays, dayRides } from "@/db/schema";
import { generateMultiTrackGpx } from "@/lib/gpx";
import { slugify } from "@/lib/slug";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tour] = await db.select().from(tours).where(eq(tours.slug, slug));
  if (!tour) notFound();

  const days = await db
    .select({ dayNumber: tourDays.dayNumber, dayRide: dayRides })
    .from(tourDays)
    .innerJoin(dayRides, eq(tourDays.dayRideId, dayRides.id))
    .where(eq(tourDays.tourId, tour.id))
    .orderBy(tourDays.dayNumber);

  const tracks = days
    .filter((d) => d.dayRide.geometry)
    .map((d) => ({ name: `Day ${d.dayNumber}: ${d.dayRide.name}`, geometry: d.dayRide.geometry as GeoJSON.LineString }));

  if (tracks.length === 0) notFound();

  const gpx = generateMultiTrackGpx({ name: tour.name, tracks });

  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${slugify(tour.name)}.gpx"`,
    },
  });
}
