import { pgTable, text, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tripTargetEnum } from "./enums-social";

export const savedRides = pgTable(
  "saved_rides",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: tripTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);
