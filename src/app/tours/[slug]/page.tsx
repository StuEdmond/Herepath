import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import {
  tours,
  regions,
  tourRegions,
  tourBikeSuitability,
  tourDays,
  tourOvernightStays,
  tourVariations,
  dayRides,
  dayRideStages,
  routes,
  places,
} from "@/db/schema";
import { getDayRideHardestDifficulty, getTourHardestDifficulty } from "@/lib/difficulty";
import { DifficultyGauge } from "@/components/ui/difficulty-gauge";
import { Tag } from "@/components/ui/tag";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TourMapCard } from "@/components/route/tour-map-card";
import { TourDayCard, type TourDayInfo } from "@/components/route/tour-day-card";
import { WhereToStay, type OvernightPlace } from "@/components/route/where-to-stay";

async function getTour(slug: string) {
  const [tour] = await db.select().from(tours).where(eq(tours.slug, slug));
  return tour;
}

const BIKE_TYPE_LABELS: Record<string, string> = {
  sports: "Sports",
  naked_and_roadster: "Naked and roadster",
  adventure: "Adventure",
  touring: "Touring",
  cruiser: "Cruiser",
  "125cc_and_new_riders": "125cc and new riders",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour) return {};

  const description = tour.introSell.length > 155 ? `${tour.introSell.slice(0, 152)}...` : tour.introSell;

  return {
    title: tour.name,
    description,
    openGraph: {
      title: `${tour.name} · Herepath`,
      description,
      images: tour.heroImage ? [{ url: tour.heroImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: tour.name,
      description,
      images: tour.heroImage ? [tour.heroImage] : undefined,
    },
  };
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour || tour.status !== "published") notFound();

  const regionRows = await db
    .select({ name: regions.name })
    .from(tourRegions)
    .innerJoin(regions, eq(tourRegions.regionId, regions.id))
    .where(eq(tourRegions.tourId, tour.id));

  const suitability = await db.select().from(tourBikeSuitability).where(eq(tourBikeSuitability.tourId, tour.id));
  const suited = suitability.filter((s) => s.level === "suited");
  const caution = suitability.filter((s) => s.level === "caution");

  const dayRows = await db
    .select({ tourDay: tourDays, dayRide: dayRides })
    .from(tourDays)
    .innerJoin(dayRides, eq(tourDays.dayRideId, dayRides.id))
    .where(eq(tourDays.tourId, tour.id))
    .orderBy(tourDays.dayNumber);

  const days: TourDayInfo[] = await Promise.all(
    dayRows.map(async (row) => {
      const hardestDifficulty = await getDayRideHardestDifficulty(row.dayRide.id);
      const featuredStages = await db
        .select({ name: routes.name })
        .from(dayRideStages)
        .innerJoin(routes, eq(dayRideStages.routeId, routes.id))
        .where(eq(dayRideStages.dayRideId, row.dayRide.id));

      return {
        dayNumber: row.tourDay.dayNumber,
        dayRideName: row.dayRide.name,
        dayRideSlug: row.dayRide.slug,
        startLocation: row.dayRide.startLocation,
        finishLocation: row.dayRide.finishLocation,
        totalDistanceMiles: row.dayRide.totalDistanceMiles,
        ridingTimeMinutes: row.dayRide.ridingTimeMinutes,
        hardestDifficulty,
        featuredRoadNames: featuredStages.map((s) => s.name),
        overnightLocation: row.tourDay.overnightLocation,
        fuelWarning: row.tourDay.fuelWarning,
      };
    }),
  );

  const hardestDifficulty = await getTourHardestDifficulty(tour.id);

  const overnightRows = await db
    .select({ dayNumber: tourOvernightStays.dayNumber, place: places })
    .from(tourOvernightStays)
    .innerJoin(places, eq(tourOvernightStays.placeId, places.id))
    .where(eq(tourOvernightStays.tourId, tour.id))
    .orderBy(tourOvernightStays.dayNumber);

  const nightsMap = new Map<number, OvernightPlace[]>();
  for (const row of overnightRows) {
    const list = nightsMap.get(row.dayNumber) ?? [];
    list.push({
      id: row.place.id,
      name: row.place.name,
      type: row.place.type as OvernightPlace["type"],
      address: row.place.address,
      tags: row.place.tags,
      shortDescription: row.place.shortDescription,
    });
    nightsMap.set(row.dayNumber, list);
  }
  const nights = Array.from(nightsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, placesForNight]) => ({ dayNumber, places: placesForNight }));

  const variationRows = await db
    .select({ variation: tourVariations, relatedTour: tours })
    .from(tourVariations)
    .innerJoin(tours, eq(tourVariations.relatedTourId, tours.id))
    .where(eq(tourVariations.tourId, tour.id));

  return (
    <div className="flex flex-col gap-6 pb-10">
      <CardImage src={tour.heroImage ?? undefined} alt={tour.name} className="aspect-[16/9] w-full rounded-none sm:aspect-[21/9]" />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        {/* 1. Label, name, rating */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-text-muted">
              Multi-day tour · {regionRows.map((r) => r.name).join(", ")}
            </span>
            {tour.isSample && (
              <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[12px] text-text-muted">Sample content</span>
            )}
          </div>
          <h1 className="text-[28px]">{tour.name}</h1>
          <span className="text-[14px] text-text-muted">No reviews yet from riders who completed it</span>
        </div>

        {/* 2. Introduction */}
        <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
          <p>{tour.introSell}</p>
          <p>{tour.introCharacter}</p>
        </div>

        {/* 3. Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Duration" value={`${tour.durationDays} days`} />
          <StatTile label="Total distance" value={`${tour.totalDistanceMiles} miles`} />
          <StatTile label="Average day" value={`${tour.averageDayMiles} miles`} />
          <StatTile
            label="Hardest section"
            value={hardestDifficulty ? <DifficultyGauge level={hardestDifficulty as 1 | 2 | 3 | 4 | 5} showLabel={false} /> : "—"}
          />
        </div>

        {/* 4. Summary rows */}
        <div className="flex flex-col gap-2 rounded-lg bg-surface p-3 text-[14px]">
          <div className="flex justify-between gap-2">
            <span className="text-text-muted">Start</span>
            <span className="text-text-primary">{tour.startLocation}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-text-muted">Finish</span>
            <span className="text-text-primary">{tour.finishLocation}</span>
          </div>
          {tour.bestTime && (
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Best time</span>
              <span className="text-text-primary">{tour.bestTime}</span>
            </div>
          )}
          {(suited.length > 0 || caution.length > 0) && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-text-muted">Best suited to</span>
              <div className="flex flex-wrap gap-2">
                {suited.map((s) => (
                  <Tag key={s.bikeType} variant="suited" title={s.note ?? undefined}>
                    {BIKE_TYPE_LABELS[s.bikeType]}
                  </Tag>
                ))}
                {caution.map((s) => (
                  <Tag key={s.bikeType} variant="caution" title={s.note ?? undefined}>
                    {BIKE_TYPE_LABELS[s.bikeType]}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Tour map */}
        <TourMapCard
          slug={tour.slug}
          days={dayRows.map((row) => ({
            dayNumber: row.tourDay.dayNumber,
            name: row.dayRide.name,
            slug: row.dayRide.slug,
            geometry: row.dayRide.geometry as GeoJSON.LineString | null,
          }))}
        />

        {/* 6. Day by day */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px]">Day by day</h2>
          <div className="flex flex-col gap-3">
            {days.map((day) => (
              <TourDayCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </div>

        {/* 7. Where to stay */}
        <WhereToStay nights={nights} />

        {/* 8. Tour planning */}
        {tour.planningNotes && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px]">Tour planning</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {tour.planningNotes.fuel && (
                <div className="rounded-lg bg-surface p-3 text-[14px]">
                  <span className="font-medium text-text-primary">Fuel — </span>
                  <span className="text-text-secondary">{tour.planningNotes.fuel}</span>
                </div>
              )}
              {tour.planningNotes.weather && (
                <div className="rounded-lg bg-surface p-3 text-[14px]">
                  <span className="font-medium text-text-primary">Weather — </span>
                  <span className="text-text-secondary">{tour.planningNotes.weather}</span>
                </div>
              )}
              {tour.planningNotes.luggage && (
                <div className="rounded-lg bg-surface p-3 text-[14px]">
                  <span className="font-medium text-text-primary">Luggage — </span>
                  <span className="text-text-secondary">{tour.planningNotes.luggage}</span>
                </div>
              )}
              {tour.planningNotes.breakdownAndSignal && (
                <div className="rounded-lg bg-surface p-3 text-[14px]">
                  <span className="font-medium text-text-primary">Breakdown and signal — </span>
                  <span className="text-text-secondary">{tour.planningNotes.breakdownAndSignal}</span>
                </div>
              )}
              {tour.planningNotes.gettingHome && (
                <div className="rounded-lg bg-surface p-3 text-[14px]">
                  <span className="font-medium text-text-primary">Getting home — </span>
                  <span className="text-text-secondary">{tour.planningNotes.gettingHome}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. Rider reviews */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px]">Rider reviews</h2>
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]" disabled title="Sign in to write a review — coming soon">
              Write a review
            </Button>
          </div>
          <p className="text-[14px] text-text-muted">No reviews yet — be the first to ride and review it.</p>
        </div>

        {/* 10. Make it your own */}
        {variationRows.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px]">Make it your own</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {variationRows.map(({ variation, relatedTour }) => (
                <Link key={variation.id} href={`/tours/${relatedTour.slug}`}>
                  <Card>
                    <CardBody>
                      <span className="text-[13px] text-text-muted">{variation.label}</span>
                      <h3 className="text-[16px]">{relatedTour.name}</h3>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
