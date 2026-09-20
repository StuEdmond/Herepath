"use server";

import { eq, and, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getLimits } from "@/lib/membership";
import { db } from "@/db/client";
import { diaryEntries, diaryEntryPhotos, routes, dayRides, tours, reviews } from "@/db/schema";
import type { tripTargetEnum } from "@/db/schema";
import { processAndSavePhoto } from "@/lib/photo-upload";
import { estimateMileMarkerOnLine } from "@/lib/geo";
import { getReviewablePlacesForTarget, savePlaceReview } from "@/lib/place-reviews";
import type { OwnRouteGeometry } from "@/db/schema/diary";

type TripTarget = (typeof tripTargetEnum.enumValues)[number];

async function getTargetGeometry(targetType: TripTarget, targetId: string): Promise<GeoJSON.LineString | null> {
  if (targetType === "route") {
    const [row] = await db.select({ geometry: routes.geometry }).from(routes).where(eq(routes.id, targetId));
    return (row?.geometry as GeoJSON.LineString) ?? null;
  }
  if (targetType === "day_ride") {
    const [row] = await db.select({ geometry: dayRides.geometry }).from(dayRides).where(eq(dayRides.id, targetId));
    return (row?.geometry as GeoJSON.LineString) ?? null;
  }
  return null;
}

/** No ride needs more points than this; the import form thins recordings well below it, so this only stops oversized or odd input. */
const MAX_OWN_ROUTE_POINTS = 6000;

/** The route sent with the form, checked and cut down if needed. Anything that isn't a proper line is treated as no route. */
function readOwnRouteGeometry(raw: string): OwnRouteGeometry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { type?: unknown; coordinates?: unknown };
    if (parsed.type !== "LineString" || !Array.isArray(parsed.coordinates)) return null;
    const valid = parsed.coordinates.filter(
      (c): c is [number, number] =>
        Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number" && Number.isFinite(c[0]) && Number.isFinite(c[1]),
    );
    if (valid.length < 2) return null;
    const step = valid.length > MAX_OWN_ROUTE_POINTS ? (valid.length - 1) / (MAX_OWN_ROUTE_POINTS - 1) : 1;
    const coordinates = step === 1 ? valid : Array.from({ length: MAX_OWN_ROUTE_POINTS }, (_, i) => valid[Math.round(i * step)]);
    return { type: "LineString", coordinates };
  } catch {
    return null;
  }
}

export async function createDiaryEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const userId = session.user.id;

  // The diary has a size limit on a free account. The form says so before this point; this is the backstop.
  const limits = await getLimits(userId);
  const [{ used }] = await db.select({ used: count() }).from(diaryEntries).where(eq(diaryEntries.userId, userId));
  if (used >= limits.diaryEntries) redirect("/pricing?need=diary");

  const source = String(formData.get("source"));
  const date = String(formData.get("date"));
  const startTime = String(formData.get("startTime") ?? "") || null;
  const finishTime = String(formData.get("finishTime") ?? "") || null;
  const rating = formData.get("rating") ? Number(formData.get("rating")) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const weatherConditions = String(formData.get("weatherConditions") ?? "").trim() || null;
  const weatherTemperatureC = formData.get("weatherTemperatureC") ? Number(formData.get("weatherTemperatureC")) : null;
  const bike = String(formData.get("bike") ?? "").trim() || null;
  const rodeSolo = formData.get("rodeSolo") === "on";
  const rodeWithCount = rodeSolo ? null : Number(formData.get("rodeWithCount") ?? 0) || null;
  const visibility = formData.get("visibility") === "shared" ? "shared" : "private";
  const suggestAsNewRoute = formData.get("suggestAsNewRoute") === "on";

  let targetType: TripTarget | null = null;
  let targetId: string | null = null;
  let ownRouteName: string | null = null;
  let ownRouteGeometry: OwnRouteGeometry | null = null;
  let distanceMiles: string;
  let geometryForPhotos: GeoJSON.LineString | null = null;

  if (source === "catalogue") {
    targetType = String(formData.get("targetType")) as TripTarget;
    targetId = String(formData.get("targetId"));
    const manualDistance = String(formData.get("distanceMiles") ?? "").trim();
    geometryForPhotos = await getTargetGeometry(targetType, targetId);

    if (manualDistance) {
      distanceMiles = manualDistance;
    } else if (targetType === "route") {
      const [row] = await db.select({ distanceMiles: routes.distanceMiles }).from(routes).where(eq(routes.id, targetId));
      distanceMiles = row?.distanceMiles ?? "0";
    } else if (targetType === "day_ride") {
      const [row] = await db.select({ totalDistanceMiles: dayRides.totalDistanceMiles }).from(dayRides).where(eq(dayRides.id, targetId));
      distanceMiles = row?.totalDistanceMiles ?? "0";
    } else {
      const [row] = await db.select({ totalDistanceMiles: tours.totalDistanceMiles }).from(tours).where(eq(tours.id, targetId));
      distanceMiles = row?.totalDistanceMiles ?? "0";
    }
  } else {
    ownRouteName = String(formData.get("ownRouteName") ?? "").trim() || "Untitled ride";
    ownRouteGeometry = readOwnRouteGeometry(String(formData.get("ownRouteGeometry") ?? ""));
    geometryForPhotos = ownRouteGeometry;
    distanceMiles = String(formData.get("distanceMiles") ?? "0");
  }

  const [entry] = await db
    .insert(diaryEntries)
    .values({
      userId,
      targetType,
      targetId,
      ownRouteName,
      ownRouteGeometry,
      date,
      startTime,
      finishTime,
      distanceMiles,
      rating,
      notes,
      weatherConditions,
      weatherTemperatureC,
      bike,
      rodeSolo,
      rodeWithCount,
      visibility,
      suggestAsNewRoute: source === "own" ? suggestAsNewRoute : false,
    })
    .returning();

  const photos = formData
    .getAll("photos")
    .filter((p): p is File => p instanceof File && p.size > 0)
    .slice(0, limits.photosPerDiaryEntry);
  let browserGps: ({ lat: number; lng: number } | null)[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("photoGps") ?? "[]"));
    if (Array.isArray(parsed)) browserGps = parsed;
  } catch {
    // no usable location data from the browser — fall back to whatever the photos carry
  }

  for (const [index, photo] of photos.entries()) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const { url, gps } = await processAndSavePhoto(buffer, browserGps[index] ?? null);
    const mileMarker = gps && geometryForPhotos ? estimateMileMarkerOnLine(geometryForPhotos, gps) : null;
    await db.insert(diaryEntryPhotos).values({ diaryEntryId: entry.id, url, mileMarker: mileMarker?.toString() });
  }

  // Short public tips about places on this ride. Only places that belong to the chosen ride are accepted.
  if (targetType && targetId) {
    const tipFields = [...formData.entries()].filter(([key, value]) => key.startsWith("placeReview_") && typeof value === "string" && value.trim());
    if (tipFields.length > 0) {
      const allowed = await getReviewablePlacesForTarget(targetType, targetId);
      for (const [key, value] of tipFields) {
        await savePlaceReview(userId, key.slice("placeReview_".length), String(value), allowed);
      }
      const touchedPaths = { day_ride: "/day-rides", tour: "/tours", route: "/routes" } as const;
      revalidatePath(touchedPaths[targetType]);
    }
  }

  // Sharing a diary entry as a public review is how reviews get published
  // (Section 4.2) — the diary/actions "Write a review" form is the other
  // entry point to the same reviews table.
  if (visibility === "shared" && targetType && targetId && rating) {
    await db.insert(reviews).values({ userId, targetType, targetId, rating, text: notes, bikeRidden: bike });
  }

  revalidatePath("/rides");
  redirect("/rides");
}

export async function deleteDiaryEntry(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  await db.delete(diaryEntries).where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, session.user.id)));
  revalidatePath("/rides");
}
