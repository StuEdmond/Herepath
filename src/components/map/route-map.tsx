"use client";

import { useMemo } from "react";
import { TrackMap } from "./track-map";
import type { PlacesSource } from "@/lib/place-kinds";

export interface RouteMapProps {
  geometry: GeoJSON.LineString | null;
  className?: string;
  placesFor?: PlacesSource;
}

export function RouteMap({ geometry, className, placesFor }: RouteMapProps) {
  const lines = useMemo(() => (geometry ? [{ id: "route-line", geometry }] : []), [geometry]);
  return <TrackMap lines={lines} className={className} placesFor={placesFor} />;
}
