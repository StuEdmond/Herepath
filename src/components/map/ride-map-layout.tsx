"use client";

import type { ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { MapExpandedContext, setMapLayoutExpanded, useMapLayoutExpanded } from "./map-layout-context";

function LayoutToggle({ expanded }: { expanded: boolean }) {
  const Icon = expanded ? Minimize2 : Maximize2;
  return (
    <button
      type="button"
      aria-pressed={expanded}
      onClick={() => setMapLayoutExpanded(!expanded)}
      className="inline-flex min-h-9 items-center gap-1.5 self-end rounded-lg bg-surface px-3 text-[13px] text-text-secondary hover:text-text-primary"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {expanded ? "Standard view" : "Larger map"}
    </button>
  );
}

/**
 * The map section of a ride page. Normally the ride details run down the page with the map in the middle.
 * With "Larger map" chosen, the map takes most of the width and the details move into a narrower panel
 * beside it (stacked under the map on a phone), so riders can see where a ride starts and finishes.
 * With no map (no track uploaded yet) it just shows the details in order.
 */
export function RideMapLayout({ before, map, after }: { before?: ReactNode; map: ReactNode; after?: ReactNode }) {
  const expanded = useMapLayoutExpanded();

  if (!map) {
    return (
      <>
        {before}
        {after}
      </>
    );
  }

  if (!expanded) {
    return (
      <>
        {before}
        <div className="flex flex-col gap-2">
          <LayoutToggle expanded={false} />
          {map}
        </div>
        {after}
      </>
    );
  }

  return (
    // Breaks out of the page's narrow reading column: the wrapper is centred on it and as wide as the screen allows.
    <div className="relative left-1/2 w-[min(calc(100vw-2rem),84rem)] -translate-x-1/2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-20">
          <LayoutToggle expanded />
          <MapExpandedContext.Provider value>{map}</MapExpandedContext.Provider>
        </div>
        <div className="flex flex-col gap-6">
          {before}
          {after}
        </div>
      </div>
    </div>
  );
}
