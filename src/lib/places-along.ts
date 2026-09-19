import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRides, places, routes, tourDays, tours } from "@/db/schema";
import { distanceToLineMetres } from "./geo";
import { OWN_PLACE_TYPES, OWN_PLACE_TYPE_LABELS, PLACE_KINDS, type AlongPlace, type PlaceKind } from "./place-kinds";

type Line = [number, number][];

// OpenStreetMap's free query service. A second server is tried if the first is busy.
const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const USER_AGENT = "Herepath/1.0 (UK motorcycle route guide; https://herepath.vercel.app)";
const CACHE_SECONDS = 7 * 24 * 60 * 60;
const MAX_POINTS_PER_LINE = 60;
const MAX_OSM_RESULTS = 500;
/** Total time allowed for OpenStreetMap, leaving room inside the endpoint's 30 second limit. */
const OSM_TIME_BUDGET_MS = 26000;
/** An OpenStreetMap place this close to one of our own, of the same kind, is treated as the same place. */
const DUPLICATE_METRES = 80;

const OSM_FILTERS: Record<PlaceKind, string> = {
  fuel: '["amenity"="fuel"]',
  food: '["amenity"~"^(restaurant|cafe|pub)$"]["name"]',
  stay: '["tourism"~"^(hotel|guest_house|hostel|motel|camp_site|caravan_site)$"]["name"]',
};

const OSM_LABELS: Record<string, string> = {
  fuel: "Fuel station",
  restaurant: "Restaurant",
  cafe: "Café",
  pub: "Pub",
  hotel: "Hotel",
  guest_house: "Guest house",
  hostel: "Hostel",
  motel: "Motel",
  camp_site: "Campsite",
  caravan_site: "Caravan site",
};

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function asLine(geometry: unknown): Line | null {
  const line = geometry as GeoJSON.LineString | null;
  return line?.type === "LineString" && Array.isArray(line.coordinates) ? (line.coordinates as Line) : null;
}

/** The track(s) of a published ride: one for a route or day ride, one per day for a tour. Null if there's no such ride or no track. */
export async function getRideLines(type: string, slug: string): Promise<Line[] | null> {
  if (type === "route") {
    const [route] = await db.select({ geometry: routes.geometry }).from(routes).where(and(eq(routes.slug, slug), eq(routes.status, "published")));
    const line = route && asLine(route.geometry);
    return line ? [line] : null;
  }
  if (type === "day-ride") {
    const [dayRide] = await db
      .select({ geometry: dayRides.geometry })
      .from(dayRides)
      .where(and(eq(dayRides.slug, slug), eq(dayRides.status, "published")));
    const line = dayRide && asLine(dayRide.geometry);
    return line ? [line] : null;
  }
  if (type === "tour") {
    const [tour] = await db.select({ id: tours.id }).from(tours).where(and(eq(tours.slug, slug), eq(tours.status, "published")));
    if (!tour) return null;
    const days = await db
      .select({ geometry: dayRides.geometry })
      .from(tourDays)
      .innerJoin(dayRides, eq(tourDays.dayRideId, dayRides.id))
      .where(eq(tourDays.tourId, tour.id))
      .orderBy(asc(tourDays.dayNumber));
    const lines = days.map((d) => asLine(d.geometry)).filter((l): l is Line => !!l);
    return lines.length > 0 ? lines : null;
  }
  return null;
}

/** Thins a long track to a manageable number of points; the corridor search doesn't need every one. */
function simplifyLine(coords: Line): Line {
  if (coords.length <= MAX_POINTS_PER_LINE) return coords;
  const step = (coords.length - 1) / (MAX_POINTS_PER_LINE - 1);
  return Array.from({ length: MAX_POINTS_PER_LINE }, (_, i) => coords[Math.round(i * step)]);
}

// Nodes and ways only: searching relations as well makes the free service time out.
function buildQuery(kind: PlaceKind, line: Line, radiusMetres: number): string {
  const path = simplifyLine(line)
    .map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join(",");
  const filter = OSM_FILTERS[kind];
  return `[out:json][timeout:25];(node${filter}(around:${radiusMetres},${path});way${filter}(around:${radiusMetres},${path}););out tags center qt ${MAX_OSM_RESULTS};`;
}

/** Asks OpenStreetMap, giving up at `deadline` (a timestamp in ms). Returns null if no server could answer in time. */
async function fetchOverpass(query: string, deadline: number): Promise<OverpassElement[] | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const timeLeft = deadline - Date.now();
    if (timeLeft < 2000) return null;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        headers: { "User-Agent": USER_AGENT },
        cache: "force-cache",
        next: { revalidate: CACHE_SECONDS },
        signal: AbortSignal.timeout(Math.min(timeLeft, 20000)),
      });
      if (!response.ok) continue;
      const json = (await response.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      // try the next server
    }
  }
  return null;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function safeWebsite(value: string | undefined): string | undefined {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

function osmToPlace(kind: PlaceKind, element: OverpassElement): AlongPlace | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};
  if (lat == null || lng == null) return null;

  const subtype = kind === "stay" ? tags.tourism : kind === "food" ? tags.amenity : "fuel";
  const label = OSM_LABELS[subtype] ?? "Place";
  const name = tags.name || (kind === "fuel" ? tags.brand || tags.operator || "Fuel station" : "");
  if (!name) return null;

  let note: string | undefined;
  if (kind === "fuel" && tags.brand && tags.brand !== name) note = tags.brand;
  if (kind === "food" && tags.cuisine) {
    note = tags.cuisine
      .split(";")
      .slice(0, 2)
      .map((c) => titleCase(c.replace(/_/g, " ")))
      .join(", ");
  }

  return {
    id: `osm-${element.type}-${element.id}`,
    kind,
    name,
    lat,
    lng,
    label,
    note,
    source: "osm",
    sponsored: false,
    website: safeWebsite(tags.website ?? tags["contact:website"]),
  };
}

async function ownPlaces(kind: PlaceKind, lines: Line[], radiusMetres: number): Promise<AlongPlace[]> {
  const rows = await db
    .select()
    .from(places)
    .where(and(isNotNull(places.lat), isNotNull(places.lng)));

  const types = OWN_PLACE_TYPES[kind];
  const result: AlongPlace[] = [];
  for (const row of rows) {
    if (!types.includes(row.type) || row.lat == null || row.lng == null) continue;
    const point = { lat: Number(row.lat), lng: Number(row.lng) };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    if (!lines.some((line) => distanceToLineMetres(line, point) <= radiusMetres)) continue;
    result.push({
      id: `herepath-${row.id}`,
      kind,
      name: row.name,
      lat: point.lat,
      lng: point.lng,
      label: OWN_PLACE_TYPE_LABELS[row.type] ?? "Place",
      note: row.shortDescription ?? undefined,
      source: "herepath",
      sponsored: row.isSponsored,
      website: safeWebsite(row.websiteUrl ?? undefined),
    });
  }
  return result;
}

/**
 * Finds the fuel, food or places to stay near a ride: Herepath's own places (including sponsored ones)
 * plus whatever OpenStreetMap lists within a few kilometres of the track. `osmOk` is false when
 * OpenStreetMap couldn't be reached, in which case only our own places are returned.
 */
export async function getPlacesAlong(kind: PlaceKind, lines: Line[]): Promise<{ places: AlongPlace[]; osmOk: boolean }> {
  const radiusMetres = PLACE_KINDS.find((k) => k.id === kind)!.radiusMetres;
  const usable = lines.filter((line) => line.length >= 2);
  if (usable.length === 0) return { places: [], osmOk: true };

  const deadline = Date.now() + OSM_TIME_BUDGET_MS;
  const own = await ownPlaces(kind, usable, radiusMetres);

  // One query per track (a tour has one per day), one after another to stay polite to the free service. Each answer
  // is cached, so if a long tour runs out of time the next request only has the missing days left to fetch.
  const elements: OverpassElement[] = [];
  let osmOk = true;
  for (const line of usable) {
    const found = await fetchOverpass(buildQuery(kind, line, radiusMetres), deadline);
    if (found === null) osmOk = false;
    else elements.push(...found);
  }

  const seen = new Set<string>();
  const fromOsm: AlongPlace[] = [];
  for (const element of elements) {
    const place = osmToPlace(kind, element);
    if (!place || seen.has(place.id)) continue;
    seen.add(place.id);
    const duplicatesOwn = own.some((o) => distanceToLineMetres([[o.lng, o.lat]], place) <= DUPLICATE_METRES);
    if (!duplicatesOwn) fromOsm.push(place);
  }

  return { places: [...own, ...fromOsm], osmOk };
}
