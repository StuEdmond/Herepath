"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { advertisingEnquiries, enquiryStatusEnum } from "@/db/schema";

function revalidateEnquiries() {
  revalidatePath("/admin/advertising");
  revalidatePath("/admin");
}

export async function setEnquiryStatus(id: string, status: (typeof enquiryStatusEnum.enumValues)[number]) {
  await db.update(advertisingEnquiries).set({ status }).where(eq(advertisingEnquiries.id, id));
  revalidateEnquiries();
}

export async function deleteEnquiry(id: string) {
  await db.delete(advertisingEnquiries).where(eq(advertisingEnquiries.id, id));
  revalidateEnquiries();
}
