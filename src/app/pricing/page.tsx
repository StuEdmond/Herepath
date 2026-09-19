import type { Metadata } from "next";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { getContent, lines } from "@/lib/site-content";
import { joinWaitlist } from "../actions";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { joined } = await searchParams;
  const c = await getContent("pricing");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-[28px]">{c.title}</h1>
        <p className="mt-1 text-[14px] text-text-muted">{c.subtitle}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl bg-surface p-6">
          <div className="flex items-center justify-between">
            <Tag variant="neutral">{c.freeLabel}</Tag>
            <p className="text-[22px]">
              {c.freePrice} <span className="text-[13px] font-normal text-text-muted">{c.freePriceNote}</span>
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-[14px] text-text-secondary">
            {lines(c.freeFeatures).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/explore" className="mt-auto">
            <Button type="button" variant="primary" fullWidth>
              {c.freeCta}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-surface-raised bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-surface-raised px-3 py-1 text-[13px] font-medium text-text-secondary">
              {c.premiumLabel}
            </span>
            <p className="text-[22px] text-text-muted">{c.premiumPrice}</p>
          </div>
          <ul className="flex flex-col gap-2 text-[14px] text-text-secondary">
            {lines(c.premiumFeatures).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          {joined === "1" ? (
            <p className="mt-auto flex items-center gap-2 text-[14px] text-green-tint-text">
              <Check className="h-4 w-4" aria-hidden="true" />
              {c.waitlistSuccess}
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
                {c.waitlistButton}
              </Button>
            </form>
          )}
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
