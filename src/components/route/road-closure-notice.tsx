import { closuresConfigured, ensureClosuresFresh, getClosuresForRides } from "@/lib/closures";
import { getRideLines } from "@/lib/places-along";
import { ClosureList } from "./closure-list";

/**
 * The road closures on a route, day ride or tour, if any. Renders nothing when there are none or when closures aren't set up.
 * Reading the closures again when they're old happens after the page has been sent, so it never slows it down.
 */
export async function RoadClosureNotice({ type, slug }: { type: "route" | "day-ride" | "tour"; slug: string }) {
  if (!closuresConfigured()) return null;
  await ensureClosuresFresh();
  const lines = await getRideLines(type, slug);
  if (!lines) return null;
  const closures = (await getClosuresForRides([{ key: "ride", lines }])).get("ride") ?? [];
  return <ClosureList closures={closures} />;
}
