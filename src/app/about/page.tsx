import type { Metadata } from "next";
import Link from "next/link";
import { getContent, paragraphs } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "About",
  description: "Why it's called Herepath, and how the guide works.",
};

export default async function AboutPage() {
  const deadCylinderUrl = process.env.NEXT_PUBLIC_DEAD_CYLINDER_URL;
  const c = await getContent("about");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">{c.title}</h1>
        <p className="mt-1 text-text-secondary">{c.tagline}</p>
      </div>

      {c.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image} alt={c.imageAlt} className="max-h-80 w-full rounded-2xl object-cover" />
      )}

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">{c.s1Heading}</h2>
        {paragraphs(c.s1Body).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">{c.s2Heading}</h2>
        {paragraphs(c.s2Body).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
        <h2 className="text-[18px] text-text-primary">{c.s3Heading}</h2>
        <p>
          {c.s3Before}{" "}
          {deadCylinderUrl ? (
            <a href={deadCylinderUrl} className="text-green-bright underline hover:no-underline">
              Dead Cylinder Co.
            </a>
          ) : (
            <span>Dead Cylinder Co.</span>
          )}
          {c.s3After}
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
