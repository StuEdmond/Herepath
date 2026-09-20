/** A place found by an address search. */
export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const OUTWARD_CODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

const TIMEOUT_MS = 6000;

export function cleanQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** The MapTiler key from the site's map style address, if it is a MapTiler one. It stays on the server. */
function mapTilerKey(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "");
    return url.hostname.endsWith("maptiler.com") ? url.searchParams.get("key") : null;
  } catch {
    return null;
  }
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://herepath.vercel.app").replace(/\/$/, "");

async function getJson(url: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": `Herepath/1.0 (${SITE_URL})`, Accept: "application/json", ...extraHeaders },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Lookup failed (${response.status})`);
  return response.json();
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** A full postcode (SK17 6BH) or just its first half (SK17), through the free postcodes.io service. */
async function findPostcode(query: string): Promise<PlaceResult[]> {
  const compact = query.replace(/\s+/g, "").toUpperCase();
  const full = FULL_POSTCODE.test(query);
  const data = (await getJson(`https://api.postcodes.io/${full ? "postcodes" : "outcodes"}/${encodeURIComponent(compact)}`)) as {
    result?: { postcode?: string; outcode?: string; latitude?: number | null; longitude?: number | null; admin_district?: string | string[] | null };
  } | null;
  const result = data?.result;
  if (!result || !isNumber(result.latitude) || !isNumber(result.longitude)) return [];
  const district = Array.isArray(result.admin_district) ? result.admin_district.join(", ") : result.admin_district;
  const name = result.postcode ?? result.outcode ?? query.toUpperCase();
  return [{ label: district ? `${name}, ${district}` : name, lat: result.latitude, lng: result.longitude }];
}

async function findWithMapTiler(query: string, key: string): Promise<PlaceResult[]> {
  // The key is restricted to this site's address in MapTiler's settings, so a request from our server has to say it comes from the site.
  const data = (await getJson(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${encodeURIComponent(key)}&country=gb&limit=5&language=en`, {
    Origin: SITE_URL,
    Referer: `${SITE_URL}/`,
  })) as {
    features?: { place_name?: string; center?: number[] }[];
  } | null;
  const out: PlaceResult[] = [];
  for (const feature of data?.features ?? []) {
    const [lng, lat] = feature.center ?? [];
    if (feature.place_name && isNumber(lat) && isNumber(lng)) out.push({ label: feature.place_name, lat, lng });
  }
  return out;
}

/** OpenStreetMap's own search, for sites with no MapTiler key. It asks for light use only, so this runs on a search, never as someone types. */
async function findWithNominatim(query: string): Promise<PlaceResult[]> {
  const data = (await getJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&countrycodes=gb&limit=5`)) as
    | { display_name?: string; lat?: string; lon?: string }[]
    | null;
  const out: PlaceResult[] = [];
  for (const item of data ?? []) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (item.display_name && Number.isFinite(lat) && Number.isFinite(lng)) out.push({ label: item.display_name.replace(/, United Kingdom$/, ""), lat, lng });
  }
  return out;
}

/** Looks up a UK address, postcode or place name. Throws if the lookup service can't be reached. */
export async function searchPlaces(rawQuery: string): Promise<PlaceResult[]> {
  const query = cleanQuery(rawQuery);
  if (FULL_POSTCODE.test(query) || OUTWARD_CODE.test(query)) {
    const found = await findPostcode(query);
    if (found.length > 0) return found;
  }
  const key = mapTilerKey();
  if (!key) return findWithNominatim(query);
  try {
    return await findWithMapTiler(query, key);
  } catch {
    // MapTiler refused or didn't answer (a changed key restriction, or its allowance used up): OpenStreetMap's search still gives an answer.
    return findWithNominatim(query);
  }
}
