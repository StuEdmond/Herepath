import { db } from "@/db/client";
import { regions, landmarkTypeEnum } from "@/db/schema";
import { Field, TextInput, Select, FormRow } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export async function LandmarkForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: { name: string; type: string; lat: string; lng: string; regionId: string };
  submitLabel: string;
}) {
  const regionRows = await db.select().from(regions).orderBy(regions.name);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Name">
        <TextInput name="name" defaultValue={defaults?.name} required />
      </Field>
      <FormRow>
        <Field label="Type">
          <Select name="type" defaultValue={defaults?.type ?? landmarkTypeEnum.enumValues[0]}>
            {landmarkTypeEnum.enumValues.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Region">
          <Select name="regionId" defaultValue={defaults?.regionId}>
            {regionRows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Latitude">
          <TextInput name="lat" defaultValue={defaults?.lat} required inputMode="decimal" />
        </Field>
        <Field label="Longitude">
          <TextInput name="lng" defaultValue={defaults?.lng} required inputMode="decimal" />
        </Field>
      </FormRow>
      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
