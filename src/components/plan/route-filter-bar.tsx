"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PopularChip } from "@/components/explore/filters";
import { BIKE_TYPE_OPTIONS, DIFFICULTY_OPTIONS, hasFilters, type RouteFilterState } from "@/lib/route-filters";

const SELECT = "min-h-11 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary";

/**
 * The same search and filters as the Explore page (search, popular searches, region, difficulty, bike type and sort), for the routes
 * in the trip planner. They apply as you type or choose, to the map and the list of routes to add.
 */
export function RouteFilterBar({
  filters,
  onChange,
  onClear,
  regionOptions,
  popularChips,
  matching,
  total,
  hasStart,
}: {
  filters: RouteFilterState;
  onChange: (changes: Partial<RouteFilterState>) => void;
  onClear: () => void;
  regionOptions: string[];
  popularChips: PopularChip[];
  matching: number;
  total: number;
  /** A start point is set, so "Nearest to my start" is on offer. */
  hasStart: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search a landmark, road or place"
          aria-label="Search a landmark, road or place"
          className="min-h-12 w-full rounded-lg border border-text-muted/40 bg-surface pl-10 pr-3 text-[15px] text-text-primary"
        />
      </div>

      {popularChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {popularChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange({ q: chip.query })}
              className="rounded-full bg-surface px-3 py-1.5 text-[13px] text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select aria-label="Region" value={filters.region} onChange={(e) => onChange({ region: e.target.value })} className={SELECT}>
          <option value="">Any region</option>
          {regionOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select aria-label="Difficulty" value={filters.difficulty} onChange={(e) => onChange({ difficulty: e.target.value })} className={SELECT}>
          <option value="">Any difficulty</option>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <select aria-label="Bike type" value={filters.bikeType} onChange={(e) => onChange({ bikeType: e.target.value })} className={SELECT}>
          <option value="">Any bike</option>
          {BIKE_TYPE_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <select aria-label="Sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} className={SELECT}>
          <option value="">{hasStart ? "Nearest to my start" : "Top rated"}</option>
          <option value="shortest">Shortest first</option>
          <option value="longest">Longest first</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] text-text-muted" role="status">
          {matching} of {total} {total === 1 ? "route" : "routes"} {hasFilters(filters) ? "match" : "shown"}
        </p>
        {hasFilters(filters) && (
          <Button type="button" variant="ghost" className="min-h-9 px-3 text-[13px]" onClick={onClear}>
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
