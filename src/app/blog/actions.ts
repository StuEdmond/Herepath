"use server";

import { randomBytes } from "node:crypto";
import { and, count, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { blogPosts, blogPostReports } from "@/db/schema";
import { BLOG_BODY_MAX, BLOG_BODY_MIN, BLOG_MAX_PENDING, BLOG_TITLE_MAX } from "@/lib/blog-limits";
import { resolveRideChoice } from "@/lib/blog";
import { REPORT_REASONS, type ReportResult } from "@/lib/report";
import { slugify } from "@/lib/slug";
import { uploadedImage } from "@/lib/storage";

async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  return session.user.id;
}

/** Reads and checks the write form. Problems send the rider back to the form with a message code. */
async function readPostForm(formData: FormData, backTo: string) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();

  if (formData.get("guidelines") !== "on") redirect(`${backTo}?error=guidelines`);
  if (!title || title.length > BLOG_TITLE_MAX) redirect(`${backTo}?error=title`);
  if (body.length < BLOG_BODY_MIN || body.length > BLOG_BODY_MAX) redirect(`${backTo}?error=body`);

  const ride = await resolveRideChoice(String(formData.get("ride") ?? ""));
  return { title, body, ride };
}

export async function createBlogPost(formData: FormData) {
  const userId = await requireUser();
  const { title, body, ride } = await readPostForm(formData, "/blog/new");

  const [{ waiting }] = await db
    .select({ waiting: count() })
    .from(blogPosts)
    .where(and(eq(blogPosts.userId, userId), eq(blogPosts.status, "pending")));
  if (waiting >= BLOG_MAX_PENDING) redirect("/blog/new?error=limit");

  const coverImage = await uploadedImage(formData, "coverImageFile", "blog");
  await db.insert(blogPosts).values({
    userId,
    title,
    body,
    coverImage,
    targetType: ride?.type ?? null,
    targetId: ride?.id ?? null,
    slug: `${slugify(title) || "post"}-${randomBytes(3).toString("hex")}`,
    status: "pending",
  });

  revalidatePath("/admin/blog-posts");
  revalidatePath("/admin");
  redirect("/blog/mine?submitted=1");
}

/** Editing sends a post back to the moderators, so an approved post can't be swapped for something else afterwards. */
export async function updateBlogPost(id: string, formData: FormData) {
  const userId = await requireUser();
  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.userId, userId)));
  if (!post) redirect("/blog/mine");

  const { title, body, ride } = await readPostForm(formData, `/blog/edit/${id}`);

  if (post.status !== "pending") {
    const [{ waiting }] = await db
      .select({ waiting: count() })
      .from(blogPosts)
      .where(and(eq(blogPosts.userId, userId), eq(blogPosts.status, "pending"), ne(blogPosts.id, id)));
    if (waiting >= BLOG_MAX_PENDING) redirect(`/blog/edit/${id}?error=limit`);
  }

  const uploaded = await uploadedImage(formData, "coverImageFile", "blog");
  const coverImage = uploaded ?? (formData.get("removeCover") === "on" ? null : post.coverImage);

  await db
    .update(blogPosts)
    .set({
      title,
      body,
      coverImage,
      targetType: ride?.type ?? null,
      targetId: ride?.id ?? null,
      status: "pending",
      moderatorNote: null,
      reviewedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog-posts");
  revalidatePath("/admin");
  redirect("/blog/mine?submitted=1");
}

export async function deleteBlogPost(id: string) {
  const userId = await requireUser();
  await db.delete(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.userId, userId)));
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog-posts");
  revalidatePath("/admin");
  redirect("/blog/mine");
}

/** Flags a live post for the moderators. Signed-in readers only, once each. */
export async function reportBlogPost(_previous: ReportResult, formData: FormData): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to report a post." };

  const postId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!REPORT_REASONS.some((r) => r.value === reason)) return { error: "Choose a reason." };

  const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(and(eq(blogPosts.id, postId), eq(blogPosts.status, "approved")));
  if (!post) return { error: "That post is no longer there." };

  await db.insert(blogPostReports).values({ postId: post.id, reporterId: session.user.id, reason }).onConflictDoNothing();
  revalidatePath("/admin/blog-posts");
  revalidatePath("/admin");
  return { done: true };
}
