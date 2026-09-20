"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { routes, savedTrips, type SavedTripItem } from "@/db/schema";
import { getLimits } from "@/lib/membership";
import { TRIP_NAME_MAX_LENGTH } from "@/lib/trip-limits";
import { MAX_TRIP_ROUTES } from "@/lib/trip-planner";

export type SaveTripResult = { ok: true; id: string } | { ok: false; error: string };

interface SaveTripInput {
  /** Set when updating a trip the rider already saved. */
  id?: string;
  name: string;
  items: SavedTripItem[];
  milesPerDay: number | null;
  origin: { lat: number; lng: number } | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saves a trip to the signed-in rider's profile, or updates one they already saved. */
export async function saveTrip(input: SaveTripInput): Promise<SaveTripResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in to save a trip." };
  const userId = session.user.id;

  const name = String(input.name ?? "").trim().slice(0, TRIP_NAME_MAX_LENGTH);
  if (!name) return { ok: false, error: "Give your trip a name first." };

  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) return { ok: false, error: "Add at least one route first." };
  if (items.length > MAX_TRIP_ROUTES) return { ok: false, error: `A trip can have up to ${MAX_TRIP_ROUTES} routes.` };
  const cleanItems: SavedTripItem[] = items.map((item) => ({ routeId: String(item.routeId), reversed: item.reversed === true }));
  if (cleanItems.some((item) => !UUID.test(item.routeId))) return { ok: false, error: "That trip has a route we don't recognise." };

  // Only published routes can go in a trip.
  const ids = [...new Set(cleanItems.map((item) => item.routeId))];
  const found = await db.select({ id: routes.id }).from(routes).where(and(inArray(routes.id, ids), eq(routes.status, "published")));
  if (found.length !== ids.length) return { ok: false, error: "One of those routes is no longer available. Remove it and try again." };

  const milesPerDay = Number.isFinite(input.milesPerDay) && input.milesPerDay! >= 30 && input.milesPerDay! <= 600 ? Math.round(input.milesPerDay!) : null;
  const origin =
    input.origin && Number.isFinite(input.origin.lat) && Number.isFinite(input.origin.lng) && Math.abs(input.origin.lat) <= 90 && Math.abs(input.origin.lng) <= 180
      ? { lat: input.origin.lat, lng: input.origin.lng }
      : null;

  if (input.id) {
    if (!UUID.test(input.id)) return { ok: false, error: "We couldn't find that trip." };
    const updated = await db
      .update(savedTrips)
      .set({ name, items: cleanItems, milesPerDay, origin, updatedAt: new Date() })
      .where(and(eq(savedTrips.id, input.id), eq(savedTrips.userId, userId)))
      .returning({ id: savedTrips.id });
    if (updated.length === 0) return { ok: false, error: "We couldn't find that trip." };
    revalidatePath("/profile");
    return { ok: true, id: updated[0].id };
  }

  const [{ total }] = await db.select({ total: count() }).from(savedTrips).where(eq(savedTrips.userId, userId));
  const { savedTrips: maxTrips } = await getLimits(userId);
  if (total >= maxTrips) {
    return {
      ok: false,
      error:
        maxTrips <= 1
          ? "A free account can keep one saved trip. Delete it from your profile to save a new one, or upgrade to Premium for unlimited trips."
          : `You can save up to ${maxTrips} trips. Delete one from your profile to make room.`,
    };
  }
  const [created] = await db.insert(savedTrips).values({ userId, name, items: cleanItems, milesPerDay, origin }).returning({ id: savedTrips.id });
  revalidatePath("/profile");
  return { ok: true, id: created.id };
}

export async function deleteTrip(id: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id || !UUID.test(id)) return { ok: false };
  await db.delete(savedTrips).where(and(eq(savedTrips.id, id), eq(savedTrips.userId, session.user.id)));
  revalidatePath("/profile");
  return { ok: true };
}
