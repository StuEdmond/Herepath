"use client";

import { useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaceResult } from "@/lib/geocode";

/**
 * A box for an address, postcode or place name. It searches when the rider presses Search (not on every key press, which the free lookup
 * services don't allow) and lists what it finds; picking one calls onPick.
 */
export function AddressSearch({ onPick }: { onPick: (place: PlaceResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const latest = useRef<AbortController | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) {
      setError("Type at least two letters of an address, postcode or place.");
      return;
    }
    latest.current?.abort();
    const controller = new AbortController();
    latest.current = controller;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`, { signal: controller.signal });
      const body = (await response.json()) as { results?: PlaceResult[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "The address search isn't answering just now.");
      setResults(body.results ?? []);
    } catch (problem) {
      if (controller.signal.aborted) return;
      setResults(null);
      setError(problem instanceof Error ? problem.message : "The address search isn't answering just now.");
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={search} className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="start-address">
          Address, postcode or place
        </label>
        <input
          id="start-address"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Address, postcode or place, e.g. SK17 6BH"
          autoComplete="off"
          maxLength={100}
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-text-muted/40 bg-bg px-3 text-[14px] text-text-primary"
        />
        <Button type="submit" variant="secondary" className="min-h-10 px-3 text-[14px]" disabled={searching}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {searching ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="text-[13px] text-red-accent">{error}</p>}
      {results && results.length === 0 && <p className="text-[13px] text-text-muted">Nothing found in the UK for that. Try a postcode or a town name.</p>}
      {results && results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-lg border border-text-muted/30 bg-bg">
          {results.map((place, index) => (
            <li key={`${place.lat},${place.lng},${index}`} className="border-b border-text-muted/20 last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  onPick(place);
                  setResults(null);
                  setQuery("");
                }}
                className="flex min-h-10 w-full items-start gap-2 px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
