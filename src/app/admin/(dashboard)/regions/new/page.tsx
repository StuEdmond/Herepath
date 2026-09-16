import { createRegion } from "../actions";
import { Field, TextInput, Textarea } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export default function NewRegionPage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-[20px]">New region</h2>
      <form action={createRegion} className="flex flex-col gap-3">
        <Field label="Name">
          <TextInput name="name" required />
        </Field>
        <Field label="Description">
          <Textarea name="description" />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Create region
        </Button>
      </form>
    </div>
  );
}
