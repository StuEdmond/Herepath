import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { searchChips } from "@/db/schema";
import { updateSearchChip, deleteSearchChip } from "../actions";
import { Field, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export default async function EditSearchChipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [chip] = await db.select().from(searchChips).where(eq(searchChips.id, id));
  if (!chip) notFound();

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">Edit search chip</h2>
      <form action={updateSearchChip.bind(null, id)} className="flex flex-col gap-3">
        <Field label="Label">
          <TextInput name="label" defaultValue={chip.label} required />
        </Field>
        <Field label="Query">
          <TextInput name="query" defaultValue={chip.query} required />
        </Field>
        <Field label="Position">
          <TextInput name="position" type="number" defaultValue={chip.position} />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Save changes
        </Button>
      </form>
      <form action={deleteSearchChip.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete chip
        </Button>
      </form>
    </div>
  );
}
