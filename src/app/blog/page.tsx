import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { blogPosts, users } from "@/db/schema";
import { excerptOf } from "@/lib/blog-limits";
import { Button } from "@/components/ui/button";
import { Card, CardImage, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Rider blog",
  description: "Ride reports, road reviews and stories from Herepath riders.",
};

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default async function BlogPage() {
  const session = await auth();

  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
      coverImage: blogPosts.coverImage,
      publishedAt: blogPosts.publishedAt,
      author: users.name,
    })
    .from(blogPosts)
    .innerJoin(users, eq(blogPosts.userId, users.id))
    .where(eq(blogPosts.status, "approved"))
    .orderBy(desc(blogPosts.publishedAt));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pt-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px]">Rider blog</h1>
          <p className="mt-1 text-text-secondary">Ride reports and road reviews from Herepath riders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session?.user && (
            <Link href="/blog/mine">
              <Button type="button" variant="secondary">
                Your posts
              </Button>
            </Link>
          )}
          <Link href="/blog/new">
            <Button type="button" variant="primary">
              Write a post
            </Button>
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg bg-surface p-8 text-center">
          <p className="text-[16px] text-text-primary">No posts yet</p>
          <p className="text-[14px] text-text-muted">Be the first — tell other riders about a road you&apos;ve ridden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card>
                <CardImage src={post.coverImage ?? undefined} alt={post.title} />
                <CardBody>
                  <span className="text-[12px] text-text-muted">
                    {post.author ?? "A rider"} · {formatDate(post.publishedAt)}
                  </span>
                  <h2 className="text-[17px]">{post.title}</h2>
                  <p className="text-[14px] text-text-secondary">{excerptOf(post.body)}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="text-[13px] text-text-muted">
        Posts are written by riders and checked by our team before they appear. See the{" "}
        <Link href="/faq#guidelines" className="underline hover:text-text-secondary">
          community guidelines
        </Link>
        .
      </p>
    </div>
  );
}
