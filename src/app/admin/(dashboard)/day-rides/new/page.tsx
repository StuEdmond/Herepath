import { createDayRide } from "../actions";
import { DayRideForm } from "../day-ride-form";

export default function NewDayRidePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">New day ride</h2>
      <DayRideForm action={createDayRide} submitLabel="Create day ride" />
    </div>
  );
}
