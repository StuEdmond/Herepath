"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map as MaplibreMap,
  AttributionControl,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyleUrl, type MapStyleId } from "@/lib/map-styles";
import { MapStyleSwitcher } from "./map-style-switcher";
import { readMapStyle, useApplyMapStyle } from "./use-map-style";

/**
 * Turbopack (dev) fails to resolve maplibre-gl's own worker chunk — it serves
 * the HTML shell instead of the worker script, which silently breaks all
 * GeoJSON/vector processing (raster tiles still work since they need no
 * worker). Pointing at the matching version's worker on jsDelivr sidesteps it.
 */
if (typeof window !== "undefined") {
  setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl-worker.mjs");
}

/**
 * Local-dev fallback only — MapLibre's own demotiles style has no road-level
 * detail, so we fall back to OSM's raster tiles for something testable.
 * Set NEXT_PUBLIC_MAP_STYLE_URL to a real provider (MapTiler, Stadia, etc.)
 * before production; the brief's Section 2 explicitly rules out relying on
 * OSM's tile servers for production traffic.
 */
const OSM_RASTER_FALLBACK: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export interface TrackLine {
  id: string;
  geometry: GeoJSON.LineString;
  color?: string;
  width?: number;
}

export interface TrackMapProps {
  lines: TrackLine[];
  className?: string;
}

/** Renders one or more GeoJSON lines on a shared basemap — the engine behind RouteMap. */
export function TrackMap({ lines, className }: TrackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const appliedStyleRef = useRef<MapStyleId>("streets");

  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle = readMapStyle();
    appliedStyleRef.current = initialStyle;

    const instance = new MaplibreMap({
      container: containerRef.current,
      style: mapStyleUrl(initialStyle) || OSM_RASTER_FALLBACK,
      center: [-1.9, 53.3],
      zoom: 6,
      attributionControl: false,
      // With a mouse the wheel zooms the map directly. On a touch screen it takes two fingers to move
      // the map, so one finger can keep scrolling the page past it.
      cooperativeGestures: !window.matchMedia("(hover: hover)").matches,
    });
    instance.addControl(new AttributionControl({ customAttribution: process.env.NEXT_PUBLIC_MAP_STYLE_URL ? undefined : "© OpenStreetMap contributors" }));
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    setMap(instance);

    return () => {
      instance.remove();
      setMap(null);
    };
  }, []);

  const prevLineIdsRef = useRef<Set<string>>(new Set());

  // refit is true when the lines themselves changed, false when only the map type did (so the rider keeps their view).
  const drawLines = useCallback(
    (target: MaplibreMap, refit: boolean) => {
      const currentIds = new Set(lines.map((l) => l.id));
      for (const staleId of prevLineIdsRef.current) {
        if (!currentIds.has(staleId) && target.getLayer(staleId)) {
          target.removeLayer(staleId);
          target.removeSource(staleId);
        }
      }
      prevLineIdsRef.current = currentIds;

      for (const line of lines) {
        const existing = target.getSource(line.id) as GeoJSONSource | undefined;
        const data: GeoJSON.Feature<GeoJSON.LineString> = { type: "Feature", geometry: line.geometry, properties: {} };

        if (existing) {
          existing.setData(data);
        } else {
          target.addSource(line.id, { type: "geojson", data });
          target.addLayer({
            id: line.id,
            type: "line",
            source: line.id,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": line.color ?? "#4fae82", "line-width": line.width ?? 4 },
          });
        }
      }

      const allCoords = lines.flatMap((l) => l.geometry.coordinates);
      if (refit && allCoords.length > 0) {
        const lngs = allCoords.map((c) => c[0]);
        const lats = allCoords.map((c) => c[1]);
        target.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 32, maxZoom: 14, duration: 0 },
        );
      }
    },
    [lines],
  );

  useEffect(() => {
    if (!map) return;
    if (map.isStyleLoaded()) drawLines(map, true);
    else map.once("load", () => drawLines(map, true));
  }, [map, drawLines]);

  useApplyMapStyle(map, appliedStyleRef, () => {
    if (map) drawLines(map, false);
  });

  return (
    <div className="relative">
      <div ref={containerRef} className={className ?? "h-64 w-full rounded-lg"} />
      <MapStyleSwitcher />
    </div>
  );
}
