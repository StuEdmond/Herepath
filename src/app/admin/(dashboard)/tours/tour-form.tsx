import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { regions, dayRides, places, bikeTypeEnum, contentStatusEnum, tourRegions, tourBikeSuitability, tourDays, tourOvernightStays } from "@/db/schema";
import type { TourPlanningNotes } from "@/db/schema/tours";
import { Field, TextInput, Textarea, Select, FormRow, ImageUploadField } from "@/components/admin/form-fields";
import { FreshnessFields } from "@/components/admin/freshness-fields";
import { TourDayBuilder, type TourDayDraft } from "@/components/admin/tour-day-builder";
import { Button } from "@/components/ui/button";

export interface TourDefaults {
  name: string;
  introSell: string;
  introCharacter: string;
  durationDays: number;
  totalDistanceMiles: string;
  averageDayMiles: string;
  startLocation: string;
  finishLocation: string;
  bestTime: string | null;
  lastVerifiedOn?: string | null;
  conditionsNote?: string | null;
  heroImage: string | null;
  status: string;
  isSample: boolean;
  planningNotes: TourPlanningNotes | null;
}

export async function TourForm({
  action,
  defaults,
  submitLabel,
  tourId,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: TourDefaults;
  submitLabel: string;
  tourId?: string;
}) {
  const [regionRows, dayRideRows, accommodationPlaces] = await Promise.all([
    db.select().from(regions).orderBy(regions.name),
    db.select({ id: dayRides.id, name: dayRides.name }).from(dayRides).orderBy(dayRides.name),
    db.select().from(places).orderBy(places.name),
  ]);
  const stayPlaces = accommodationPlaces.filter((p) => ["hotel", "b_and_b", "campsite"].includes(p.type));

  const selectedRegionIds = tourId
    ? new Set((await db.select({ regionId: tourRegions.regionId }).from(tourRegions).where(eq(tourRegions.tourId, tourId))).map((r) => r.regionId))
    : new Set<string>();

  const existingSuitability = tourId ? await db.select().from(tourBikeSuitability).where(eq(tourBikeSuitability.tourId, tourId)) : [];
  const suitabilityByType = new Map(existingSuitability.map((s) => [s.bikeType, s]));

  const existingDays = tourId ? await db.select().from(tourDays).where(eq(tourDays.tourId, tourId)).orderBy(tourDays.dayNumber) : [];
  const initialDays: TourDayDraft[] = existingDays.map((d) => ({
    key: d.id,
    dayRideId: d.dayRideId,
    overnightLocation: d.overnightLocation,
    fuelWarning: d.fuelWarning ?? "",
  }));

  const existingStays = tourId ? await db.select().from(tourOvernightStays).where(eq(tourOvernightStays.tourId, tourId)) : [];
  const nightsByPlace = new Map<string, number[]>();
  for (const stay of existingStays) {
    const list = nightsByPlace.get(stay.placeId) ?? [];
    list.push(stay.dayNumber);
    nightsByPlace.set(stay.placeId, list);
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Name">
        <TextInput name="name" defaultValue={defaults?.name} required />
      </Field>

      <Field label="Intro — first paragraph">
        <Textarea name="introSell" defaultValue={defaults?.introSell} required rows={3} />
      </Field>
      <Field label="Intro — second paragraph">
        <Textarea name="introCharacter" defaultValue={defaults?.introCharacter} required rows={3} />
      </Field>

      <FormRow>
        <Field label="Duration (days)">
          <TextInput name="durationDays" type="number" defaultValue={defaults?.durationDays ?? 1} required />
        </Field>
        <Field label="Total distance (miles)">
          <TextInput name="totalDistanceMiles" defaultValue={defaults?.totalDistanceMiles} required inputMode="decimal" />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Average day (miles)">
          <TextInput name="averageDayMiles" defaultValue={defaults?.averageDayMiles} required inputMode="decimal" />
        </Field>
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
        <Field label="Start location">
          <TextInput name="startLocation" defaultValue={defaults?.startLocation} required />
        </Field>
        <Field label="Finish location">
          <TextInput name="finishLocation" defaultValue={defaults?.finishLocation} required />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Best time">
          <TextInput name="bestTime" defaultValue={defaults?.bestTime ?? ""} />
        </Field>
        <ImageUploadField label="Hero image" fileName="heroImageFile" urlName="heroImage" defaultUrl={defaults?.heroImage} />
      </FormRow>

      <FreshnessFields lastVerifiedOn={defaults?.lastVerifiedOn} conditionsNote={defaults?.conditionsNote} />

      <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
        <input type="checkbox" name="isSample" defaultChecked={defaults?.isSample} />
        Sample content
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] text-text-muted">Regions covered</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-surface p-3 text-[14px] text-text-primary">
          {regionRows.map((r) => (
            <label key={r.id} className="flex items-center gap-1.5">
              <input type="checkbox" name={`region_${r.id}`} defaultChecked={selectedRegionIds.has(r.id)} />
              {r.name}
            </label>
          ))}
        </div>
      </fieldset>

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
        <legend className="text-[13px] text-text-muted">Day by day</legend>
        <TourDayBuilder dayRideOptions={dayRideRows} initialDays={initialDays} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Where to stay</legend>
        <p className="text-[12px] text-text-muted">
          For each option, list the night numbers it&apos;s offered on (e.g. &quot;1,2&quot; for nights after day 1 and day 2).
        </p>
        <div className="flex flex-col gap-1.5 rounded-lg bg-surface p-3">
          {stayPlaces.length === 0 && <p className="text-[13px] text-text-muted">No accommodation places yet — add one under Places.</p>}
          {stayPlaces.map((place) => (
            <label key={place.id} className="flex items-center gap-2 text-[14px] text-text-primary">
              <span className="w-40 shrink-0">
                {place.name} <span className="text-text-muted">({place.type.replace(/_/g, " ")})</span>
              </span>
              <TextInput
                name={`stay_nights_${place.id}`}
                defaultValue={(nightsByPlace.get(place.id) ?? []).join(",")}
                placeholder="e.g. 1,2"
                className="min-h-8 max-w-32 text-[13px]"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Tour planning</legend>
        <FormRow>
          <Field label="Fuel">
            <Textarea name="planning_fuel" defaultValue={defaults?.planningNotes?.fuel ?? ""} rows={2} />
          </Field>
          <Field label="Weather">
            <Textarea name="planning_weather" defaultValue={defaults?.planningNotes?.weather ?? ""} rows={2} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Luggage">
            <Textarea name="planning_luggage" defaultValue={defaults?.planningNotes?.luggage ?? ""} rows={2} />
          </Field>
          <Field label="Breakdown and signal">
            <Textarea name="planning_breakdown" defaultValue={defaults?.planningNotes?.breakdownAndSignal ?? ""} rows={2} />
          </Field>
        </FormRow>
        <Field label="Getting home">
          <Textarea name="planning_gettingHome" defaultValue={defaults?.planningNotes?.gettingHome ?? ""} rows={2} />
        </Field>
      </fieldset>

      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
