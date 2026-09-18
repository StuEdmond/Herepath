import type { Metadata } from "next";
import Link from "next/link";
import { Route, ShieldCheck, Download, BookOpen, Share2, MapPinned, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { joinWaitlist } from "./actions";

export const metadata: Metadata = {
  title: "Herepath",
  description: "Ancient roads. Modern riders. Curated UK motorcycle routes, day rides and tours with honest ratings and GPX export.",
};

const BENEFITS = [
  {
    icon: Route,
    title: "Curated routes, day rides & tours",
    body: "Hand-picked UK roads, from a quick blast to a multi-day crossing.",
  },
  {
    icon: ShieldCheck,
    title: "Honest difficulty ratings",
    body: "Real difficulty and bike-suitability ratings, not marketing spin.",
  },
  {
    icon: Download,
    title: "GPX export & app hand-off",
    body: "Download a GPX file or open straight in Google Maps or Apple Maps.",
  },
  {
    icon: BookOpen,
    title: "Your ride diary",
    body: "Log every ride with photos, notes, weather and who you rode with.",
  },
  {
    icon: Share2,
    title: "Share your rides",
    body: "Branded share images for Instagram, X and Facebook, with a privacy safeguard built in.",
  },
  {
    icon: MapPinned,
    title: "Search, filter, map view",
    body: "Find a ride by region, difficulty, bike type, or a place name you already know.",
  },
] as const;

const STEPS = [
  { title: "Search & filter", body: "Find a route by region, difficulty or bike type." },
  { title: "Ride it your way", body: "Download the GPX or hand off to Google or Apple Maps." },
  { title: "Log & share", body: "Save it to your diary and share the ride if you want to." },
] as const;

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

export default async function HomePage({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { joined } = await searchParams;

  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pt-12 pb-8 text-center">
        <h1 className="text-[34px] leading-tight">Ancient roads. Modern riders.</h1>
        <p className="max-w-xl text-[16px] text-text-secondary">
          Herepath curates the best motorcycling roads in the UK — honestly rated, GPX-ready, and handed off to the
          maps app you already trust.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/explore">
            <Button type="button" variant="primary">
              Explore routes
            </Button>
          </Link>
          <Link href="#pricing">
            <Button type="button" variant="secondary">
              See what&apos;s free
            </Button>
          </Link>
        </div>
        <p className="text-[13px] text-text-muted">
          No credit card, browsing is free forever. We&apos;re in beta, so a few rides are illustrative sample content
          until real GPX recordings are uploaded.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2 rounded-xl bg-surface p-5">
            <Icon className="h-6 w-6 text-green-bright" aria-hidden="true" />
            <h3 className="text-[16px]">{title}</h3>
            <p className="text-[14px] text-text-secondary">{body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <h2 className="text-center text-[24px]">How it works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-2 rounded-xl bg-surface p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-tint-bg text-[13px] font-medium text-green-tint-text">
                {i + 1}
              </span>
              <h3 className="text-[16px]">{step.title}</h3>
              <p className="text-[14px] text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-5xl px-4 py-8 scroll-mt-6">
        <div className="text-center">
          <h2 className="text-[24px]">Free to explore. Premium coming soon.</h2>
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
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center">
        <h2 className="text-[24px]">Ready to find your next ride?</h2>
        <Link href="/explore">
          <Button type="button" variant="primary">
            Explore routes
          </Button>
        </Link>
      </section>
    </div>
  );
}
