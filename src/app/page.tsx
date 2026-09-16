import type { Metadata } from "next";
import { db } from "@/db/client";
import { regions, searchChips } from "@/db/schema";
import { getExploreResults, filterAndSortResults, matchedLandmark, type ExploreFilters } from "@/lib/explore";
import { ExploreFilters as ExploreFiltersComponent } from "@/components/explore/filters";
import { ResultCard } from "@/components/explore/result-card";
import { ResultsPinMap } from "@/components/explore/results-pin-map";

export const metadata: Metadata = {
  title: "Herepath",
  description: "Ancient roads. Modern riders. Search UK motorcycle routes, day rides and tours.",
};

type SearchParams = Record<string, string | undefined>;

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const [regionRows, chipRows, allResults] = await Promise.all([
    db.select().from(regions).orderBy(regions.name),
    db.select().from(searchChips).orderBy(searchChips.position),
    getExploreResults(),
  ]);

  const filters: ExploreFilters = {
    q: params.q,
    tripType: (params.tripType as ExploreFilters["tripType"]) ?? "all",
    region: params.region,
    difficulty: params.difficulty as ExploreFilters["difficulty"],
    bikeType: params.bikeType,
    sort: params.sort as ExploreFilters["sort"],
  };

  const results = filterAndSortResults(allResults, filters);
  const view = params.view === "map" ? "map" : "grid";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-8">
      <ExploreFiltersComponent regionOptions={regionRows.map((r) => r.name)} popularChips={chipRows} />

      <div className="flex items-center justify-between">
        <p className="text-[14px] text-text-muted">
          {results.length} {results.length === 1 ? "ride" : "rides"} found
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-surface p-8 text-center">
          <p className="text-[16px] text-text-primary">No rides match those filters</p>
          <p className="text-[14px] text-text-muted">Try widening the region or difficulty.</p>
        </div>
      ) : view === "map" ? (
        <ResultsPinMap results={results} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <ResultCard key={`${result.type}-${result.id}`} result={result} matchedLandmarkName={matchedLandmark(result, filters.q)} />
          ))}
        </div>
      )}
    </div>
  );
}
