"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { rideConditionReports } from "@/db/schema";

function refresh() {
  revalidatePath("/admin/road-reports");
  revalidatePath("/admin");
}

export async function resolveRoadReport(id: string) {
  await db.update(rideConditionReports).set({ resolvedAt: new Date() }).where(eq(rideConditionReports.id, id));
  refresh();
}

export async function reopenRoadReport(id: string) {
  await db.update(rideConditionReports).set({ resolvedAt: null }).where(eq(rideConditionReports.id, id));
  refresh();
}

export async function deleteRoadReport(id: string) {
  await db.delete(rideConditionReports).where(eq(rideConditionReports.id, id));
  refresh();
}
