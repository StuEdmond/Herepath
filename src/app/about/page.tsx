import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Why it's called Herepath, and how the guide works.",
};

export default function AboutPage() {
  const deadCylinderUrl = process.env.NEXT_PUBLIC_DEAD_CYLINDER_URL;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">About Herepath</h1>
        <p className="mt-1 text-text-secondary">Ancient roads. Modern riders.</p>
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">Where the name comes from</h2>
        <p>
          A herepath — pronounced &ldquo;here-path&rdquo; — was an Old English &ldquo;army path&rdquo;: a road used by
          King Alfred&apos;s forces across ninth-century Wessex, and relied on for generations afterwards by ordinary
          travellers making long journeys across the country.
        </p>
        <p>
          We liked the idea of roads that outlast the reasons they were first built — the same spirit behind the
          passes and moorland roads on this site, most of them centuries old and still the best way to see Britain
          from a bike.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">What Herepath is</h2>
        <p>
          Herepath is a guide first, an app second. We curate UK motorcycle routes, day rides and multi-day tours
          with honest difficulty and bike-suitability ratings, then hand you off to the navigation app you already
          use — Google Maps, Apple Maps, or a GPX file for your own device. We don&apos;t do turn-by-turn navigation
          ourselves.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">Dead Cylinder Co.</h2>
        <p>
          Herepath has its own identity but is made by the same people behind{" "}
          {deadCylinderUrl ? (
            <a href={deadCylinderUrl} className="text-green-bright underline hover:no-underline">
              Dead Cylinder Co.
            </a>
          ) : (
            <span>Dead Cylinder Co.</span>
          )}
          , a British motorcycle heritage apparel brand.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-4 text-[14px] text-text-muted">
        <p>
          Read our{" "}
          <Link href="/privacy" className="text-text-secondary underline hover:text-text-primary">
            privacy policy
          </Link>{" "}
          for how we handle your data.
        </p>
      </div>
    </div>
  );
}
