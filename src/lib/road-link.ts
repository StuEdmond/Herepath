import type { LatLng } from "./geo";

/**
 * What the planner needs to know about a road route between two points. Shared by the server (which fetches it) and the browser
 * (which asks for it and draws it).
 */
export interface RoadLink {
  miles: number;
  minutes: number;
  /** The road as [lng, lat] points. */
  line: [number, number][];
}

/** The answer of `/api/route`. */
export interface RoadLinkResponse extends RoadLink {
  /** Credit the routing service asks to be shown beside its routes. */
  attribution: string;
}

/** Stretches shorter than this aren't worth routing: they're the same place. */
export const MIN_LINK_MILES = 0.1;
/** The longest straight-line gap we'll route, so the service can't be used to plan across the country or the world. */
export const MAX_LINK_STRAIGHT_MILES = 300;

/** Roughly Great Britain and Northern Ireland, with the seas around them. */
const UK_BOUNDS = { south: 49.8, north: 60.95, west: -8.7, east: 1.95 };

export function inUk(point: LatLng): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= UK_BOUNDS.south &&
    point.lat <= UK_BOUNDS.north &&
    point.lng >= UK_BOUNDS.west &&
    point.lng <= UK_BOUNDS.east
  );
}

/** A stable name for a stretch, to 4 decimal places (about 10 metres). Used as the key for cached answers, in the browser and on the server. */
export function linkKey(from: LatLng, to: LatLng): string {
  return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}>${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
}

/** Reads a "lat,lng" query value. */
export function parsePoint(value: string | null): LatLng | null {
  const parts = (value ?? "").split(",").map(Number);
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  const point = { lat: parts[0], lng: parts[1] };
  return inUk(point) ? point : null;
}
