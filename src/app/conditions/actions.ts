"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { dayRides, rideConditionReports, routes, tours } from "@/db/schema";
import {
  CONDITION_CATEGORIES,
  CONDITION_NOTE_MAX_LENGTH,
  CONDITION_NOTE_MIN_LENGTH,
  MAX_CONDITION_REPORTS_PER_DAY,
  type ConditionReportResult,
  type ConditionTargetType,
} from "@/lib/condition-reports";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rideExists(type: ConditionTargetType, id: string): Promise<boolean> {
  const table = type === "route" ? routes : type === "day_ride" ? dayRides : tours;
  const [row] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.status, "published")));
  return !!row;
}

/**
 * A signed-in rider telling us the road has changed. It goes to the admin queue and is never shown to other riders until our
 * team has checked it and added a conditions note to the ride.
 */
export async function reportRideCondition(_previous: ConditionReportResult, formData: FormData): Promise<ConditionReportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to report a problem." };
  const userId = session.user.id;

  const targetType = String(formData.get("targetType") ?? "") as ConditionTargetType;
  const targetId = String(formData.get("targetId") ?? "");
  const category = String(formData.get("category") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!["route", "day_ride", "tour"].includes(targetType) || !UUID.test(targetId)) return { error: "We couldn't tell which ride this is about." };
  if (!CONDITION_CATEGORIES.some((c) => c.value === category)) return { error: "Choose what has changed." };
  if (note.length < CONDITION_NOTE_MIN_LENGTH) return { error: "Please say where and what you saw, in a few words." };
  if (note.length > CONDITION_NOTE_MAX_LENGTH) return { error: `Please keep it under ${CONDITION_NOTE_MAX_LENGTH} characters.` };
  if (!(await rideExists(targetType, targetId))) return { error: "That ride is no longer available." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(rideConditionReports)
    .where(and(eq(rideConditionReports.reporterId, userId), gte(rideConditionReports.createdAt, since)));
  if (recent >= MAX_CONDITION_REPORTS_PER_DAY) return { error: "You've sent a few reports today. Please try again tomorrow." };

  await db.insert(rideConditionReports).values({ reporterId: userId, targetType, targetId, category: category as (typeof CONDITION_CATEGORIES)[number]["value"], note });
  return { done: true };
}
