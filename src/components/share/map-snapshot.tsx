"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

if (typeof window !== "undefined") {
  setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl-worker.mjs");
}

const OSM_RASTER_FALLBACK: StyleSpecification = {
  version: 8,
  sources: {
    osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/**
 * Renders a MapLibre map off-screen purely to rasterise it — MapLibre draws
 * to a real <canvas>, so once the map is idle we can read that canvas
 * straight into the share image canvas as a static snapshot.
 */
export function MapSnapshot({
  geometry,
  width,
  height,
  onReady,
}: {
  geometry: GeoJSON.LineString;
  width: number;
  height: number;
  onReady: (canvas: HTMLCanvasElement) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || OSM_RASTER_FALLBACK,
      center: [-1.9, 53.3],
      zoom: 6,
      attributionControl: false,
      interactive: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    map.once("load", () => {
      map.addSource("share-line", { type: "geojson", data: { type: "Feature", geometry, properties: {} } });
      map.addLayer({
        id: "share-line",
        type: "line",
        source: "share-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#4fae82", "line-width": 6 },
      });

      const lngs = geometry.coordinates.map((c) => c[0]);
      const lats = geometry.coordinates.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 24, duration: 0 },
      );

      map.once("idle", () => onReady(map.getCanvas()));
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
