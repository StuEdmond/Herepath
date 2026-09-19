"use server";

import { eq, and, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adviceArticles, contentStatusEnum } from "@/db/schema";
import { ADVICE_CATEGORIES } from "@/lib/advice";
import { slugify } from "@/lib/slug";
import { uploadedImage } from "@/lib/storage";

async function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!title || !body) throw new Error("A title and some article text are required");

  const category = String(formData.get("category") ?? "general");
  const status = String(formData.get("status") ?? "draft") as (typeof contentStatusEnum.enumValues)[number];
  const coverImage = (await uploadedImage(formData, "coverImageFile", "content")) ?? (String(formData.get("coverImage") ?? "").trim() || null);

  return {
    title,
    body,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    category: ADVICE_CATEGORIES.some((c) => c.value === category) ? category : "general",
    coverImage,
    status,
    customSlug: slugify(String(formData.get("slug") ?? "")),
  };
}

/** A URL-safe slug that no other article already uses. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "article";
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? root : `${root}-${n + 1}`;
    const [clash] = await db
      .select({ id: adviceArticles.id })
      .from(adviceArticles)
      .where(excludeId ? and(eq(adviceArticles.slug, candidate), ne(adviceArticles.id, excludeId)) : eq(adviceArticles.slug, candidate));
    if (!clash) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function revalidateAdvice() {
  revalidatePath("/admin/advice");
  revalidatePath("/advice", "layout");
}

export async function createArticle(formData: FormData) {
  const { customSlug, ...data } = await readForm(formData);
  const slug = await uniqueSlug(customSlug || slugify(data.title));
  const [article] = await db
    .insert(adviceArticles)
    .values({ ...data, slug, publishedAt: data.status === "published" ? new Date() : null })
    .returning();
  revalidateAdvice();
  redirect(`/admin/advice/${article.id}`);
}

export async function updateArticle(id: string, formData: FormData) {
  const { customSlug, ...data } = await readForm(formData);
  const [existing] = await db.select().from(adviceArticles).where(eq(adviceArticles.id, id));
  if (!existing) throw new Error("Article not found");

  const slug = await uniqueSlug(customSlug || existing.slug, id);
  // The publish date is set the first time an article goes live and then left alone.
  const publishedAt = data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt;

  await db
    .update(adviceArticles)
    .set({ ...data, slug, publishedAt, updatedAt: new Date() })
    .where(eq(adviceArticles.id, id));
  revalidateAdvice();
  redirect(`/admin/advice/${id}`);
}

export async function deleteArticle(id: string) {
  await db.delete(adviceArticles).where(eq(adviceArticles.id, id));
  revalidateAdvice();
  redirect("/admin/advice");
}
