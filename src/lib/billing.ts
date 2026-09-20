import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { stripeEvents, subscriptions, users } from "@/db/schema";
import { getStripe, stripeConfigured } from "./stripe";

/** Keeping our copy of a rider's subscription in step with Stripe's, and stopping billing when an account is deleted. */

function planOf(subscription: Stripe.Subscription): "monthly" | "yearly" {
  return subscription.items.data[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
}

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  return typeof value === "string" ? value : (value?.id ?? null);
}

/** The rider a subscription belongs to: the id we put on it at checkout, or failing that whoever already has that Stripe customer. */
async function userIdFor(subscription: Stripe.Subscription, fallback?: string | null): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId || fallback || null;
  if (fromMetadata) {
    const [found] = await db.select({ id: users.id }).from(users).where(eq(users.id, fromMetadata));
    if (found) return found.id;
  }
  const customer = customerId(subscription.customer);
  if (!customer) return null;
  const [existing] = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeCustomerId, customer));
  return existing?.userId ?? null;
}

/** Saves a subscription as Stripe describes it. Returns false if it can't be tied to a rider. */
export async function applySubscription(subscription: Stripe.Subscription, fallbackUserId?: string | null): Promise<boolean> {
  const userId = await userIdFor(subscription, fallbackUserId);
  const customer = customerId(subscription.customer);
  if (!userId || !customer) return false;

  const periodEnd = subscription.items.data[0]?.current_period_end;
  const values = {
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    plan: planOf(subscription),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  };
  await db
    .insert(subscriptions)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: subscriptions.userId, set: values });
  return true;
}

/**
 * Handles one Stripe event. Returns "handled" or "ignored" (an event we don't use). Throws if something went wrong, so the webhook
 * answers with an error and Stripe sends it again.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<"handled" | "ignored"> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return "ignored";
      const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const subscription = await getStripe().subscriptions.retrieve(id);
      if (!(await applySubscription(subscription, session.client_reference_id))) throw new Error(`Subscription ${id} couldn't be tied to a rider`);
      return "handled";
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // A subscription we can't tie to a rider is one made outside the site; nothing for us to do.
      await applySubscription(event.data.object);
      return "handled";
    }
    default:
      return "ignored";
  }
}

/**
 * Records that an event is being handled, returning false if it already was (Stripe delivers some twice). If handling then fails the
 * record is removed so Stripe's retry gets a fresh go.
 */
export async function claimStripeEvent(event: Stripe.Event): Promise<boolean> {
  const claimed = await db.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning({ id: stripeEvents.id });
  return claimed.length > 0;
}

export async function releaseStripeEvent(eventId: string): Promise<void> {
  await db.delete(stripeEvents).where(eq(stripeEvents.id, eventId));
}

/**
 * Ends a rider's Stripe subscription straight away, for when their account is being deleted, so nobody is charged for an account that
 * no longer exists. Does nothing if they have none or Stripe isn't set up.
 */
export async function cancelSubscriptionForUser(userId: string): Promise<void> {
  if (!stripeConfigured()) return;
  const [row] = await db.select({ id: subscriptions.stripeSubscriptionId, status: subscriptions.status }).from(subscriptions).where(eq(subscriptions.userId, userId));
  if (!row || row.status === "canceled") return;
  try {
    await getStripe().subscriptions.cancel(row.id);
  } catch (error) {
    // Already gone at Stripe's end is fine; anything else must stop the deletion so the rider isn't left paying for nothing.
    const code = (error as { code?: string }).code;
    if (code !== "resource_missing") throw error;
  }
}
