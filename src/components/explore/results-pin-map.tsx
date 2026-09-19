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
import { buildPinCard } from "./pin-card";
import { mapStyleUrl, type MapStyleId } from "@/lib/map-styles";
import { MapStyleSwitcher } from "@/components/map/map-style-switcher";
import { readMapStyle, useApplyMapStyle } from "@/components/map/use-map-style";

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
  const appliedStyleRef = useRef<MapStyleId>("streets");
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;
    const initialStyle = readMapStyle();
    appliedStyleRef.current = initialStyle;
    const instance = new MaplibreMap({
      container: containerRef.current,
      style: mapStyleUrl(initialStyle) || OSM_RASTER_FALLBACK,
      center: [-2.5, 54],
      zoom: 5,
      attributionControl: false,
      // This map is the point of the page, so with a mouse the wheel zooms it directly. On a touch screen
      // it still takes two fingers to move it, so one finger can keep scrolling the page.
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

  useEffect(() => {
    if (!map) return;

    const pinned = results.filter((r) => r.point);

    // With a mouse, hovering (or tabbing to) a pin shows the ride's details and clicking opens it. A touch
    // screen has no hover, so a tap shows the details with a "View ride" link instead.
    const canHover = window.matchMedia("(hover: hover)").matches;
    const openRide = (result: ExploreResult) => router.push(`/${TYPE_PATH[result.type]}/${result.slug}`);
    const popup = new Popup({
      offset: 14,
      closeButton: false,
      closeOnClick: !canHover,
      maxWidth: "280px",
      focusAfterOpen: false,
      className: canHover ? "herepath-popup herepath-popup-hover" : "herepath-popup",
    });
    const showCard = (result: ExploreResult) => {
      popup
        .setLngLat([result.point!.lng, result.point!.lat])
        .setDOMContent(buildPinCard(result, canHover ? undefined : () => openRide(result)))
        .addTo(map);
    };

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

      if (canHover) {
        el.addEventListener("mouseenter", () => showCard(result));
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("focus", () => showCard(result));
        el.addEventListener("blur", () => popup.remove());
        el.addEventListener("click", () => openRide(result));
      } else {
        el.addEventListener("click", (event) => {
          // Stops the tap counting as a click on the map, which would close the card straight away.
          event.stopPropagation();
          showCard(result);
        });
      }

      return new Marker({ element: el }).setLngLat([result.point!.lng, result.point!.lat]).addTo(map);
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
      popup.remove();
      for (const marker of markers) marker.remove();
    };
  }, [map, results, router]);

  // The pins are page elements, not part of the map style, so they survive a change of map type.
  useApplyMapStyle(map, appliedStyleRef);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[60vh] w-full rounded-lg" />
      <MapStyleSwitcher />
    </div>
  );
}
