import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users, regions } from "@/db/schema";
import {
  getDiaryEntries,
  getRiddenRouteIds,
  getRiddenRegionNames,
  getRiddenGeometries,
  getCollectionsProgress,
  getSavedRides,
} from "@/lib/your-rides";
import { getSuggestions } from "@/lib/suggestions";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { PersonalMapCard } from "@/components/route/personal-map-card";
import { DiaryEntryCard } from "@/components/diary/diary-entry-card";

export const metadata: Metadata = { title: "Your rides" };

const TYPE_PATH: Record<string, string> = { route: "routes", "day-ride": "day-rides", tour: "tours" };

export default async function YourRidesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const totalRegions = await db.$count(regions);

  const [entries, riddenRouteIds, riddenRegions, geometries, collectionsProgress, savedRideList, suggestions] = await Promise.all([
    getDiaryEntries(session.user.id),
    getRiddenRouteIds(session.user.id),
    getRiddenRegionNames(session.user.id),
    getRiddenGeometries(session.user.id),
    getCollectionsProgress(session.user.id),
    getSavedRides(session.user.id),
    getSuggestions(session.user.id),
  ]);

  const milesRidden = entries.reduce((sum, e) => sum + Number(e.distanceMiles), 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-[18px] font-medium text-text-primary">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              (user?.name ?? "R")[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-[22px]">Your rides</h1>
            <p className="text-[13px] text-text-muted">
              {user?.mainBike ?? "No bike set"} · Member since {user?.memberSince.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <Link href="/diary/new">
          <Button type="button" variant="primary">
            Log a ride
          </Button>
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Rides logged" value={entries.length} />
        <StatTile label="Miles ridden" value={Math.round(milesRidden)} />
        <StatTile label="Featured roads ridden" value={riddenRouteIds.size} />
        <StatTile label="Regions" value={`${riddenRegions.size} of ${totalRegions}`} />
      </div>

      {/* Personal map */}
      <PersonalMapCard lines={geometries} />

      <p className="text-[13px] text-text-muted">
        Your diary is private. You choose what to share as a public review.
      </p>

      {/* Diary entries */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[17px]">Diary</h2>
        {entries.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">
            No rides logged yet — log your first ride to start your diary.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <DiaryEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested for you */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px]">Suggested for you</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestions.map((s) => (
              <Link key={`${s.result.type}-${s.result.id}`} href={`/${TYPE_PATH[s.result.type]}/${s.result.slug}`}>
                <Card>
                  <CardImage src={s.result.heroImage ?? undefined} alt={s.result.name} badge={<TripTypeBadge type={s.result.type} />} />
                  <CardBody>
                    <h3 className="text-[15px]">{s.result.name}</h3>
                    <p className="text-[12px] text-text-muted">{s.reason}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your progress */}
      {collectionsProgress.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px]">Your progress</h2>
          <div className="flex flex-col gap-2">
            {collectionsProgress.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5 rounded-lg bg-surface p-3">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-text-primary">{c.name}</span>
                  <span className="text-text-muted">
                    {c.ridden} of {c.total}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-green-bright"
                    style={{ width: `${c.total > 0 ? (c.ridden / c.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Want to ride */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[17px]">Want to ride</h2>
        {savedRideList.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">
            Nothing saved yet — use &ldquo;Want to ride&rdquo; on a route, day ride or tour page.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {savedRideList.map((s) => (
              <Link key={`${s.targetType}-${s.targetId}`} href={`/${TYPE_PATH[s.targetType === "day_ride" ? "day-ride" : s.targetType]}/${s.slug}`}>
                <Card>
                  <CardImage
                    src={s.heroImage ?? undefined}
                    alt={s.name}
                    badge={<TripTypeBadge type={s.targetType === "day_ride" ? "day-ride" : s.targetType} />}
                  />
                  <CardBody>
                    <h3 className="text-[15px]">{s.name}</h3>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/account/settings" className="text-[13px] text-text-muted underline hover:text-text-secondary">
        Account settings, data and deletion
      </Link>
    </div>
  );
}
