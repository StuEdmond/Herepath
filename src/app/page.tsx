import type { Metadata } from "next";
import Link from "next/link";
import { Route, ShieldCheck, Download, BookOpen, Share2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function HomePage() {
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
          <Link href="/pricing">
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

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center">
        <h2 className="text-[24px]">Ready to find your next ride?</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/explore">
            <Button type="button" variant="primary">
              Explore routes
            </Button>
          </Link>
          <Link href="/pricing">
            <Button type="button" variant="secondary">
              See pricing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
