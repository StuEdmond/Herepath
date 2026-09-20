import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLimits } from "@/lib/membership";
import { db } from "@/db/client";
import { tours, tourDays, tourOvernightStays, places, dayRides } from "@/db/schema";
import { getTourHardestDifficulty } from "@/lib/difficulty";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Printable tour sheet" };

export default async function TourPrintSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tour] = await db.select().from(tours).where(eq(tours.slug, slug));
  if (!tour || tour.status !== "published") notFound();
  // Printable tour sheets are part of Premium.
  const session = await auth();
  if (!(await getLimits(session?.user?.id)).tourSheet) redirect("/pricing?need=tour-sheet");

  const dayRows = await db
    .select({ tourDay: tourDays, dayRide: dayRides })
    .from(tourDays)
    .innerJoin(dayRides, eq(tourDays.dayRideId, dayRides.id))
    .where(eq(tourDays.tourId, tour.id))
    .orderBy(tourDays.dayNumber);

  const hardestDifficulty = await getTourHardestDifficulty(tour.id);

  const overnightRows = await db
    .select({ dayNumber: tourOvernightStays.dayNumber, place: places })
    .from(tourOvernightStays)
    .innerJoin(places, eq(tourOvernightStays.placeId, places.id))
    .where(eq(tourOvernightStays.tourId, tour.id))
    .orderBy(tourOvernightStays.dayNumber);

  const nightsMap = new Map<number, string[]>();
  for (const row of overnightRows) {
    const list = nightsMap.get(row.dayNumber) ?? [];
    list.push(`${row.place.name} (${row.place.type.replace(/_/g, " ")})`);
    nightsMap.set(row.dayNumber, list);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 bg-bg p-6 text-text-primary print:bg-white print:text-black">
      <PrintButton />

      <div>
        <h1 className="text-[24px]">{tour.name}</h1>
        <p className="text-text-secondary print:text-black">
          {tour.durationDays} days · {tour.totalDistanceMiles} miles · average {tour.averageDayMiles} miles a day
          {hardestDifficulty ? ` · hardest section: difficulty ${hardestDifficulty} of 5` : ""}
        </p>
        <p className="text-text-secondary print:text-black">
          Start: {tour.startLocation} · Finish: {tour.finishLocation}
          {tour.bestTime ? ` · Best time: ${tour.bestTime}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px]">Day by day</h2>
        {dayRows.map((row) => (
          <div key={row.tourDay.dayNumber} className="border-b border-surface-raised pb-3 print:border-gray-300">
            <p className="font-medium">
              Day {row.tourDay.dayNumber}: {row.dayRide.startLocation} → {row.dayRide.finishLocation}
            </p>
            <p className="text-[14px] text-text-secondary print:text-black">
              {row.dayRide.totalDistanceMiles} miles · {row.dayRide.fullDayTimeEstimate} with stops
            </p>
            <p className="text-[14px] text-text-secondary print:text-black">Overnight: {row.tourDay.overnightLocation}</p>
            {row.tourDay.fuelWarning && <p className="text-[14px] font-medium text-red-accent">⚠ {row.tourDay.fuelWarning}</p>}
          </div>
        ))}
      </div>

      {nightsMap.size > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[18px]">Where to stay</h2>
          {Array.from(nightsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([dayNumber, names], i) => (
              <p key={dayNumber} className="text-[14px] text-text-secondary print:text-black">
                <span className="font-medium text-text-primary print:text-black">Night {i + 1} — </span>
                {names.join(", ")}
              </p>
            ))}
        </div>
      )}

      {tour.planningNotes && (
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px]">Tour planning</h2>
          {tour.planningNotes.fuel && <p className="text-[14px] print:text-black">Fuel: {tour.planningNotes.fuel}</p>}
          {tour.planningNotes.weather && <p className="text-[14px] print:text-black">Weather: {tour.planningNotes.weather}</p>}
          {tour.planningNotes.luggage && <p className="text-[14px] print:text-black">Luggage: {tour.planningNotes.luggage}</p>}
          {tour.planningNotes.breakdownAndSignal && (
            <p className="text-[14px] print:text-black">Breakdown and signal: {tour.planningNotes.breakdownAndSignal}</p>
          )}
          {tour.planningNotes.gettingHome && <p className="text-[14px] print:text-black">Getting home: {tour.planningNotes.gettingHome}</p>}
        </div>
      )}

      <p className="text-[13px] text-text-muted print:text-black">
        This tour is guidance only. Riders must judge conditions and their own ability — road conditions change.
      </p>
    </div>
  );
}
