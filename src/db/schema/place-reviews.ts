import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { places } from "./places";

/** A rider's one-line tip about a place to eat or stay, left when logging a ride. One per rider per place. */
export const placeReviews = pgTable(
  "place_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("place_reviews_user_place").on(t.userId, t.placeId)],
);
