import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  regions,
  routes,
  routeBikeSuitability,
  routeLandmarks,
  landmarks,
  dayRides,
  dayRideBikeSuitability,
  dayRideStages,
  tours,
  tourRegions,
  tourBikeSuitability,
  tourDays,
} from "@/db/schema";
import { getDayRideHardestDifficulty, getTourHardestDifficulty } from "@/lib/difficulty";
import type { GeoPoint } from "@/db/schema/routes";
import { matchesDifficultyBand, matchesSearch } from "@/lib/route-filters";

export type TripType = "route" | "day-ride" | "tour";

export interface ExploreResult {
  id: string;
  type: TripType;
  name: string;
  slug: string;
  heroImage: string | null;
  regionNames: string[];
  distanceMiles: number;
  durationDays: number | null;
  difficulty: number | null;
  isSample: boolean;
  landmarkNames: string[];
  suitedBikeTypes: string[];
  point: GeoPoint | null;
  /** For the hover card on the Explore map. Tours have no single riding time, and only routes record a road surface. */
  ridingTimeMinutes: number | null;
  surface: "good" | "mixed" | "poor" | null;
  startName: string | null;
  finishName: string | null;
}

/** Fetches every published route, day ride and tour, normalised into one shape for the Explore page. */
export async function getExploreResults(): Promise<ExploreResult[]> {
  const regionRows = await db.select().from(regions);
  const regionNameById = new Map(regionRows.map((r) => [r.id, r.name]));

  const results: ExploreResult[] = [];

  // Routes
  const routeRows = await db.select().from(routes).where(eq(routes.status, "published"));
  const routeLandmarkRows = await db
    .select({ routeId: routeLandmarks.routeId, name: landmarks.name })
    .from(routeLandmarks)
    .innerJoin(landmarks, eq(routeLandmarks.landmarkId, landmarks.id));
  const landmarksByRoute = new Map<string, string[]>();
  for (const row of routeLandmarkRows) {
    const list = landmarksByRoute.get(row.routeId) ?? [];
    list.push(row.name);
    landmarksByRoute.set(row.routeId, list);
  }
  const routeSuitedRows = await db.select().from(routeBikeSuitability).where(eq(routeBikeSuitability.level, "suited"));
  const suitedByRoute = new Map<string, string[]>();
  for (const row of routeSuitedRows) {
    const list = suitedByRoute.get(row.routeId) ?? [];
    list.push(row.bikeType);
    suitedByRoute.set(row.routeId, list);
  }

  for (const route of routeRows) {
    results.push({
      id: route.id,
      type: "route",
      name: route.name,
      slug: route.slug,
      heroImage: route.heroImage,
      regionNames: [regionNameById.get(route.regionId) ?? ""].filter(Boolean),
      distanceMiles: Number(route.distanceMiles),
      durationDays: null,
      difficulty: route.difficulty,
      isSample: route.isSample,
      landmarkNames: landmarksByRoute.get(route.id) ?? [],
      suitedBikeTypes: suitedByRoute.get(route.id) ?? [],
      point: route.startPoint,
      ridingTimeMinutes: route.ridingTimeMinutes,
      surface: route.surfaceQuality,
      startName: route.startPoint?.label ?? null,
      finishName: route.endPoint?.label ?? null,
    });
  }

  // Day rides — landmarks propagate from their featured routes' stages.
  const dayRideRows = await db.select().from(dayRides).where(eq(dayRides.status, "published"));
  const dayRideSuitedRows = await db.select().from(dayRideBikeSuitability).where(eq(dayRideBikeSuitability.level, "suited"));
  const suitedByDayRide = new Map<string, string[]>();
  for (const row of dayRideSuitedRows) {
    const list = suitedByDayRide.get(row.dayRideId) ?? [];
    list.push(row.bikeType);
    suitedByDayRide.set(row.dayRideId, list);
  }
  const stageRouteRows = await db
    .select({ dayRideId: dayRideStages.dayRideId, routeId: dayRideStages.routeId })
    .from(dayRideStages)
    .where(eq(dayRideStages.kind, "route"));
  const routeIdsByDayRide = new Map<string, string[]>();
  for (const row of stageRouteRows) {
    if (!row.routeId) continue;
    const list = routeIdsByDayRide.get(row.dayRideId) ?? [];
    list.push(row.routeId);
    routeIdsByDayRide.set(row.dayRideId, list);
  }

  for (const dayRide of dayRideRows) {
    const featuredRouteIds = routeIdsByDayRide.get(dayRide.id) ?? [];
    const landmarkNames = featuredRouteIds.flatMap((rid) => landmarksByRoute.get(rid) ?? []);
    const geometry = dayRide.geometry as GeoJSON.LineString | null;
    results.push({
      id: dayRide.id,
      type: "day-ride",
      name: dayRide.name,
      slug: dayRide.slug,
      heroImage: dayRide.heroImage,
      regionNames: [regionNameById.get(dayRide.regionId) ?? ""].filter(Boolean),
      distanceMiles: Number(dayRide.totalDistanceMiles),
      durationDays: null,
      difficulty: await getDayRideHardestDifficulty(dayRide.id),
      isSample: dayRide.isSample,
      landmarkNames,
      suitedBikeTypes: suitedByDayRide.get(dayRide.id) ?? [],
      point: geometry ? { lat: geometry.coordinates[0][1], lng: geometry.coordinates[0][0] } : null,
      ridingTimeMinutes: dayRide.ridingTimeMinutes,
      surface: null,
      startName: dayRide.startLocation || null,
      finishName: dayRide.finishLocation || null,
    });
  }

  // Tours
  const tourRows = await db.select().from(tours).where(eq(tours.status, "published"));
  const tourRegionRows = await db.select().from(tourRegions);
  const regionIdsByTour = new Map<string, string[]>();
  for (const row of tourRegionRows) {
    const list = regionIdsByTour.get(row.tourId) ?? [];
    list.push(row.regionId);
    regionIdsByTour.set(row.tourId, list);
  }
  const tourSuitedRows = await db.select().from(tourBikeSuitability).where(eq(tourBikeSuitability.level, "suited"));
  const suitedByTour = new Map<string, string[]>();
  for (const row of tourSuitedRows) {
    const list = suitedByTour.get(row.tourId) ?? [];
    list.push(row.bikeType);
    suitedByTour.set(row.tourId, list);
  }
  const tourDayRows = await db
    .select({ tourId: tourDays.tourId, dayNumber: tourDays.dayNumber, dayRideId: tourDays.dayRideId })
    .from(tourDays);
  const dayRideById = new Map(dayRideRows.map((d) => [d.id, d]));

  for (const tour of tourRows) {
    const firstDay = tourDayRows.filter((d) => d.tourId === tour.id).sort((a, b) => a.dayNumber - b.dayNumber)[0];
    const firstDayRide = firstDay ? dayRideById.get(firstDay.dayRideId) : undefined;
    const firstGeometry = firstDayRide?.geometry as GeoJSON.LineString | null | undefined;

    results.push({
      id: tour.id,
      type: "tour",
      name: tour.name,
      slug: tour.slug,
      heroImage: tour.heroImage,
      regionNames: (regionIdsByTour.get(tour.id) ?? []).map((rid) => regionNameById.get(rid) ?? "").filter(Boolean),
      distanceMiles: Number(tour.totalDistanceMiles),
      durationDays: tour.durationDays,
      difficulty: await getTourHardestDifficulty(tour.id),
      isSample: tour.isSample,
      landmarkNames: [],
      suitedBikeTypes: suitedByTour.get(tour.id) ?? [],
      point: firstGeometry ? { lat: firstGeometry.coordinates[0][1], lng: firstGeometry.coordinates[0][0] } : null,
      ridingTimeMinutes: null,
      surface: null,
      startName: tour.startLocation || null,
      finishName: tour.finishLocation || null,
    });
  }

  return results;
}

export interface ExploreFilters {
  q?: string;
  tripType?: TripType | "all";
  region?: string;
  difficulty?: "any" | "relaxed" | "moderate" | "challenging";
  bikeType?: string;
  sort?: "top-rated" | "shortest" | "longest";
}


/** Which landmark name (if any) in this result matched the search text — used to highlight the tag on its card. */
export function matchedLandmark(result: ExploreResult, q: string | undefined): string | null {
  if (!q) return null;
  const needle = q.toLowerCase();
  return result.landmarkNames.find((l) => l.toLowerCase().includes(needle)) ?? null;
}

export function filterAndSortResults(results: ExploreResult[], filters: ExploreFilters): ExploreResult[] {
  let filtered = results;

  if (filters.tripType && filters.tripType !== "all") {
    filtered = filtered.filter((r) => r.type === filters.tripType);
  }
  if (filters.q) {
    filtered = filtered.filter((r) => matchesSearch(filters.q!, r));
  }
  if (filters.region) {
    filtered = filtered.filter((r) => r.regionNames.includes(filters.region!));
  }
  if (filters.difficulty) {
    filtered = filtered.filter((r) => matchesDifficultyBand(r.difficulty, filters.difficulty));
  }
  if (filters.bikeType) {
    filtered = filtered.filter((r) => r.suitedBikeTypes.includes(filters.bikeType!));
  }

  const sorted = [...filtered];
  if (filters.sort === "shortest") {
    sorted.sort((a, b) => a.distanceMiles - b.distanceMiles);
  } else if (filters.sort === "longest") {
    sorted.sort((a, b) => b.distanceMiles - a.distanceMiles);
  } else {
    // "Top rated" — no review data exists yet (Phase 2), so fall back to name order.
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}
