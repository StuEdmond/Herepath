import Link from "next/link";
import { getPublishedRides } from "@/lib/places-along";
import { PreloadRunner } from "./preload-runner";

// Each lookup can take a while when OpenStreetMap is busy.
export const maxDuration = 30;

export default async function PreloadPlacesPage() {
  const rides = await getPublishedRides();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/places" className="text-[13px] text-text-muted hover:text-text-primary hover:underline">
          ← Places
        </Link>
        <h2 className="mt-1 text-[20px]">Preload map places</h2>
        <p className="mt-1 max-w-2xl text-[14px] text-text-secondary">
          The first time anyone switches on fuel, food or stay pins for a ride, the site asks OpenStreetMap, which can take up to 20 seconds. This
          does that for every published ride now, so riders don&apos;t wait. It only asks again for rides that are missing or more than 10 days old,
          so it&apos;s quick to run after adding rides. It looks up one at a time, so keep this page open until it finishes.
        </p>
        <p className="mt-2 max-w-2xl text-[14px] text-text-secondary">
          You don&apos;t need to run it regularly: once a day the site refreshes the oldest answers by itself (a few rides each day).
        </p>
      </div>
      <PreloadRunner rides={rides} />
    </div>
  );
}
