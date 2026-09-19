import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { routes } from "@/db/schema";
import { updateRoute, deleteRoute } from "../actions";
import { RouteForm } from "../route-form";
import { Button } from "@/components/ui/button";

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [route] = await db.select().from(routes).where(eq(routes.id, id));
  if (!route) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">Edit route</h2>
      <RouteForm
        action={updateRoute.bind(null, id)}
        submitLabel="Save changes"
        routeId={id}
        defaults={{
          name: route.name,
          regionId: route.regionId,
          introSell: route.introSell,
          introCharacter: route.introCharacter,
          distanceMiles: route.distanceMiles,
          ridingTimeMinutes: route.ridingTimeMinutes,
          difficulty: route.difficulty,
          surfaceQuality: route.surfaceQuality,
          hazards: route.hazards,
          bestTime: route.bestTime,
          lastVerifiedOn: route.lastVerifiedOn,
          conditionsNote: route.conditionsNote,
          stopOffNote: route.stopOffNote,
          heroImage: route.heroImage,
          gallery: route.gallery,
          status: route.status,
          isSample: route.isSample,
          geometry: route.geometry as GeoJSON.LineString | null,
          startPoint: route.startPoint,
          endPoint: route.endPoint,
        }}
      />
      <form action={deleteRoute.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete route
        </Button>
      </form>
    </div>
  );
}
