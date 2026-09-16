"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { landmarks, landmarkTypeEnum } from "@/db/schema";
import { slugify } from "@/lib/slug";

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as (typeof landmarkTypeEnum.enumValues)[number];
  const lat = String(formData.get("lat") ?? "").trim();
  const lng = String(formData.get("lng") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "");
  if (!name || !lat || !lng || !regionId) throw new Error("Name, coordinates and region are required");
  return { name, type, lat, lng, regionId };
}

export async function createLandmark(formData: FormData) {
  const data = readForm(formData);
  await db.insert(landmarks).values({ ...data, slug: slugify(data.name) });
  revalidatePath("/admin/landmarks");
  redirect("/admin/landmarks");
}

export async function updateLandmark(id: string, formData: FormData) {
  const data = readForm(formData);
  await db.update(landmarks).set({ ...data, slug: slugify(data.name) }).where(eq(landmarks.id, id));
  revalidatePath("/admin/landmarks");
  redirect("/admin/landmarks");
}

export async function deleteLandmark(id: string) {
  await db.delete(landmarks).where(eq(landmarks.id, id));
  revalidatePath("/admin/landmarks");
  redirect("/admin/landmarks");
}
