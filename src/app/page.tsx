import type { Metadata } from "next";
import Link from "next/link";
import { Route, ShieldCheck, Download, BookOpen, Share2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Herepath",
  description: "Ancient roads. Modern riders. Curated UK motorcycle routes, day rides and tours with honest ratings and GPX export.",
};

const BENEFIT_ICONS = [Route, ShieldCheck, Download, BookOpen, Share2, MapPinned] as const;

function BannerImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[420px] w-full rounded-2xl object-cover" />
    </section>
  );
}

export default async function HomePage() {
  const c = await getContent("home");

  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pt-12 pb-8 text-center">
        <h1 className="text-[34px] leading-tight">{c.heroTitle}</h1>
        <p className="max-w-xl text-[16px] text-text-secondary">{c.heroBody}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/explore">
            <Button type="button" variant="primary">
              {c.heroPrimaryCta}
            </Button>
          </Link>
          <Link href="/pricing">
            <Button type="button" variant="secondary">
              {c.heroSecondaryCta}
            </Button>
          </Link>
        </div>
        <p className="text-[13px] text-text-muted">{c.heroNote}</p>
      </section>

      <BannerImage src={c.heroImage} alt={c.heroImageAlt} />

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFIT_ICONS.map((Icon, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl bg-surface p-5">
            <Icon className="h-6 w-6 text-green-bright" aria-hidden="true" />
            <h3 className="text-[16px]">{c[`benefit${i + 1}Title`]}</h3>
            <p className="text-[14px] text-text-secondary">{c[`benefit${i + 1}Body`]}</p>
          </div>
        ))}
      </section>

      <BannerImage src={c.featureImage} alt={c.featureImageAlt} />

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <h2 className="text-center text-[24px]">{c.stepsHeading}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-2 rounded-xl bg-surface p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-tint-bg text-[13px] font-medium text-green-tint-text">
                {n}
              </span>
              <h3 className="text-[16px]">{c[`step${n}Title`]}</h3>
              <p className="text-[14px] text-text-secondary">{c[`step${n}Body`]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center">
        <h2 className="text-[24px]">{c.finalHeading}</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/explore">
            <Button type="button" variant="primary">
              {c.finalPrimaryCta}
            </Button>
          </Link>
          <Link href="/pricing">
            <Button type="button" variant="secondary">
              {c.finalSecondaryCta}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
