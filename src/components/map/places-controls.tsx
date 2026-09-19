"use client";

import { BedDouble, Fuel, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACE_KINDS, type PlaceKind } from "@/lib/place-kinds";
import type { PlacesState } from "./use-places";

const ICONS: Record<PlaceKind, typeof Fuel> = { fuel: Fuel, food: UtensilsCrossed, stay: BedDouble };

/** Buttons under a ride's map for showing fuel, food and places to stay along the route, with a note about the data. */
export function PlacesControls({ state }: { state: PlacesState }) {
  const anyActive = state.active.size > 0;
  const waiting = PLACE_KINDS.filter((k) => state.active.has(k.id) && state.loading.has(k.id));
  const problems = PLACE_KINDS.filter((k) => state.active.has(k.id) && (state.failed.has(k.id) || state.loaded[k.id]?.complete === false));
  const empty = PLACE_KINDS.filter((k) => state.active.has(k.id) && state.loaded[k.id]?.complete && state.loaded[k.id]!.places.length === 0);

  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-text-muted">Show on map:</span>
        {PLACE_KINDS.map((kind) => {
          const Icon = ICONS[kind.id];
          const on = state.active.has(kind.id);
          const count = state.loaded[kind.id]?.places.length;
          return (
            <button
              key={kind.id}
              type="button"
              aria-pressed={on}
              onClick={() => state.toggle(kind.id)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 transition-colors",
                on ? "border-transparent bg-green-primary text-white" : "border-surface-raised text-text-secondary hover:text-text-primary",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-white/80" style={{ backgroundColor: kind.color }} aria-hidden="true" />
              <Icon className="h-4 w-4" aria-hidden="true" />
              {kind.label}
              {on && count != null && <span className="opacity-80">· {count}</span>}
            </button>
          );
        })}
      </div>

      {waiting.length > 0 && (
        <p className="text-text-muted" role="status">
          Looking for places along the route. The first time for a ride this can take up to 20 seconds.
        </p>
      )}
      {empty.length > 0 && (
        <p className="text-text-muted">No {empty.map((k) => k.label.toLowerCase()).join(" or ")} found near this route.</p>
      )}
      {problems.map((kind) => (
        <p key={kind.id} className="text-text-muted">
          {state.failed.has(kind.id) ? `Couldn't load ${kind.label.toLowerCase()} places just now.` : `Some ${kind.label.toLowerCase()} places may be missing, because the map data service was slow to answer.`}{" "}
          <button type="button" onClick={() => state.retry(kind.id)} className="text-green-bright underline hover:no-underline">
            Try again
          </button>
        </p>
      ))}
      {anyActive && (
        <p className="text-text-muted">
          Places come from OpenStreetMap and Herepath. Opening times and availability aren&apos;t guaranteed, so check before you rely on a fuel stop
          or a booking.
        </p>
      )}
    </div>
  );
}
