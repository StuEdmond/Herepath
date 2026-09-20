/**
 * Reads National Highways' Road and Lane Closures feed (v2.0, DATEX II as JSON) and picks out the closures a rider needs to know about:
 * where the road itself is shut. Lane closures, narrowed lanes and slip or link road closures are left out, since they slow a ride
 * without stopping it. Everything here is pure (no network, no database) except `fetchNationalHighwaysClosures`.
 */

export interface ParsedClosure {
  id: string;
  roads: string[];
  comment: string;
  locationText: string;
  status: "active" | "planned" | "suspended";
  startsAt: Date | null;
  endsAt: Date | null;
  /** [lng, lat] points, one line per stretch. */
  lines: [number, number][][];
  updatedAt: Date | null;
}

const API_BASE = "https://api.data.nationalhighways.co.uk/roads/v2.0/closures";
/** The service refuses a longer window than this. */
export const MAX_WINDOW_DAYS = 30;
const MAX_POINTS_PER_LINE = 120;

type Json = Record<string, unknown>;
const asObject = (value: unknown): Json | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null);
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const dig = (value: unknown, ...path: string[]): unknown => path.reduce<unknown>((current, key) => asObject(current)?.[key], value);

function parseDate(value: unknown): Date | null {
  const date = new Date(asString(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "lat lng lat lng ..." into [lng, lat] points, thinned to a sensible number. */
export function parsePosList(posList: unknown): [number, number][] {
  const numbers = asString(posList).trim().split(/\s+/).map(Number);
  const points: [number, number][] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const lat = numbers[i];
    const lng = numbers[i + 1];
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) points.push([lng, lat]);
  }
  if (points.length <= MAX_POINTS_PER_LINE) return points;
  const step = (points.length - 1) / (MAX_POINTS_PER_LINE - 1);
  return Array.from({ length: MAX_POINTS_PER_LINE }, (_, i) => points[Math.round(i * step)]);
}

/** Closures of a slip road, link road or junction entry or exit: the main road stays open. */
const SLIP_OR_LINK = /\b(slip|sliproad|link road|entry|exit|on-slip|off-slip)\b/i;

/** Pulls what we need out of one record, or null if it isn't a closure of the road itself. */
export function parseRecord(record: unknown): ParsedClosure | null {
  const wrapper = asObject(record);
  const r = asObject(wrapper && Object.values(wrapper)[0]);
  if (!r) return null;

  const id = asString(r.idG) || asString(r.id);
  const comment = asString(asObject(asArray(r.generalPublicComment)[0])?.comment).trim();
  const status = asString(dig(r, "validity", "validityStatus"));
  if (!id || (status !== "active" && status !== "planned" && status !== "suspended")) return null;

  const reference = asObject(r.locationReference);
  const groups = asArray(dig(reference, "locLocationGroupByList", "locationContainedInGroup")).map(asObject);
  // Some records describe one place directly rather than through a group.
  if (groups.length === 0 && reference) groups.push(reference);

  const lines: [number, number][][] = [];
  const roads = new Set<string>();
  const descriptions: string[] = [];
  let roadShut = asString(dig(r, "roadOrCarriagewayOrLaneManagementType", "value")) === "carriagewayClosures";

  for (const group of groups) {
    const linear = asObject(group?.locLinearLocation);
    const line = parsePosList(dig(linear, "gmlLineString", "locGmlLineString", "posList"));
    if (line.length >= 2) lines.push(line);

    const description = asString(dig(linear, "supplementaryPositionalDescription", "locationDescription")).trim();
    if (description && !descriptions.includes(description)) descriptions.push(description);

    for (const carriageway of asArray(dig(linear, "supplementaryPositionalDescription", "carriageway"))) {
      if (dig(carriageway, "carriagewayExtensionG", "impactOnCarriageway", "numberOfOperationalLanes") === 0) roadShut = true;
    }
    for (const within of asArray(dig(group, "locSingleRoadLinearLocation", "linearWithinLinearElement"))) {
      const name = asString(dig(within, "linearElement", "locLinearElementByCode", "roadName")).trim();
      if (name) roads.add(name);
    }
  }

  const text = `${comment} ${descriptions.join(" ")}`;
  if (!roadShut || lines.length === 0 || SLIP_OR_LINK.test(text)) return null;

  return {
    id,
    roads: [...roads],
    comment: comment || descriptions[0] || "Road closure",
    locationText: descriptions.join("; "),
    status,
    startsAt: parseDate(dig(r, "validity", "validityTimeSpecification", "overallStartTime")),
    endsAt: parseDate(dig(r, "validity", "validityTimeSpecification", "overallEndTime")),
    lines,
    updatedAt: parseDate(r.situationRecordVersionTime),
  };
}

/** Every closure of the road itself in a feed response, one per record id. */
export function parseClosures(payload: unknown): ParsedClosure[] {
  const found = new Map<string, ParsedClosure>();
  for (const situation of asArray(dig(payload, "D2Payload", "situation"))) {
    for (const record of asArray(asObject(situation)?.situationRecord)) {
      const closure = parseRecord(record);
      if (closure) found.set(closure.id, closure);
    }
  }
  return [...found.values()];
}

const formatTime = (date: Date) => date.toISOString().slice(0, 19);

/**
 * Asks National Highways for planned and unplanned closures from now for `days` days (at most 30). Two requests, which is well inside
 * the limit of ten a minute. Throws if either can't be read, so a half answer never replaces a whole one.
 */
export async function fetchNationalHighwaysClosures(apiKey: string, days = MAX_WINDOW_DAYS): Promise<ParsedClosure[]> {
  const start = new Date();
  const end = new Date(start.getTime() + Math.min(days, MAX_WINDOW_DAYS) * 24 * 60 * 60 * 1000);
  const all = new Map<string, ParsedClosure>();

  for (const type of ["planned", "unplanned"]) {
    const response = await fetch(`${API_BASE}?startDateTime=${formatTime(start)}&endDateTime=${formatTime(end)}&closureType=${type}`, {
      signal: AbortSignal.timeout(40_000),
      headers: { "Ocp-Apim-Subscription-Key": apiKey, "X-Response-MediaType": "application/json", "X-Data-Format": "DATEXII" },
    });
    if (!response.ok) throw new Error(`National Highways ${type} closures: HTTP ${response.status}`);
    for (const closure of parseClosures(await response.json())) all.set(closure.id, closure);
  }
  return [...all.values()];
}
