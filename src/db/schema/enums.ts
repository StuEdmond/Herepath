import { pgEnum } from "drizzle-orm/pg-core";

export const contentStatusEnum = pgEnum("content_status", ["draft", "published"]);

export const bikeTypeEnum = pgEnum("bike_type", [
  "sports",
  "naked_and_roadster",
  "adventure",
  "touring",
  "cruiser",
  "125cc_and_new_riders",
]);

export const suitabilityLevelEnum = pgEnum("suitability_level", ["suited", "caution"]);

export const surfaceQualityEnum = pgEnum("surface_quality", ["good", "mixed", "poor"]);

export const landmarkTypeEnum = pgEnum("landmark_type", [
  "castle",
  "reservoir",
  "pass",
  "viaduct",
  "viewpoint",
  "coast",
  "village",
  "other",
]);

export const placeTypeEnum = pgEnum("place_type", [
  "cafe",
  "pub",
  "restaurant",
  "fuel",
  "hotel",
  "b_and_b",
  "campsite",
]);

export const stopTypeEnum = pgEnum("stop_type", ["lunch", "coffee", "fuel"]);

export const dayRideStageKindEnum = pgEnum("day_ride_stage_kind", [
  "start",
  "route",
  "link",
  "stop",
  "finish",
]);
