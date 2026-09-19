import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { routes, dayRides, tours } from "@/db/schema";

export interface RideOption {
  id: string;
  name: string;
  type: "route" | "day_ride" | "tour";
}

const TYPE_LABEL: Record<RideOption["type"], string> = { route: "Short route", day_ride: "Day ride", tour: "Tour" };
const TYPE_PATH: Record<RideOption["type"], string> = { route: "routes", day_ride: "day-rides", tour: "tours" };

export function rideTypeLabel(type: RideOption["type"]): string {
  return TYPE_LABEL[type];
}

/** Every published ride a post can be about, for the picker on the write form. */
export async function getRideOptions(): Promise<RideOption[]> {
  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    db.select({ id: routes.id, name: routes.name }).from(routes).where(eq(routes.status, "published")),
    db.select({ id: dayRides.id, name: dayRides.name }).from(dayRides).where(eq(dayRides.status, "published")),
    db.select({ id: tours.id, name: tours.name }).from(tours).where(eq(tours.status, "published")),
  ]);
  return [
    ...routeRows.map((r) => ({ ...r, type: "route" as const })),
    ...dayRideRows.map((r) => ({ ...r, type: "day_ride" as const })),
    ...tourRows.map((r) => ({ ...r, type: "tour" as const })),
  ];
}

/** Turns a "type:id" picker value back into a valid published ride, or null. Never trusts the browser. */
export async function resolveRideChoice(value: string): Promise<{ type: RideOption["type"]; id: string } | null> {
  const [type, id] = value.split(":");
  if (!id) return null;
  if (type === "route") {
    const [row] = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, id), eq(routes.status, "published")));
    return row ? { type, id } : null;
  }
  if (type === "day_ride") {
    const [row] = await db.select({ id: dayRides.id }).from(dayRides).where(and(eq(dayRides.id, id), eq(dayRides.status, "published")));
    return row ? { type, id } : null;
  }
  if (type === "tour") {
    const [row] = await db.select({ id: tours.id }).from(tours).where(and(eq(tours.id, id), eq(tours.status, "published")));
    return row ? { type, id } : null;
  }
  return null;
}

/** The ride a post is about, with a link to its page. */
export async function getLinkedRide(type: string | null, id: string | null): Promise<{ name: string; href: string; label: string } | null> {
  if (!type || !id) return null;
  const table = type === "route" ? routes : type === "day_ride" ? dayRides : type === "tour" ? tours : null;
  if (!table) return null;
  const [row] = await db.select({ name: table.name, slug: table.slug }).from(table).where(eq(table.id, id));
  if (!row) return null;
  return { name: row.name, href: `/${TYPE_PATH[type as RideOption["type"]]}/${row.slug}`, label: TYPE_LABEL[type as RideOption["type"]] };
}
