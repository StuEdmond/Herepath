import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { updateTour, deleteTour } from "../actions";
import { TourForm } from "../tour-form";
import { Button } from "@/components/ui/button";

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tour] = await db.select().from(tours).where(eq(tours.id, id));
  if (!tour) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">Edit tour</h2>
      <TourForm action={updateTour.bind(null, id)} submitLabel="Save changes" tourId={id} defaults={tour} />
      <form action={deleteTour.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete tour
        </Button>
      </form>
    </div>
  );
}
