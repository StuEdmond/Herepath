import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { blogPosts, users } from "@/db/schema";
import { excerptOf } from "@/lib/blog-limits";
import { getLinkedRide } from "@/lib/blog";
import { ArticleBody } from "@/components/ui/article-body";
import { ReportButton } from "@/components/ui/report-button";
import { Button } from "@/components/ui/button";
import { reportBlogPost } from "../actions";

async function getPost(slug: string) {
  const [row] = await db
    .select({ post: blogPosts, author: users.name })
    .from(blogPosts)
    .innerJoin(users, eq(blogPosts.userId, users.id))
    .where(eq(blogPosts.slug, slug));
  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPost(slug);
  // Only live posts are ever described to search engines and link previews.
  if (!row || row.post.status !== "approved") return { robots: { index: false } };

  const description = excerptOf(row.post.body, 155);
  return {
    title: row.post.title,
    description,
    openGraph: {
      title: `${row.post.title} · Herepath`,
      description,
      images: row.post.coverImage ? [{ url: row.post.coverImage }] : undefined,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: row.post.title, description, images: row.post.coverImage ? [row.post.coverImage] : undefined },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getPost(slug);
  if (!row) notFound();

  const { post, author } = row;
  const session = await auth();
  const isOwner = session?.user?.id === post.userId;
  // Live posts are public; a rider can also preview their own post while it waits for review.
  if (post.status !== "approved" && !isOwner) notFound();

  const ride = await getLinkedRide(post.targetType, post.targetId);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pt-6 pb-16">
      <Link href="/blog" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Rider blog
      </Link>

      {post.status !== "approved" && (
        <p className="rounded-lg bg-surface p-3 text-[14px] text-text-secondary">
          {post.status === "pending"
            ? "Only you can see this — it's waiting for our team to check it."
            : "Only you can see this — it hasn't been published. You can edit it and submit it again."}{" "}
          <Link href={`/blog/edit/${post.id}`} className="text-green-bright underline">
            Edit
          </Link>
        </p>
      )}

      <header className="flex flex-col gap-2">
        <span className="text-[13px] text-text-muted">
          By {author ?? "a rider"}
          {post.publishedAt ? ` · ${post.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}
        </span>
        <h1 className="text-[30px] leading-tight">{post.title}</h1>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="max-h-96 w-full rounded-2xl object-cover" />
      )}

      <ArticleBody text={post.body} />

      {ride && (
        <Link href={ride.href} className="flex items-center gap-3 rounded-xl bg-surface p-4 hover:bg-surface-raised">
          <RouteIcon className="h-5 w-5 shrink-0 text-green-bright" aria-hidden="true" />
          <span className="flex flex-col">
            <span className="text-[12px] text-text-muted">This post is about</span>
            <span className="text-[16px] text-text-primary">
              {ride.name} <span className="text-[13px] text-text-muted">· {ride.label}</span>
            </span>
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-3">
        <p className="text-[13px] text-text-muted">
          Posts on Herepath are written by riders and checked by our team. See the{" "}
          <Link href="/faq#guidelines" className="underline hover:text-text-secondary">
            community guidelines
          </Link>
          .
        </p>
        {post.status === "approved" && !isOwner && (
          <ReportButton action={reportBlogPost} targetId={post.id} signedIn={!!session?.user?.id} label="Report this post" />
        )}
      </div>

      <div className="mt-2 flex flex-col items-start gap-2 rounded-xl bg-surface p-5">
        <p className="text-[16px] text-text-primary">Got a story of your own?</p>
        <Link href="/blog/new">
          <Button type="button" variant="primary">
            Write a post
          </Button>
        </Link>
      </div>
    </article>
  );
}
