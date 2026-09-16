import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { places } from "@/db/schema";
import { updatePlace, deletePlace } from "../actions";
import { PlaceForm } from "../place-form";
import { Button } from "@/components/ui/button";

export default async function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [place] = await db.select().from(places).where(eq(places.id, id));
  if (!place) notFound();

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">Edit place</h2>
      <PlaceForm action={updatePlace.bind(null, id)} submitLabel="Save changes" defaults={place} />
      <form action={deletePlace.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete place
        </Button>
      </form>
    </div>
  );
}
