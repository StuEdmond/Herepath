import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { PLACE_REVIEW_MAX_LENGTH } from "@/lib/place-review-limits";
import { places, placeReviews, users, dayRidePlacesToEat, tourDays, tourOvernightStays, dayRides, tours } from "@/db/schema";

const REVIEWABLE_TYPES = ["cafe", "pub", "restaurant", "hotel", "b_and_b", "campsite"];

export interface ReviewablePlace {
  id: string;
  name: string;
  type: string;
}

export interface PlaceReviewView {
  text: string;
  author: string;
}

function isReviewable(place: { type: string }) {
  return REVIEWABLE_TYPES.includes(place.type);
}

/** The places a rider can leave a tip about after riding a day ride or tour (routes have none). */
export async function getReviewablePlacesForTarget(targetType: string, targetId: string): Promise<ReviewablePlace[]> {
  const found = new Map<string, ReviewablePlace>();
  const add = (p: { id: string; name: string; type: string }) => {
    if (isReviewable(p)) found.set(p.id, { id: p.id, name: p.name, type: p.type });
  };

  if (targetType === "day_ride") {
    const rows = await db
      .select({ id: places.id, name: places.name, type: places.type })
      .from(dayRidePlacesToEat)
      .innerJoin(places, eq(dayRidePlacesToEat.placeId, places.id))
      .where(eq(dayRidePlacesToEat.dayRideId, targetId));
    rows.forEach(add);
  }

  if (targetType === "tour") {
    const eatRows = await db
      .select({ id: places.id, name: places.name, type: places.type })
      .from(tourDays)
      .innerJoin(dayRidePlacesToEat, eq(dayRidePlacesToEat.dayRideId, tourDays.dayRideId))
      .innerJoin(places, eq(dayRidePlacesToEat.placeId, places.id))
      .where(eq(tourDays.tourId, targetId));
    const stayRows = await db
      .select({ id: places.id, name: places.name, type: places.type })
      .from(tourOvernightStays)
      .innerJoin(places, eq(tourOvernightStays.placeId, places.id))
      .where(eq(tourOvernightStays.tourId, targetId));
    [...eatRows, ...stayRows].forEach(add);
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Reviewable places for every published day ride and tour, keyed "day_ride:<id>" / "tour:<id>", for the Log a ride form. */
export async function getReviewablePlacesByTarget(): Promise<Record<string, ReviewablePlace[]>> {
  const [dayRideRows, tourRows] = await Promise.all([
    db.select({ id: dayRides.id }).from(dayRides).where(eq(dayRides.status, "published")),
    db.select({ id: tours.id }).from(tours).where(eq(tours.status, "published")),
  ]);

  const result: Record<string, ReviewablePlace[]> = {};
  await Promise.all([
    ...dayRideRows.map(async ({ id }) => {
      const list = await getReviewablePlacesForTarget("day_ride", id);
      if (list.length > 0) result[`day_ride:${id}`] = list;
    }),
    ...tourRows.map(async ({ id }) => {
      const list = await getReviewablePlacesForTarget("tour", id);
      if (list.length > 0) result[`tour:${id}`] = list;
    }),
  ]);
  return result;
}

/** Latest few rider tips for each place, keyed by place id. Authors are shown by first name only. */
export async function getPlaceReviews(placeIds: string[], perPlace = 2): Promise<Map<string, PlaceReviewView[]>> {
  const byPlace = new Map<string, PlaceReviewView[]>();
  if (placeIds.length === 0) return byPlace;

  const rows = await db
    .select({ placeId: placeReviews.placeId, text: placeReviews.text, name: users.name })
    .from(placeReviews)
    .innerJoin(users, eq(placeReviews.userId, users.id))
    .where(inArray(placeReviews.placeId, placeIds))
    .orderBy(desc(placeReviews.createdAt));

  for (const row of rows) {
    const list = byPlace.get(row.placeId) ?? [];
    if (list.length < perPlace) list.push({ text: row.text, author: row.name?.trim().split(/\s+/)[0] || "A rider" });
    byPlace.set(row.placeId, list);
  }
  return byPlace;
}

/** Saves (or replaces) a rider's tip for a place. Returns false if the place isn't one they could review for this ride. */
export async function savePlaceReview(userId: string, placeId: string, text: string, allowed: ReviewablePlace[]): Promise<boolean> {
  const trimmed = text.trim().slice(0, PLACE_REVIEW_MAX_LENGTH);
  if (!trimmed || !allowed.some((p) => p.id === placeId)) return false;

  await db
    .insert(placeReviews)
    .values({ userId, placeId, text: trimmed })
    .onConflictDoUpdate({ target: [placeReviews.userId, placeReviews.placeId], set: { text: trimmed, createdAt: new Date() } });
  return true;
}
