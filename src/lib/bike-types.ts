const BIKE_TYPES = ["sports", "naked_and_roadster", "adventure", "touring", "cruiser", "125cc_and_new_riders"] as const;

export type BikeType = (typeof BIKE_TYPES)[number];

export const BIKE_TYPE_KEYS: BikeType[] = [...BIKE_TYPES];

export function isBikeType(value: string): value is BikeType {
  return (BIKE_TYPES as readonly string[]).includes(value);
}

/** Plain-English names for the bike types routes are rated for. */
export const BIKE_TYPE_LABELS: Record<string, string> = {
  sports: "Sports",
  naked_and_roadster: "Naked and roadster",
  adventure: "Adventure",
  touring: "Touring",
  cruiser: "Cruiser",
  "125cc_and_new_riders": "125cc and new riders",
};

/** The bikes least able to ride a demanding route, so they can't be marked "suited" on one (see `isDemandingRoute`). */
export const BEGINNER_BIKE_TYPES: BikeType[] = ["cruiser", "125cc_and_new_riders"];

/** Difficulty 4 or 5, or a poor surface: honest ratings are the point of Herepath, so a route this demanding can't say it suits the bikes least able to ride it. */
export function isDemandingRoute(difficulty: number, surface: string): boolean {
  return difficulty >= 4 || surface === "poor";
}
