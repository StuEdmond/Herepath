import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/site-content";

export const metadata: Metadata = { title: "FAQ" };

const FAQ_SLOTS = 12;

export default async function FaqPage() {
  const c = await getContent("faq");
  const items = Array.from({ length: FAQ_SLOTS }, (_, i) => ({ q: c[`q${i + 1}`], a: c[`a${i + 1}`] })).filter((item) => item.q);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">{c.title}</h1>
      </div>

      <div className="flex flex-col gap-2">
        {items.map(({ q, a }) => (
          <details key={q} className="group rounded-xl bg-surface p-4 open:pb-4">
            <summary className="cursor-pointer list-none text-[15px] text-text-primary marker:content-none">{q}</summary>
            <p className="mt-2 whitespace-pre-line text-[14px] text-text-secondary">{a}</p>
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
