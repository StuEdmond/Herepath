/**
 * The terms a route brought in from elsewhere can be used on. Recorded for every imported route, so we always know whether we're allowed
 * to publish it and what credit it needs. Kept in one file so the importer, the route form and the public credit line agree.
 */
export const ROUTE_LICENCES = [
  { value: "own", label: "We recorded it (or a Herepath rider gave it to us)", credit: false },
  { value: "permission", label: "Used with the author's permission", credit: true },
  { value: "cc-by", label: "Creative Commons Attribution (CC BY)", credit: true },
  { value: "cc-by-sa", label: "Creative Commons Attribution-ShareAlike (CC BY-SA)", credit: true },
  { value: "cc0", label: "Public domain or CC0", credit: false },
  { value: "osm", label: "Made from OpenStreetMap data (ODbL)", credit: true },
  { value: "other", label: "Other (explain in the source notes)", credit: true },
] as const;

export type RouteLicence = (typeof ROUTE_LICENCES)[number]["value"];

export function isRouteLicence(value: string): value is RouteLicence {
  return ROUTE_LICENCES.some((l) => l.value === value);
}

export function routeLicenceLabel(value: string | null): string {
  return ROUTE_LICENCES.find((l) => l.value === value)?.label ?? value ?? "";
}

/** The short credit shown on a route's page, or null when the source needs none. */
export function routeCreditLine(source: { name: string | null; author: string | null; licence: string | null }): string | null {
  if (!source.name && !source.author) return null;
  const licence = ROUTE_LICENCES.find((l) => l.value === source.licence);
  if (licence && !licence.credit) return null;
  const from = [source.author, source.name].filter(Boolean).join(", ");
  const short =
    source.licence === "cc-by" ? "CC BY" : source.licence === "cc-by-sa" ? "CC BY-SA" : source.licence === "osm" ? "© OpenStreetMap contributors (ODbL)" : source.licence === "permission" ? "used with permission" : "";
  return `Route from ${from}${short ? ` (${short})` : ""}`;
}

/** Limits for one bulk import. */
export const MAX_IMPORT_FILES = 30;
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_POINTS = 3000;
