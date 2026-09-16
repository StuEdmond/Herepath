import { createSearchChip } from "../actions";
import { Field, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export default function NewSearchChipPage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">New search chip</h2>
      <form action={createSearchChip} className="flex flex-col gap-3">
        <Field label="Label" hint='Shown on the chip, e.g. "Castles"'>
          <TextInput name="label" required />
        </Field>
        <Field label="Query" hint="Text applied to the search box when tapped">
          <TextInput name="query" required />
        </Field>
        <Field label="Position" hint="Lower numbers show first">
          <TextInput name="position" type="number" defaultValue={0} />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Create chip
        </Button>
      </form>
    </div>
  );
}
