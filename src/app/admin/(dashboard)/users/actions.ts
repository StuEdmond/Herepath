"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { membershipTierEnum } from "@/db/schema";

export async function setMembershipTier(id: string, tier: (typeof membershipTierEnum.enumValues)[number]) {
  await db.update(users).set({ membershipTier: tier }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}
