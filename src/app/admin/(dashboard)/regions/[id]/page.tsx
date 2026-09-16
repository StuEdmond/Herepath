import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { regions } from "@/db/schema";
import { updateRegion, deleteRegion } from "../actions";
import { Field, TextInput, Textarea } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export default async function EditRegionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [region] = await db.select().from(regions).where(eq(regions.id, id));
  if (!region) notFound();

  const updateWithId = updateRegion.bind(null, id);
  const deleteWithId = deleteRegion.bind(null, id);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">Edit region</h2>
      <form action={updateWithId} className="flex flex-col gap-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={region.name} required />
        </Field>
        <Field label="Description">
          <Textarea name="description" defaultValue={region.description ?? ""} />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Save changes
        </Button>
      </form>
      <form action={deleteWithId}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete region
        </Button>
      </form>
    </div>
  );
}
