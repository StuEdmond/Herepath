import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getPlannerRoutes, getSavedTrip } from "@/lib/trips";
import { TripBuilder, type InitialTrip } from "@/components/plan/trip-builder";

export const metadata: Metadata = {
  title: "Plan a trip",
  description: "Join Herepath routes together into your own day ride or multi-day tour, or ask for a round trip from where you start.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ trip?: string; add?: string }> }) {
  const { trip: tripId, add } = await searchParams;
  const session = await auth();
  const routes = await getPlannerRoutes();

  let initial: InitialTrip | null = null;
  if (tripId && UUID.test(tripId) && session?.user?.id) {
    const saved = await getSavedTrip(session.user.id, tripId);
    if (saved) {
      initial = {
        id: saved.id,
        name: saved.name,
        items: saved.items,
        milesPerDay: saved.milesPerDay,
        origin: saved.origin,
      };
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pt-6 pb-16">
      <div>
        <h1 className="text-[28px]">Plan a trip</h1>
        <p className="mt-1 max-w-3xl text-[15px] text-text-secondary">
          Build your own day ride or tour by joining Herepath routes together. Click routes on the map or add them from the list, put them in order, and
          split the trip into days. Or set a start point and ask for a round trip.
        </p>
        <p className="mt-1 max-w-3xl text-[13px] text-text-muted">
          We work out the riding between one route and the next as a straight-line estimate, so treat those stretches as a guide and plan the actual roads in
          your navigation app.
        </p>
      </div>
      <TripBuilder routes={routes} initial={initial} addSlug={add ?? null} signedIn={!!session?.user} />
    </div>
  );
}
