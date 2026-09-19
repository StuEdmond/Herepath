"use client";

import { cn } from "@/lib/utils";
import { MAP_STYLE_OPTIONS, canSwitchMapStyle } from "@/lib/map-styles";
import { setMapStyle, useMapStyle } from "./use-map-style";

/** Small Map / Contour Map / Satellite switch that sits over the top-left corner of a map. */
export function MapStyleSwitcher() {
  const current = useMapStyle();
  if (!canSwitchMapStyle()) return null;

  return (
    <div role="group" aria-label="Map type" className="absolute left-2 top-2 z-10 flex rounded-lg bg-surface/95 p-0.5 shadow-md">
      {MAP_STYLE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={current === option.id}
          onClick={() => setMapStyle(option.id)}
          className={cn(
            "min-h-8 rounded-md px-2.5 text-[12px] font-medium transition-colors",
            current === option.id ? "bg-green-primary text-white" : "text-text-secondary hover:text-text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
