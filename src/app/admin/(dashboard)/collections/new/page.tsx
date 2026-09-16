import { createCollection } from "../actions";
import { CollectionForm } from "../collection-form";

export default function NewCollectionPage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">New collection</h2>
      <CollectionForm action={createCollection} submitLabel="Create collection" />
    </div>
  );
}
