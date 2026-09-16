import { XMLParser } from "fast-xml-parser";
import type { GeoPoint } from "@/db/schema/routes";

export interface ParsedGpx {
  geometry: GeoJSON.LineString;
  distanceMiles: number;
  startPoint: GeoPoint;
  endPoint: GeoPoint;
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

/** Parses GPX XML text into a GeoJSON LineString, total distance, and start/end points. */
export function parseGpx(xml: string): ParsedGpx {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const gpx = doc.gpx;
  if (!gpx) throw new Error("Not a valid GPX file: missing <gpx> root element.");

  const points: [number, number][] = [];

  const collectFromSegments = (segments: unknown) => {
    const segList = Array.isArray(segments) ? segments : [segments];
    for (const seg of segList) {
      const trkpts = seg?.trkpt;
      if (!trkpts) continue;
      const trkptList = Array.isArray(trkpts) ? trkpts : [trkpts];
      for (const pt of trkptList) {
        const lat = parseFloat(pt["@_lat"]);
        const lng = parseFloat(pt["@_lon"]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lng, lat]);
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
        if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lng, lat]);
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

  return {
    geometry: { type: "LineString", coordinates: points },
    distanceMiles: Math.round((totalMetres / METRES_PER_MILE) * 10) / 10,
    startPoint: { lat: startLat, lng: startLng },
    endPoint: { lat: endLat, lng: endLng },
  };
}

export interface GpxWaypoint {
  lat: number;
  lng: number;
  name: string;
}

/** Builds a downloadable GPX 1.1 file from a track line and optional named waypoints. */
export function generateGpx(options: {
  name: string;
  geometry: GeoJSON.LineString;
  waypoints?: GpxWaypoint[];
}): string {
  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const trkpts = options.geometry.coordinates
    .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("\n");

  const wpts = (options.waypoints ?? [])
    .map((w) => `  <wpt lat="${w.lat}" lon="${w.lng}"><name>${escapeXml(w.name)}</name></wpt>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Herepath" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(options.name)}</name></metadata>
${wpts}
  <trk>
    <name>${escapeXml(options.name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}
