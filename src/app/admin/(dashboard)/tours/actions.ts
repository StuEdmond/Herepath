"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { tours, tourRegions, tourBikeSuitability, tourDays, tourOvernightStays, bikeTypeEnum, regions, places } from "@/db/schema";
import { slugify } from "@/lib/slug";
import type { TourDayDraft } from "@/components/admin/tour-day-builder";

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const introSell = String(formData.get("introSell") ?? "").trim();
  const introCharacter = String(formData.get("introCharacter") ?? "").trim();
  const durationDays = Number(formData.get("durationDays") ?? 1);
  const totalDistanceMiles = String(formData.get("totalDistanceMiles") ?? "").trim();
  const averageDayMiles = String(formData.get("averageDayMiles") ?? "").trim();
  const startLocation = String(formData.get("startLocation") ?? "").trim();
  const finishLocation = String(formData.get("finishLocation") ?? "").trim();
  const bestTime = String(formData.get("bestTime") ?? "").trim() || null;
  const heroImage = String(formData.get("heroImage") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const isSample = formData.get("isSample") === "on";

  const planningNotes = {
    fuel: String(formData.get("planning_fuel") ?? "").trim() || undefined,
    weather: String(formData.get("planning_weather") ?? "").trim() || undefined,
    luggage: String(formData.get("planning_luggage") ?? "").trim() || undefined,
    breakdownAndSignal: String(formData.get("planning_breakdown") ?? "").trim() || undefined,
    gettingHome: String(formData.get("planning_gettingHome") ?? "").trim() || undefined,
  };

  if (!name || !introSell || !introCharacter || !startLocation || !finishLocation || !totalDistanceMiles) {
    throw new Error("Name, intro paragraphs, start/finish and distance are required");
  }

  return {
    name,
    introSell,
    introCharacter,
    durationDays,
    totalDistanceMiles,
    averageDayMiles,
    startLocation,
    finishLocation,
    bestTime,
    heroImage,
    status,
    isSample,
    planningNotes,
  };
}

async function saveRelations(tourId: string, formData: FormData) {
  await db.delete(tourRegions).where(eq(tourRegions.tourId, tourId));
  const allRegions = await db.select({ id: regions.id }).from(regions);
  const selectedRegions = allRegions.filter((r) => formData.get(`region_${r.id}`) === "on").map((r) => ({ tourId, regionId: r.id }));
  if (selectedRegions.length > 0) await db.insert(tourRegions).values(selectedRegions);

  await db.delete(tourBikeSuitability).where(eq(tourBikeSuitability.tourId, tourId));
  const suitabilityValues: (typeof tourBikeSuitability.$inferInsert)[] = [];
  for (const bikeType of bikeTypeEnum.enumValues) {
    const level = String(formData.get(`suitability_${bikeType}`) ?? "");
    if (level === "suited" || level === "caution") {
      const note = String(formData.get(`note_${bikeType}`) ?? "").trim() || null;
      suitabilityValues.push({ tourId, bikeType, level, note });
    }
  }
  if (suitabilityValues.length > 0) await db.insert(tourBikeSuitability).values(suitabilityValues);

  await db.delete(tourDays).where(eq(tourDays.tourId, tourId));
  const tourDaysJson = String(formData.get("tourDaysJson") ?? "[]");
  const days = JSON.parse(tourDaysJson) as TourDayDraft[];
  const dayValues = days
    .filter((d) => d.dayRideId)
    .map((d, i) => ({
      tourId,
      dayNumber: i + 1,
      dayRideId: d.dayRideId,
      overnightLocation: d.overnightLocation,
      fuelWarning: d.fuelWarning || null,
    }));
  if (dayValues.length > 0) await db.insert(tourDays).values(dayValues);

  await db.delete(tourOvernightStays).where(eq(tourOvernightStays.tourId, tourId));
  const accommodationPlaces = await db
    .select({ id: places.id, type: places.type })
    .from(places);
  const stayValues: (typeof tourOvernightStays.$inferInsert)[] = [];
  for (const place of accommodationPlaces) {
    if (!["hotel", "b_and_b", "campsite"].includes(place.type)) continue;
    const nightsRaw = String(formData.get(`stay_nights_${place.id}`) ?? "");
    for (const nightStr of nightsRaw.split(",").map((s) => s.trim()).filter(Boolean)) {
      const dayNumber = Number(nightStr);
      if (Number.isFinite(dayNumber)) stayValues.push({ tourId, dayNumber, placeId: place.id });
    }
  }
  if (stayValues.length > 0) await db.insert(tourOvernightStays).values(stayValues);
}

export async function createTour(formData: FormData) {
  const data = readForm(formData);
  const [tour] = await db
    .insert(tours)
    .values({ ...data, slug: slugify(data.name) })
    .returning();
  await saveRelations(tour.id, formData);
  revalidatePath("/admin/tours");
  redirect(`/admin/tours/${tour.id}`);
}

export async function updateTour(id: string, formData: FormData) {
  const data = readForm(formData);
  await db.update(tours).set({ ...data, slug: slugify(data.name), updatedAt: new Date() }).where(eq(tours.id, id));
  await saveRelations(id, formData);
  revalidatePath("/admin/tours");
  redirect(`/admin/tours/${id}`);
}

export async function deleteTour(id: string) {
  await db.delete(tours).where(eq(tours.id, id));
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}
