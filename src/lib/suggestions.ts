import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { diaryEntries, tourDays, dayRideStages } from "@/db/schema";
import { getExploreResults, type ExploreResult } from "@/lib/explore";
import { getRiddenRouteIds, getRiddenRegionNames } from "@/lib/your-rides";

export interface Suggestion {
  result: ExploreResult;
  reason: string;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Section 5.6's rule-based suggestion logic. */
export async function getSuggestions(userId: string): Promise<Suggestion[]> {
  const [allResults, entries, riddenRouteIds, riddenRegions] = await Promise.all([
    getExploreResults(),
    db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId)),
    getRiddenRouteIds(userId),
    getRiddenRegionNames(userId),
  ]);

  const byTarget = new Map(allResults.map((r) => [`${r.type}:${r.id}`, r]));

  // Never re-suggest something already logged, unless it was rated highly
  // over a year ago (allows resurfacing an old favourite).
  const loggedKeys = new Set<string>();
  for (const entry of entries) {
    if (!entry.targetType || !entry.targetId) continue;
    const key = `${entry.targetType === "day_ride" ? "day-ride" : entry.targetType}:${entry.targetId}`;
    const ageMs = Date.now() - new Date(entry.date).getTime();
    const eligibleAgain = (entry.rating ?? 0) >= 4 && ageMs > ONE_YEAR_MS;
    if (!eligibleAgain) loggedKeys.add(key);
  }

  const candidates = allResults.filter((r) => !loggedKeys.has(`${r.type}:${r.id}`));
  const suggestions: Suggestion[] = [];
  const used = new Set<string>();

  function addSuggestion(result: ExploreResult, reason: string) {
    const key = `${result.type}:${result.id}`;
    if (used.has(key)) return false;
    used.add(key);
    suggestions.push({ result, reason });
    return true;
  }

  // Rule 1: similar difficulty + shared bike suitability to a highly-rated ride.
  const highlyRated = entries.filter((e) => (e.rating ?? 0) >= 4 && e.targetType && e.targetId);
  for (const entry of highlyRated) {
    if (suggestions.length >= 3) break;
    const key = `${entry.targetType === "day_ride" ? "day-ride" : entry.targetType}:${entry.targetId}`;
    const loved = byTarget.get(key);
    if (!loved) continue;

    const match = candidates.find(
      (c) =>
        `${c.type}:${c.id}` !== key &&
        c.difficulty !== null &&
        loved.difficulty !== null &&
        Math.abs(c.difficulty - loved.difficulty) <= 1 &&
        c.suitedBikeTypes.some((b) => loved.suitedBikeTypes.includes(b)),
    );
    if (match) addSuggestion(match, `You rated ${loved.name} ${entry.rating} stars`);
  }

  // Rule 2: a region the user hasn't ridden yet.
  if (suggestions.length < 3) {
    const match = candidates.find((c) => c.regionNames.length > 0 && c.regionNames.some((r) => !riddenRegions.has(r)));
    if (match) addSuggestion(match, "A new region for you");
  }

  // Rule 3: a tour containing day rides/routes already completed.
  if (suggestions.length < 3) {
    const tourCandidates = candidates.filter((c) => c.type === "tour");
    for (const tour of tourCandidates) {
      const days = await db.select({ dayRideId: tourDays.dayRideId }).from(tourDays).where(eq(tourDays.tourId, tour.id));
      let overlap = 0;
      for (const day of days) {
        const stages = await db.select({ routeId: dayRideStages.routeId }).from(dayRideStages).where(eq(dayRideStages.dayRideId, day.dayRideId));
        if (stages.some((s) => s.routeId && riddenRouteIds.has(s.routeId))) overlap++;
      }
      if (overlap > 0) {
        addSuggestion(tour, `Ready for a first tour? Includes ${overlap} ride${overlap === 1 ? "" : "s"} you've done`);
        break;
      }
    }
  }

  // Fill any remaining slots with anything not yet suggested, so there's always something to show.
  for (const candidate of candidates) {
    if (suggestions.length >= 3) break;
    if (used.has(`${candidate.type}:${candidate.id}`)) continue;
    addSuggestion(candidate, "Popular with riders like you");
  }

  return suggestions.slice(0, 3);
}
