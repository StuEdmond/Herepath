"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map as MaplibreMap,
  Marker,
  Popup,
  AttributionControl,
  NavigationControl,
  LngLatBounds,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyleUrl, type MapStyleId } from "@/lib/map-styles";
import { MapStyleSwitcher } from "@/components/map/map-style-switcher";
import { PlacesControls } from "@/components/map/places-controls";
import { syncPlacesLayers } from "@/components/map/places-map";
import { readMapStyle, useApplyMapStyle } from "@/components/map/use-map-style";
import type { PlacesState } from "@/components/map/use-places";
import { DIFFICULTY_LABELS } from "@/components/ui/difficulty-gauge";
import type { LatLng } from "@/lib/geo";
import type { LinkLeg, PlannerRoute } from "@/lib/trip-planner";

if (typeof window !== "undefined") {
  setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl-worker.mjs");
}

const OSM_RASTER_FALLBACK: StyleSpecification = {
  version: 8,
  sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const ROUTES_SOURCE = "trip-routes";
const ROUTES_LINE = "trip-routes-line";
const ROUTES_HIT = "trip-routes-hit";
const LEGS_SOURCE = "trip-legs";
const LEGS_LINE = "trip-legs-line";
const LEGS_ROAD_LINE = "trip-legs-road-line";
const CLOSURES_SOURCE = "trip-closures";
const CLOSURES_LINE = "trip-closures-line";
const UNSELECTED_COLOR = "#8a93a3";

export interface TripMapStop {
  routeId: string;
  order: number;
  color: string;
  entry: LatLng;
}

interface Handlers {
  routes: Map<string, PlannerRoute>;
  orders: Map<string, number>;
  picking: boolean;
  toggleRoute: (routeId: string) => void;
  pickOrigin: (point: LatLng) => void;
}

function card(route: PlannerRoute, order: number, action?: () => void): HTMLElement {
  const el = document.createElement("div");
  el.className = "herepath-pin-card";
  const type = document.createElement("div");
  type.className = "herepath-pin-card-type";
  type.textContent = order > 0 ? `Route · stop ${order} of your trip` : "Route";
  const title = document.createElement("div");
  title.className = "herepath-pin-card-title";
  title.textContent = route.name;
  const list = document.createElement("dl");
  list.className = "herepath-pin-card-rows";
  const rows: [string, string][] = [
    ["Distance", `${route.distanceMiles} miles`],
    ["Difficulty", `${route.difficulty} of 5 · ${DIFFICULTY_LABELS[Math.min(5, Math.max(1, route.difficulty)) - 1]}`],
  ];
  if (route.startLabel) rows.push(["Start", route.startLabel]);
  if (route.endLabel) rows.push(["Finish", route.endLabel]);
  for (const [label, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.append(dt, dd);
  }
  el.append(type, title, list);

  const note = document.createElement("div");
  note.className = "herepath-pin-card-source";
  note.style.marginTop = "6px";
  note.textContent = order > 0 ? "Click to take it out of your trip" : "Click to add it to your trip";
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "herepath-pin-card-open";
    button.textContent = order > 0 ? "Take out of trip" : "Add to trip";
    button.addEventListener("click", action);
    el.appendChild(button);
  } else {
    el.appendChild(note);
  }
  return el;
}

const boundMaps = new WeakSet<MaplibreMap>();

/** Hover for details with a mouse, a click to add or remove a route; on a touch screen a tap shows the details with a button. */
function bindEvents(map: MaplibreMap, ref: { current: Handlers }) {
  if (boundMaps.has(map)) return;
  boundMaps.add(map);

  const canHover = window.matchMedia("(hover: hover)").matches;
  const popup = new Popup({ offset: 10, closeButton: false, closeOnClick: false, maxWidth: "260px", focusAfterOpen: false, className: "herepath-popup" });
  const canvas = map.getCanvas();

  const show = (feature: MapGeoJSONFeature, interactive: boolean, lngLat: { lng: number; lat: number }) => {
    const { routes, orders } = ref.current;
    const id = String(feature.properties?.id);
    const route = routes.get(id);
    if (!route) return;
    const action = interactive
      ? () => {
          ref.current.toggleRoute(id);
          popup.remove();
        }
      : undefined;
    popup.setLngLat(lngLat).setDOMContent(card(route, orders.get(id) ?? 0, action)).addTo(map);
    popup.getElement()?.classList.toggle("herepath-popup-hover", !interactive);
  };

  map.on("mouseenter", ROUTES_HIT, (event) => {
    if (ref.current.picking) return;
    canvas.style.cursor = "pointer";
    if (canHover && event.features?.[0]) show(event.features[0], false, event.lngLat);
  });
  map.on("mousemove", ROUTES_HIT, (event) => {
    if (canHover && !ref.current.picking && event.features?.[0]) show(event.features[0], false, event.lngLat);
  });
  map.on("mouseleave", ROUTES_HIT, () => {
    canvas.style.cursor = ref.current.picking ? "crosshair" : "";
    if (canHover) popup.remove();
  });
  map.on("click", ROUTES_HIT, (event) => {
    if (ref.current.picking) return;
    const feature = event.features?.[0];
    if (!feature) return;
    if (canHover) {
      ref.current.toggleRoute(String(feature.properties?.id));
      popup.remove();
    } else {
      show(feature, true, event.lngLat);
    }
  });
  map.on("click", (event) => {
    if (ref.current.picking) {
      ref.current.pickOrigin({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      return;
    }
    if (!map.getLayer(ROUTES_HIT) || map.queryRenderedFeatures(event.point, { layers: [ROUTES_HIT] }).length === 0) popup.remove();
  });
}

function addLayers(map: MaplibreMap, routes: GeoJSON.FeatureCollection, legs: GeoJSON.FeatureCollection, closures: GeoJSON.FeatureCollection) {
  map.addSource(ROUTES_SOURCE, { type: "geojson", data: routes });
  // Closed roads get a wide red band under the route lines, so a route running along one shows red on either side of it.
  map.addSource(CLOSURES_SOURCE, { type: "geojson", data: closures });
  map.addLayer({
    id: CLOSURES_LINE,
    type: "line",
    source: CLOSURES_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#e5484d", "line-width": 11, "line-opacity": 0.75 },
  });
  map.addLayer({
    id: ROUTES_LINE,
    type: "line",
    source: ROUTES_SOURCE,
    layout: { "line-cap": "round", "line-join": "round", "line-sort-key": ["get", "order"] },
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["case", [">", ["get", "order"], 0], 5, 3],
      "line-opacity": ["case", [">", ["get", "order"], 0], 1, 0.75],
    },
  });
  // A wide, almost invisible copy on top so a thin line is easy to hit with a finger or mouse.
  map.addLayer({ id: ROUTES_HIT, type: "line", source: ROUTES_SOURCE, paint: { "line-color": "#000000", "line-width": 16, "line-opacity": 0.01 } });

  map.addSource(LEGS_SOURCE, { type: "geojson", data: legs });
  // Estimates (a straight line between two points) are dashed; a real road route is solid.
  map.addLayer({
    id: LEGS_LINE,
    type: "line",
    source: LEGS_SOURCE,
    filter: ["==", ["get", "road"], false],
    layout: { "line-cap": "butt" },
    paint: { "line-color": "#e8a13a", "line-width": 3, "line-dasharray": [2, 2] },
  });
  map.addLayer({
    id: LEGS_ROAD_LINE,
    type: "line",
    source: LEGS_SOURCE,
    filter: ["==", ["get", "road"], true],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#e8a13a", "line-width": 4 },
  });
}

/**
 * The trip planner's map: every published route as a line, the ones in the rider's trip picked out in colour and numbered, dashed
 * amber lines for the stretches joining them (solid where a road route was found, dashed where it is an estimate), and the rider's start point. Hover a route for details; click it to add or remove it.
 */
export function TripMap({
  routes,
  stops,
  legs,
  closures,
  origin,
  picking,
  fitKey,
  placesState,
  onToggleRoute,
  onPickOrigin,
}: {
  routes: PlannerRoute[];
  stops: TripMapStop[];
  legs: LinkLeg[];
  /** Closed stretches of road to draw in red, as [lng, lat] lines. */
  closures: { id: string; lines: [number, number][][] }[];
  origin: LatLng | null;
  picking: boolean;
  /** Changes when the map should zoom to fit the trip (or every route, when the trip is empty). */
  fitKey: number;
  placesState: PlacesState;
  onToggleRoute: (routeId: string) => void;
  onPickOrigin: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const appliedStyleRef = useRef<MapStyleId>("streets");
  const markersRef = useRef<Marker[]>([]);
  const lastFitRef = useRef<number | null>(null);
  const placesRef = useRef(placesState.places);

  const handlersRef = useRef<Handlers>({ routes: new Map(), orders: new Map(), picking: false, toggleRoute: onToggleRoute, pickOrigin: onPickOrigin });
  useEffect(() => {
    handlersRef.current = {
      routes: new Map(routes.map((r) => [r.id, r])),
      orders: new Map(stops.map((s) => [s.routeId, s.order])),
      picking,
      toggleRoute: onToggleRoute,
      pickOrigin: onPickOrigin,
    };
  }, [routes, stops, picking, onToggleRoute, onPickOrigin]);

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

  const buildData = useCallback(() => {
    const colorById = new Map(stops.map((s) => [s.routeId, s.color]));
    const orderById = new Map(stops.map((s) => [s.routeId, s.order]));
    const routeFeatures: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: routes.map((r) => ({
        type: "Feature",
        properties: { id: r.id, order: orderById.get(r.id) ?? 0, color: colorById.get(r.id) ?? UNSELECTED_COLOR },
        geometry: { type: "LineString", coordinates: r.line },
      })),
    };
    const legFeatures: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: legs.map((l) => ({
        type: "Feature",
        properties: { road: l.road },
        geometry: { type: "LineString", coordinates: l.line ?? [[l.from.lng, l.from.lat], [l.to.lng, l.to.lat]] },
      })),
    };
    const closureFeatures: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: closures.map((c) => ({ type: "Feature", properties: { id: c.id }, geometry: { type: "MultiLineString", coordinates: c.lines } })),
    };
    return { routeFeatures, legFeatures, closureFeatures };
  }, [routes, stops, legs, closures]);

  const draw = useCallback(
    (target: MaplibreMap) => {
      const { routeFeatures, legFeatures, closureFeatures } = buildData();
      const routesSource = target.getSource(ROUTES_SOURCE) as GeoJSONSource | undefined;
      if (routesSource) {
        routesSource.setData(routeFeatures);
        (target.getSource(LEGS_SOURCE) as GeoJSONSource | undefined)?.setData(legFeatures);
        (target.getSource(CLOSURES_SOURCE) as GeoJSONSource | undefined)?.setData(closureFeatures);
      } else {
        addLayers(target, routeFeatures, legFeatures, closureFeatures);
      }
      bindEvents(target, handlersRef);
    },
    [buildData],
  );

  // Draw whenever the trip changes. isStyleLoaded() is also false while tiles arrive, so just try, and try again once the style is ready.
  useEffect(() => {
    if (!map) return;
    try {
      draw(map);
    } catch {
      map.once("style.load", () => draw(map));
    }
  }, [map, draw]);

  // Zoom to the trip (or to every route) when asked to, and once at the start.
  useEffect(() => {
    if (!map || lastFitRef.current === fitKey) return;
    const coordinates = (stops.length > 0 ? routes.filter((r) => stops.some((s) => s.routeId === r.id)) : routes).flatMap((r) => r.line);
    const points = origin ? [...coordinates, [origin.lng, origin.lat] as [number, number]] : coordinates;
    if (points.length === 0) return;
    lastFitRef.current = fitKey;
    const bounds = points.reduce((b, c) => b.extend(c as [number, number]), new LngLatBounds(points[0] as [number, number], points[0] as [number, number]));
    map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: lastFitRef.current === 0 ? 0 : 600 });
  }, [map, fitKey, routes, stops, origin]);

  // Numbered markers where each route in the trip begins, and the start point.
  useEffect(() => {
    if (!map) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    const make = (label: string, color: string, point: LatLng) => {
      const el = document.createElement("div");
      el.textContent = label;
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = `width:24px;height:24px;border-radius:50%;background:${color};color:#0e0f12;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:600 12px sans-serif;pointer-events:none`;
      markersRef.current.push(new Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map));
    };
    for (const stop of stops) make(String(stop.order), stop.color, stop.entry);
    if (origin) make("S", "#f5f7fa", origin);
    return () => {
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
    };
  }, [map, stops, origin]);

  useEffect(() => {
    if (map) map.getCanvas().style.cursor = picking ? "crosshair" : "";
  }, [map, picking]);

  // Fuel, food and stay pins along the trip's routes.
  useEffect(() => {
    placesRef.current = placesState.places;
    if (!map) return;
    const apply = () => syncPlacesLayers(map, placesState.places);
    try {
      apply();
    } catch {
      map.once("style.load", apply);
    }
  }, [map, placesState.places]);

  // Changing the map type wipes everything drawn on it, so put it all back once the new style is ready.
  useApplyMapStyle(map, appliedStyleRef, () => {
    if (!map) return;
    draw(map);
    syncPlacesLayers(map, placesRef.current);
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div ref={containerRef} className="h-[55vh] min-h-72 w-full rounded-lg lg:h-[calc(100vh-15rem)]" />
        <MapStyleSwitcher />
        {picking && (
          <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-3">
            <p className="rounded-lg bg-surface/95 px-3 py-1.5 text-[13px] text-text-primary shadow-md">Tap the map to set your start point</p>
          </div>
        )}
      </div>
      <PlacesControls state={placesState} />
    </div>
  );
}
