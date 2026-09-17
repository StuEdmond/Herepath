import { pgEnum } from "drizzle-orm/pg-core";

/** What a review, saved ride, or diary entry points at. */
export const tripTargetEnum = pgEnum("trip_target", ["route", "day_ride", "tour"]);
