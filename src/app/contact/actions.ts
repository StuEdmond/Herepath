"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { contactMessages } from "@/db/schema";

export async function submitContactMessage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) throw new Error("Name, email and message are all required");
  if (!email.includes("@")) throw new Error("Enter a valid email address");

  await db.insert(contactMessages).values({ name, email, message });
  redirect("/contact?sent=1");
}
