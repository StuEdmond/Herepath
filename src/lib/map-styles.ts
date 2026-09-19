export type MapStyleId = "streets" | "outdoor" | "satellite";

export const MAP_STYLE_OPTIONS: { id: MapStyleId; label: string }[] = [
  { id: "streets", label: "Map" },
  { id: "outdoor", label: "Contour Map" },
  { id: "satellite", label: "Satellite" },
];

// MapTiler's own names for each type. "hybrid" is satellite imagery with road and place names on top.
const MAPTILER_STYLE_IDS: Record<MapStyleId, string> = {
  streets: "streets-v2",
  outdoor: "outdoor-v2",
  satellite: "hybrid",
};

const STYLE_PATH = /\/maps\/[^/]+\/style\.json/;

function baseStyleUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL || undefined;
}

/** True when the configured map style is a MapTiler one we can swap for other map types. */
export function canSwitchMapStyle(): boolean {
  const base = baseStyleUrl();
  return !!base && STYLE_PATH.test(base);
}

/** Address of the chosen map type, or undefined when no map provider is configured (the plain fallback map is used). */
export function mapStyleUrl(id: MapStyleId): string | undefined {
  const base = baseStyleUrl();
  if (!base) return undefined;
  if (!STYLE_PATH.test(base)) return base;
  return base.replace(STYLE_PATH, `/maps/${MAPTILER_STYLE_IDS[id]}/style.json`);
}
