import { placeTypeEnum } from "@/db/schema";
import { Field, TextInput, Textarea, Select, FormRow } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { PLACE_TAG_OPTIONS } from "./constants";

export interface PlaceDefaults {
  name: string;
  type: string;
  lat: string | null;
  lng: string | null;
  address: string | null;
  websiteUrl: string | null;
  shortDescription: string | null;
  photo: string | null;
  priceBand: number | null;
  tags: string[];
  isSuggested: boolean;
  isSponsored: boolean;
}

export function PlaceForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: PlaceDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormRow>
        <Field label="Name">
          <TextInput name="name" defaultValue={defaults?.name} required />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={defaults?.type ?? placeTypeEnum.enumValues[0]}>
            {placeTypeEnum.enumValues.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Latitude" hint="Optional">
          <TextInput name="lat" defaultValue={defaults?.lat ?? ""} inputMode="decimal" />
        </Field>
        <Field label="Longitude" hint="Optional">
          <TextInput name="lng" defaultValue={defaults?.lng ?? ""} inputMode="decimal" />
        </Field>
      </FormRow>
      <Field label="Address">
        <TextInput name="address" defaultValue={defaults?.address ?? ""} />
      </Field>
      <Field label="Website">
        <TextInput name="websiteUrl" type="url" defaultValue={defaults?.websiteUrl ?? ""} />
      </Field>
      <Field label="Short description">
        <Textarea name="shortDescription" defaultValue={defaults?.shortDescription ?? ""} />
      </Field>
      <FormRow>
        <Field label="Photo URL" hint="Object storage upload comes in Phase 2">
          <TextInput name="photo" type="url" defaultValue={defaults?.photo ?? ""} />
        </Field>
        <Field label="Price band">
          <Select name="priceBand" defaultValue={defaults?.priceBand ? String(defaults.priceBand) : ""}>
            <option value="">Not set</option>
            <option value="1">£</option>
            <option value="2">££</option>
            <option value="3">£££</option>
          </Select>
        </Field>
      </FormRow>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] text-text-muted">Tags</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-text-primary">
          {PLACE_TAG_OPTIONS.map((tag) => (
            <label key={tag} className="flex items-center gap-1.5">
              <input type="checkbox" name={`tag_${tag}`} defaultChecked={defaults?.tags.includes(tag)} />
              {tag.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-4 text-[14px] text-text-primary">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="isSuggested" defaultChecked={defaults?.isSuggested} />
          Rider-suggested (pending review)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="isSponsored" defaultChecked={defaults?.isSponsored} />
          Sponsored
        </label>
      </div>
      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
