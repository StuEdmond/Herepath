import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { landmarks } from "@/db/schema";
import { updateLandmark, deleteLandmark } from "../actions";
import { LandmarkForm } from "../landmark-form";
import { Button } from "@/components/ui/button";

export default async function EditLandmarkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [landmark] = await db.select().from(landmarks).where(eq(landmarks.id, id));
  if (!landmark) notFound();

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">Edit landmark</h2>
      <LandmarkForm
        action={updateLandmark.bind(null, id)}
        submitLabel="Save changes"
        defaults={{
          name: landmark.name,
          type: landmark.type,
          lat: landmark.lat,
          lng: landmark.lng,
          regionId: landmark.regionId,
        }}
      />
      <form action={deleteLandmark.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete landmark
        </Button>
      </form>
    </div>
  );
}
