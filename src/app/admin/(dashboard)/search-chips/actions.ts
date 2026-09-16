"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { searchChips } from "@/db/schema";

export async function createSearchChip(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();
  const position = Number(formData.get("position") ?? 0);
  if (!label || !query) throw new Error("Label and query are required");

  await db.insert(searchChips).values({ label, query, position });
  revalidatePath("/admin/search-chips");
  revalidatePath("/");
  redirect("/admin/search-chips");
}

export async function updateSearchChip(id: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();
  const position = Number(formData.get("position") ?? 0);
  if (!label || !query) throw new Error("Label and query are required");

  await db.update(searchChips).set({ label, query, position }).where(eq(searchChips.id, id));
  revalidatePath("/admin/search-chips");
  revalidatePath("/");
  redirect("/admin/search-chips");
}

export async function deleteSearchChip(id: string) {
  await db.delete(searchChips).where(eq(searchChips.id, id));
  revalidatePath("/admin/search-chips");
  revalidatePath("/");
  redirect("/admin/search-chips");
}
