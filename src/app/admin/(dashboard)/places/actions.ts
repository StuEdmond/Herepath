"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { places, placeTypeEnum } from "@/db/schema";
import { PLACE_TAG_OPTIONS } from "./constants";

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as (typeof placeTypeEnum.enumValues)[number];
  if (!name) throw new Error("Name is required");

  const lat = String(formData.get("lat") ?? "").trim() || null;
  const lng = String(formData.get("lng") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || null;
  const shortDescription = String(formData.get("shortDescription") ?? "").trim() || null;
  const photo = String(formData.get("photo") ?? "").trim() || null;
  const priceBandRaw = String(formData.get("priceBand") ?? "");
  const priceBand = priceBandRaw ? Number(priceBandRaw) : null;
  const tags = PLACE_TAG_OPTIONS.filter((tag) => formData.get(`tag_${tag}`) === "on");
  const isSuggested = formData.get("isSuggested") === "on";
  const isSponsored = formData.get("isSponsored") === "on";

  return { name, type, lat, lng, address, websiteUrl, shortDescription, photo, priceBand, tags, isSuggested, isSponsored };
}

export async function createPlace(formData: FormData) {
  const data = readForm(formData);
  await db.insert(places).values(data);
  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function updatePlace(id: string, formData: FormData) {
  const data = readForm(formData);
  await db.update(places).set({ ...data, updatedAt: new Date() }).where(eq(places.id, id));
  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function deletePlace(id: string) {
  await db.delete(places).where(eq(places.id, id));
  revalidatePath("/admin/places");
  redirect("/admin/places");
}
