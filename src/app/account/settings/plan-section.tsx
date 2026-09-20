import Link from "next/link";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { getMembership, subscriptionsAvailable } from "@/lib/membership";
import { PREMIUM_PRICES, TIER_LABELS, formatPence } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { openBillingPortal } from "@/app/billing/actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** The rider's plan on their settings page: what they have, when it renews or ends, and how to change it. */
export async function PlanSection({ userId, justSubscribed }: { userId: string; justSubscribed: boolean }) {
  const membership = await getMembership(userId);
  const subscription = membership.subscription;
  const canManageBilling = !!subscription && stripeConfigured();

  let message: string;
  if (membership.source === "subscription" && subscription) {
    const billed = subscription.plan === "yearly" ? `${formatPence(PREMIUM_PRICES.yearly)} a year` : `${formatPence(PREMIUM_PRICES.monthly)} a month`;
    const when = subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : null;
    if (subscription.status === "past_due") message = "Your last payment didn't go through. Update your card to keep Premium.";
    else if (subscription.cancelAtPeriodEnd) message = `Your subscription has been cancelled. You keep Premium${when ? ` until ${when}` : " until the end of the period you've paid for"}.`;
    else message = `${billed}${when ? `. Renews on ${when}` : ""}.`;
  } else if (membership.source === "admin") {
    message = membership.tier === "premium_plus" ? "Premium Plus was added to your account by the Herepath team." : "Premium was added to your account by the Herepath team. Thanks for helping us test.";
  } else if (subscriptionsAvailable()) {
    message = "You're on the free plan.";
  } else {
    message = "Premium is coming soon.";
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      {justSubscribed && (
        <p className="rounded-lg bg-green-tint-bg p-3 text-[13px] text-green-tint-text" role="status">
          {membership.tier === "free" ? "Thanks. Your payment went through and your plan will show here in a moment. Refresh in a few seconds." : "Thanks for subscribing. Premium is now on your account."}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag variant={membership.tier === "free" ? "neutral" : "suited"}>{TIER_LABELS[membership.tier]}</Tag>
          <span className="text-[13px] text-text-muted">{message}</span>
        </div>
        {membership.tier === "free" && (
          <Link href="/pricing" className="text-[13px] text-green-bright underline">
            See what&apos;s included
          </Link>
        )}
      </div>
      {canManageBilling && (
        <form action={openBillingPortal} className="flex flex-col gap-1">
          <Button type="submit" variant="secondary" className="min-h-10 w-fit px-4 text-[14px]">
            Manage billing
          </Button>
          <span className="text-[12px] text-text-muted">Change your card, see invoices or cancel, on Stripe&apos;s secure page.</span>
        </form>
      )}
    </div>
  );
}
