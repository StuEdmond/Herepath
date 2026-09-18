import { pgEnum } from "drizzle-orm/pg-core";

/** What a review, saved ride, or diary entry points at. */
export const tripTargetEnum = pgEnum("trip_target", ["route", "day_ride", "tour"]);

/** A rider's membership tier. No billing yet — set manually in admin ahead of a real Premium launch. */
export const membershipTierEnum = pgEnum("membership_tier", ["free", "premium"]);
