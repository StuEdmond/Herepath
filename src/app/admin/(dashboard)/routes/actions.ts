"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  routes,
  routeBikeSuitability,
  routeFuelStops,
  routeLandmarks,
  bikeTypeEnum,
  places,
  landmarks,
  contentStatusEnum,
  surfaceQualityEnum,
} from "@/db/schema";
import { slugify } from "@/lib/slug";
import { uploadedImage, uploadedImages } from "@/lib/storage";

async function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "");
  const introSell = String(formData.get("introSell") ?? "").trim();
  const introCharacter = String(formData.get("introCharacter") ?? "").trim();
  const distanceMiles = String(formData.get("distanceMiles") ?? "").trim();
  const ridingTimeMinutes = Number(formData.get("ridingTimeMinutes") ?? 0);
  const difficulty = Number(formData.get("difficulty") ?? 3);
  const surfaceQuality = String(formData.get("surfaceQuality") ?? "good") as (typeof surfaceQualityEnum.enumValues)[number];
  const hazards = String(formData.get("hazards") ?? "").trim() || null;
  const bestTime = String(formData.get("bestTime") ?? "").trim() || null;
  const stopOffNote = String(formData.get("stopOffNote") ?? "").trim() || null;
  const heroImageUrl = String(formData.get("heroImage") ?? "").trim() || null;
  const galleryUrls = String(formData.get("gallery") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const status = String(formData.get("status") ?? "draft") as (typeof contentStatusEnum.enumValues)[number];
  const isSample = formData.get("isSample") === "on";

  if (!name || !regionId || !introSell || !introCharacter || !distanceMiles) {
    throw new Error("Name, region, intro paragraphs and distance are required");
  }

  const heroImage = (await uploadedImage(formData, "heroImageFile", "content")) ?? heroImageUrl;
  const gallery = [...galleryUrls, ...(await uploadedImages(formData, "galleryFiles", "content"))];

  const geometryRaw = String(formData.get("geometry") ?? "");
  const geometry = geometryRaw ? (JSON.parse(geometryRaw) as GeoJSON.LineString) : null;
  const startLat = String(formData.get("startLat") ?? "");
  const startLng = String(formData.get("startLng") ?? "");
  const endLat = String(formData.get("endLat") ?? "");
  const endLng = String(formData.get("endLng") ?? "");
  const startPoint = startLat && startLng ? { lat: Number(startLat), lng: Number(startLng) } : null;
  const endPoint = endLat && endLng ? { lat: Number(endLat), lng: Number(endLng) } : null;

  return {
    name,
    regionId,
    introSell,
    introCharacter,
    distanceMiles,
    ridingTimeMinutes,
    difficulty,
    surfaceQuality,
    hazards,
    bestTime,
    stopOffNote,
    heroImage,
    gallery,
    status,
    isSample,
    geometry,
    startPoint,
    endPoint,
  };
}

async function saveRelations(routeId: string, formData: FormData) {
  await db.delete(routeBikeSuitability).where(eq(routeBikeSuitability.routeId, routeId));
  const suitabilityValues: (typeof routeBikeSuitability.$inferInsert)[] = [];
  for (const bikeType of bikeTypeEnum.enumValues) {
    const level = String(formData.get(`suitability_${bikeType}`) ?? "");
    if (level === "suited" || level === "caution") {
      const note = String(formData.get(`note_${bikeType}`) ?? "").trim() || null;
      suitabilityValues.push({ routeId, bikeType, level, note });
    }
  }
  if (suitabilityValues.length > 0) await db.insert(routeBikeSuitability).values(suitabilityValues);

  await db.delete(routeFuelStops).where(eq(routeFuelStops.routeId, routeId));
  const fuelPlaces = await db.select({ id: places.id }).from(places).where(eq(places.type, "fuel"));
  const fuelValues: (typeof routeFuelStops.$inferInsert)[] = [];
  for (const place of fuelPlaces) {
    if (formData.get(`fuel_include_${place.id}`) === "on") {
      const mileMarker = String(formData.get(`fuel_mile_${place.id}`) ?? "0");
      fuelValues.push({ routeId, placeId: place.id, mileMarker });
    }
  }
  if (fuelValues.length > 0) await db.insert(routeFuelStops).values(fuelValues);

  await db.delete(routeLandmarks).where(eq(routeLandmarks.routeId, routeId));
  const allLandmarks = await db.select({ id: landmarks.id }).from(landmarks);
  const landmarkValues = allLandmarks
    .filter((l) => formData.get(`landmark_${l.id}`) === "on")
    .map((l) => ({ routeId, landmarkId: l.id }));
  if (landmarkValues.length > 0) await db.insert(routeLandmarks).values(landmarkValues);
}

export async function createRoute(formData: FormData) {
  const data = await readForm(formData);
  const [route] = await db
    .insert(routes)
    .values({ ...data, slug: slugify(data.name) })
    .returning();
  await saveRelations(route.id, formData);
  revalidatePath("/admin/routes");
  redirect(`/admin/routes/${route.id}`);
}

export async function updateRoute(id: string, formData: FormData) {
  const data = await readForm(formData);
  await db.update(routes).set({ ...data, slug: slugify(data.name), updatedAt: new Date() }).where(eq(routes.id, id));
  await saveRelations(id, formData);
  revalidatePath("/admin/routes");
  redirect(`/admin/routes/${id}`);
}

export async function deleteRoute(id: string) {
  await db.delete(routes).where(eq(routes.id, id));
  revalidatePath("/admin/routes");
  redirect("/admin/routes");
}
