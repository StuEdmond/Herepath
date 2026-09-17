import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { reviews, users, diaryEntries } from "@/db/schema";
import type { tripTargetEnum } from "@/db/schema";

type TripTarget = (typeof tripTargetEnum.enumValues)[number];

export interface ReviewWithAuthor {
  id: string;
  rating: number;
  text: string | null;
  bikeRidden: string | null;
  createdAt: Date;
  authorName: string;
}

export async function getReviewsForTarget(targetType: TripTarget, targetId: string) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      bikeRidden: reviews.bikeRidden,
      createdAt: reviews.createdAt,
      authorName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.targetType, targetType), eq(reviews.targetId, targetId)))
    .orderBy(desc(reviews.createdAt));

  const list: ReviewWithAuthor[] = rows.map((r) => ({ ...r, authorName: r.authorName ?? "A rider" }));
  const average = list.length > 0 ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : null;

  return { reviews: list, average, count: list.length };
}

/** Day rides and tours can only be reviewed by riders who logged completing them. */
export async function hasLoggedRide(userId: string, targetType: TripTarget, targetId: string): Promise<boolean> {
  const [entry] = await db
    .select()
    .from(diaryEntries)
    .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.targetType, targetType), eq(diaryEntries.targetId, targetId)));
  return !!entry;
}
