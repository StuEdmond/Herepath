"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { blogPosts, blogPostReports } from "@/db/schema";

function revalidateBlog() {
  revalidatePath("/admin/blog-posts");
  revalidatePath("/admin");
  revalidatePath("/blog", "layout");
}

export async function approveBlogPost(id: string) {
  const [post] = await db.select({ publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id));
  if (!post) return;
  const now = new Date();
  await db
    .update(blogPosts)
    .set({ status: "approved", moderatorNote: null, reviewedAt: now, publishedAt: post.publishedAt ?? now })
    .where(eq(blogPosts.id, id));
  revalidateBlog();
}

/** Sends a post back to its author with an optional note. Also how a live post is taken down. */
export async function rejectBlogPost(id: string, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  await db.update(blogPosts).set({ status: "rejected", moderatorNote: note, reviewedAt: new Date() }).where(eq(blogPosts.id, id));
  await db.delete(blogPostReports).where(eq(blogPostReports.postId, id));
  revalidateBlog();
}

export async function deleteBlogPostAsAdmin(id: string) {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidateBlog();
}

export async function dismissBlogPostReports(id: string) {
  await db.delete(blogPostReports).where(eq(blogPostReports.postId, id));
  revalidateBlog();
}
