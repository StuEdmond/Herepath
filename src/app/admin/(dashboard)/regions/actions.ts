"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { regions } from "@/db/schema";
import { slugify } from "@/lib/slug";

export async function createRegion(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");

  await db.insert(regions).values({ name, slug: slugify(name), description });
  revalidatePath("/admin/regions");
  redirect("/admin/regions");
}

export async function updateRegion(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");

  await db.update(regions).set({ name, slug: slugify(name), description, updatedAt: new Date() }).where(eq(regions.id, id));
  revalidatePath("/admin/regions");
  redirect("/admin/regions");
}

export async function deleteRegion(id: string) {
  await db.delete(regions).where(eq(regions.id, id));
  revalidatePath("/admin/regions");
  redirect("/admin/regions");
}
