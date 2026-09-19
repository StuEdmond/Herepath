import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { blogPosts } from "@/db/schema";
import { getRideOptions } from "@/lib/blog";
import { updateBlogPost, deleteBlogPost } from "../../actions";
import { PostForm } from "../../post-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const { id } = await params;
  const { error } = await searchParams;

  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.userId, session.user.id)));
  if (!post) notFound();
  const rides = await getRideOptions();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pt-6 pb-16">
      <Link href="/blog/mine" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Your posts
      </Link>
      <h1 className="text-[26px]">Edit post</h1>
      {post.status === "approved" && (
        <p className="rounded-lg bg-surface p-3 text-[14px] text-text-secondary">
          This post is live. If you save changes it will come down until our team has checked it again.
        </p>
      )}
      <PostForm
        action={updateBlogPost.bind(null, id)}
        rides={rides}
        error={error}
        submitLabel="Save and submit for review"
        defaults={{
          title: post.title,
          body: post.body,
          coverImage: post.coverImage,
          ride: post.targetType && post.targetId ? `${post.targetType}:${post.targetId}` : "",
        }}
      />
      <form action={deleteBlogPost.bind(null, id)} className="border-t border-surface-raised pt-4">
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete this post
        </Button>
      </form>
    </div>
  );
}
