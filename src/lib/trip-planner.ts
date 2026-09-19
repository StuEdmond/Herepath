import { haversineMiles, type LatLng } from "./geo";

/**
 * The trip builder's arithmetic: joining Herepath routes end to end, totalling them, splitting them into days, and suggesting
 * round trips. Everything here is estimates from straight-line distances between where routes start and finish. There is no
 * road routing, so the stretches between routes are labelled as estimates wherever they're shown.
 */

/** Straight-line distance understates the road; roads wander, so scale it up. */
export const ROAD_FACTOR = 1.3;
/** Average speed for the riding between routes, in miles per hour. */
export const LINK_MPH = 30;
/** A gap this long between two routes gets a warning. */
export const LONG_GAP_MILES = 25;
export const MAX_TRIP_ROUTES = 30;

export interface PlannerRoute {
  id: string;
  slug: string;
  name: string;
  regionName: string;
  distanceMiles: number;
  ridingTimeMinutes: number;
  difficulty: number;
  surface: "good" | "mixed" | "poor";
  suitedBikeTypes: string[];
  /** Landmarks on the route (a castle, a reservoir, a pass), so a search for one finds it. */
  landmarkNames: string[];
  start: LatLng;
  end: LatLng;
  startLabel?: string;
  endLabel?: string;
  /** A thinned copy of the track, enough to draw the route on the overview map. */
  line: [number, number][];
}

export interface TripItem {
  routeId: string;
  /** Ridden from its finish back to its start. */
  reversed: boolean;
}

export interface LinkLeg {
  /** Straight-line miles between the two points. */
  straightMiles: number;
  /** Estimated riding miles, allowing for the road not being straight. */
  miles: number;
  minutes: number;
  from: LatLng;
  to: LatLng;
}

export interface TripStop {
  item: TripItem;
  route: PlannerRoute;
  entry: LatLng;
  exit: LatLng;
  entryLabel?: string;
  exitLabel?: string;
}

export interface TripSummary {
  stops: TripStop[];
  /** links[i] is the stretch before stops[i] (from the start point when there is one); links[stops.length] is the ride home. */
  links: (LinkLeg | null)[];
  routeMiles: number;
  linkMiles: number;
  totalMiles: number;
  totalMinutes: number;
  hardestDifficulty: number;
  worstSurface: "good" | "mixed" | "poor" | null;
  /** Bike types marked as suited on every route in the trip. */
  suitedForAll: string[];
  /** Items whose route is no longer published. */
  missing: number;
  longGaps: number;
}

export function entryPoint(route: PlannerRoute, reversed: boolean): LatLng {
  return reversed ? route.end : route.start;
}

export function exitPoint(route: PlannerRoute, reversed: boolean): LatLng {
  return reversed ? route.start : route.end;
}

export function linkBetween(from: LatLng, to: LatLng): LinkLeg {
  const straightMiles = haversineMiles(from, to);
  const miles = straightMiles * ROAD_FACTOR;
  return { straightMiles, miles, minutes: (miles / LINK_MPH) * 60, from, to };
}

const SURFACE_ORDER = { good: 0, mixed: 1, poor: 2 } as const;

/** Adds up a trip. With a start point, the trip begins and ends there (a round trip); without one it runs from the first route to the last. */
export function summariseTrip(items: TripItem[], routesById: Map<string, PlannerRoute>, origin: LatLng | null): TripSummary {
  const stops: TripStop[] = [];
  let missing = 0;
  for (const item of items) {
    const route = routesById.get(item.routeId);
    if (!route) {
      missing++;
      continue;
    }
    stops.push({
      item,
      route,
      entry: entryPoint(route, item.reversed),
      exit: exitPoint(route, item.reversed),
      entryLabel: item.reversed ? route.endLabel : route.startLabel,
      exitLabel: item.reversed ? route.startLabel : route.endLabel,
    });
  }

  const links: (LinkLeg | null)[] = [];
  for (let i = 0; i <= stops.length; i++) {
    const from = i === 0 ? origin : stops[i - 1].exit;
    const to = i === stops.length ? origin : stops[i].entry;
    links.push(from && to && stops.length > 0 ? linkBetween(from, to) : null);
  }

  const routeMiles = stops.reduce((sum, s) => sum + s.route.distanceMiles, 0);
  const linkMiles = links.reduce((sum, l) => sum + (l?.miles ?? 0), 0);
  const routeMinutes = stops.reduce((sum, s) => sum + s.route.ridingTimeMinutes, 0);
  const linkMinutes = links.reduce((sum, l) => sum + (l?.minutes ?? 0), 0);

  let suitedForAll: string[] = [];
  if (stops.length > 0) {
    suitedForAll = stops[0].route.suitedBikeTypes.filter((type) => stops.every((s) => s.route.suitedBikeTypes.includes(type)));
  }
  const worst = stops.reduce<TripSummary["worstSurface"]>(
    (acc, s) => (acc === null || SURFACE_ORDER[s.route.surface] > SURFACE_ORDER[acc] ? s.route.surface : acc),
    null,
  );

  return {
    stops,
    links,
    routeMiles,
    linkMiles,
    totalMiles: routeMiles + linkMiles,
    totalMinutes: routeMinutes + linkMinutes,
    hardestDifficulty: stops.reduce((max, s) => Math.max(max, s.route.difficulty), 0),
    worstSurface: worst,
    suitedForAll,
    missing,
    longGaps: links.filter((l) => l && l.straightMiles > LONG_GAP_MILES).length,
  };
}

export interface TripDay {
  number: number;
  /** Indexes into TripSummary.stops. */
  stopIndexes: number[];
  miles: number;
  minutes: number;
  /** Where the day ends: the finish of its last route, or the start point when the last day rides home. */
  endsAt: LatLng;
  endsAtLabel?: string;
  /** A day made of one route (plus the stretch to reach it) that's longer than the day limit can't be shortened, so it runs over. */
  overLimit: boolean;
}

/**
 * Splits a trip into days of about `milesPerDay`. Routes can't be cut, so a day ends when the next route (with the stretch to
 * reach it) wouldn't fit. The stretch before a route belongs to that route's day, so each morning starts with the ride to it.
 */
export function splitIntoDays(trip: TripSummary, milesPerDay: number, origin: LatLng | null): TripDay[] {
  const days: TripDay[] = [];
  let current: TripDay | null = null;

  trip.stops.forEach((stop, index) => {
    const block = (trip.links[index]?.miles ?? 0) + stop.route.distanceMiles;
    const blockMinutes = (trip.links[index]?.minutes ?? 0) + stop.route.ridingTimeMinutes;
    if (!current || (current.miles + block > milesPerDay && current.stopIndexes.length > 0)) {
      current = { number: days.length + 1, stopIndexes: [], miles: 0, minutes: 0, endsAt: stop.exit, endsAtLabel: stop.exitLabel, overLimit: false };
      days.push(current);
    }
    current.stopIndexes.push(index);
    current.miles += block;
    current.minutes += blockMinutes;
    current.endsAt = stop.exit;
    current.endsAtLabel = stop.exitLabel;
  });

  const last = days[days.length - 1];
  const ride = trip.links[trip.stops.length];
  if (last && ride && origin) {
    last.miles += ride.miles;
    last.minutes += ride.minutes;
    last.endsAt = origin;
    last.endsAtLabel = "your start";
  }
  // Only a day with a single route can't be shortened by starting a new day, so that's the case worth pointing out.
  for (const day of days) day.overLimit = day.miles > milesPerDay * 1.0001 && day.stopIndexes.length === 1;
  return days;
}

export interface RoundTripOption {
  items: TripItem[];
  routeCount: number;
  routeMiles: number;
  linkMiles: number;
  totalMiles: number;
  /** Lower is better. */
  score: number;
}

export interface RoundTripSearch {
  options: RoundTripOption[];
  /** The closest a route starts or finishes to the start point, for the "nothing found" message. */
  nearestRouteMiles: number | null;
  /** True if the search stopped early because it was taking too long (it then returns what it had found). */
  cutShort: boolean;
}

const MAX_SEARCH_NODES = 200_000;
const MAX_LINK_MILES = 25;
const MAX_ROUND_TRIP_ROUTES = 8;

/**
 * Looks for loops that start and finish at `origin`, made of whole routes joined by short stretches, whose total is near
 * `targetMiles`. Prefers loops with little joining and few routes. Returns up to `limit` different sets of routes.
 */
export function suggestRoundTrips(routes: PlannerRoute[], origin: LatLng, targetMiles: number, limit = 3): RoundTripSearch {
  const low = targetMiles * 0.7;
  const high = targetMiles * 1.3;
  const road = (a: LatLng, b: LatLng) => haversineMiles(a, b) * ROAD_FACTOR;

  let nearest: number | null = null;
  for (const r of routes) {
    const d = Math.min(haversineMiles(origin, r.start), haversineMiles(origin, r.end));
    nearest = nearest === null ? d : Math.min(nearest, d);
  }

  const bestBySet = new Map<string, RoundTripOption>();
  let visited = 0;
  let cutShort = false;

  const search = (position: LatLng, sequence: TripItem[], used: Set<string>, routeMiles: number, linkMiles: number) => {
    if (cutShort) return;
    if (sequence.length >= MAX_ROUND_TRIP_ROUTES) return;

    // Try the routes that start nearest first, so if the search has to stop early it has looked at the likeliest ones.
    const candidates: { route: PlannerRoute; reversed: boolean; entry: LatLng; exit: LatLng; link: number }[] = [];
    for (const route of routes) {
      if (used.has(route.id)) continue;
      for (const reversed of [false, true]) {
        const entry = entryPoint(route, reversed);
        const link = road(position, entry);
        if (link <= MAX_LINK_MILES) candidates.push({ route, reversed, entry, exit: exitPoint(route, reversed), link });
      }
    }
    candidates.sort((a, b) => a.link - b.link);

    for (const { route, reversed, exit, link } of candidates) {
      if (++visited > MAX_SEARCH_NODES) {
        cutShort = true;
        return;
      }

      const newRouteMiles = routeMiles + route.distanceMiles;
      const newLinkMiles = linkMiles + link;
      const home = road(exit, origin);
      const total = newRouteMiles + newLinkMiles + home;
      if (newRouteMiles + newLinkMiles > high) continue;

      const next = [...sequence, { routeId: route.id, reversed }];
      if (total >= low && total <= high) {
        const allLink = newLinkMiles + home;
        const score = Math.abs(total - targetMiles) / targetMiles + 0.6 * (allLink / total) + 0.03 * next.length;
        const key = next
          .map((i) => i.routeId)
          .sort()
          .join("|");
        const existing = bestBySet.get(key);
        if (!existing || score < existing.score) {
          bestBySet.set(key, { items: next, routeCount: next.length, routeMiles: newRouteMiles, linkMiles: allLink, totalMiles: total, score });
        }
      }
      if (total < high) {
        used.add(route.id);
        search(exit, next, used, newRouteMiles, newLinkMiles);
        used.delete(route.id);
      }
    }
  };
  search(origin, [], new Set(), 0, 0);

  const options = [...bestBySet.values()].sort((a, b) => a.score - b.score).slice(0, limit);
  return { options, nearestRouteMiles: nearest, cutShort };
}

/** One colour per day on the map, the same as the tour maps use. */
export const DAY_COLORS = ["#4fae82", "#4a90d9", "#d9a544", "#9b72cf", "#3bc4b0", "#d97bb0"];

/** The address of the GPX download for some of a trip's routes (the whole trip, or one day of it). */
export function tripGpxHref(name: string, stops: { slug: string; reversed: boolean }[], origin: LatLng | null): string {
  const params = new URLSearchParams();
  params.set("name", name.trim() || "Herepath trip");
  for (const stop of stops) params.append("r", stop.reversed ? `${stop.slug}~` : stop.slug);
  if (origin) params.set("start", `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`);
  return `/api/trip-gpx?${params.toString()}`;
}

export function formatMiles(miles: number): string {
  return `${Math.round(miles)} mi`;
}

export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes / 5) * 5;
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
