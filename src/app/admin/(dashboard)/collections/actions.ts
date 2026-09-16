"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { collections, collectionRoutes, routes } from "@/db/schema";
import { slugify } from "@/lib/slug";

async function readSelectedRoutes(formData: FormData) {
  const allRoutes = await db.select({ id: routes.id }).from(routes);
  const selected: { routeId: string; position: number }[] = [];
  for (const route of allRoutes) {
    if (formData.get(`include_${route.id}`) === "on") {
      const position = Number(formData.get(`position_${route.id}`) ?? 0);
      selected.push({ routeId: route.id, position });
    }
  }
  selected.sort((a, b) => a.position - b.position);
  return selected.map((s, i) => ({ routeId: s.routeId, position: i }));
}

export async function createCollection(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");

  const [collection] = await db.insert(collections).values({ name, slug: slugify(name), description }).returning();
  const selected = await readSelectedRoutes(formData);
  if (selected.length > 0) {
    await db.insert(collectionRoutes).values(selected.map((s) => ({ collectionId: collection.id, ...s })));
  }
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function updateCollection(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");

  await db.update(collections).set({ name, slug: slugify(name), description, updatedAt: new Date() }).where(eq(collections.id, id));
  await db.delete(collectionRoutes).where(eq(collectionRoutes.collectionId, id));
  const selected = await readSelectedRoutes(formData);
  if (selected.length > 0) {
    await db.insert(collectionRoutes).values(selected.map((s) => ({ collectionId: id, ...s })));
  }
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function deleteCollection(id: string) {
  await db.delete(collections).where(eq(collections.id, id));
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}
