import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { regions, routes, places, bikeTypeEnum, contentStatusEnum, dayRideBikeSuitability, dayRideStages, dayRidePlacesToEat } from "@/db/schema";
import { Field, TextInput, Textarea, Select, FormRow, ImageUploadField } from "@/components/admin/form-fields";
import { StageBuilder, type StageDraft } from "@/components/admin/stage-builder";
import { GpxUploadField } from "@/components/admin/gpx-upload-field";
import { Button } from "@/components/ui/button";

export interface DayRideDefaults {
  name: string;
  regionId: string;
  introSell: string;
  introCharacter: string;
  startLocation: string;
  finishLocation: string;
  isLoop: boolean;
  totalDistanceMiles: string;
  ridingTimeMinutes: number;
  fullDayTimeEstimate: string;
  bestTime: string | null;
  parkingNote: string | null;
  heroImage: string | null;
  status: string;
  isSample: boolean;
  geometry?: GeoJSON.GeoJSON | null;
}

export async function DayRideForm({
  action,
  defaults,
  submitLabel,
  dayRideId,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: DayRideDefaults;
  submitLabel: string;
  dayRideId?: string;
}) {
  const [regionRows, routeRows, foodPlaces] = await Promise.all([
    db.select().from(regions).orderBy(regions.name),
    db.select({ id: routes.id, name: routes.name }).from(routes).orderBy(routes.name),
    db.select().from(places).orderBy(places.name),
  ]);
  const eatablePlaces = foodPlaces.filter((p) => ["cafe", "pub", "restaurant"].includes(p.type));

  const existingSuitability = dayRideId
    ? await db.select().from(dayRideBikeSuitability).where(eq(dayRideBikeSuitability.dayRideId, dayRideId))
    : [];
  const suitabilityByType = new Map(existingSuitability.map((s) => [s.bikeType, s]));

  const existingStages = dayRideId
    ? await db.select().from(dayRideStages).where(eq(dayRideStages.dayRideId, dayRideId)).orderBy(dayRideStages.position)
    : [];
  const initialStages: StageDraft[] = existingStages.map((s) => ({
    key: s.id,
    kind: s.kind,
    location: s.location ?? "",
    note: s.note ?? "",
    routeId: s.routeId ?? "",
    fromMile: s.fromMile ?? "",
    toMile: s.toMile ?? "",
    description: s.description ?? "",
    placeId: s.placeId ?? "",
    mile: s.mile ?? "",
    stopType: s.stopType ?? "lunch",
  }));

  const existingEat = dayRideId ? await db.select().from(dayRidePlacesToEat).where(eq(dayRidePlacesToEat.dayRideId, dayRideId)) : [];
  const eatByPlace = new Map(existingEat.map((e) => [e.placeId, e]));

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormRow>
        <Field label="Name">
          <TextInput name="name" defaultValue={defaults?.name} required />
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

      <Field label="Intro — first paragraph">
        <Textarea name="introSell" defaultValue={defaults?.introSell} required rows={3} />
      </Field>
      <Field label="Intro — second paragraph">
        <Textarea name="introCharacter" defaultValue={defaults?.introCharacter} required rows={3} />
      </Field>

      <FormRow>
        <Field label="Start location">
          <TextInput name="startLocation" defaultValue={defaults?.startLocation} required />
        </Field>
        <Field label="Finish location">
          <TextInput name="finishLocation" defaultValue={defaults?.finishLocation} required />
        </Field>
      </FormRow>

      <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
        <input type="checkbox" name="isLoop" defaultChecked={defaults?.isLoop} />
        Loop (starts and finishes in the same place)
      </label>

      <GpxUploadField
        distanceFieldName="totalDistanceMiles"
        includeStartEndFields={false}
        defaults={{
          geometry: (defaults?.geometry as GeoJSON.LineString | null) ?? null,
          distanceMiles: defaults?.totalDistanceMiles ?? "",
          startPoint: null,
          endPoint: null,
        }}
      />

      <FormRow>
        <Field label="Riding time (minutes)">
          <TextInput name="ridingTimeMinutes" type="number" defaultValue={defaults?.ridingTimeMinutes} required />
        </Field>
        <Field label="Full day time estimate" hint='e.g. "5 to 6 hours"'>
          <TextInput name="fullDayTimeEstimate" defaultValue={defaults?.fullDayTimeEstimate} required />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Status">
          <Select name="status" defaultValue={defaults?.status ?? "draft"}>
            {contentStatusEnum.enumValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Best time">
          <TextInput name="bestTime" defaultValue={defaults?.bestTime ?? ""} />
        </Field>
        <Field label="Parking note">
          <TextInput name="parkingNote" defaultValue={defaults?.parkingNote ?? ""} />
        </Field>
      </FormRow>

      <ImageUploadField label="Hero image" fileName="heroImageFile" urlName="heroImage" defaultUrl={defaults?.heroImage} />

      <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
        <input type="checkbox" name="isSample" defaultChecked={defaults?.isSample} />
        Sample content
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Bike suitability</legend>
        <div className="grid gap-2 rounded-lg bg-surface p-3 sm:grid-cols-2">
          {bikeTypeEnum.enumValues.map((bikeType) => {
            const existing = suitabilityByType.get(bikeType);
            return (
              <div key={bikeType} className="flex flex-col gap-1">
                <span className="text-[13px] text-text-primary">{bikeType.replace(/_/g, " ")}</span>
                <div className="flex gap-2">
                  <Select name={`suitability_${bikeType}`} defaultValue={existing?.level ?? ""} className="min-h-9 text-[13px]">
                    <option value="">Not set</option>
                    <option value="suited">Suited</option>
                    <option value="caution">Caution</option>
                  </Select>
                  <TextInput name={`note_${bikeType}`} defaultValue={existing?.note ?? ""} placeholder="Note" className="min-h-9 text-[13px]" />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">The ride, stage by stage</legend>
        <StageBuilder
          routeOptions={routeRows}
          placeOptions={foodPlaces.map((p) => ({ id: p.id, name: p.name }))}
          initialStages={initialStages}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Places to eat</legend>
        <div className="flex flex-col gap-1.5 rounded-lg bg-surface p-3">
          {eatablePlaces.length === 0 && <p className="text-[13px] text-text-muted">No cafes, pubs or restaurants yet — add one under Places.</p>}
          {eatablePlaces.map((place) => {
            const existing = eatByPlace.get(place.id);
            return (
              <label key={place.id} className="flex items-center gap-3 text-[14px] text-text-primary">
                <input type="checkbox" name={`eat_include_${place.id}`} defaultChecked={!!existing} />
                {place.name}
                <span className="ml-auto flex items-center gap-1 text-[13px] text-text-muted">
                  <input type="checkbox" name={`eat_lunch_${place.id}`} defaultChecked={existing?.isSuggestedLunch} />
                  Suggested lunch stop
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
