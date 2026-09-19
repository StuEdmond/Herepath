import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { regions, routeBikeSuitability, routes, savedTrips } from "@/db/schema";
import { simplifyTrack } from "./gpx";
import type { PlannerRoute } from "./trip-planner";

const OVERVIEW_POINTS = 150;

/**
 * Every published route that has a track and start and finish points, in the shape the trip planner needs. The track is thinned
 * to a few hundred points, since it's only used to draw the route on the overview map; full tracks stay on the server.
 */
export async function getPlannerRoutes(): Promise<PlannerRoute[]> {
  const [rows, regionRows, suitedRows] = await Promise.all([
    db.select().from(routes).where(eq(routes.status, "published")).orderBy(routes.name),
    db.select().from(regions),
    db.select().from(routeBikeSuitability).where(eq(routeBikeSuitability.level, "suited")),
  ]);
  const regionName = new Map(regionRows.map((r) => [r.id, r.name]));
  const suitedByRoute = new Map<string, string[]>();
  for (const row of suitedRows) suitedByRoute.set(row.routeId, [...(suitedByRoute.get(row.routeId) ?? []), row.bikeType]);

  const result: PlannerRoute[] = [];
  for (const route of rows) {
    const geometry = route.geometry as GeoJSON.LineString | null;
    if (!geometry || geometry.type !== "LineString" || geometry.coordinates.length < 2 || !route.startPoint || !route.endPoint) continue;
    result.push({
      id: route.id,
      slug: route.slug,
      name: route.name,
      regionName: regionName.get(route.regionId) ?? "",
      distanceMiles: Number(route.distanceMiles),
      ridingTimeMinutes: route.ridingTimeMinutes,
      difficulty: route.difficulty,
      surface: route.surfaceQuality,
      suitedBikeTypes: suitedByRoute.get(route.id) ?? [],
      start: { lat: route.startPoint.lat, lng: route.startPoint.lng },
      end: { lat: route.endPoint.lat, lng: route.endPoint.lng },
      startLabel: route.startPoint.label,
      endLabel: route.endPoint.label,
      line: simplifyTrack(geometry.coordinates as [number, number][], OVERVIEW_POINTS),
    });
  }
  return result;
}

export async function listSavedTrips(userId: string) {
  return db.select().from(savedTrips).where(eq(savedTrips.userId, userId)).orderBy(desc(savedTrips.updatedAt));
}

export async function getSavedTrip(userId: string, id: string) {
  const [trip] = await db
    .select()
    .from(savedTrips)
    .where(and(eq(savedTrips.userId, userId), eq(savedTrips.id, id)));
  return trip ?? null;
}
