"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { dayRides, dayRideBikeSuitability, dayRideStages, dayRidePlacesToEat, bikeTypeEnum, places } from "@/db/schema";
import { slugify } from "@/lib/slug";
import type { StageDraft } from "@/components/admin/stage-builder";

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "");
  const introSell = String(formData.get("introSell") ?? "").trim();
  const introCharacter = String(formData.get("introCharacter") ?? "").trim();
  const startLocation = String(formData.get("startLocation") ?? "").trim();
  const finishLocation = String(formData.get("finishLocation") ?? "").trim();
  const isLoop = formData.get("isLoop") === "on";
  const totalDistanceMiles = String(formData.get("totalDistanceMiles") ?? "").trim();
  const ridingTimeMinutes = Number(formData.get("ridingTimeMinutes") ?? 0);
  const fullDayTimeEstimate = String(formData.get("fullDayTimeEstimate") ?? "").trim();
  const bestTime = String(formData.get("bestTime") ?? "").trim() || null;
  const parkingNote = String(formData.get("parkingNote") ?? "").trim() || null;
  const heroImage = String(formData.get("heroImage") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const isSample = formData.get("isSample") === "on";

  if (!name || !regionId || !introSell || !introCharacter || !startLocation || !finishLocation || !totalDistanceMiles) {
    throw new Error("Name, region, intro paragraphs, start/finish and distance are required");
  }

  return {
    name,
    regionId,
    introSell,
    introCharacter,
    startLocation,
    finishLocation,
    isLoop,
    totalDistanceMiles,
    ridingTimeMinutes,
    fullDayTimeEstimate,
    bestTime,
    parkingNote,
    heroImage,
    status,
    isSample,
  };
}

async function saveRelations(dayRideId: string, formData: FormData) {
  await db.delete(dayRideBikeSuitability).where(eq(dayRideBikeSuitability.dayRideId, dayRideId));
  const suitabilityValues: (typeof dayRideBikeSuitability.$inferInsert)[] = [];
  for (const bikeType of bikeTypeEnum.enumValues) {
    const level = String(formData.get(`suitability_${bikeType}`) ?? "");
    if (level === "suited" || level === "caution") {
      const note = String(formData.get(`note_${bikeType}`) ?? "").trim() || null;
      suitabilityValues.push({ dayRideId, bikeType, level, note });
    }
  }
  if (suitabilityValues.length > 0) await db.insert(dayRideBikeSuitability).values(suitabilityValues);

  await db.delete(dayRideStages).where(eq(dayRideStages.dayRideId, dayRideId));
  const stagesJson = String(formData.get("stagesJson") ?? "[]");
  const stages = JSON.parse(stagesJson) as StageDraft[];
  const stageValues = stages.map((s, i) => ({
    dayRideId,
    position: i + 1,
    kind: s.kind,
    location: s.location || null,
    note: s.note || null,
    routeId: s.routeId || null,
    fromMile: s.fromMile || null,
    toMile: s.toMile || null,
    description: s.description || null,
    placeId: s.placeId || null,
    mile: s.mile || null,
    stopType: s.kind === "stop" ? s.stopType : null,
  }));
  if (stageValues.length > 0) await db.insert(dayRideStages).values(stageValues);

  await db.delete(dayRidePlacesToEat).where(eq(dayRidePlacesToEat.dayRideId, dayRideId));
  const foodPlaces = await db.select({ id: places.id, type: places.type }).from(places);
  const foodValues = foodPlaces
    .filter((p) => ["cafe", "pub", "restaurant"].includes(p.type) && formData.get(`eat_include_${p.id}`) === "on")
    .map((p) => ({
      dayRideId,
      placeId: p.id,
      isSuggestedLunch: formData.get(`eat_lunch_${p.id}`) === "on",
    }));
  if (foodValues.length > 0) await db.insert(dayRidePlacesToEat).values(foodValues);
}

export async function createDayRide(formData: FormData) {
  const data = readForm(formData);
  const [dayRide] = await db
    .insert(dayRides)
    .values({ ...data, slug: slugify(data.name) })
    .returning();
  await saveRelations(dayRide.id, formData);
  revalidatePath("/admin/day-rides");
  redirect(`/admin/day-rides/${dayRide.id}`);
}

export async function updateDayRide(id: string, formData: FormData) {
  const data = readForm(formData);
  await db.update(dayRides).set({ ...data, slug: slugify(data.name), updatedAt: new Date() }).where(eq(dayRides.id, id));
  await saveRelations(id, formData);
  revalidatePath("/admin/day-rides");
  redirect(`/admin/day-rides/${id}`);
}

export async function deleteDayRide(id: string) {
  await db.delete(dayRides).where(eq(dayRides.id, id));
  revalidatePath("/admin/day-rides");
  redirect("/admin/day-rides");
}
