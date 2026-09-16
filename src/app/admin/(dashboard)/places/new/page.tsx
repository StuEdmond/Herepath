import { createPlace } from "../actions";
import { PlaceForm } from "../place-form";

export default function NewPlacePage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">New place</h2>
      <PlaceForm action={createPlace} submitLabel="Create place" />
    </div>
  );
}
