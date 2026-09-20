import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { getMembership, subscriptionsAvailable } from "@/lib/membership";
import {
  PLAN_FEATURES,
  PREMIUM_PLUS_YEARLY_PENCE,
  PREMIUM_PRICES,
  formatPence,
  yearlySavingPercent,
  type BillingInterval,
  type PlanFeature,
} from "@/lib/plans";
import { getContent } from "@/lib/site-content";
import { startCheckout } from "../billing/actions";
import { joinWaitlist } from "../actions";

export const metadata: Metadata = { title: "Pricing" };

const NEEDS: Record<string, string> = {
  "tour-gpx": "The full GPX file for a whole tour is part of Premium. Each day's GPX is free from the tour page.",
  "tour-sheet": "Printable tour sheets are part of Premium.",
  diary: "Your free diary is full. Premium keeps an unlimited diary.",
};

function FeatureList({ features }: { features: PlanFeature[] }) {
  return (
    <ul className="flex flex-col gap-2 text-[14px] text-text-secondary">
      {features.map((feature) => (
        <li key={feature.text} className="flex items-start gap-2">
          {feature.status === "included" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          )}
          <span className={feature.status === "soon" ? "text-text-muted" : undefined}>
            {feature.text}
            {feature.status === "soon" && <span className="ml-1.5 whitespace-nowrap rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-text-muted">Coming soon</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WaitlistForm({ interest, joined, buttonLabel, successText, id }: { interest: "premium" | "premium_plus"; joined: string | undefined; buttonLabel: string; successText: string; id: string }) {
  if (joined === interest) {
    return (
      <p className="mt-auto flex items-center gap-2 text-[14px] text-green-tint-text">
        <Check className="h-4 w-4" aria-hidden="true" />
        {successText}
      </p>
    );
  }
  return (
    <form action={joinWaitlist} className="mt-auto flex gap-2">
      <input type="hidden" name="interest" value={interest} />
      <label className="sr-only" htmlFor={id}>
        Email address
      </label>
      <input
        id={id}
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-text-muted/40 bg-surface px-3 text-[14px] text-text-primary"
      />
      <Button type="submit" variant="secondary" className="min-h-11 shrink-0 px-4 text-[13px]">
        <Mail className="h-4 w-4" aria-hidden="true" />
        {buttonLabel}
      </Button>
    </form>
  );
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ joined?: string; billing?: string; need?: string }> }) {
  const { joined, billing, need } = await searchParams;
  const c = await getContent("pricing");
  const session = await auth();
  const membership = await getMembership(session?.user?.id);
  const canSubscribe = subscriptionsAvailable();

  const interval: BillingInterval = billing === "monthly" ? "monthly" : "yearly";
  const premiumPence = PREMIUM_PRICES[interval];
  const saving = yearlySavingPercent();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-[28px]">{c.title}</h1>
        <p className="mt-1 text-[14px] text-text-muted">{c.subtitle}</p>
      </div>

      {need && NEEDS[need] && (
        <p className="mx-auto mt-4 max-w-2xl rounded-xl bg-surface p-3 text-center text-[14px] text-text-secondary" role="note">
          {NEEDS[need]}
        </p>
      )}

      <div className="mt-6 flex justify-center" role="tablist" aria-label="Billing period">
        <div className="inline-flex rounded-full bg-surface p-1 text-[13px]">
          {(["yearly", "monthly"] as const).map((option) => (
            <Link
              key={option}
              href={`/pricing?billing=${option}`}
              role="tab"
              aria-selected={interval === option}
              className={`rounded-full px-4 py-1.5 font-medium ${interval === option ? "bg-green-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
            >
              {option === "yearly" ? `Yearly (save ${saving}%)` : "Monthly"}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Free */}
        <div className="flex flex-col gap-4 rounded-xl bg-surface p-6">
          <div className="flex items-center justify-between">
            <Tag variant="neutral">Free</Tag>
            <p className="text-[22px]">
              £0 <span className="text-[13px] font-normal text-text-muted">forever</span>
            </p>
          </div>
          <FeatureList features={PLAN_FEATURES.free} />
          <Link href="/explore" className="mt-auto">
            <Button type="button" variant="primary" fullWidth>
              Start exploring
            </Button>
          </Link>
        </div>

        {/* Premium */}
        <div className="flex flex-col gap-4 rounded-xl border border-green-primary bg-surface p-6">
          <div className="flex items-center justify-between gap-2">
            <Tag variant="suited">Premium</Tag>
            <p className="text-[22px]">
              {formatPence(premiumPence)} <span className="text-[13px] font-normal text-text-muted">{interval === "yearly" ? "a year" : "a month"}</span>
            </p>
          </div>
          {interval === "yearly" && <p className="-mt-2 text-right text-[12px] text-text-muted">That&apos;s {formatPence(Math.round(PREMIUM_PRICES.yearly / 12))} a month</p>}
          <p className="text-[13px] text-text-muted">For weekends away and the occasional tour. Everything in Free, plus:</p>
          <FeatureList features={PLAN_FEATURES.premium} />

          {membership.tier !== "free" ? (
            <div className="mt-auto flex flex-col gap-2">
              <p className="flex items-center gap-2 text-[14px] text-green-tint-text">
                <Check className="h-4 w-4" aria-hidden="true" />
                {membership.tier === "premium_plus" ? "You have Premium Plus." : "You have Premium."}
              </p>
              <Link href="/account/settings" className="text-[13px] text-green-bright underline">
                Manage your plan
              </Link>
            </div>
          ) : canSubscribe ? (
            <form action={startCheckout} className="mt-auto flex flex-col gap-2">
              <input type="hidden" name="plan" value={interval} />
              <Button type="submit" variant="primary" fullWidth>
                Subscribe for {formatPence(premiumPence)} {interval === "yearly" ? "a year" : "a month"}
              </Button>
              <p className="text-[12px] text-text-muted">
                {session?.user ? "" : "You'll be asked to sign in first. "}
                Cancel any time from your account settings and keep Premium until the end of the period you&apos;ve paid for.
              </p>
            </form>
          ) : (
            <WaitlistForm interest="premium" joined={joined} buttonLabel={c.waitlistButton} successText={c.waitlistSuccess} id="waitlist-premium" />
          )}
        </div>

        {/* Premium Plus */}
        <div className="flex flex-col gap-4 rounded-xl bg-surface p-6 opacity-95">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-surface-raised px-3 py-1 text-[13px] font-medium text-text-secondary">Premium Plus</span>
            <p className="text-[22px] text-text-muted">
              {formatPence(PREMIUM_PLUS_YEARLY_PENCE)} <span className="text-[13px] font-normal">a year</span>
            </p>
          </div>
          <p className="-mt-2 text-right text-[12px] text-text-muted">Planned price. Coming soon.</p>
          <p className="text-[13px] text-text-muted">For clubs, tour leaders and heavy users. Everything in Premium, plus:</p>
          <FeatureList features={PLAN_FEATURES.premium_plus.filter((f) => f.text !== "Everything in Premium")} />
          <WaitlistForm interest="premium_plus" joined={joined} buttonLabel="Tell me" successText="You're on the list. We'll email you when it's ready." id="waitlist-plus" />
        </div>
      </div>

      {c.offlineNote.trim() && (
        <p className="mt-6 rounded-xl bg-surface p-4 text-[14px] text-text-secondary">
          <span className="font-medium text-text-primary">No signal? </span>
          {c.offlineNote}
        </p>
      )}
    </div>
  );
}
