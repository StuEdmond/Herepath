"use client";

import { useMemo } from "react";
import { TrackMap } from "./track-map";

export interface RouteMapProps {
  geometry: GeoJSON.LineString | null;
  className?: string;
}

export function RouteMap({ geometry, className }: RouteMapProps) {
  const lines = useMemo(() => (geometry ? [{ id: "route-line", geometry }] : []), [geometry]);
  return <TrackMap lines={lines} className={className} />;
}
