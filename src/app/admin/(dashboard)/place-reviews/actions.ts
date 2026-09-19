"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { placeReviews } from "@/db/schema";

export async function deletePlaceReview(id: string) {
  await db.delete(placeReviews).where(eq(placeReviews.id, id));
  revalidatePath("/admin/place-reviews");
  revalidatePath("/day-rides", "layout");
  revalidatePath("/tours", "layout");
}
