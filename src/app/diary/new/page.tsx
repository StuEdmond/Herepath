import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { routes, dayRides, tours, diaryEntries } from "@/db/schema";
import { getLimits, premiumLive } from "@/lib/membership";
import { getReviewablePlacesByTarget } from "@/lib/place-reviews";
import { DiaryForm, type CatalogueOption } from "./diary-form";

export const metadata: Metadata = { title: "Log a ride" };

export default async function NewDiaryEntryPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/sign-in");

  const limits = await getLimits(session.user.id);
  const [{ used }] = await db.select({ used: count() }).from(diaryEntries).where(eq(diaryEntries.userId, session.user.id!));
  const atLimit = used >= limits.diaryEntries;

  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    db.select({ id: routes.id, name: routes.name }).from(routes).where(eq(routes.status, "published")),
    db.select({ id: dayRides.id, name: dayRides.name }).from(dayRides).where(eq(dayRides.status, "published")),
    db.select({ id: tours.id, name: tours.name }).from(tours).where(eq(tours.status, "published")),
  ]);

  const reviewablePlacesByTarget = await getReviewablePlacesByTarget();

  const catalogueOptions: CatalogueOption[] = [
    ...routeRows.map((r) => ({ ...r, type: "route" as const })),
    ...dayRideRows.map((r) => ({ ...r, type: "day_ride" as const })),
    ...tourRows.map((r) => ({ ...r, type: "tour" as const })),
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pt-6 pb-16">
      <h1 className="text-[22px]">Log a ride</h1>
      {atLimit ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-[14px] text-text-secondary">
          <p className="text-text-primary">Your diary is full.</p>
          <p>
            A free account keeps up to {limits.diaryEntries} rides in the diary. Delete an old ride to make room, or upgrade to Premium for an unlimited diary.
          </p>
          <div className="flex gap-3">
            <Link href="/pricing" className="text-green-bright underline">
              See Premium
            </Link>
            <Link href="/rides" className="text-green-bright underline">
              Back to your rides
            </Link>
          </div>
        </div>
      ) : (
        <DiaryForm
          catalogueOptions={catalogueOptions}
          reviewablePlacesByTarget={reviewablePlacesByTarget}
          photoLimit={limits.photosPerDiaryEntry}
          canImportGpx={limits.diaryGpxImport}
          showUpgrade={premiumLive()}
        />
      )}
    </div>
  );
}
