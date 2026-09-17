import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { routes, dayRides, tours } from "@/db/schema";
import { DiaryForm, type CatalogueOption } from "./diary-form";

export const metadata: Metadata = { title: "Log a ride" };

export default async function NewDiaryEntryPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/sign-in");

  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    db.select({ id: routes.id, name: routes.name }).from(routes).where(eq(routes.status, "published")),
    db.select({ id: dayRides.id, name: dayRides.name }).from(dayRides).where(eq(dayRides.status, "published")),
    db.select({ id: tours.id, name: tours.name }).from(tours).where(eq(tours.status, "published")),
  ]);

  const catalogueOptions: CatalogueOption[] = [
    ...routeRows.map((r) => ({ ...r, type: "route" as const })),
    ...dayRideRows.map((r) => ({ ...r, type: "day_ride" as const })),
    ...tourRows.map((r) => ({ ...r, type: "tour" as const })),
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pt-6 pb-16">
      <h1 className="text-[22px]">Log a ride</h1>
      <DiaryForm catalogueOptions={catalogueOptions} />
    </div>
  );
}
