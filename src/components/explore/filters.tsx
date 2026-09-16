"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Map as MapIcon, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TRIP_TYPES = [
  { value: "all", label: "All rides" },
  { value: "route", label: "Short routes" },
  { value: "day-ride", label: "Full day rides" },
  { value: "tour", label: "Multi-day tours" },
] as const;

const BIKE_TYPE_OPTIONS = [
  { value: "sports", label: "Sports" },
  { value: "naked_and_roadster", label: "Naked and roadster" },
  { value: "adventure", label: "Adventure" },
  { value: "touring", label: "Touring" },
  { value: "cruiser", label: "Cruiser" },
  { value: "125cc_and_new_riders", label: "125cc and new riders" },
] as const;

export interface PopularChip {
  id: string;
  label: string;
  query: string;
}

export function ExploreFilters({
  regionOptions,
  popularChips,
}: {
  regionOptions: string[];
  popularChips: PopularChip[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const activeTripType = searchParams.get("tripType") ?? "all";
  const activeView = searchParams.get("view") ?? "grid";
  const hasFilters = ["q", "tripType", "region", "difficulty", "bikeType", "sort"].some((k) => searchParams.get(k));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[26px]">Find your next ride</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: searchInput || null });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search a landmark, road or place"
          aria-label="Search a landmark, road or place"
          className="min-h-12 w-full rounded-lg border border-text-muted/40 bg-surface pl-10 pr-3 text-[15px] text-text-primary"
        />
      </form>

      {popularChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {popularChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setSearchInput(chip.query);
                updateParams({ q: chip.query });
              }}
              className="rounded-full bg-surface px-3 py-1.5 text-[13px] text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex rounded-lg bg-surface p-1">
        {TRIP_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => updateParams({ tripType: t.value === "all" ? null : t.value })}
            className={cn(
              "min-h-10 flex-1 rounded-md px-2 text-[13px] font-medium transition-colors",
              activeTripType === t.value ? "bg-green-primary text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          aria-label="Region"
          value={searchParams.get("region") ?? ""}
          onChange={(e) => updateParams({ region: e.target.value || null })}
          className="min-h-11 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
        >
          <option value="">Any region</option>
          {regionOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          aria-label="Difficulty"
          value={searchParams.get("difficulty") ?? ""}
          onChange={(e) => updateParams({ difficulty: e.target.value || null })}
          className="min-h-11 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
        >
          <option value="">Any difficulty</option>
          <option value="relaxed">Relaxed (1 to 2)</option>
          <option value="moderate">Moderate (3)</option>
          <option value="challenging">Challenging (4 to 5)</option>
        </select>

        <select
          aria-label="Bike type"
          value={searchParams.get("bikeType") ?? ""}
          onChange={(e) => updateParams({ bikeType: e.target.value || null })}
          className="min-h-11 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
        >
          <option value="">Any bike</option>
          {BIKE_TYPE_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort"
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => updateParams({ sort: e.target.value || null })}
          className="min-h-11 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
        >
          <option value="">Top rated</option>
          <option value="shortest">Shortest first</option>
          <option value="longest">Longest first</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg bg-surface p-1">
          <button
            type="button"
            onClick={() => updateParams({ view: null })}
            aria-label="Grid view"
            aria-pressed={activeView === "grid"}
            className={cn("flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[13px]", activeView === "grid" ? "bg-surface-raised text-text-primary" : "text-text-muted")}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => updateParams({ view: "map" })}
            aria-label="Map view"
            aria-pressed={activeView === "map"}
            className={cn("flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[13px]", activeView === "map" ? "bg-surface-raised text-text-primary" : "text-text-muted")}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Map
          </button>
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 px-3 text-[13px]"
            onClick={() => {
              setSearchInput("");
              router.push(pathname, { scroll: false });
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
