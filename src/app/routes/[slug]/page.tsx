import type { Metadata } from "next";
import Link from "next/link";
import { eq, and, ne, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ShieldAlert, Fuel } from "lucide-react";
import { db } from "@/db/client";
import { routes, regions, routeBikeSuitability, routeFuelStops, places, routeLandmarks, landmarks, dayRideStages, dayRides } from "@/db/schema";
import type { GeoPoint } from "@/db/schema/routes";
import { haversineMiles } from "@/lib/geo";
import { DifficultyGauge } from "@/components/ui/difficulty-gauge";
import { Tag } from "@/components/ui/tag";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { Button } from "@/components/ui/button";
import { RouteMapCard } from "@/components/route/route-map-card";

async function getRoute(slug: string) {
  const [route] = await db.select().from(routes).where(eq(routes.slug, slug));
  return route;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
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
  const route = await getRoute(slug);
  if (!route) return {};

  const description = route.introSell.length > 155 ? `${route.introSell.slice(0, 152)}...` : route.introSell;

  return {
    title: route.name,
    description,
    openGraph: {
      title: `${route.name} · Herepath`,
      description,
      images: route.heroImage ? [{ url: route.heroImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: route.name,
      description,
      images: route.heroImage ? [route.heroImage] : undefined,
    },
  };
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = await getRoute(slug);
  if (!route || route.status !== "published") notFound();

  const [region] = await db.select().from(regions).where(eq(regions.id, route.regionId));

  const suitability = await db.select().from(routeBikeSuitability).where(eq(routeBikeSuitability.routeId, route.id));
  const suited = suitability.filter((s) => s.level === "suited");
  const caution = suitability.filter((s) => s.level === "caution");

  const fuelStops = await db
    .select({ mileMarker: routeFuelStops.mileMarker, place: places })
    .from(routeFuelStops)
    .innerJoin(places, eq(routeFuelStops.placeId, places.id))
    .where(eq(routeFuelStops.routeId, route.id))
    .orderBy(routeFuelStops.mileMarker);

  const landmarkRows = await db
    .select({ name: landmarks.name })
    .from(routeLandmarks)
    .innerJoin(landmarks, eq(routeLandmarks.landmarkId, landmarks.id))
    .where(eq(routeLandmarks.routeId, route.id));

  // "Combine with nearby routes" — proximity from this route's start/end to others'.
  const otherRoutes = await db
    .select()
    .from(routes)
    .where(and(eq(routes.status, "published"), ne(routes.id, route.id), isNotNull(routes.startPoint)));

  const thisPoints: GeoPoint[] = [route.startPoint, route.endPoint].filter((p): p is GeoPoint => !!p);
  const nearby = otherRoutes
    .map((other) => {
      const otherPoints: GeoPoint[] = [other.startPoint, other.endPoint].filter((p): p is GeoPoint => !!p);
      let minDistance = Infinity;
      for (const a of thisPoints) {
        for (const b of otherPoints) {
          minDistance = Math.min(minDistance, haversineMiles(a, b));
        }
      }
      return { route: other, distance: minDistance };
    })
    .filter((r) => Number.isFinite(r.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  // Suggested day ride — one that features this route as a stage.
  const [suggestedStage] = await db
    .select({ dayRide: dayRides })
    .from(dayRideStages)
    .innerJoin(dayRides, eq(dayRideStages.dayRideId, dayRides.id))
    .where(and(eq(dayRideStages.routeId, route.id), eq(dayRides.status, "published")))
    .limit(1);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* 1. Hero photo */}
      <CardImage
        src={route.heroImage ?? undefined}
        alt={route.name}
        className="aspect-[16/9] w-full rounded-none sm:aspect-[21/9]"
        priority
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        {/* 2. Region, name, rating */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-text-muted">{region?.name}</span>
            {route.isSample && (
              <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[12px] text-text-muted">
                Sample content
              </span>
            )}
          </div>
          <h1 className="text-[28px]">{route.name}</h1>
          <span className="text-[14px] text-text-muted">No reviews yet</span>
        </div>

        {/* 3. Two-paragraph introduction */}
        <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
          <p>{route.introSell}</p>
          <p>{route.introCharacter}</p>
        </div>

        {/* 4. Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Distance" value={`${route.distanceMiles} miles`} />
          <StatTile label="Riding time" value={formatMinutes(route.ridingTimeMinutes)} />
          <StatTile label="Difficulty" value={<DifficultyGauge level={route.difficulty as 1 | 2 | 3 | 4 | 5} showLabel={false} />} />
          <StatTile label="Road surface" value={<span className="capitalize">{route.surfaceQuality}</span>} />
        </div>

        {/* 5. Best suited to */}
        {(suited.length > 0 || caution.length > 0) && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px]">Best suited to</h2>
            <div className="flex flex-wrap gap-2">
              {suited.map((s) => (
                <Tag key={s.bikeType} variant="suited" className="[&:hover]:cursor-help" title={s.note ?? undefined}>
                  {BIKE_TYPE_LABELS[s.bikeType]}
                </Tag>
              ))}
              {caution.map((s) => (
                <Tag key={s.bikeType} variant="caution" className="[&:hover]:cursor-help" title={s.note ?? undefined}>
                  {BIKE_TYPE_LABELS[s.bikeType]}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {landmarkRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {landmarkRows.map((l) => (
              <Tag key={l.name} variant="neutral">
                {l.name}
              </Tag>
            ))}
          </div>
        )}

        {/* 6. Map card */}
        {route.geometry && <RouteMapCard slug={route.slug} geometry={route.geometry as GeoJSON.LineString} />}

        {/* 7. Rider notes */}
        {(route.hazards || route.bestTime || route.stopOffNote) && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px]">Rider notes</h2>
            {route.hazards && (
              <p className="text-[14px] text-text-secondary">
                <span className="font-medium text-text-primary">Hazards — </span>
                {route.hazards}
              </p>
            )}
            {route.bestTime && (
              <p className="text-[14px] text-text-secondary">
                <span className="font-medium text-text-primary">Best time — </span>
                {route.bestTime}
              </p>
            )}
            {route.stopOffNote && (
              <p className="text-[14px] text-text-secondary">
                <span className="font-medium text-text-primary">Stop off — </span>
                {route.stopOffNote}
              </p>
            )}
          </div>
        )}

        {/* Safety disclaimer (Section 6) */}
        <div className="flex gap-2 rounded-lg bg-red-tint-bg p-3 text-[13px] text-red-tint-text">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            This route is guidance only. Riders must judge conditions and their own ability — road conditions change,
            so ride to what you can see, not to this page.
          </p>
        </div>

        {/* 8. Fuel stops */}
        {fuelStops.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px]">Fuel stops</h2>
            <ul className="flex flex-col gap-2">
              {fuelStops.map((stop) => (
                <li key={stop.place.id} className="flex items-center gap-2 rounded-lg bg-surface p-3 text-[14px]">
                  <Fuel className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                  <span className="font-medium text-text-primary">Mile {stop.mileMarker}</span>
                  <span className="text-text-secondary">{stop.place.name}</span>
                </li>
              ))}
            </ul>
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

        {/* 10. Rider photos */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[17px]">Rider photos</h2>
          {route.gallery.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {route.gallery.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-text-muted">No rider photos yet.</p>
          )}
        </div>

        {/* 11. Combine with nearby routes */}
        {(nearby.length > 0 || suggestedStage) && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px]">Combine with nearby routes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {nearby.map(({ route: other, distance }) => (
                <Link key={other.id} href={`/routes/${other.slug}`}>
                  <Card>
                    <CardImage src={other.heroImage ?? undefined} alt={other.name} badge={<TripTypeBadge type="route" />} />
                    <CardBody>
                      <h3 className="text-[16px]">{other.name}</h3>
                      <p className="text-[13px] text-text-muted">{distance.toFixed(1)} miles from this route</p>
                    </CardBody>
                  </Card>
                </Link>
              ))}
              {suggestedStage && (
                <Link href={`/day-rides/${suggestedStage.dayRide.slug}`}>
                  <Card>
                    <CardImage
                      src={suggestedStage.dayRide.heroImage ?? undefined}
                      alt={suggestedStage.dayRide.name}
                      badge={<TripTypeBadge type="day-ride" />}
                    />
                    <CardBody>
                      <h3 className="text-[16px]">{suggestedStage.dayRide.name}</h3>
                      <p className="text-[13px] text-text-muted">Make it a full day out</p>
                    </CardBody>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
