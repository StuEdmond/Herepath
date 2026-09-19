import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adviceArticles } from "@/db/schema";
import { ADVICE_CATEGORIES, categoryLabel } from "@/lib/advice";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Advice",
  description: "Pre-ride checks, camping essentials, tool kits and gear reviews for UK motorcyclists.",
};

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default async function AdvicePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = ADVICE_CATEGORIES.find((c) => c.value === category)?.value;

  const articles = await db
    .select()
    .from(adviceArticles)
    .where(active ? and(eq(adviceArticles.status, "published"), eq(adviceArticles.category, active)) : eq(adviceArticles.status, "published"))
    .orderBy(desc(adviceArticles.publishedAt));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pt-8 pb-12">
      <div>
        <h1 className="text-[28px]">Advice</h1>
        <p className="mt-1 text-text-secondary">Practical guides for getting the most out of your riding.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ value: undefined, label: "All" }, ...ADVICE_CATEGORIES].map((c) => (
          <Link
            key={c.label}
            href={c.value ? `/advice?category=${c.value}` : "/advice"}
            aria-current={active === c.value ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px]",
              active === c.value ? "bg-green-primary text-white" : "bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg bg-surface p-8 text-center">
          <p className="text-[16px] text-text-primary">Nothing here yet</p>
          <p className="text-[14px] text-text-muted">New guides are on the way — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/advice/${article.slug}`}>
              <Card>
                <CardImage src={article.coverImage ?? undefined} alt={article.title} />
                <CardBody>
                  <span className="text-[12px] text-text-muted">
                    {categoryLabel(article.category)}
                    {article.publishedAt ? ` · ${formatDate(article.publishedAt)}` : ""}
                  </span>
                  <h2 className="text-[17px]">{article.title}</h2>
                  {article.excerpt && <p className="text-[14px] text-text-secondary">{article.excerpt}</p>}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
