import type { GeoPoint } from "@/db/schema/routes";

const MAX_GOOGLE_WAYPOINTS = 8;

function samplePoints(coordinates: [number, number][], count: number): GeoPoint[] {
  if (coordinates.length <= count) {
    return coordinates.map(([lng, lat]) => ({ lat, lng }));
  }
  const step = (coordinates.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const [lng, lat] = coordinates[Math.round(i * step)];
    return { lat, lng };
  });
}

/**
 * Builds a Google Maps directions link. Google's api=1 URL scheme accepts a
 * limited number of waypoints, so for a short route we sample points along
 * the key bends rather than every trackpoint, keeping the intended road.
 */
export function buildGoogleMapsUrl(geometry: GeoJSON.LineString): string {
  const points = samplePoints(geometry.coordinates as [number, number][], MAX_GOOGLE_WAYPOINTS + 2);
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
