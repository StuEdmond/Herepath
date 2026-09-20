import { distanceToLineMetres } from "./geo";

type Line = [number, number][];

/** A closure counts as on a ride when this much of it lies within `NEAR_METRES` of the ride's line. */
const NEAR_METRES = 50;
/** Enough of the closure, in metres, that the ride is plainly using this road and not just crossing it... */
const ENOUGH_METRES = 300;
/** ...or, for a short closure, this share of its length. */
const ENOUGH_SHARE = 0.5;
/** The closure is walked in steps this long, so the answer doesn't depend on how far apart its points happen to be. */
const STEP_METRES = 25;

const METRES_PER_DEG_LAT = 111320;

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function boundsOf(lines: Line[]): Bounds | null {
  let bounds: Bounds | null = null;
  for (const line of lines) {
    for (const [lng, lat] of line) {
      if (!bounds) bounds = { minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
      else {
        if (lat < bounds.minLat) bounds.minLat = lat;
        if (lat > bounds.maxLat) bounds.maxLat = lat;
        if (lng < bounds.minLng) bounds.minLng = lng;
        if (lng > bounds.maxLng) bounds.maxLng = lng;
      }
    }
  }
  return bounds;
}

export function boundsOverlap(a: Bounds, b: Bounds, marginDegrees = 0.001): boolean {
  return a.minLat - marginDegrees <= b.maxLat && a.maxLat + marginDegrees >= b.minLat && a.minLng - marginDegrees <= b.maxLng && a.maxLng + marginDegrees >= b.minLng;
}

/** Points every `STEP_METRES` along a line, each standing for a stretch that long. */
function walk(line: Line): { point: [number, number]; metres: number }[] {
  const out: { point: [number, number]; metres: number }[] = [];
  for (let i = 1; i < line.length; i++) {
    const [lng1, lat1] = line[i - 1];
    const [lng2, lat2] = line[i];
    const metresPerDegLng = METRES_PER_DEG_LAT * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180);
    const length = Math.hypot((lng2 - lng1) * metresPerDegLng, (lat2 - lat1) * METRES_PER_DEG_LAT);
    const steps = Math.max(1, Math.round(length / STEP_METRES));
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      out.push({ point: [lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t], metres: length / steps });
    }
  }
  return out;
}

/**
 * Whether a closure sits on a ride: enough of the closed road runs along the ride's line. A ride that only crosses a closed road (over
 * a bridge or under a flyover) touches it for a few metres, which doesn't count.
 */
export function closureOnRide(closureLines: Line[], rideLines: Line[]): boolean {
  const closureBounds = boundsOf(closureLines);
  if (!closureBounds) return false;
  const near = rideLines.filter((line) => {
    const bounds = boundsOf([line]);
    return bounds !== null && boundsOverlap(bounds, closureBounds);
  });
  if (near.length === 0) return false;

  let total = 0;
  let matched = 0;
  for (const line of closureLines) {
    for (const { point, metres } of walk(line)) {
      total += metres;
      if (near.some((ride) => distanceToLineMetres(ride, { lng: point[0], lat: point[1] }) <= NEAR_METRES)) matched += metres;
    }
  }
  return total > 0 && matched >= Math.min(ENOUGH_METRES, total * ENOUGH_SHARE);
}
