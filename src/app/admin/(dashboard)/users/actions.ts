"use server";

import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { membershipTierEnum } from "@/db/schema";

/** Sets a rider's level by hand: a free upgrade for testers, friends and founding members. A paid subscription is separate and never changed here. */
export async function setMembershipTier(id: string, formData: FormData) {
  const tier = String(formData.get("tier"));
  if (!(membershipTierEnum.enumValues as readonly string[]).includes(tier)) return;
  await db.update(users).set({ membershipTier: tier as (typeof membershipTierEnum.enumValues)[number] }).where(eq(users.id, id));
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

// No look-alike characters (0/O, 1/l/I), so a password read out or typed from a message is hard to get wrong.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTemporaryPassword(length = 12): string {
  return Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");
}

export type ResetPasswordResult = { password?: string; error?: string };

/** Sets a new random password for a rider and returns it once, so the admin can pass it on. */
export async function resetUserPassword(_previous: ResetPasswordResult, formData: FormData): Promise<ResetPasswordResult> {
  const id = String(formData.get("userId") ?? "");
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) return { error: "That user no longer exists." };

  const password = generateTemporaryPassword();
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 10) })
    .where(eq(users.id, id));
  return { password };
}
