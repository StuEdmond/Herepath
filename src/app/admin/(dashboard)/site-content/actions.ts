"use server";

import { eq, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { siteContent } from "@/db/schema";
import { findGroup } from "@/lib/site-content";
import { uploadedImage } from "@/lib/storage";

async function setValue(key: string, value: string) {
  await db
    .insert(siteContent)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });
}

export async function saveSiteContent(groupId: string, formData: FormData) {
  const group = findGroup(groupId);
  if (!group) throw new Error("Unknown page");

  let uploadError: string | null = null;

  for (const field of group.fields) {
    const key = `${groupId}.${field.name}`;

    if (field.type === "image") {
      try {
        const url = await uploadedImage(formData, `file:${field.name}`, "site");
        if (url) await setValue(key, url);
        else if (formData.get(`remove:${field.name}`) === "on") await db.delete(siteContent).where(eq(siteContent.key, key));
      } catch (err) {
        uploadError = `${field.label}: ${err instanceof Error ? err.message : "the upload failed"}`;
      }
      continue;
    }

    const value = String(formData.get(field.name) ?? "").replace(/\r\n/g, "\n").trim();
    if (value === field.default) await db.delete(siteContent).where(eq(siteContent.key, key));
    else await setValue(key, value);
  }

  revalidatePath(group.path);
  revalidatePath("/admin/site-content");
  const error = uploadError ? `&error=${encodeURIComponent(uploadError)}` : "";
  redirect(`/admin/site-content?saved=${groupId}${error}`);
}

export async function resetSiteContent(groupId: string) {
  const group = findGroup(groupId);
  if (!group) throw new Error("Unknown page");

  await db.delete(siteContent).where(like(siteContent.key, `${groupId}.%`));
  revalidatePath(group.path);
  revalidatePath("/admin/site-content");
  redirect(`/admin/site-content?saved=${groupId}`);
}
