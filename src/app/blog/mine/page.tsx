import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { blogPosts } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export const metadata: Metadata = { title: "Your blog posts" };

const STATUS_LABEL = { pending: "Waiting for review", approved: "Live", rejected: "Not published" } as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function MyPostsPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const { submitted } = await searchParams;

  const posts = await db.select().from(blogPosts).where(eq(blogPosts.userId, session.user.id)).orderBy(desc(blogPosts.updatedAt));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pt-6 pb-16">
      <Link href="/profile" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Profile
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px]">Your blog posts</h1>
        <Link href="/blog/new">
          <Button type="button" variant="primary">
            Write a post
          </Button>
        </Link>
      </div>

      {submitted === "1" && (
        <p className="flex items-start gap-2 rounded-lg bg-surface p-3 text-[14px] text-text-secondary">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
          Thanks — your post is with our team. It will appear on the blog once it has been checked.
        </p>
      )}

      {posts.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">You haven&apos;t written anything yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-[17px]">{post.title}</h2>
                <Tag variant={post.status === "approved" ? "suited" : post.status === "rejected" ? "caution" : "neutral"}>
                  {STATUS_LABEL[post.status]}
                </Tag>
              </div>
              <p className="text-[13px] text-text-muted">Last updated {formatDate(post.updatedAt)}</p>
              {post.status === "rejected" && (
                <p className="rounded-lg bg-red-tint-bg p-3 text-[14px] text-red-tint-text">
                  {post.moderatorNote ? `From our team: ${post.moderatorNote}` : "Our team decided not to publish this post."} You can edit it and submit it
                  again.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link href={`/blog/${post.slug}`}>
                  <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
                    {post.status === "approved" ? "View" : "Preview"}
                  </Button>
                </Link>
                <Link href={`/blog/edit/${post.id}`}>
                  <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
