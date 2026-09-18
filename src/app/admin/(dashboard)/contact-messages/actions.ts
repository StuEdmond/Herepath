"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { contactMessages } from "@/db/schema";

export async function markContactMessageRead(id: string, isRead: boolean) {
  await db.update(contactMessages).set({ isRead }).where(eq(contactMessages.id, id));
  revalidatePath("/admin/contact-messages");
}

export async function deleteContactMessage(id: string) {
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/admin/contact-messages");
}
