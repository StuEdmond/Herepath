"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth, signIn, signOut } from "@/lib/auth";

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

  await signIn("credentials", { email, password, redirectTo: "/rides" });
}

export async function signInWithCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/rides" });
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

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  await db.delete(users).where(eq(users.id, session.user.id));
  await signOut({ redirectTo: "/" });
}
