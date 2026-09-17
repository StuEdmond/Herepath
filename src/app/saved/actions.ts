"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { savedRides } from "@/db/schema";
import type { tripTargetEnum } from "@/db/schema";

type TripTarget = (typeof tripTargetEnum.enumValues)[number];

export async function toggleSavedRide(targetType: TripTarget, targetId: string, currentPath: string) {
  const session = await auth();
  if (!session?.user?.id) return { signedIn: false, saved: false };

  const [existing] = await db
    .select()
    .from(savedRides)
    .where(and(eq(savedRides.userId, session.user.id), eq(savedRides.targetType, targetType), eq(savedRides.targetId, targetId)));

  if (existing) {
    await db
      .delete(savedRides)
      .where(and(eq(savedRides.userId, session.user.id), eq(savedRides.targetType, targetType), eq(savedRides.targetId, targetId)));
  } else {
    await db.insert(savedRides).values({ userId: session.user.id, targetType, targetId });
  }

  revalidatePath(currentPath);
  revalidatePath("/saved");
  return { signedIn: true, saved: !existing };
}
