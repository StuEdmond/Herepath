import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Is Herepath free to use?",
    a: "Yes. Browsing, searching, saving rides and keeping a ride diary are all free. We're planning an optional Premium tier — see the pricing section on the home page for what's coming.",
  },
  {
    q: "Do I need an account?",
    a: "No account is needed to browse routes, day rides and tours. You'll need a free account to save rides, keep a diary, or leave a review.",
  },
  {
    q: "How are difficulty and bike-suitability ratings decided?",
    a: "They're set by hand based on road surface, technicality and how exposed a route is to weather — not generated automatically.",
  },
  {
    q: "Can I download a GPX file for my own sat-nav or app?",
    a: "Yes. Every route, day ride and tour page has a GPX download, plus direct hand-off buttons for Google Maps and Apple Maps.",
  },
  {
    q: "Do you provide turn-by-turn navigation?",
    a: "No — Herepath is a guide first. We hand you off to the navigation app you already use rather than building our own.",
  },
  {
    q: "Can I share my rides?",
    a: "Yes. Diary entries and public ride pages have a share button that generates a branded image for Instagram, X or Facebook, or you can just copy a link.",
  },
  {
    q: "Is my ride data private?",
    a: "Shared route maps trim the first and last half mile so a ride doesn't reveal where you live or keep your bike. Only what you choose to share publicly is visible to others.",
  },
  {
    q: "Why do some rides say \"Sample content\"?",
    a: "We're in beta. A handful of routes are illustrative until we've collected real GPX recordings from riders — those are clearly tagged so you know what you're looking at.",
  },
  {
    q: "What's coming next?",
    a: "Real GPX-recorded routes replacing the remaining sample content, an optional Premium tier, and video ride recaps built from your diary.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">Frequently asked questions</h1>
      </div>

      <div className="flex flex-col gap-2">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group rounded-xl bg-surface p-4 open:pb-4">
            <summary className="cursor-pointer list-none text-[15px] text-text-primary marker:content-none">
              {q}
            </summary>
            <p className="mt-2 text-[14px] text-text-secondary">{a}</p>
          </details>
        ))}
      </div>

      <p className="mt-4 text-[14px] text-text-muted">
        Didn&apos;t find your answer?{" "}
        <Link href="/contact" className="text-text-secondary underline hover:text-text-primary">
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}
