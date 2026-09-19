import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db/client";
import { adviceArticles } from "@/db/schema";
import { categoryLabel, parseArticleBody, readingMinutes } from "@/lib/advice";
import { Button } from "@/components/ui/button";

async function getArticle(slug: string) {
  const [article] = await db.select().from(adviceArticles).where(eq(adviceArticles.slug, slug));
  return article && article.status === "published" ? article : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  const description = article.excerpt || article.body.slice(0, 155);
  return {
    title: article.title,
    description,
    openGraph: {
      title: `${article.title} · Herepath`,
      description,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: article.title, description, images: article.coverImage ? [article.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const blocks = parseArticleBody(article.body);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pt-6 pb-16">
      <Link href="/advice" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All advice
      </Link>

      <header className="flex flex-col gap-2">
        <span className="text-[13px] text-text-muted">
          {categoryLabel(article.category)}
          {article.publishedAt ? ` · ${article.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}
          {` · ${readingMinutes(article.body)} min read`}
        </span>
        <h1 className="text-[30px] leading-tight">{article.title}</h1>
        {article.excerpt && <p className="text-[16px] text-text-secondary">{article.excerpt}</p>}
      </header>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt="" className="max-h-96 w-full rounded-2xl object-cover" />
      )}

      <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-text-secondary">
        {blocks.map((block, i) => {
          if (block.kind === "heading") {
            return (
              <h2 key={i} className="mt-2 text-[22px] text-text-primary">
                {block.text}
              </h2>
            );
          }
          if (block.kind === "list") {
            return (
              <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="whitespace-pre-line">
              {block.text}
            </p>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col items-start gap-2 rounded-xl bg-surface p-5">
        <p className="text-[16px] text-text-primary">Ready to put it into practice?</p>
        <Link href="/explore">
          <Button type="button" variant="primary">
            Find your next ride
          </Button>
        </Link>
      </div>
    </article>
  );
}
