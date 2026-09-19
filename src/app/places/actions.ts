"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { placeReviews, placeReviewReports } from "@/db/schema";
import { REPORT_REASONS } from "@/lib/place-review-limits";

export type ReportResult = { done?: boolean; error?: string };

/** Flags a rider's tip for admin. Signed-in riders only, and each rider can report a tip once. */
export async function reportPlaceReview(_previous: ReportResult, formData: FormData): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to report a tip." };

  const reviewId = String(formData.get("reviewId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!REPORT_REASONS.some((r) => r.value === reason)) return { error: "Choose a reason." };

  const [review] = await db.select({ id: placeReviews.id }).from(placeReviews).where(eq(placeReviews.id, reviewId));
  if (!review) return { error: "That tip is no longer there." };

  await db.insert(placeReviewReports).values({ placeReviewId: review.id, reporterId: session.user.id, reason }).onConflictDoNothing();
  return { done: true };
}
