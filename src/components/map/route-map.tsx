"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MaplibreMap,
  AttributionControl,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
const LINE_SOURCE_ID = "route-line";

export interface RouteMapProps {
  geometry: GeoJSON.LineString | null;
  className?: string;
}

export function RouteMap({ geometry, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MaplibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new MaplibreMap({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || OSM_RASTER_FALLBACK,
      center: [-1.9, 53.3],
      zoom: 6,
      attributionControl: false,
    });
    instance.addControl(new AttributionControl({ customAttribution: "© OpenStreetMap contributors" }));
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    setMap(instance);

    return () => {
      instance.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    const draw = () => {
      const existing = map.getSource(LINE_SOURCE_ID) as GeoJSONSource | undefined;
      const data: GeoJSON.Feature<GeoJSON.LineString> | GeoJSON.FeatureCollection = geometry
        ? { type: "Feature", geometry, properties: {} }
        : { type: "FeatureCollection", features: [] };

      if (existing) {
        existing.setData(data);
      } else {
        map.addSource(LINE_SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: LINE_SOURCE_ID,
          type: "line",
          source: LINE_SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#4fae82", "line-width": 4 },
        });
      }

      if (geometry && geometry.coordinates.length > 0) {
        const lngs = geometry.coordinates.map((c) => c[0]);
        const lats = geometry.coordinates.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 32, maxZoom: 14, duration: 0 },
        );
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [map, geometry]);

  return <div ref={containerRef} className={className ?? "h-64 w-full rounded-lg"} />;
}
