import { BIKE_TYPE_KEYS, BIKE_TYPE_LABELS } from "./bike-types";
import { buildCsv, parseCsv, type CsvRow } from "./csv";
import { haversineMiles, type LatLng } from "./geo";
import { lineDistanceMiles } from "./gpx";
import { isRouteLicence, type RouteLicence } from "./route-sources";

/** What the bulk importer sends the server: one batch of details about where the files came from, and one row per route. */
export interface ImportBatch {
  sourceName: string;
  sourceUrl: string;
  sourceAuthor: string;
  licence: RouteLicence;
  /** The admin has confirmed they have the right to publish these files. */
  declaration: boolean;
}

export interface ImportRow {
  name: string;
  regionId: string;
  coordinates: [number, number][];
  difficulty: number;
  surface: "good" | "mixed" | "poor";
  ridingTimeMinutes: number;
  startLabel: string;
  endLabel: string;
  /** Everything below can come from a route-details spreadsheet (see below). Still blank by default, and still a draft either way. */
  introSell?: string;
  introCharacter?: string;
  hazards?: string;
  bestTime?: string;
  stopOffNote?: string;
  suitedBikeTypes?: string[];
  cautionBikeTypes?: string[];
  /** Existing landmarks to link to this route, by id. Never created here — only linked. */
  landmarkIds?: string[];
  /** Overrides the batch's source fields for just this route, when the files came from more than one place. */
  sourceName?: string;
  sourceAuthor?: string;
  sourceUrl?: string;
  sourceLicence?: string;
}

export type ImportResult =
  | { ok: true; created: { id: string; name: string; note?: string }[]; skipped: { name: string; reason: string }[] }
  | { ok: false; error: string };

/** A route already on the site, as much as is needed to spot the same road being imported twice. */
export interface ExistingRouteSummary {
  name: string;
  start: LatLng | null;
  end: LatLng | null;
  distanceMiles: number;
}

/**
 * The summary of a stored route. Its length is taken from its track, not the distance typed into the form, because the two can differ
 * and a repeat is the same road, not the same typed number.
 */
export function summariseExistingRoute(route: {
  name: string;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  geometry: unknown;
  distanceMiles: string;
}): ExistingRouteSummary {
  const line = route.geometry as GeoJSON.LineString | null;
  const coordinates = line?.type === "LineString" && Array.isArray(line.coordinates) && line.coordinates.length >= 2 ? (line.coordinates as [number, number][]) : null;
  // The track's own ends and length are used when there's a track, since the typed start and finish points and distance can sit a little off it.
  return {
    name: route.name,
    start: coordinates ? { lat: coordinates[0][1], lng: coordinates[0][0] } : route.startPoint ? { lat: route.startPoint.lat, lng: route.startPoint.lng } : null,
    end: coordinates
      ? { lat: coordinates[coordinates.length - 1][1], lng: coordinates[coordinates.length - 1][0] }
      : route.endPoint
        ? { lat: route.endPoint.lat, lng: route.endPoint.lng }
        : null,
    distanceMiles: coordinates ? lineDistanceMiles(coordinates) : Number(route.distanceMiles),
  };
}

const SAME_PLACE_MILES = 0.2;
const SAME_LENGTH = 0.05;

/**
 * The existing route this looks like, if any: it starts and finishes in the same places (in either direction) and is about the same
 * length. Catches a road imported twice, or one that's already on the site.
 */
export function findLikelyDuplicate(coordinates: [number, number][], existing: ExistingRouteSummary[]): ExistingRouteSummary | null {
  if (coordinates.length < 2) return null;
  const start = { lat: coordinates[0][1], lng: coordinates[0][0] };
  const end = { lat: coordinates[coordinates.length - 1][1], lng: coordinates[coordinates.length - 1][0] };
  const miles = lineDistanceMiles(coordinates);

  for (const route of existing) {
    if (!route.start || !route.end) continue;
    const sameWay = haversineMiles(start, route.start) <= SAME_PLACE_MILES && haversineMiles(end, route.end) <= SAME_PLACE_MILES;
    const reversed = haversineMiles(start, route.end) <= SAME_PLACE_MILES && haversineMiles(end, route.start) <= SAME_PLACE_MILES;
    const similarLength = Math.abs(miles - route.distanceMiles) <= Math.max(0.3, route.distanceMiles * SAME_LENGTH);
    if ((sameWay || reversed) && similarLength) return route;
  }
  return null;
}

/** A first guess at riding time for a route with no timestamps: distance at a steady 35 mph. The admin can change it. */
export function estimateRidingMinutes(miles: number): number {
  return Math.max(5, Math.round(((miles / 35) * 60) / 5) * 5);
}

/**
 * Route details from another source: a spreadsheet the admin fills in alongside the GPX files, so the description, ratings and other
 * details from wherever the routes came from don't have to be retyped by hand into every one of up to 30 review cards. Matched to the
 * rows the GPX files produced by filename (and, for a file with several tracks, an optional "track" column); a "name" column is a
 * fallback when there's no file to match on. Every column but the match itself is optional, and nothing here changes the rule that an
 * imported route stays a draft, marked "needs review", until someone has checked it.
 */

/** One row of a file the GPX importer produced, as far as the spreadsheet needs to know to match a row to it. */
export interface ImportFileRow {
  key: string;
  fileName: string;
  name: string;
}

const CSV_COLUMNS = [
  ["file", "The GPX file this row belongs to (its name, with or without .gpx)."],
  ["track", "For a file with more than one track, which one — its name, or leave blank to match them in order."],
  ["name", "Route name. Also used to match this row when no file column is given."],
  ["region", "Must match one of your regions by name."],
  ["difficulty", "1 (relaxed) to 5 (very challenging)."],
  ["surface", "good, mixed or poor."],
  ["riding time (minutes)", "A number. Leave blank to keep the guess worked out from the track."],
  ["start", "Where the route starts."],
  ["finish", "Where the route finishes."],
  ["intro (sell)", "The first paragraph on the route page: what makes the ride worth doing."],
  ["intro (character)", "The second paragraph: the practical character and any honest warnings."],
  ["hazards", "Anything riders should watch for."],
  ["best time", "When the road is at its best."],
  ["stop-off", "A cafe, viewpoint or other stop worth knowing about."],
  ["suited bikes", "Bike types this route suits, separated by semicolons, e.g. Sports; Adventure."],
  ["caution bikes", "Bike types that should take care, the same way."],
  ["landmarks", "Existing landmarks along the route to link to it, separated by semicolons. Only links to ones already in the system."],
  ["source name", "Overrides the batch's source for just this route."],
  ["source author", "Overrides the batch's author for just this route."],
  ["source url", "Overrides the batch's link for just this route."],
  ["source licence", "Overrides the batch's licence for just this route (own, permission, cc-by, cc-by-sa, cc0, osm or other)."],
] as const;

export const DETAILS_CSV_HEADERS = CSV_COLUMNS.map(([header]) => header);

/** A downloadable spreadsheet, pre-filled with one row per file (and track) the GPX importer has already read, ready to fill in. */
export function buildDetailsTemplate(fileRows: ImportFileRow[]): string {
  const byFile = new Map<string, ImportFileRow[]>();
  for (const row of fileRows) {
    const base = baseFileName(row.fileName);
    byFile.set(base, [...(byFile.get(base) ?? []), row]);
  }
  const rows = fileRows.map((row) => {
    const shared = byFile.get(baseFileName(row.fileName)) ?? [];
    return [row.fileName, shared.length > 1 ? row.name : "", row.name, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
  });
  return buildCsv(DETAILS_CSV_HEADERS, rows);
}

function baseFileName(fileName: string): string {
  return fileName.replace(/\.gpx$/i, "").trim().toLowerCase();
}

/** Reads any of a few likely column names for the same thing, so a spreadsheet close to the template still works. */
function pick(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return "";
}

function splitList(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** A bike type by its key ("cruiser") or its plain-English label ("Cruiser"), case-insensitively. */
function matchBikeType(value: string): string | null {
  const key = BIKE_TYPE_KEYS.find((k) => k === value.toLowerCase().replace(/\s+/g, "_"));
  if (key) return key;
  const byLabel = Object.entries(BIKE_TYPE_LABELS).find(([, label]) => label.toLowerCase() === value.toLowerCase());
  return byLabel?.[0] ?? null;
}

export interface DetailsRowResult {
  key: string;
  changes: Partial<ImportRow>;
}

/**
 * Reads a route-details spreadsheet, matches its rows to the GPX rows already read, and resolves each one against the regions,
 * landmarks and licences the site actually has. Nothing here is fatal: a row that doesn't match, or a value that doesn't resolve, is
 * left out and explained in `warnings`, and everything else in that row still applies.
 */
export function applyDetailsCsv(
  csvText: string,
  fileRows: ImportFileRow[],
  regions: { id: string; name: string }[],
  landmarks: { id: string; name: string; regionId: string }[],
): { results: DetailsRowResult[]; warnings: string[] } {
  const { headers, rows } = parseCsv(csvText);
  const warnings: string[] = [];
  if (headers.length === 0) {
    return { results: [], warnings: ["The spreadsheet looks empty."] };
  }

  const claimed = new Set<string>();
  const results: DetailsRowResult[] = [];

  rows.forEach((row, index) => {
    const rowLabel = `Row ${index + 2}`; // + 1 for the header row, + 1 to count from 1
    const fileValue = pick(row, "file", "filename", "gpx", "gpx file");
    const trackValue = pick(row, "track", "track name");
    const nameValue = pick(row, "name", "route name", "route");

    let candidates: ImportFileRow[];
    if (fileValue) {
      candidates = fileRows.filter((r) => !claimed.has(r.key) && baseFileName(r.fileName) === baseFileName(fileValue));
      if (trackValue) candidates = candidates.filter((r) => r.name.toLowerCase() === trackValue.toLowerCase());
    } else if (nameValue) {
      candidates = fileRows.filter((r) => !claimed.has(r.key) && r.name.toLowerCase() === nameValue.toLowerCase());
    } else {
      warnings.push(`${rowLabel}: no file or name to match it to a route, so it was skipped.`);
      return;
    }

    const match = candidates[0];
    if (!match) {
      warnings.push(`${rowLabel}: ${fileValue || nameValue} doesn't match any of the routes read from your GPX files, so it was skipped.`);
      return;
    }
    claimed.add(match.key);

    const changes: DetailsRowResult["changes"] = {};
    if (nameValue) changes.name = nameValue;

    const regionValue = pick(row, "region");
    if (regionValue) {
      const region = regions.find((r) => r.name.toLowerCase() === regionValue.toLowerCase());
      if (region) changes.regionId = region.id;
      else warnings.push(`${rowLabel}: region "${regionValue}" isn't one of your regions, so it was left for you to choose.`);
    }

    const difficultyValue = pick(row, "difficulty");
    if (difficultyValue) {
      const difficulty = Number(difficultyValue);
      if ([1, 2, 3, 4, 5].includes(difficulty)) changes.difficulty = difficulty;
      else warnings.push(`${rowLabel}: difficulty "${difficultyValue}" should be 1 to 5, so it was left as a guess.`);
    }

    const surfaceValue = pick(row, "surface", "road surface", "surface quality").toLowerCase();
    if (surfaceValue) {
      if (surfaceValue === "good" || surfaceValue === "mixed" || surfaceValue === "poor") changes.surface = surfaceValue;
      else warnings.push(`${rowLabel}: surface "${surfaceValue}" should be good, mixed or poor, so it was left as a guess.`);
    }

    const minutesValue = pick(row, "riding time (minutes)", "riding time", "riding_time_minutes", "minutes", "time");
    if (minutesValue) {
      const minutes = Number(minutesValue);
      if (Number.isFinite(minutes) && minutes > 0) changes.ridingTimeMinutes = Math.round(minutes);
      else warnings.push(`${rowLabel}: riding time "${minutesValue}" isn't a number of minutes, so the guess from the track was kept.`);
    }

    const startValue = pick(row, "start", "start label", "start name", "from");
    if (startValue) changes.startLabel = startValue;
    const endValue = pick(row, "finish", "finish label", "finish name", "end", "end label", "to");
    if (endValue) changes.endLabel = endValue;

    const introSell = pick(row, "intro (sell)", "intro sell", "sell", "summary");
    if (introSell) changes.introSell = introSell;
    const introCharacter = pick(row, "intro (character)", "intro character", "character", "description");
    if (introCharacter) changes.introCharacter = introCharacter;
    const hazards = pick(row, "hazards", "hazard");
    if (hazards) changes.hazards = hazards;
    const bestTime = pick(row, "best time", "best_time");
    if (bestTime) changes.bestTime = bestTime;
    const stopOffNote = pick(row, "stop-off", "stop off", "stop off note");
    if (stopOffNote) changes.stopOffNote = stopOffNote;

    const suited: string[] = [];
    for (const value of splitList(pick(row, "suited bikes", "suited", "suited bike types", "good for"))) {
      const key = matchBikeType(value);
      if (key) suited.push(key);
      else warnings.push(`${rowLabel}: "${value}" isn't a bike type we know, so it wasn't marked suited.`);
    }
    if (suited.length > 0) changes.suitedBikeTypes = suited;

    const caution: string[] = [];
    for (const value of splitList(pick(row, "caution bikes", "caution", "take care", "caution bike types"))) {
      const key = matchBikeType(value);
      if (key) caution.push(key);
      else warnings.push(`${rowLabel}: "${value}" isn't a bike type we know, so it wasn't marked caution.`);
    }
    if (caution.length > 0) changes.cautionBikeTypes = caution;

    const landmarkIds: string[] = [];
    for (const value of splitList(pick(row, "landmarks", "landmark"))) {
      const found = landmarks.filter((l) => l.name.toLowerCase() === value.toLowerCase());
      const inRegion = changes.regionId ? found.find((l) => l.regionId === changes.regionId) : undefined;
      const landmark = inRegion ?? found[0];
      if (landmark) landmarkIds.push(landmark.id);
      else warnings.push(`${rowLabel}: landmark "${value}" isn't one you already have, so it wasn't linked.`);
    }
    if (landmarkIds.length > 0) changes.landmarkIds = landmarkIds;

    const sourceName = pick(row, "source name", "source");
    if (sourceName) changes.sourceName = sourceName;
    const sourceAuthor = pick(row, "source author", "author", "credit");
    if (sourceAuthor) changes.sourceAuthor = sourceAuthor;
    const sourceUrl = pick(row, "source url", "source link", "link", "url");
    if (sourceUrl) changes.sourceUrl = sourceUrl;
    const sourceLicenceValue = pick(row, "source licence", "licence", "license").toLowerCase();
    if (sourceLicenceValue) {
      if (isRouteLicence(sourceLicenceValue)) changes.sourceLicence = sourceLicenceValue;
      else warnings.push(`${rowLabel}: licence "${sourceLicenceValue}" isn't one we know, so the batch's licence was kept for this route.`);
    }

    results.push({ key: match.key, changes });
  });

  return { results, warnings };
}
