import { createTour } from "../actions";
import { TourForm } from "../tour-form";

export default function NewTourPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">New tour</h2>
      <TourForm action={createTour} submitLabel="Create tour" />
    </div>
  );
}
