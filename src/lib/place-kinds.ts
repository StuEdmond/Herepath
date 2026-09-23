/** The kinds of place a rider can show along a ride's map. Shared by the server (which finds them) and the map (which draws them). */
export type PlaceKind = "fuel" | "food" | "stay";

export const PLACE_KINDS: { id: PlaceKind; label: string; color: string; radiusMetres: number }[] = [
  { id: "fuel", label: "Fuel", color: "#e8a13a", radiusMetres: 2000 },
  { id: "food", label: "Food & drink", color: "#e2574c", radiusMetres: 1500 },
  { id: "stay", label: "Stay", color: "#4a90d9", radiusMetres: 3000 },
];

/** Which of Herepath's own place types (set in admin) count as each kind. */
export const OWN_PLACE_TYPES: Record<PlaceKind, string[]> = {
  fuel: ["fuel"],
  food: ["cafe", "pub", "restaurant"],
  stay: ["hotel", "b_and_b", "campsite"],
};

export const OWN_PLACE_TYPE_LABELS: Record<string, string> = {
  fuel: "Fuel station",
  cafe: "Café",
  pub: "Pub",
  restaurant: "Restaurant",
  hotel: "Hotel",
  b_and_b: "B&B",
  campsite: "Campsite",
};

export interface AlongPlace {
  id: string;
  kind: PlaceKind;
  name: string;
  lat: number;
  lng: number;
  /** e.g. "Pub", "Fuel station", "Guest house". */
  label: string;
  /** Brand, cuisine or a short description, when we have one. */
  note?: string;
  source: "osm" | "herepath";
  sponsored: boolean;
  website?: string;
  /** A photo of the place, only ever one we hold ourselves (OpenStreetMap's own image tags aren't used, so nothing from there is embedded as a picture). */
  photoUrl?: string;
}

/** Which ride a map belongs to, so the server can find the places along it. */
export interface PlacesSource {
  type: "route" | "day-ride" | "tour";
  slug: string;
}

export const PLACES_ENDPOINT = "/api/places-along";
