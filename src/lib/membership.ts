import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { FREE_LIMITS, TIER_RANK, UNRESTRICTED_LIMITS, limitsForTier, type BillingInterval, type PlanLimits, type TierId } from "./plans";
import { stripeConfigured } from "./stripe";

/**
 * What a rider is entitled to. A rider's level is the higher of two things: the membership set by hand in admin (for testers,
 * friends and founding members) and a paid Stripe subscription. The subscription never overwrites the admin setting, so ending
 * a subscription can't take away a level someone was given.
 *
 * Until `PREMIUM_LIVE=on`, Premium isn't on sale and nothing is limited: the site works as it did before there were plans.
 */

export function premiumLive(): boolean {
  return process.env.PREMIUM_LIVE?.trim().toLowerCase() === "on";
}

/** Riders can subscribe only when Premium is live and Stripe is set up. */
export function subscriptionsAvailable(): boolean {
  return premiumLive() && stripeConfigured();
}

/** Stripe statuses that still give Premium. `past_due` is included: Stripe is still retrying the card, and cutting a rider off during that would be harsh. */
const PAYING_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface SubscriptionInfo {
  status: string;
  plan: BillingInterval;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  /** Whether it currently gives Premium. */
  paying: boolean;
}

export interface Membership {
  tier: TierId;
  /** Where the level comes from: a paid subscription, or set by hand in admin. */
  source: "subscription" | "admin" | "none";
  adminTier: TierId;
  subscription: SubscriptionInfo | null;
}

const NONE: Membership = { tier: "free", source: "none", adminTier: "free", subscription: null };

export async function getMembership(userId: string | null | undefined): Promise<Membership> {
  if (!userId) return NONE;
  const [row] = await db
    .select({ adminTier: users.membershipTier, subscription: subscriptions })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(eq(users.id, userId));
  if (!row) return NONE;

  const subscription: SubscriptionInfo | null = row.subscription
    ? {
        status: row.subscription.status,
        plan: row.subscription.plan === "yearly" ? "yearly" : "monthly",
        currentPeriodEnd: row.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: row.subscription.cancelAtPeriodEnd,
        paying: PAYING_STATUSES.has(row.subscription.status),
      }
    : null;

  const fromSubscription: TierId = subscription?.paying ? "premium" : "free";
  const tier = TIER_RANK[fromSubscription] > TIER_RANK[row.adminTier] ? fromSubscription : row.adminTier;
  const source = tier === "free" ? "none" : fromSubscription === tier && TIER_RANK[fromSubscription] > TIER_RANK[row.adminTier] ? "subscription" : "admin";
  return { tier, source, adminTier: row.adminTier, subscription };
}

/** What this rider can do right now. */
export async function getLimits(userId: string | null | undefined): Promise<PlanLimits> {
  if (!premiumLive()) return UNRESTRICTED_LIMITS;
  if (!userId) return FREE_LIMITS;
  return limitsForTier((await getMembership(userId)).tier);
}
