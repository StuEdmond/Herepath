import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db/client";
import {
  diaryEntries,
  diaryEntryPhotos,
  routes,
  dayRides,
  dayRideStages,
  tours,
  tourDays,
  tourRegions,
  regions,
  collections,
  collectionRoutes,
  savedRides,
} from "@/db/schema";

export interface DiaryEntryView {
  id: string;
  targetType: "route" | "day_ride" | "tour" | null;
  targetId: string | null;
  name: string;
  slug: string | null;
  date: string;
  startTime: string | null;
  finishTime: string | null;
  distanceMiles: string;
  rating: number | null;
  notes: string | null;
  weatherConditions: string | null;
  weatherTemperatureC: number | null;
  bike: string | null;
  rodeSolo: boolean;
  rodeWithCount: number | null;
  visibility: "private" | "shared";
  photos: { id: string; url: string; mileMarker: string | null }[];
}

/** Resolves every route actually ridden by a user — directly logged, or featured inside a logged day ride/tour. */
export async function getRiddenRouteIds(userId: string): Promise<Set<string>> {
  const entries = await db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId));

  const direct = entries.filter((e) => e.targetType === "route").map((e) => e.targetId!);
  const dayRideIds = entries.filter((e) => e.targetType === "day_ride").map((e) => e.targetId!);
  const tourIds = entries.filter((e) => e.targetType === "tour").map((e) => e.targetId!);

  let allDayRideIds = [...dayRideIds];
  if (tourIds.length > 0) {
    const days = await db.select({ dayRideId: tourDays.dayRideId }).from(tourDays).where(inArray(tourDays.tourId, tourIds));
    allDayRideIds = [...allDayRideIds, ...days.map((d) => d.dayRideId)];
  }

  let viaStages: string[] = [];
  if (allDayRideIds.length > 0) {
    const stages = await db
      .select({ routeId: dayRideStages.routeId })
      .from(dayRideStages)
      .where(and(inArray(dayRideStages.dayRideId, allDayRideIds), eq(dayRideStages.kind, "route")));
    viaStages = stages.map((s) => s.routeId!).filter(Boolean);
  }

  return new Set([...direct, ...viaStages]);
}

export async function getDiaryEntries(userId: string): Promise<DiaryEntryView[]> {
  const entries = await db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId)).orderBy(diaryEntries.date);
  entries.reverse();

  const routeIds = entries.filter((e) => e.targetType === "route").map((e) => e.targetId!);
  const dayRideIds = entries.filter((e) => e.targetType === "day_ride").map((e) => e.targetId!);
  const tourIds = entries.filter((e) => e.targetType === "tour").map((e) => e.targetId!);

  const [routeRows, dayRideRows, tourRows, photoRows] = await Promise.all([
    routeIds.length > 0 ? db.select({ id: routes.id, name: routes.name, slug: routes.slug }).from(routes).where(inArray(routes.id, routeIds)) : [],
    dayRideIds.length > 0
      ? db.select({ id: dayRides.id, name: dayRides.name, slug: dayRides.slug }).from(dayRides).where(inArray(dayRides.id, dayRideIds))
      : [],
    tourIds.length > 0 ? db.select({ id: tours.id, name: tours.name, slug: tours.slug }).from(tours).where(inArray(tours.id, tourIds)) : [],
    db
      .select({ id: diaryEntryPhotos.id, url: diaryEntryPhotos.url, mileMarker: diaryEntryPhotos.mileMarker, diaryEntryId: diaryEntryPhotos.diaryEntryId })
      .from(diaryEntryPhotos)
      .where(
        inArray(
          diaryEntryPhotos.diaryEntryId,
          entries.map((e) => e.id),
        ),
      ),
  ]);

  const nameBySlug = new Map([...routeRows, ...dayRideRows, ...tourRows].map((r) => [r.id, r]));
  const photosByEntry = new Map<string, { id: string; url: string; mileMarker: string | null }[]>();
  for (const p of photoRows) {
    const list = photosByEntry.get(p.diaryEntryId) ?? [];
    list.push({ id: p.id, url: p.url, mileMarker: p.mileMarker });
    photosByEntry.set(p.diaryEntryId, list);
  }

  return entries.map((e) => {
    const catalogue = e.targetId ? nameBySlug.get(e.targetId) : undefined;
    return {
      id: e.id,
      targetType: e.targetType,
      targetId: e.targetId,
      name: catalogue?.name ?? e.ownRouteName ?? "Ride",
      slug: catalogue?.slug ?? null,
      date: e.date,
      startTime: e.startTime,
      finishTime: e.finishTime,
      distanceMiles: e.distanceMiles,
      rating: e.rating,
      notes: e.notes,
      weatherConditions: e.weatherConditions,
      weatherTemperatureC: e.weatherTemperatureC,
      bike: e.bike,
      rodeSolo: e.rodeSolo,
      rodeWithCount: e.rodeWithCount,
      visibility: e.visibility,
      photos: photosByEntry.get(e.id) ?? [],
    };
  });
}

export async function getRiddenRegionNames(userId: string): Promise<Set<string>> {
  const entries = await db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId));
  const routeIds = entries.filter((e) => e.targetType === "route").map((e) => e.targetId!);
  const dayRideIds = entries.filter((e) => e.targetType === "day_ride").map((e) => e.targetId!);
  const tourIds = entries.filter((e) => e.targetType === "tour").map((e) => e.targetId!);

  const regionIds = new Set<string>();

  if (routeIds.length > 0) {
    const rows = await db.select({ regionId: routes.regionId }).from(routes).where(inArray(routes.id, routeIds));
    rows.forEach((r) => regionIds.add(r.regionId));
  }
  if (dayRideIds.length > 0) {
    const rows = await db.select({ regionId: dayRides.regionId }).from(dayRides).where(inArray(dayRides.id, dayRideIds));
    rows.forEach((r) => regionIds.add(r.regionId));
  }
  if (tourIds.length > 0) {
    const rows = await db.select({ regionId: tourRegions.regionId }).from(tourRegions).where(inArray(tourRegions.tourId, tourIds));
    rows.forEach((r) => regionIds.add(r.regionId));
  }

  if (regionIds.size === 0) return new Set();
  const rows = await db.select({ name: regions.name }).from(regions).where(inArray(regions.id, [...regionIds]));
  return new Set(rows.map((r) => r.name));
}

/** Every road geometry a user has ridden, for the personal map on their diary page. */
export async function getRiddenGeometries(userId: string): Promise<{ id: string; geometry: GeoJSON.LineString }[]> {
  const entries = await db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId));

  const lines: { id: string; geometry: GeoJSON.LineString }[] = [];

  const routeIds = entries.filter((e) => e.targetType === "route").map((e) => e.targetId!);
  const dayRideIds = entries.filter((e) => e.targetType === "day_ride").map((e) => e.targetId!);
  const tourIds = entries.filter((e) => e.targetType === "tour").map((e) => e.targetId!);

  if (routeIds.length > 0) {
    const rows = await db.select({ id: routes.id, geometry: routes.geometry }).from(routes).where(inArray(routes.id, routeIds));
    rows.forEach((r) => r.geometry && lines.push({ id: r.id, geometry: r.geometry as GeoJSON.LineString }));
  }

  let allDayRideIds = [...dayRideIds];
  if (tourIds.length > 0) {
    const days = await db.select({ dayRideId: tourDays.dayRideId }).from(tourDays).where(inArray(tourDays.tourId, tourIds));
    allDayRideIds = [...allDayRideIds, ...days.map((d) => d.dayRideId)];
  }
  if (allDayRideIds.length > 0) {
    const rows = await db.select({ id: dayRides.id, geometry: dayRides.geometry }).from(dayRides).where(inArray(dayRides.id, allDayRideIds));
    rows.forEach((r) => r.geometry && lines.push({ id: r.id, geometry: r.geometry as GeoJSON.LineString }));
  }

  for (const entry of entries) {
    if (entry.ownRouteGeometry) lines.push({ id: entry.id, geometry: entry.ownRouteGeometry as GeoJSON.LineString });
  }

  return lines;
}

export interface CollectionProgress {
  id: string;
  name: string;
  slug: string;
  ridden: number;
  total: number;
}

export async function getCollectionsProgress(userId: string): Promise<CollectionProgress[]> {
  const riddenRouteIds = await getRiddenRouteIds(userId);
  const allCollections = await db.select().from(collections);
  const allCollectionRoutes = await db.select().from(collectionRoutes);

  return allCollections.map((c) => {
    const routeIdsInCollection = allCollectionRoutes.filter((cr) => cr.collectionId === c.id).map((cr) => cr.routeId);
    const ridden = routeIdsInCollection.filter((id) => riddenRouteIds.has(id)).length;
    return { id: c.id, name: c.name, slug: c.slug, ridden, total: routeIdsInCollection.length };
  });
}

export interface SavedRideView {
  targetType: "route" | "day_ride" | "tour";
  targetId: string;
  name: string;
  slug: string;
  heroImage: string | null;
}

export async function getSavedRides(userId: string): Promise<SavedRideView[]> {
  const saved = await db.select().from(savedRides).where(eq(savedRides.userId, userId));
  const routeIds = saved.filter((s) => s.targetType === "route").map((s) => s.targetId);
  const dayRideIds = saved.filter((s) => s.targetType === "day_ride").map((s) => s.targetId);
  const tourIds = saved.filter((s) => s.targetType === "tour").map((s) => s.targetId);

  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    routeIds.length > 0
      ? db.select({ id: routes.id, name: routes.name, slug: routes.slug, heroImage: routes.heroImage }).from(routes).where(inArray(routes.id, routeIds))
      : [],
    dayRideIds.length > 0
      ? db
          .select({ id: dayRides.id, name: dayRides.name, slug: dayRides.slug, heroImage: dayRides.heroImage })
          .from(dayRides)
          .where(inArray(dayRides.id, dayRideIds))
      : [],
    tourIds.length > 0
      ? db.select({ id: tours.id, name: tours.name, slug: tours.slug, heroImage: tours.heroImage }).from(tours).where(inArray(tours.id, tourIds))
      : [],
  ]);

  const byId = new Map(
    [
      ...routeRows.map((r) => ({ ...r, targetType: "route" as const })),
      ...dayRideRows.map((r) => ({ ...r, targetType: "day_ride" as const })),
      ...tourRows.map((r) => ({ ...r, targetType: "tour" as const })),
    ].map((r) => [r.id, r]),
  );

  return saved
    .map((s) => {
      const match = byId.get(s.targetId);
      if (!match) return null;
      return { targetType: s.targetType, targetId: s.targetId, name: match.name, slug: match.slug, heroImage: match.heroImage };
    })
    .filter((s): s is SavedRideView => s !== null);
}
