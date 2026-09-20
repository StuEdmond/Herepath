import { pgEnum } from "drizzle-orm/pg-core";

/** What a review, saved ride, or diary entry points at. */
export const tripTargetEnum = pgEnum("trip_target", ["route", "day_ride", "tour"]);

/**
 * A rider's membership level as set by hand in admin (a free upgrade for testers, friends and founding members). A paid Stripe
 * subscription is stored separately and adds to this; see `src/lib/membership.ts`. Premium Plus is not on sale yet.
 */
export const membershipTierEnum = pgEnum("membership_tier", ["free", "premium", "premium_plus"]);
