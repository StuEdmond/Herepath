import type { Metadata } from "next";
import { BackToResults } from "@/components/explore/back-to-results";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { db } from "@/db/client";
import { dayRides, regions, dayRideBikeSuitability, dayRideStages, dayRidePlacesToEat, routes, places, tourDays, tours, savedRides } from "@/db/schema";
import { getDayRideHardestDifficulty } from "@/lib/difficulty";
import { auth } from "@/lib/auth";
import { getReviewsForTarget, hasLoggedRide } from "@/lib/reviews";
import { getPlaceReviews } from "@/lib/place-reviews";
import { DifficultyGauge } from "@/components/ui/difficulty-gauge";
import { StarRating } from "@/components/ui/star-rating";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { DayRideMapCard } from "@/components/route/day-ride-map-card";
import { RideMapLayout } from "@/components/map/ride-map-layout";
import { BikeSuitability } from "@/components/route/bike-suitability";
import { RideFreshness } from "@/components/route/ride-freshness";
import { StageTimeline, type TimelineStage } from "@/components/route/stage-timeline";
import { PlacesToEat, type PlaceToEatEntry } from "@/components/route/places-to-eat";
import { ReviewsSection } from "@/components/route/reviews-section";
import { SaveRideButton } from "@/components/route/save-ride-button";
import { ShareButton } from "@/components/share/share-button";

async function getDayRide(slug: string) {
  const [dayRide] = await db.select().from(dayRides).where(eq(dayRides.slug, slug));
  return dayRide;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dayRide = await getDayRide(slug);
  if (!dayRide) return {};

  const description = dayRide.introSell.length > 155 ? `${dayRide.introSell.slice(0, 152)}...` : dayRide.introSell;

  return {
    title: dayRide.name,
    description,
    openGraph: {
      title: `${dayRide.name} · Herepath`,
      description,
      images: dayRide.heroImage ? [{ url: dayRide.heroImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: dayRide.name,
      description,
      images: dayRide.heroImage ? [dayRide.heroImage] : undefined,
    },
  };
}

export default async function DayRidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dayRide = await getDayRide(slug);
  if (!dayRide || dayRide.status !== "published") notFound();

  const [region] = await db.select().from(regions).where(eq(regions.id, dayRide.regionId));

  const suitability = await db.select().from(dayRideBikeSuitability).where(eq(dayRideBikeSuitability.dayRideId, dayRide.id));
  const suited = suitability.filter((s) => s.level === "suited");
  const caution = suitability.filter((s) => s.level === "caution");

  const stageRows = await db
    .select({ stage: dayRideStages, route: routes, place: places })
    .from(dayRideStages)
    .leftJoin(routes, eq(dayRideStages.routeId, routes.id))
    .leftJoin(places, eq(dayRideStages.placeId, places.id))
    .where(eq(dayRideStages.dayRideId, dayRide.id))
    .orderBy(dayRideStages.position);

  const hardestDifficulty = await getDayRideHardestDifficulty(dayRide.id);

  const timelineStages: TimelineStage[] = stageRows.map((row) => ({
    id: row.stage.id,
    kind: row.stage.kind,
    location: row.stage.location,
    note: row.stage.note,
    description: row.stage.description,
    fromMile: row.stage.fromMile,
    toMile: row.stage.toMile,
    mile: row.stage.mile,
    stopType: row.stage.stopType,
    route: row.route ? { name: row.route.name, slug: row.route.slug } : null,
    place: row.place ? { name: row.place.name } : null,
  }));

  const highlightSegments = stageRows
    .filter((row) => row.stage.kind === "route" && row.route?.geometry)
    .map((row) => ({ id: `stage-${row.stage.id}`, geometry: row.route!.geometry as GeoJSON.LineString }));

  // Places to eat, cross-referenced with any matching 'stop' stage for a mile marker.
  const stopMileByPlace = new Map(
    stageRows.filter((r) => r.stage.kind === "stop" && r.stage.placeId).map((r) => [r.stage.placeId!, r.stage.mile ? Number(r.stage.mile) : null]),
  );
  const placesToEatRows = await db
    .select({ place: places, isSuggestedLunch: dayRidePlacesToEat.isSuggestedLunch })
    .from(dayRidePlacesToEat)
    .innerJoin(places, eq(dayRidePlacesToEat.placeId, places.id))
    .where(eq(dayRidePlacesToEat.dayRideId, dayRide.id));
  const placeTips = await getPlaceReviews(placesToEatRows.map((row) => row.place.id));
  const placeToEatEntries: PlaceToEatEntry[] = placesToEatRows.map((row) => ({
    id: row.place.id,
    name: row.place.name,
    type: row.place.type,
    address: row.place.address,
    websiteUrl: row.place.websiteUrl,
    tags: row.place.tags,
    priceBand: row.place.priceBand,
    shortDescription: row.place.shortDescription,
    isSuggestedLunch: row.isSuggestedLunch,
    stageMile: stopMileByPlace.get(row.place.id) ?? null,
    reviews: placeTips.get(row.place.id) ?? [],
    isSponsored: row.place.isSponsored,
  }));

  const fuelStops = stageRows.filter((row) => row.stage.kind === "stop" && row.stage.stopType === "fuel" && row.place);

  const longerTrips = await db
    .select({ tour: tours })
    .from(tourDays)
    .innerJoin(tours, eq(tourDays.tourId, tours.id))
    .where(and(eq(tourDays.dayRideId, dayRide.id), eq(tours.status, "published")));

  const session = await auth();
  const { reviews, average } = await getReviewsForTarget("day_ride", dayRide.id);
  let initialSaved = false;
  let canReview = false;
  if (session?.user?.id) {
    const [saved] = await db
      .select()
      .from(savedRides)
      .where(and(eq(savedRides.userId, session.user.id), eq(savedRides.targetType, "day_ride"), eq(savedRides.targetId, dayRide.id)));
    initialSaved = !!saved;
    canReview = await hasLoggedRide(session.user.id, "day_ride", dayRide.id);
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="mx-auto -mb-3 w-full max-w-3xl px-4">
        <BackToResults />
      </div>

      <CardImage
        src={dayRide.heroImage ?? undefined}
        alt={dayRide.name}
        className="aspect-[16/9] w-full rounded-none sm:aspect-[21/9]"
        priority
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        {/* 1. Label, name, rating */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-text-muted">Day ride · {region?.name}</span>
              {dayRide.isSample && (
                <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[12px] text-text-muted">Sample content</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ShareButton
                data={{
                  title: dayRide.name,
                  region: region?.name,
                  distanceMiles: Number(dayRide.totalDistanceMiles),
                  ridingTimeMinutes: dayRide.ridingTimeMinutes,
                  rating: average ?? undefined,
                  notes: dayRide.introSell,
                  photoUrl: dayRide.heroImage,
                  geometry: dayRide.geometry as GeoJSON.LineString | null,
                  url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/day-rides/${dayRide.slug}`,
                }}
              />
              <SaveRideButton targetType="day_ride" targetId={dayRide.id} initialSaved={initialSaved} />
            </div>
          </div>
          <h1 className="text-[28px]">{dayRide.name}</h1>
          {average !== null ? (
            <StarRating rating={average} reviewCount={reviews.length} />
          ) : (
            <span className="text-[14px] text-text-muted">No reviews yet from riders who completed it</span>
          )}
        </div>

        <RideFreshness
          targetType="day_ride"
          targetId={dayRide.id}
          lastVerifiedOn={dayRide.lastVerifiedOn}
          conditionsNote={dayRide.conditionsNote}
          conditionsNoteOn={dayRide.conditionsNoteOn}
        />

        <RideMapLayout
          before={
            <>
        {/* 2. Introduction */}
        <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
          <p>{dayRide.introSell}</p>
          <p>{dayRide.introCharacter}</p>
        </div>

        {/* 3. Stat tiles */}
        <div className="@container">
          <div className="grid grid-cols-2 gap-3 @md:grid-cols-4">
            <StatTile label="Total distance" value={`${dayRide.totalDistanceMiles} miles`} />
            <StatTile label="Riding time" value={formatMinutes(dayRide.ridingTimeMinutes)} />
            <StatTile
              label="Hardest section"
              value={hardestDifficulty ? <DifficultyGauge level={hardestDifficulty as 1 | 2 | 3 | 4 | 5} showLabel={false} showValue /> : "Not yet rated"}
            />
            <StatTile label="Start and finish" value={dayRide.isLoop ? dayRide.startLocation : `${dayRide.startLocation} → ${dayRide.finishLocation}`} />
          </div>
        </div>

        {/* 4. Best suited to */}
        <BikeSuitability suited={suited} caution={caution} />

            </>
          }
          /* 5. Full loop map */
          map={
            dayRide.geometry ? (
              <DayRideMapCard
                slug={dayRide.slug}
                name={dayRide.name}
                geometry={dayRide.geometry as GeoJSON.LineString}
                highlightSegments={highlightSegments}
              />
            ) : null
          }
          after={
            <>
        {!dayRide.geometry && (
          <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">Map available once a GPX track is added in admin.</p>
        )}

        {/* Safety disclaimer */}
        <div className="flex gap-2 rounded-lg bg-red-tint-bg p-3 text-[13px] text-red-tint-text">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            This ride is guidance only. Riders must judge conditions and their own ability — road conditions change,
            so ride to what you can see, not to this page.
          </p>
        </div>
            </>
          }
        />

        {/* 6. Stage by stage */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px]">The ride, stage by stage</h2>
          <StageTimeline stages={timelineStages} />
        </div>

        {/* 7. Plan your day */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px]">Plan your day</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-3 text-[14px]">
              <span className="font-medium text-text-primary">Fuel plan — </span>
              {fuelStops.length > 0 ? (
                <span className="text-text-secondary">
                  {fuelStops.map((s) => `Mile ${s.stage.mile} (${s.place!.name})`).join(", ")}
                </span>
              ) : (
                <span className="text-text-secondary">No dedicated fuel stop — fill up before you set off.</span>
              )}
            </div>
            <div className="rounded-lg bg-surface p-3 text-[14px]">
              <span className="font-medium text-text-primary">Full day, with stops — </span>
              <span className="text-text-secondary">{dayRide.fullDayTimeEstimate}</span>
            </div>
            {dayRide.bestTime && (
              <div className="rounded-lg bg-surface p-3 text-[14px]">
                <span className="font-medium text-text-primary">Best time — </span>
                <span className="text-text-secondary">{dayRide.bestTime}</span>
              </div>
            )}
            {dayRide.parkingNote && (
              <div className="rounded-lg bg-surface p-3 text-[14px]">
                <span className="font-medium text-text-primary">Parking at start — </span>
                <span className="text-text-secondary">{dayRide.parkingNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* 8. Places to eat */}
        {placeToEatEntries.length > 0 && <PlacesToEat entries={placeToEatEntries} />}

        {/* 9. Rider reviews */}
        <ReviewsSection
          reviews={reviews}
          average={average}
          ratedFromCompletedRiders
          writeReviewHref={
            canReview
              ? `/reviews/new?targetType=day_ride&targetId=${dayRide.id}&returnSlug=${dayRide.slug}&name=${encodeURIComponent(dayRide.name)}`
              : undefined
          }
          disabledReason={session?.user ? "Log this ride in your diary before reviewing it" : "Sign in and log this ride to review it"}
        />

        {/* 10. Make it a longer trip */}
        {longerTrips.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px]">Make it a longer trip</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {longerTrips.map(({ tour }) => (
                <Link key={tour.id} href={`/tours/${tour.slug}`}>
                  <Card>
                    <CardImage src={tour.heroImage ?? undefined} alt={tour.name} badge={<TripTypeBadge type="tour" />} />
                    <CardBody>
                      <h3 className="text-[16px]">{tour.name}</h3>
                      <p className="text-[13px] text-text-muted">
                        {tour.durationDays} days · {tour.totalDistanceMiles} miles
                      </p>
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
