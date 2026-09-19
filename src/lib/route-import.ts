import { haversineMiles, type LatLng } from "./geo";
import { lineDistanceMiles } from "./gpx";
import type { RouteLicence } from "./route-sources";

/** What the bulk importer sends the server: one batch of details about where the files came from, and one row per route. */
export interface ImportBatch {
  sourceName: string;
  sourceUrl: string;
  sourceAuthor: string;
  licence: RouteLicence;
  /** The admin has confirmed they have the right to publish these files. */
  declaration: boolean;
}

export interface ImportRow {
  name: string;
  regionId: string;
  coordinates: [number, number][];
  difficulty: number;
  surface: "good" | "mixed" | "poor";
  ridingTimeMinutes: number;
  startLabel: string;
  endLabel: string;
}

export type ImportResult =
  | { ok: true; created: { id: string; name: string }[]; skipped: { name: string; reason: string }[] }
  | { ok: false; error: string };

/** A route already on the site, as much as is needed to spot the same road being imported twice. */
export interface ExistingRouteSummary {
  name: string;
  start: LatLng | null;
  end: LatLng | null;
  distanceMiles: number;
}

/**
 * The summary of a stored route. Its length is taken from its track, not the distance typed into the form, because the two can differ
 * and a repeat is the same road, not the same typed number.
 */
export function summariseExistingRoute(route: {
  name: string;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  geometry: unknown;
  distanceMiles: string;
}): ExistingRouteSummary {
  const line = route.geometry as GeoJSON.LineString | null;
  const coordinates = line?.type === "LineString" && Array.isArray(line.coordinates) && line.coordinates.length >= 2 ? (line.coordinates as [number, number][]) : null;
  // The track's own ends and length are used when there's a track, since the typed start and finish points and distance can sit a little off it.
  return {
    name: route.name,
    start: coordinates ? { lat: coordinates[0][1], lng: coordinates[0][0] } : route.startPoint ? { lat: route.startPoint.lat, lng: route.startPoint.lng } : null,
    end: coordinates
      ? { lat: coordinates[coordinates.length - 1][1], lng: coordinates[coordinates.length - 1][0] }
      : route.endPoint
        ? { lat: route.endPoint.lat, lng: route.endPoint.lng }
        : null,
    distanceMiles: coordinates ? lineDistanceMiles(coordinates) : Number(route.distanceMiles),
  };
}

const SAME_PLACE_MILES = 0.2;
const SAME_LENGTH = 0.05;

/**
 * The existing route this looks like, if any: it starts and finishes in the same places (in either direction) and is about the same
 * length. Catches a road imported twice, or one that's already on the site.
 */
export function findLikelyDuplicate(coordinates: [number, number][], existing: ExistingRouteSummary[]): ExistingRouteSummary | null {
  if (coordinates.length < 2) return null;
  const start = { lat: coordinates[0][1], lng: coordinates[0][0] };
  const end = { lat: coordinates[coordinates.length - 1][1], lng: coordinates[coordinates.length - 1][0] };
  const miles = lineDistanceMiles(coordinates);

  for (const route of existing) {
    if (!route.start || !route.end) continue;
    const sameWay = haversineMiles(start, route.start) <= SAME_PLACE_MILES && haversineMiles(end, route.end) <= SAME_PLACE_MILES;
    const reversed = haversineMiles(start, route.end) <= SAME_PLACE_MILES && haversineMiles(end, route.start) <= SAME_PLACE_MILES;
    const similarLength = Math.abs(miles - route.distanceMiles) <= Math.max(0.3, route.distanceMiles * SAME_LENGTH);
    if ((sameWay || reversed) && similarLength) return route;
  }
  return null;
}

/** A first guess at riding time for a route with no timestamps: distance at a steady 35 mph. The admin can change it. */
export function estimateRidingMinutes(miles: number): number {
  return Math.max(5, Math.round(((miles / 35) * 60) / 5) * 5);
}
