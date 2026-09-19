import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  regions,
  places,
  landmarks,
  bikeTypeEnum,
  surfaceQualityEnum,
  contentStatusEnum,
  routeBikeSuitability,
  routeFuelStops,
  routeLandmarks,
} from "@/db/schema";
import type { GeoPoint } from "@/db/schema/routes";
import { Field, TextInput, Textarea, Select, FormRow, ImageUploadField } from "@/components/admin/form-fields";
import { GpxUploadField } from "@/components/admin/gpx-upload-field";
import { ImageFileInput } from "@/components/ui/image-file-input";
import { Button } from "@/components/ui/button";

export interface RouteDefaults {
  name: string;
  regionId: string;
  introSell: string;
  introCharacter: string;
  distanceMiles: string;
  ridingTimeMinutes: number;
  difficulty: number;
  surfaceQuality: string;
  hazards: string | null;
  bestTime: string | null;
  stopOffNote: string | null;
  heroImage: string | null;
  gallery: string[];
  status: string;
  isSample: boolean;
  geometry: GeoJSON.LineString | null;
  startPoint: GeoPoint | null;
  endPoint: GeoPoint | null;
}

export async function RouteForm({
  action,
  defaults,
  submitLabel,
  routeId,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: RouteDefaults;
  submitLabel: string;
  /** When editing, used to pre-check existing bike suitability / fuel stops / landmarks. */
  routeId?: string;
}) {
  const [regionRows, fuelPlaces, landmarkRows] = await Promise.all([
    db.select().from(regions).orderBy(regions.name),
    db.select().from(places).where(eq(places.type, "fuel")),
    db.select().from(landmarks).orderBy(landmarks.name),
  ]);

  const existingSuitability = routeId
    ? await db.select().from(routeBikeSuitability).where(eq(routeBikeSuitability.routeId, routeId))
    : [];
  const suitabilityByType = new Map(existingSuitability.map((s) => [s.bikeType, s]));

  const existingFuel = routeId ? await db.select().from(routeFuelStops).where(eq(routeFuelStops.routeId, routeId)) : [];
  const fuelByPlace = new Map(existingFuel.map((f) => [f.placeId, f]));

  const existingLandmarks = routeId
    ? await db.select({ landmarkId: routeLandmarks.landmarkId }).from(routeLandmarks).where(eq(routeLandmarks.routeId, routeId))
    : [];
  const selectedLandmarkIds = new Set(existingLandmarks.map((l) => l.landmarkId));

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

      <Field label="Intro — first paragraph" hint="Sells the experience">
        <Textarea name="introSell" defaultValue={defaults?.introSell} required rows={3} />
      </Field>
      <Field label="Intro — second paragraph" hint="Practical character and honest warnings">
        <Textarea name="introCharacter" defaultValue={defaults?.introCharacter} required rows={3} />
      </Field>

      <GpxUploadField
        defaults={
          defaults
            ? {
                geometry: defaults.geometry,
                distanceMiles: defaults.distanceMiles,
                startPoint: defaults.startPoint,
                endPoint: defaults.endPoint,
              }
            : undefined
        }
      />

      <FormRow>
        <Field label="Start name" hint="Shown on the Explore map, e.g. Glossop">
          <TextInput name="startLabel" defaultValue={defaults?.startPoint?.label} />
        </Field>
        <Field label="Finish name" hint="e.g. Ladybower Reservoir">
          <TextInput name="endLabel" defaultValue={defaults?.endPoint?.label} />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Riding time (minutes)">
          <TextInput name="ridingTimeMinutes" type="number" defaultValue={defaults?.ridingTimeMinutes} required />
        </Field>
        <Field label="Difficulty (1 to 5)">
          <Select name="difficulty" defaultValue={String(defaults?.difficulty ?? 3)}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Surface quality">
          <Select name="surfaceQuality" defaultValue={defaults?.surfaceQuality ?? surfaceQualityEnum.enumValues[0]}>
            {surfaceQualityEnum.enumValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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

      <Field label="Hazards">
        <Textarea name="hazards" defaultValue={defaults?.hazards ?? ""} />
      </Field>
      <FormRow>
        <Field label="Best time">
          <TextInput name="bestTime" defaultValue={defaults?.bestTime ?? ""} />
        </Field>
        <Field label="Stop-off note">
          <TextInput name="stopOffNote" defaultValue={defaults?.stopOffNote ?? ""} />
        </Field>
      </FormRow>

      <FormRow>
        <ImageUploadField label="Hero image" fileName="heroImageFile" urlName="heroImage" defaultUrl={defaults?.heroImage} />
        <div className="flex flex-col gap-3">
          <Field label="Gallery image links" hint="One per line — delete a line to remove that image">
            <Textarea name="gallery" defaultValue={defaults?.gallery.join("\n") ?? ""} />
          </Field>
          <div className="flex flex-col gap-1.5 text-[13px] text-text-muted">
            Add gallery images
            <ImageFileInput name="galleryFiles" multiple />
          </div>
        </div>
      </FormRow>

      <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
        <input type="checkbox" name="isSample" defaultChecked={defaults?.isSample} />
        Sample content (shows a &quot;Sample content&quot; label until replaced with a verified route)
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
                  <TextInput
                    name={`note_${bikeType}`}
                    defaultValue={existing?.note ?? ""}
                    placeholder="Note"
                    className="min-h-9 text-[13px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Fuel stops</legend>
        <div className="flex flex-col gap-1.5 rounded-lg bg-surface p-3">
          {fuelPlaces.length === 0 && <p className="text-[13px] text-text-muted">No fuel places yet — add one under Places.</p>}
          {fuelPlaces.map((place) => {
            const existing = fuelByPlace.get(place.id);
            return (
              <label key={place.id} className="flex items-center gap-2 text-[14px] text-text-primary">
                <input type="checkbox" name={`fuel_include_${place.id}`} defaultChecked={!!existing} />
                {place.name}
                <span className="text-text-muted">mile</span>
                <TextInput
                  name={`fuel_mile_${place.id}`}
                  defaultValue={existing?.mileMarker ?? "0"}
                  className="w-16 min-h-8 text-[13px]"
                  inputMode="decimal"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] text-text-muted">Landmarks</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-surface p-3 text-[14px] text-text-primary">
          {landmarkRows.length === 0 && <p className="text-[13px] text-text-muted">No landmarks yet.</p>}
          {landmarkRows.map((landmark) => (
            <label key={landmark.id} className="flex items-center gap-1.5">
              <input type="checkbox" name={`landmark_${landmark.id}`} defaultChecked={selectedLandmarkIds.has(landmark.id)} />
              {landmark.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
