import type { GeoPoint } from "@/db/schema/routes";

const MAX_GOOGLE_WAYPOINTS = 8;
const POINTS_PER_STAGE = MAX_GOOGLE_WAYPOINTS + 2; // origin + up to 8 waypoints + destination
const MAX_STAGES = 6;

function sampleRawPoints(coordinates: [number, number][], count: number): [number, number][] {
  if (coordinates.length <= count) return coordinates;
  const step = (coordinates.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => coordinates[Math.round(i * step)]);
}

function toGeoPoints(coordinates: [number, number][]): GeoPoint[] {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Builds a Google Maps directions link. Google's api=1 URL scheme accepts a
 * limited number of waypoints, so for a short route we sample points along
 * the key bends rather than every trackpoint, keeping the intended road.
 */
export function buildGoogleMapsUrl(geometry: GeoJSON.LineString): string {
  const points = toGeoPoints(sampleRawPoints(geometry.coordinates as [number, number][], POINTS_PER_STAGE));
  const [start, ...rest] = points;
  const end = rest.pop();
  if (!start || !end) return "";

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${start.lat},${start.lng}`);
  url.searchParams.set("destination", `${end.lat},${end.lng}`);
  if (rest.length > 0) {
    url.searchParams.set("waypoints", rest.map((p) => `${p.lat},${p.lng}`).join("|"));
  }
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

/**
 * Builds an Apple Maps directions link. Apple's web link scheme only
 * reliably supports a start and end point (saddr/daddr) — no intermediate
 * waypoints — so the route may differ slightly from the GPX on tighter roads.
 */
export function buildAppleMapsUrl(geometry: GeoJSON.LineString): string {
  const coords = geometry.coordinates as [number, number][];
  const [startLng, startLat] = coords[0];
  const [endLng, endLat] = coords[coords.length - 1];

  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("saddr", `${startLat},${startLng}`);
  url.searchParams.set("daddr", `${endLat},${endLng}`);
  url.searchParams.set("dirflg", "d");
  return url.toString();
}

export interface MapStage {
  index: number;
  total: number;
  googleUrl: string;
  appleUrl: string;
}

/**
 * Splits a long ride into map-app-sized stages (Section 5.5): each stage's
 * link stays within Google's waypoint budget, with stages overlapping by one
 * point so the join is continuous. Day rides and tours use this instead of a
 * single link; short routes fit in one call to buildGoogleMapsUrl/AppleMapsUrl.
 */
export function buildStagedMapLinks(geometry: GeoJSON.LineString): MapStage[] {
  const raw = geometry.coordinates as [number, number][];
  const maxTotalPoints = POINTS_PER_STAGE * MAX_STAGES - (MAX_STAGES - 1); // account for 1-point overlaps
  const keyPoints = raw.length > maxTotalPoints ? sampleRawPoints(raw, maxTotalPoints) : raw;

  const chunks: [number, number][][] = [];
  let i = 0;
  while (i < keyPoints.length - 1) {
    const end = Math.min(i + POINTS_PER_STAGE - 1, keyPoints.length - 1);
    chunks.push(keyPoints.slice(i, end + 1));
    i = end;
  }
  if (chunks.length === 0) chunks.push(keyPoints);

  return chunks.map((chunk, idx) => {
    const lineString: GeoJSON.LineString = { type: "LineString", coordinates: chunk };
    return {
      index: idx + 1,
      total: chunks.length,
      googleUrl: buildGoogleMapsUrl(lineString),
      appleUrl: buildAppleMapsUrl(lineString),
    };
  });
}
