"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/db/client";
import { blogPosts, diaryEntries, diaryEntryPhotos, users } from "@/db/schema";
import { auth, signIn, signOut } from "@/lib/auth";
import { cancelSubscriptionForUser } from "@/lib/billing";
import { deleteStoredImages } from "@/lib/storage";

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    redirect("/account/sign-up?error=invalid");
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    redirect("/account/sign-up?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash });

  await signIn("credentials", { email, password, redirectTo: "/profile" });
}

export async function signInWithCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/profile" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/account/sign-in?error=invalid");
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const mainBike = String(formData.get("mainBike") ?? "").trim() || null;

  await db.update(users).set({ name: name || null, mainBike }).where(eq(users.id, session.user.id));
  redirect("/account/settings?saved=1");
}

export async function updateBikes(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const mainBike = String(formData.get("mainBike") ?? "").trim() || null;
  await db.update(users).set({ mainBike }).where(eq(users.id, session.user.id));
  redirect("/profile?saved=bikes");
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!user) redirect("/account/sign-in");

  if (newPassword.length < 8) redirect("/account/settings?password=short");

  // Riders who signed up with Google have no password yet, so there is nothing to confirm.
  if (user.passwordHash && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    redirect("/account/settings?password=wrong");
  }

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(newPassword, 10) })
    .where(eq(users.id, user.id));
  redirect("/account/settings?password=changed");
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const userId = session.user.id;

  // Stop any paid subscription first, so nobody is charged for an account that no longer exists.
  await cancelSubscriptionForUser(userId);

  // Work out which uploaded files belong to this rider before their rows disappear, then remove the
  // files once the account itself is gone. The account's bike details are part of the account row.
  const [account] = await db.select({ image: users.image }).from(users).where(eq(users.id, userId));
  const postCovers = await db.select({ image: blogPosts.coverImage }).from(blogPosts).where(eq(blogPosts.userId, userId));
  const diaryPhotos = await db
    .select({ url: diaryEntryPhotos.url })
    .from(diaryEntryPhotos)
    .innerJoin(diaryEntries, eq(diaryEntryPhotos.diaryEntryId, diaryEntries.id))
    .where(eq(diaryEntries.userId, userId));

  await db.delete(users).where(eq(users.id, userId));
  await deleteStoredImages([account?.image, ...postCovers.map((p) => p.image), ...diaryPhotos.map((p) => p.url)]);

  await signOut({ redirectTo: "/" });
}
