"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Map as MaplibreMap,
  Marker,
  Popup,
  AttributionControl,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ExploreResult } from "@/lib/explore";

if (typeof window !== "undefined") {
  setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl-worker.mjs");
}

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

const TYPE_PATH: Record<ExploreResult["type"], string> = {
  route: "routes",
  "day-ride": "day-rides",
  tour: "tours",
};

export function ResultsPinMap({ results }: { results: ExploreResult[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new MaplibreMap({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || OSM_RASTER_FALLBACK,
      center: [-2.5, 54],
      zoom: 5,
      attributionControl: false,
      cooperativeGestures: true,
    });
    instance.addControl(new AttributionControl({ customAttribution: process.env.NEXT_PUBLIC_MAP_STYLE_URL ? undefined : "© OpenStreetMap contributors" }));
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    setMap(instance);
    return () => {
      instance.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    const pinned = results.filter((r) => r.point);
    const markers = pinned.map((result) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", result.name);
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.background = "#4fae82";
      el.style.cursor = "pointer";
      el.addEventListener("click", () => router.push(`/${TYPE_PATH[result.type]}/${result.slug}`));

      const popup = new Popup({ offset: 12, closeButton: false }).setText(result.name);
      return new Marker({ element: el }).setLngLat([result.point!.lng, result.point!.lat]).setPopup(popup).addTo(map);
    });

    if (pinned.length > 0) {
      const lngs = pinned.map((r) => r.point!.lng);
      const lats = pinned.map((r) => r.point!.lat);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 48, maxZoom: 12, duration: 0 },
      );
    }

    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [map, results, router]);

  return <div ref={containerRef} className="h-[60vh] w-full rounded-lg" />;
}
