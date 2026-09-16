import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { dayRides } from "@/db/schema";
import { updateDayRide, deleteDayRide } from "../actions";
import { DayRideForm } from "../day-ride-form";
import { Button } from "@/components/ui/button";

export default async function EditDayRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dayRide] = await db.select().from(dayRides).where(eq(dayRides.id, id));
  if (!dayRide) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">Edit day ride</h2>
      <DayRideForm action={updateDayRide.bind(null, id)} submitLabel="Save changes" dayRideId={id} defaults={dayRide} />
      <form action={deleteDayRide.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete day ride
        </Button>
      </form>
    </div>
  );
}
