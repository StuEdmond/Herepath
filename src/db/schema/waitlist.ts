import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** Which plan they want to hear about: "premium" or "premium_plus". */
    interest: text("interest").notNull().default("premium"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // The same person can be on the list for both plans.
  (table) => [uniqueIndex("waitlist_email_interest_unique").on(table.email, table.interest)],
);
