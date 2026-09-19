import { haversineMiles, type LatLng } from "./geo";
import type { PlannerRoute } from "./trip-planner";

/**
 * The filters riders use to narrow down rides, shared by the Explore page and the trip planner so both mean the same thing:
 * what the search matches, what "relaxed" or "challenging" covers, and the bike types on offer.
 */

export const BIKE_TYPE_OPTIONS = [
  { value: "sports", label: "Sports" },
  { value: "naked_and_roadster", label: "Naked and roadster" },
  { value: "adventure", label: "Adventure" },
  { value: "touring", label: "Touring" },
  { value: "cruiser", label: "Cruiser" },
  { value: "125cc_and_new_riders", label: "125cc and new riders" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "relaxed", label: "Relaxed (1 to 2)" },
  { value: "moderate", label: "Moderate (3)" },
  { value: "challenging", label: "Challenging (4 to 5)" },
] as const;

export type DifficultyBand = (typeof DIFFICULTY_OPTIONS)[number]["value"];

/** Does the search text appear in the ride's name, its region, or a landmark on it? */
export function matchesSearch(text: string, ride: { name: string; regionNames: string[]; landmarkNames: string[] }): boolean {
  const needle = text.toLowerCase();
  return (
    ride.name.toLowerCase().includes(needle) ||
    ride.regionNames.some((r) => r.toLowerCase().includes(needle)) ||
    ride.landmarkNames.some((l) => l.toLowerCase().includes(needle))
  );
}

export function matchesDifficultyBand(difficulty: number | null, band: string | undefined): boolean {
  if (!band || band === "any") return true;
  if (difficulty == null) return false;
  if (band === "relaxed") return difficulty <= 2;
  if (band === "moderate") return difficulty === 3;
  return difficulty >= 4;
}

/** The trip planner's filters, held in the page rather than the address bar so changing one doesn't reload anything. */
export interface RouteFilterState {
  q: string;
  region: string;
  difficulty: string;
  bikeType: string;
  /** "shortest", "longest", "nearest" (to the rider's start point), or empty for the default order. */
  sort: string;
}

export const NO_FILTERS: RouteFilterState = { q: "", region: "", difficulty: "", bikeType: "", sort: "" };

export function hasFilters(filters: RouteFilterState): boolean {
  return !!(filters.q || filters.region || filters.difficulty || filters.bikeType || filters.sort);
}

/** The routes that pass the filters, in the chosen order. With a start point and no other order chosen, nearest first. */
export function filterRoutes(routes: PlannerRoute[], filters: RouteFilterState, origin: LatLng | null): PlannerRoute[] {
  const q = filters.q.trim();
  const matching = routes.filter(
    (route) =>
      (!q || matchesSearch(q, { name: route.name, regionNames: [route.regionName], landmarkNames: route.landmarkNames })) &&
      (!filters.region || route.regionName === filters.region) &&
      matchesDifficultyBand(route.difficulty, filters.difficulty) &&
      (!filters.bikeType || route.suitedBikeTypes.includes(filters.bikeType)),
  );

  const nearest = (route: PlannerRoute) => (origin ? Math.min(haversineMiles(origin, route.start), haversineMiles(origin, route.end)) : 0);
  const sorted = [...matching];
  if (filters.sort === "shortest") sorted.sort((a, b) => a.distanceMiles - b.distanceMiles);
  else if (filters.sort === "longest") sorted.sort((a, b) => b.distanceMiles - a.distanceMiles);
  else if (filters.sort === "nearest" || (!filters.sort && origin)) sorted.sort((a, b) => nearest(a) - nearest(b));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}
