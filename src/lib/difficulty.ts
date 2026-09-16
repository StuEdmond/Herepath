import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRideStages, routes, tourDays } from "@/db/schema";

/** Hardest difficulty for a day ride: the MAXIMUM difficulty of its featured routes (not an average). */
export async function getDayRideHardestDifficulty(dayRideId: string): Promise<number | null> {
  const rows = await db
    .select({ difficulty: routes.difficulty })
    .from(dayRideStages)
    .innerJoin(routes, eq(dayRideStages.routeId, routes.id))
    .where(eq(dayRideStages.dayRideId, dayRideId));

  if (rows.length === 0) return null;
  return Math.max(...rows.map((r) => r.difficulty));
}

/** Hardest difficulty for a tour: the MAXIMUM hardest difficulty across its day rides. */
export async function getTourHardestDifficulty(tourId: string): Promise<number | null> {
  const days = await db
    .select({ dayRideId: tourDays.dayRideId })
    .from(tourDays)
    .where(eq(tourDays.tourId, tourId));

  const perDay = await Promise.all(days.map((d) => getDayRideHardestDifficulty(d.dayRideId)));
  const known = perDay.filter((d): d is number => d !== null);
  return known.length > 0 ? Math.max(...known) : null;
}
