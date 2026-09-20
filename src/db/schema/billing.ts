import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * A rider's paid Premium subscription, mirrored from Stripe by its webhooks. Stripe is the source of truth; this is what the site reads.
 * A rider whose membership was set by hand in admin has no row here, and a row never changes that setting.
 */
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  /** Stripe's own status: active, trialing, past_due, canceled, unpaid, incomplete and so on. */
  status: text("status").notNull(),
  /** "monthly" or "yearly". */
  plan: text("plan").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Stripe events already handled, so one that is delivered twice (which Stripe does) changes nothing the second time. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});
