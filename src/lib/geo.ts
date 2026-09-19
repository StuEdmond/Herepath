const EARTH_RADIUS_MILES = 3958.8;

export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Shortest distance in metres from a point to a line, measuring to the stretches between vertices, not just the vertices. */
export function distanceToLineMetres(coords: [number, number][], point: LatLng): number {
  if (coords.length === 0) return Infinity;
  // Flat-earth maths around the point is accurate to well under a metre at the few-kilometre scales used here.
  const metresPerDegLat = 111320;
  const metresPerDegLng = 111320 * Math.cos((point.lat * Math.PI) / 180);
  const toXY = ([lng, lat]: [number, number]): [number, number] => [(lng - point.lng) * metresPerDegLng, (lat - point.lat) * metresPerDegLat];

  let best = Infinity;
  let prev = toXY(coords[0]);
  best = Math.min(best, Math.hypot(prev[0], prev[1]));
  for (let i = 1; i < coords.length; i++) {
    const next = toXY(coords[i]);
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const lengthSquared = dx * dx + dy * dy;
    // Position of the point's closest approach along this stretch, clamped to its ends (the point itself is the origin).
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(prev[0] * dx + prev[1] * dy) / lengthSquared));
    best = Math.min(best, Math.hypot(prev[0] + t * dx, prev[1] + t * dy));
    prev = next;
  }
  return best;
}

/**
 * Approximates how far along a route line a point sits, in miles, by finding
 * the nearest vertex and summing the cumulative distance up to it. Good
 * enough for placing a rider's photo on the mile-by-mile timeline given our
 * geometries are themselves illustrative, not surveyed.
 */
export function estimateMileMarkerOnLine(geometry: GeoJSON.LineString, point: LatLng): number | null {
  const coords = geometry.coordinates as [number, number][];
  if (coords.length === 0) return null;

  let cumulative = 0;
  let nearestDistance = Infinity;
  let nearestCumulative = 0;

  for (let i = 0; i < coords.length; i++) {
    const vertex = { lat: coords[i][1], lng: coords[i][0] };
    const distanceToPoint = haversineMiles(vertex, point);
    if (distanceToPoint < nearestDistance) {
      nearestDistance = distanceToPoint;
      nearestCumulative = cumulative;
    }
    if (i > 0) {
      const prev = { lat: coords[i - 1][1], lng: coords[i - 1][0] };
      cumulative += haversineMiles(prev, vertex);
    }
  }

  return Math.round(nearestCumulative * 10) / 10;
}

/**
 * Cuts the first and last `milesFromEachEnd` off a route line — the Section
 * 5.7 privacy safeguard so a shared ride map doesn't reveal exactly where a
 * rider lives or keeps their bike. Interpolates onto the line rather than
 * just dropping vertices, so the trim length is accurate regardless of how
 * sparse the geometry is.
 */
export function trimLineEnds(geometry: GeoJSON.LineString, milesFromEachEnd: number): GeoJSON.LineString {
  const coords = geometry.coordinates as [number, number][];
  if (coords.length < 2) return geometry;

  const toPoint = (c: [number, number]): LatLng => ({ lng: c[0], lat: c[1] });

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < coords.length; i++) {
    const len = haversineMiles(toPoint(coords[i - 1]), toPoint(coords[i]));
    segmentLengths.push(len);
    totalLength += len;
  }

  // Route is too short to trim both ends meaningfully — leave it whole rather
  // than collapsing to nothing.
  if (totalLength <= milesFromEachEnd * 2) return geometry;

  function pointAtDistance(fromStart: number): [number, number] {
    let remaining = fromStart;
    for (let i = 0; i < segmentLengths.length; i++) {
      if (remaining <= segmentLengths[i]) {
        const t = segmentLengths[i] === 0 ? 0 : remaining / segmentLengths[i];
        const a = coords[i];
        const b = coords[i + 1];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      remaining -= segmentLengths[i];
    }
    return coords[coords.length - 1];
  }

  const trimmed: [number, number][] = [pointAtDistance(milesFromEachEnd)];
  let cumulative = 0;
  for (let i = 1; i < coords.length; i++) {
    cumulative += segmentLengths[i - 1];
    if (cumulative > milesFromEachEnd && cumulative < totalLength - milesFromEachEnd) {
      trimmed.push(coords[i]);
    }
  }
  trimmed.push(pointAtDistance(totalLength - milesFromEachEnd));

  return { type: "LineString", coordinates: trimmed };
}
