"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { placeReviews, placeReviewReports } from "@/db/schema";

function revalidateEverywhere() {
  revalidatePath("/admin/place-reviews");
  revalidatePath("/admin");
  revalidatePath("/day-rides", "layout");
  revalidatePath("/tours", "layout");
}

export async function deletePlaceReview(id: string) {
  await db.delete(placeReviews).where(eq(placeReviews.id, id));
  revalidateEverywhere();
}

/** Keeps the tip and clears its reports, for when a report turns out to be unfounded. */
export async function dismissPlaceReviewReports(id: string) {
  await db.delete(placeReviewReports).where(eq(placeReviewReports.placeReviewId, id));
  revalidateEverywhere();
}
