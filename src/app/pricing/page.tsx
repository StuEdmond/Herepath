import type { Metadata } from "next";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { joinWaitlist } from "../actions";

export const metadata: Metadata = { title: "Pricing" };

const FREE_FEATURES = [
  "Browse every route, day ride and tour",
  "Search, filters and map view",
  "Save rides and keep a ride diary",
  "GPX export and Google/Apple Maps hand-off",
  "Share your rides",
] as const;

const PREMIUM_FEATURES = [
  "Video ride recaps, built from your diary",
  "Offline-ready maps for weak-signal areas",
  "Unlimited cloud photo backup for your diary",
  "Early access to new tours",
  "Priority support and feature requests",
] as const;

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { joined } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-[28px]">Free to explore. Premium coming soon.</h1>
        <p className="mt-1 text-[14px] text-text-muted">No billing yet — Premium is on our roadmap, not live.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl bg-surface p-6">
          <div className="flex items-center justify-between">
            <Tag variant="neutral">Free</Tag>
            <p className="text-[22px]">
              £0 <span className="text-[13px] font-normal text-text-muted">forever</span>
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-[14px] text-text-secondary">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/explore" className="mt-auto">
            <Button type="button" variant="primary" fullWidth>
              Start exploring
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-surface-raised bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-surface-raised px-3 py-1 text-[13px] font-medium text-text-secondary">
              Premium · coming soon
            </span>
            <p className="text-[22px] text-text-muted">TBC</p>
          </div>
          <ul className="flex flex-col gap-2 text-[14px] text-text-secondary">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          {joined === "1" ? (
            <p className="mt-auto flex items-center gap-2 text-[14px] text-green-tint-text">
              <Check className="h-4 w-4" aria-hidden="true" />
              You&apos;re on the list — we&apos;ll email you when Premium launches.
            </p>
          ) : (
            <form action={joinWaitlist} className="mt-auto flex gap-2">
              <label className="sr-only" htmlFor="waitlist-email">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="min-h-11 flex-1 rounded-lg border border-text-muted/40 bg-surface px-3 text-[14px] text-text-primary"
              />
              <Button type="submit" variant="secondary" className="min-h-11 shrink-0 px-4 text-[13px]">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Notify me
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
