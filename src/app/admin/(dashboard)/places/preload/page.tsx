import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRides, routes, tours } from "@/db/schema";
import { PreloadRunner, type PreloadRide } from "./preload-runner";

// Each lookup can take a while when OpenStreetMap is busy.
export const maxDuration = 30;

export default async function PreloadPlacesPage() {
  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    db.select({ name: routes.name, slug: routes.slug }).from(routes).where(eq(routes.status, "published")).orderBy(routes.name),
    db.select({ name: dayRides.name, slug: dayRides.slug }).from(dayRides).where(eq(dayRides.status, "published")).orderBy(dayRides.name),
    db.select({ name: tours.name, slug: tours.slug }).from(tours).where(eq(tours.status, "published")).orderBy(tours.name),
  ]);

  const rides: PreloadRide[] = [
    ...routeRows.map((r) => ({ type: "route" as const, ...r })),
    ...dayRideRows.map((r) => ({ type: "day-ride" as const, ...r })),
    ...tourRows.map((r) => ({ type: "tour" as const, ...r })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/places" className="text-[13px] text-text-muted hover:text-text-primary hover:underline">
          ← Places
        </Link>
        <h2 className="mt-1 text-[20px]">Preload map places</h2>
        <p className="mt-1 max-w-2xl text-[14px] text-text-secondary">
          The first time anyone switches on fuel, food or stay pins for a ride, the site asks OpenStreetMap, which can take up to 20 seconds. This
          does that for every published ride now, so riders don&apos;t wait. The answers are kept for a week, so run it again after adding rides or
          about once a week. It looks up one at a time, so keep this page open until it finishes.
        </p>
      </div>
      <PreloadRunner rides={rides} />
    </div>
  );
}
