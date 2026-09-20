/**
 * The plans on offer: their prices, what each includes, and the limits that go with them. This file is the one place the pricing page
 * and the checkout read prices from, so what a rider sees is what Stripe charges. Change a price here and it changes everywhere.
 */

export type TierId = "free" | "premium" | "premium_plus";
export type BillingInterval = "monthly" | "yearly";

export const TIER_LABELS: Record<TierId, string> = { free: "Free", premium: "Premium", premium_plus: "Premium Plus" };

/** Higher is more. */
export const TIER_RANK: Record<TierId, number> = { free: 0, premium: 1, premium_plus: 2 };

/** Premium's price in pence. Stripe charges exactly these amounts. */
export const PREMIUM_PRICES: Record<BillingInterval, number> = { monthly: 299, yearly: 2499 };
/** Premium Plus is not on sale yet, so this is what's shown, not what's charged. */
export const PREMIUM_PLUS_YEARLY_PENCE = 5999;

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/** What a rider on the yearly plan saves against paying monthly for a year, as a whole percentage. */
export function yearlySavingPercent(): number {
  const monthlyForAYear = PREMIUM_PRICES.monthly * 12;
  return Math.round(((monthlyForAYear - PREMIUM_PRICES.yearly) / monthlyForAYear) * 100);
}

export interface PlanLimits {
  savedTrips: number;
  diaryEntries: number;
  photosPerDiaryEntry: number;
  /** Download the GPX of a whole multi-day tour. Day rides and routes are free. */
  tourGpx: boolean;
  /** Open the printable tour sheet. */
  tourSheet: boolean;
  /** The roads between routes are included in a planned trip's GPX. */
  tripGpxLegs: boolean;
  /** Import a ride from a GPX file into the diary. */
  diaryGpxImport: boolean;
}

/** Unlimited in practice; a real ceiling stops one account filling the database. */
const GENEROUS = { savedTrips: 200, diaryEntries: 5000, photosPerDiaryEntry: 20 };

export const FREE_LIMITS: PlanLimits = { savedTrips: 1, diaryEntries: 20, photosPerDiaryEntry: 3, tourGpx: false, tourSheet: false, tripGpxLegs: false, diaryGpxImport: false };
export const PREMIUM_LIMITS: PlanLimits = { ...GENEROUS, tourGpx: true, tourSheet: true, tripGpxLegs: true, diaryGpxImport: true };
/** What everyone gets while Premium isn't live yet: the site as it has always been. */
export const UNRESTRICTED_LIMITS: PlanLimits = { ...GENEROUS, savedTrips: 10, tourGpx: true, tourSheet: true, tripGpxLegs: true, diaryGpxImport: true };

export function limitsForTier(tier: TierId): PlanLimits {
  return tier === "free" ? FREE_LIMITS : PREMIUM_LIMITS;
}

export interface PlanFeature {
  text: string;
  /** "included" works today. "soon" is planned and is shown as coming, never as something a subscriber already has. */
  status: "included" | "soon";
}

const included = (text: string): PlanFeature => ({ text, status: "included" });
const soon = (text: string): PlanFeature => ({ text, status: "soon" });

export const PLAN_FEATURES: Record<TierId, PlanFeature[]> = {
  free: [
    included("Every route, day ride and tour page in full, with hazards, difficulty, bike suitability and when we last checked it"),
    included("Search, filters, map, contour and satellite views, and fuel, food and stay pins"),
    included("GPX download for any route and any single day ride"),
    included("Google and Apple Maps hand-off, and our guide to using GPX in Beeline, Garmin and TomTom"),
    included("Saved rides, ride diary (up to 20 entries, 3 photos each), reviews, rider tips, blog and advice guides"),
    included("Trip planner: build and export one saved trip at a time"),
    included("Report a problem on any route, and see road closures on the ride"),
  ],
  premium: [
    included("Full GPX download for every multi-day tour"),
    included("Printable tour sheets for riding with weak signal"),
    included("Unlimited saved trips in the planner, with the roads between routes included in the GPX"),
    included("Unlimited diary entries and photos, and GPX import into the diary"),
    soon("Roadbook PDFs to download and keep on your phone"),
    soon("Offline ride packs: a region's routes, maps, stops and notes with no signal"),
    soon("Route watchlist: a message when a saved route is re-checked, closed or changes"),
    soon("Early access to new tours before they're public"),
    soon("Advance notice and priority on new region launches"),
  ],
  premium_plus: [
    soon("Everything in Premium"),
    soon("Video ride recaps built from your diary GPX and photos"),
    soon("Ride-outs: publish a ride with a date and meeting point, public or to a private group, with a joining link and a GPX pack for everyone going"),
    soon("Group trip planning: a shared itinerary, per-rider stay and fuel notes, and a printable pack for each rider"),
    soon("Custom route request: two a year, where we plan or check a route to your brief"),
    soon("Nationwide offline pack: every region at once"),
    soon("Dead Cylinder Co. discount and a members' patch or sticker pack when you join"),
    soon("Founding member badge on your reviews and tips, and a direct line for feature requests"),
  ],
};
