import { createLandmark } from "../actions";
import { LandmarkForm } from "../landmark-form";

export default function NewLandmarkPage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">New landmark</h2>
      <LandmarkForm action={createLandmark} submitLabel="Create landmark" />
    </div>
  );
}
