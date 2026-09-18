"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { waitlistSignups } from "@/db/schema";

export async function joinWaitlist(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address");

  await db.insert(waitlistSignups).values({ email }).onConflictDoNothing();
  redirect("/?joined=1#pricing");
}
