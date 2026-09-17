"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { reviews, diaryEntries } from "@/db/schema";
import type { tripTargetEnum } from "@/db/schema";

type TripTarget = (typeof tripTargetEnum.enumValues)[number];

const RETURN_PATH: Record<TripTarget, string> = {
  route: "routes",
  day_ride: "day-rides",
  tour: "tours",
};

export async function createReview(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const targetType = String(formData.get("targetType")) as TripTarget;
  const targetId = String(formData.get("targetId"));
  const returnSlug = String(formData.get("returnSlug"));
  const rating = Number(formData.get("rating"));
  const text = String(formData.get("text") ?? "").trim() || null;
  const bikeRidden = String(formData.get("bikeRidden") ?? "").trim() || null;

  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  // Day rides and tours can only be reviewed by riders who logged completing them.
  if (targetType === "day_ride" || targetType === "tour") {
    const [logged] = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, session.user.id), eq(diaryEntries.targetType, targetType), eq(diaryEntries.targetId, targetId)));
    if (!logged) throw new Error("Log this ride in your diary before reviewing it");
  }

  await db.insert(reviews).values({ userId: session.user.id, targetType, targetId, rating, text, bikeRidden });

  const returnPath = `/${RETURN_PATH[targetType]}/${returnSlug}`;
  revalidatePath(returnPath);
  redirect(returnPath);
}
