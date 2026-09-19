import { XMLParser } from "fast-xml-parser";
import type { GeoPoint } from "@/db/schema/routes";

export interface ParsedGpx {
  geometry: GeoJSON.LineString;
  distanceMiles: number;
  startPoint: GeoPoint;
  endPoint: GeoPoint;
  /** The ride's name from the file, when the app that made it saved one. */
  name?: string;
  /** When the recording started and finished (ISO 8601, from the first and last timestamped points), when the file has them. */
  startTime?: string;
  endTime?: string;
}

/** A name, or a timestamp, as text — the XML parser can hand back numbers or objects for odd files. */
function asText(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function asValidTime(value: unknown): string | undefined {
  const text = asText(value);
  return text && Number.isFinite(Date.parse(text)) ? text : undefined;
}

const METRES_PER_MILE = 1609.344;
const EARTH_RADIUS_METRES = 6371000;

function haversineMetres(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

/** Length of a line in miles, adding up the straight stretches between its points. */
export function lineDistanceMiles(coordinates: [number, number][]): number {
  let metres = 0;
  for (let i = 1; i < coordinates.length; i++) metres += haversineMetres(coordinates[i - 1], coordinates[i]);
  return Math.round((metres / METRES_PER_MILE) * 10) / 10;
}

export interface GpxTrack {
  /** The track's own name, when the file gives one. */
  name?: string;
  coordinates: [number, number][];
  /** How long the recording took, in minutes, when its points carry timestamps. */
  durationMinutes?: number;
}

function pointsFrom(list: unknown, note: (time: unknown) => void): [number, number][] {
  const out: [number, number][] = [];
  for (const pt of Array.isArray(list) ? list : list ? [list] : []) {
    const lat = parseFloat(pt["@_lat"]);
    const lng = parseFloat(pt["@_lon"]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      out.push([lng, lat]);
      note(pt.time);
    }
  }
  return out;
}

/**
 * Every separate track (and planned route) in a GPX file, each as its own line. A file that collects many roads gives many results,
 * where parseGpx would join them into one. Tracks with fewer than two points are left out.
 */
export function parseGpxTracks(xml: string): GpxTrack[] {
  const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" }).parse(xml);
  const gpx = doc.gpx;
  if (!gpx) throw new Error("Not a valid GPX file: missing <gpx> root element.");

  const asList = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value : value ? [value as Record<string, unknown>] : []);
  const result: GpxTrack[] = [];

  for (const trk of asList(gpx.trk)) {
    let first: number | undefined;
    let last: number | undefined;
    const note = (value: unknown) => {
      const time = asValidTime(value);
      if (!time) return;
      const ms = Date.parse(time);
      first ??= ms;
      last = ms;
    };
    const coordinates = asList(trk.trkseg).flatMap((seg) => pointsFrom(seg.trkpt, note));
    if (coordinates.length >= 2) {
      result.push({ name: asText(trk.name), coordinates, durationMinutes: first !== undefined && last !== undefined && last > first ? Math.round((last - first) / 60000) : undefined });
    }
  }

  // Planned routes (<rte>) only count when the file has no recorded tracks.
  if (result.length === 0) {
    for (const rte of asList(gpx.rte)) {
      const coordinates = pointsFrom(rte.rtept, () => {});
      if (coordinates.length >= 2) result.push({ name: asText(rte.name), coordinates });
    }
  }

  if (result.length === 0) throw new Error("No track or route points found in this GPX file.");
  return result;
}

/** Parses GPX XML text into a GeoJSON LineString, total distance, and start/end points. */
export function parseGpx(xml: string): ParsedGpx {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const gpx = doc.gpx;
  if (!gpx) throw new Error("Not a valid GPX file: missing <gpx> root element.");

  const points: [number, number][] = [];
  let startTime: string | undefined;
  let endTime: string | undefined;
  const noteTime = (value: unknown) => {
    const time = asValidTime(value);
    if (!time) return;
    startTime ??= time;
    endTime = time;
  };

  const collectFromSegments = (segments: unknown) => {
    const segList = Array.isArray(segments) ? segments : [segments];
    for (const seg of segList) {
      const trkpts = seg?.trkpt;
      if (!trkpts) continue;
      const trkptList = Array.isArray(trkpts) ? trkpts : [trkpts];
      for (const pt of trkptList) {
        const lat = parseFloat(pt["@_lat"]);
        const lng = parseFloat(pt["@_lon"]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          points.push([lng, lat]);
          noteTime(pt.time);
        }
      }
    }
  };

  const tracks = gpx.trk ? (Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk]) : [];
  for (const trk of tracks) {
    if (trk.trkseg) collectFromSegments(trk.trkseg);
  }

  // Fall back to a route (<rte>) if the file has no track.
  if (points.length === 0 && gpx.rte) {
    const routes = Array.isArray(gpx.rte) ? gpx.rte : [gpx.rte];
    for (const rte of routes) {
      const rtepts = rte.rtept;
      if (!rtepts) continue;
      const rteptList = Array.isArray(rtepts) ? rtepts : [rtepts];
      for (const pt of rteptList) {
        const lat = parseFloat(pt["@_lat"]);
        const lng = parseFloat(pt["@_lon"]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          points.push([lng, lat]);
          noteTime(pt.time);
        }
      }
    }
  }

  if (points.length < 2) {
    throw new Error("No track or route points found in this GPX file.");
  }

  let totalMetres = 0;
  for (let i = 1; i < points.length; i++) {
    totalMetres += haversineMetres(points[i - 1], points[i]);
  }

  const [startLng, startLat] = points[0];
  const [endLng, endLat] = points[points.length - 1];

  const firstTrack = tracks[0];
  const firstRoute = gpx.rte ? (Array.isArray(gpx.rte) ? gpx.rte[0] : gpx.rte) : undefined;
  const name = asText(gpx.metadata?.name) ?? asText(firstTrack?.name) ?? asText(firstRoute?.name);

  return {
    geometry: { type: "LineString", coordinates: points },
    distanceMiles: Math.round((totalMetres / METRES_PER_MILE) * 10) / 10,
    startPoint: { lat: startLat, lng: startLng },
    endPoint: { lat: endLat, lng: endLng },
    name,
    startTime,
    endTime,
  };
}

const METRES_PER_DEGREE = 111320;

/**
 * Thins a recorded track that has far more points than it needs (a phone can log one every second, so a long ride runs to tens of
 * thousands), keeping its shape to within a few metres. Uses the Ramer–Douglas–Peucker method, widening the tolerance until the
 * track is small enough. Short tracks come back untouched.
 */
export function simplifyTrack(coords: [number, number][], maxPoints = 3000): [number, number][] {
  if (coords.length <= maxPoints) return coords;

  // Flat-earth maths around the middle of the track is plenty accurate for a single ride.
  const midLat = coords[Math.floor(coords.length / 2)][1];
  const kx = Math.cos((midLat * Math.PI) / 180) * METRES_PER_DEGREE;
  const xy = coords.map(([lng, lat]) => [lng * kx, lat * METRES_PER_DEGREE] as const);

  const distanceToSegment = (p: readonly [number, number], a: readonly [number, number], b: readonly [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };

  const thin = (tolerance: number): [number, number][] => {
    const keep = new Uint8Array(coords.length);
    keep[0] = 1;
    keep[coords.length - 1] = 1;
    const stack: [number, number][] = [[0, coords.length - 1]];
    while (stack.length > 0) {
      const [start, end] = stack.pop()!;
      let farthest = -1;
      let farthestDistance = tolerance;
      for (let i = start + 1; i < end; i++) {
        const d = distanceToSegment(xy[i], xy[start], xy[end]);
        if (d > farthestDistance) {
          farthest = i;
          farthestDistance = d;
        }
      }
      if (farthest !== -1) {
        keep[farthest] = 1;
        stack.push([start, farthest], [farthest, end]);
      }
    }
    return coords.filter((_, i) => keep[i] === 1);
  };

  let tolerance = 2;
  let thinned = coords;
  for (let attempt = 0; attempt < 12 && thinned.length > maxPoints; attempt++) {
    thinned = thin(tolerance);
    tolerance *= 2;
  }
  // A track that still won't fit (extremely unlikely) is cut down evenly instead.
  if (thinned.length > maxPoints) {
    const step = (thinned.length - 1) / (maxPoints - 1);
    thinned = Array.from({ length: maxPoints }, (_, i) => thinned[Math.round(i * step)]);
  }
  return thinned;
}

export interface GpxWaypoint {
  lat: number;
  lng: number;
  name: string;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trackBlock(name: string, geometry: GeoJSON.LineString): string {
  const trkpts = geometry.coordinates.map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`).join("\n");
  return `  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>`;
}

/** Builds a downloadable GPX 1.1 file from a track line and optional named waypoints. */
export function generateGpx(options: { name: string; geometry: GeoJSON.LineString; waypoints?: GpxWaypoint[] }): string {
  return generateMultiTrackGpx({ name: options.name, tracks: [{ name: options.name, geometry: options.geometry }], waypoints: options.waypoints });
}

/** Builds a downloadable GPX 1.1 file with one track per day — used for whole-tour downloads. */
export function generateMultiTrackGpx(options: {
  name: string;
  tracks: { name: string; geometry: GeoJSON.LineString }[];
  waypoints?: GpxWaypoint[];
}): string {
  const wpts = (options.waypoints ?? [])
    .map((w) => `  <wpt lat="${w.lat}" lon="${w.lng}"><name>${escapeXml(w.name)}</name></wpt>`)
    .join("\n");
  const tracks = options.tracks.map((t) => trackBlock(t.name, t.geometry)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Herepath" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(options.name)}</name></metadata>
${wpts}
${tracks}
</gpx>
`;
}
