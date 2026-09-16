import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { collections, collectionRoutes } from "@/db/schema";
import { updateCollection, deleteCollection } from "../actions";
import { CollectionForm } from "../collection-form";
import { Button } from "@/components/ui/button";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [collection] = await db.select().from(collections).where(eq(collections.id, id));
  if (!collection) notFound();

  const existing = await db.select().from(collectionRoutes).where(eq(collectionRoutes.collectionId, id));
  const selectedRoutes = new Map(existing.map((r) => [r.routeId, r.position]));

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">Edit collection</h2>
      <CollectionForm
        action={updateCollection.bind(null, id)}
        submitLabel="Save changes"
        defaults={collection}
        selectedRoutes={selectedRoutes}
      />
      <form action={deleteCollection.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete collection
        </Button>
      </form>
    </div>
  );
}
