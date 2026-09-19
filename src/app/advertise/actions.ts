"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { advertisingEnquiries } from "@/db/schema";
import { BUSINESS_TYPES, ENQUIRY_MESSAGE_MAX, cleanWebsite } from "@/lib/advertising";

const MAX_PER_EMAIL_PER_DAY = 3;

export async function submitAdvertisingEnquiry(formData: FormData) {
  // A hidden field real visitors never see or fill in; bots usually do. Pretend it worked and drop it.
  if (String(formData.get("company_site") ?? "").trim()) redirect("/advertise?sent=1");

  const businessName = String(formData.get("businessName") ?? "").trim().slice(0, 150);
  const contactName = String(formData.get("contactName") ?? "").trim().slice(0, 150);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40) || null;
  const businessType = String(formData.get("businessType") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, ENQUIRY_MESSAGE_MAX);

  if (!businessName || !contactName || !message) redirect("/advertise?error=missing");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/advertise?error=email");
  if (!BUSINESS_TYPES.some((t) => t.value === businessType)) redirect("/advertise?error=type");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(advertisingEnquiries)
    .where(and(eq(advertisingEnquiries.email, email), gt(advertisingEnquiries.createdAt, since)));
  if (recent >= MAX_PER_EMAIL_PER_DAY) redirect("/advertise?error=limit");

  await db.insert(advertisingEnquiries).values({
    businessName,
    contactName,
    email,
    phone,
    businessType,
    website: cleanWebsite(String(formData.get("website") ?? "")),
    message,
  });

  revalidatePath("/admin/advertising");
  revalidatePath("/admin");
  redirect("/advertise?sent=1");
}
