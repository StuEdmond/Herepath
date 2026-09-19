import { Popup, type GeoJSONSource, type Map as MaplibreMap, type MapGeoJSONFeature } from "maplibre-gl";
import { PLACE_KINDS, type AlongPlace } from "@/lib/place-kinds";
import { buildPlaceCard } from "./place-card";

const SOURCE = "along-places";
const CLUSTERS = "along-places-clusters";
const CLUSTER_COUNT = "along-places-cluster-count";
const POINTS = "along-places-points";

interface MapState {
  popup: Popup;
  pinned: boolean;
}
const stateByMap = new WeakMap<MaplibreMap, MapState>();

function toFeatureCollection(places: AlongPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      properties: {
        id: place.id,
        kind: place.kind,
        name: place.name,
        label: place.label,
        note: place.note ?? null,
        source: place.source,
        sponsored: place.sponsored,
        website: place.website ?? null,
      },
    })),
  };
}

/** The font a style already uses for its own labels, so the cluster counts can use one it actually has. */
function styleFont(map: MaplibreMap): string[] | null {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== "symbol") continue;
    const font = layer.layout?.["text-font"];
    if (Array.isArray(font) && font.length > 0 && font.every((f) => typeof f === "string")) return font as string[];
  }
  return null;
}

function addLayers(map: MaplibreMap, data: GeoJSON.FeatureCollection) {
  map.addSource(SOURCE, { type: "geojson", data, cluster: true, clusterMaxZoom: 11, clusterRadius: 40 });

  map.addLayer({
    id: CLUSTERS,
    type: "circle",
    source: SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#5b6577",
      "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 50, 22],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  // Counts need the style's map fonts; the plain fallback map has none, so it just shows the circles.
  const font = map.getStyle().glyphs ? styleFont(map) : null;
  if (font) {
    map.addLayer({
      id: CLUSTER_COUNT,
      type: "symbol",
      source: SOURCE,
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": font, "text-size": 12 },
      paint: { "text-color": "#ffffff" },
    });
  }

  const colorByKind: unknown[] = ["match", ["get", "kind"]];
  for (const kind of PLACE_KINDS) colorByKind.push(kind.id, kind.color);
  colorByKind.push("#888888");

  map.addLayer({
    id: POINTS,
    type: "circle",
    source: SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": colorByKind as never,
      "circle-radius": ["case", ["==", ["get", "sponsored"], true], 9, 7],
      "circle-stroke-width": 2,
      // A green ring marks a sponsored place; the card says "Sponsored" too.
      "circle-stroke-color": ["case", ["==", ["get", "sponsored"], true], "#4fae82", "#ffffff"],
    },
  });
}

function showCard(map: MaplibreMap, state: MapState, feature: MapGeoJSONFeature, pinned: boolean) {
  const props = feature.properties as Record<string, unknown>;
  const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
  const card = buildPlaceCard(
    {
      name: String(props.name),
      label: String(props.label),
      note: props.note ? String(props.note) : undefined,
      source: props.source === "osm" ? "osm" : "herepath",
      sponsored: props.sponsored === true,
      website: props.website ? String(props.website) : undefined,
    },
    pinned,
  );
  state.pinned = pinned;
  state.popup.setLngLat(coordinates).setDOMContent(card).addTo(map);
  // A hover card ignores the mouse so it can never flicker over the pin; a pinned one is clickable. Set on the
  // element itself, since adding the popup to the map again builds it fresh.
  state.popup.getElement()?.classList.toggle("herepath-popup-hover", !pinned);
}

/** Hover shows a card with a mouse; a click (or tap) pins it open with a website link; clicking a cluster zooms in. */
function bindEvents(map: MaplibreMap) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const popup = new Popup({ offset: 12, closeButton: false, closeOnClick: false, maxWidth: "260px", focusAfterOpen: false, className: "herepath-popup" });
  const state: MapState = { popup, pinned: false };
  stateByMap.set(map, state);
  popup.on("close", () => {
    state.pinned = false;
  });

  const canvas = map.getCanvas();
  for (const layer of [POINTS, CLUSTERS]) {
    map.on("mouseenter", layer, () => {
      canvas.style.cursor = "pointer";
    });
    map.on("mouseleave", layer, () => {
      canvas.style.cursor = "";
    });
  }

  map.on("mouseenter", POINTS, (event) => {
    if (canHover && !state.pinned && event.features?.[0]) showCard(map, state, event.features[0], false);
  });
  map.on("mouseleave", POINTS, () => {
    if (!state.pinned) popup.remove();
  });
  map.on("click", POINTS, (event) => {
    if (event.features?.[0]) showCard(map, state, event.features[0], true);
  });

  map.on("click", CLUSTERS, async (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    const zoom = await source?.getClusterExpansionZoom(Number(feature.properties?.cluster_id));
    if (zoom != null) map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
  });

  // Clicking empty map closes a pinned card. (The popup's own close-on-click would also close it straight after opening.)
  map.on("click", (event) => {
    if (!map.getLayer(POINTS) || !map.getLayer(CLUSTERS)) return;
    if (map.queryRenderedFeatures(event.point, { layers: [POINTS, CLUSTERS] }).length === 0) popup.remove();
  });
}

/**
 * Puts the given places on the map (adding the layers the first time, and again after a change of map type wipes them),
 * or updates the ones already there. Safe to call with an empty list.
 */
export function syncPlacesLayers(map: MaplibreMap, places: AlongPlace[]) {
  const data = toFeatureCollection(places);
  const existing = map.getSource(SOURCE) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  if (places.length === 0) return;

  addLayers(map, data);
  if (!stateByMap.has(map)) bindEvents(map);
}
