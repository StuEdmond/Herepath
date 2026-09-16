import { pgTable, uuid, text, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { landmarkTypeEnum } from "./enums";
import { regions } from "./regions";
import { routes } from "./routes";

export const landmarks = pgTable("landmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: landmarkTypeEnum("type").notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const routeLandmarks = pgTable(
  "route_landmarks",
  {
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    landmarkId: uuid("landmark_id")
      .notNull()
      .references(() => landmarks.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.routeId, t.landmarkId] })],
);
