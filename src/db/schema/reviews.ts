import { pgTable, uuid, text, smallint, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tripTargetEnum } from "./enums-social";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: tripTargetEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  rating: smallint("rating").notNull(),
  text: text("text"),
  bikeRidden: text("bike_ridden"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
