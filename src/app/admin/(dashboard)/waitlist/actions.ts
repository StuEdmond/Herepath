"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { waitlistSignups } from "@/db/schema";

export async function deleteWaitlistSignup(id: string) {
  await db.delete(waitlistSignups).where(eq(waitlistSignups.id, id));
  revalidatePath("/admin/waitlist");
}
