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
