"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { getMembership, subscriptionsAvailable } from "@/lib/membership";
import { PREMIUM_PRICES, formatPence, type BillingInterval } from "@/lib/plans";
import { getStripe, siteUrl } from "@/lib/stripe";

/** Sends a signed-in rider to Stripe's checkout to subscribe to Premium. `plan` is "monthly" or "yearly". */
export async function startCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  if (!subscriptionsAvailable()) redirect("/pricing");

  const plan: BillingInterval = formData.get("plan") === "yearly" ? "yearly" : "monthly";
  const userId = session.user.id;
  const membership = await getMembership(userId);
  // Someone already paying manages their plan rather than buying a second one.
  if (membership.subscription?.paying) redirect("/account/settings");

  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  const [existing] = await db.select({ customer: subscriptions.stripeCustomerId }).from(subscriptions).where(eq(subscriptions.userId, userId));

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: PREMIUM_PRICES[plan],
          recurring: { interval: plan === "yearly" ? "year" : "month" },
          product_data: { name: "Herepath Premium", description: `${plan === "yearly" ? "Yearly" : "Monthly"} plan, ${formatPence(PREMIUM_PRICES[plan])}` },
        },
      },
    ],
    // Reuse the rider's Stripe customer if they've subscribed before, so their payment history stays in one place.
    ...(existing ? { customer: existing.customer } : { customer_email: user?.email ?? undefined }),
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    custom_text: {
      submit: { message: "Your Premium access starts straight away. You can cancel any time and keep it until the end of the period you've paid for." },
    },
    success_url: `${siteUrl()}/account/settings?subscribed=1`,
    cancel_url: `${siteUrl()}/pricing`,
  });

  if (!checkout.url) redirect("/pricing");
  redirect(checkout.url);
}

/** Opens Stripe's own page where a subscriber can change card, see invoices or cancel. */
export async function openBillingPortal() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const [row] = await db.select({ customer: subscriptions.stripeCustomerId }).from(subscriptions).where(eq(subscriptions.userId, session.user.id));
  if (!row) redirect("/account/settings");

  const portal = await getStripe().billingPortal.sessions.create({ customer: row.customer, return_url: `${siteUrl()}/account/settings` });
  redirect(portal.url);
}
