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

/** A rider flagging a tip for admin to look at. One report per rider per tip. */
export const placeReviewReports = pgTable(
  "place_review_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeReviewId: uuid("place_review_id")
      .notNull()
      .references(() => placeReviews.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("place_review_reports_once").on(t.placeReviewId, t.reporterId)],
);
