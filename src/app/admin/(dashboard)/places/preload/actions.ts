"use server";

import { getPlacesAlong, getRideLines } from "@/lib/places-along";
import { PLACE_KINDS, type PlaceKind } from "@/lib/place-kinds";

export type PreloadResult =
  | { status: "done"; count: number }
  /** OpenStreetMap was too slow for some of the ride. What was found is cached; asking again fills in the rest. */
  | { status: "partial"; count: number }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

/**
 * Looks up one kind of place along one ride, which stores OpenStreetMap's answer in the site's cache so the first
 * rider to switch it on doesn't have to wait. Admin only: the whole /admin area is behind the admin login.
 */
export async function preloadPlacesJob(type: string, slug: string, kind: string): Promise<PreloadResult> {
  if (!PLACE_KINDS.some((k) => k.id === kind)) return { status: "error", reason: "Unknown kind of place" };
  try {
    const lines = await getRideLines(type, slug);
    if (!lines) return { status: "skipped", reason: "No published track" };
    const result = await getPlacesAlong(kind as PlaceKind, lines);
    return { status: result.osmOk ? "done" : "partial", count: result.places.length };
  } catch (error) {
    return { status: "error", reason: error instanceof Error ? error.message : "Something went wrong" };
  }
}
