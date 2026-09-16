import { pgTable, uuid, text, numeric, smallint, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { placeTypeEnum } from "./enums";

/** tags: bike_parking, secure_parking, hot_food, drying_room, hard_standing, pub_nearby */
export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: placeTypeEnum("type").notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  address: text("address"),
  websiteUrl: text("website_url"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  /** 1 = £, 2 = ££, 3 = £££ */
  priceBand: smallint("price_band"),
  shortDescription: text("short_description"),
  photo: text("photo"),
  isSuggested: boolean("is_suggested").notNull().default(false),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
