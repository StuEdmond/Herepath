import { createRoute } from "../actions";
import { RouteForm } from "../route-form";

export default function NewRoutePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">New route</h2>
      <RouteForm action={createRoute} submitLabel="Create route" />
    </div>
  );
}
