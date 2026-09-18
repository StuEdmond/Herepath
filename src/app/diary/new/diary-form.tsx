"use client";

import { useState } from "react";
import { createDiaryEntry } from "../actions";
import { GpxUploadField } from "@/components/admin/gpx-upload-field";
import { Field, TextInput, Textarea, Select, FormRow } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { ImageFileInput } from "@/components/ui/image-file-input";

export interface CatalogueOption {
  id: string;
  name: string;
  type: "route" | "day_ride" | "tour";
}

export function DiaryForm({ catalogueOptions }: { catalogueOptions: CatalogueOption[] }) {
  const [source, setSource] = useState<"catalogue" | "own">("catalogue");
  const [rodeSolo, setRodeSolo] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState(catalogueOptions[0] ? `${catalogueOptions[0].type}:${catalogueOptions[0].id}` : "");

  const [targetType, targetId] = selectedTarget.split(":");

  return (
    <form action={createDiaryEntry} className="flex flex-col gap-4">
      <div className="flex rounded-lg bg-surface p-1">
        <button
          type="button"
          onClick={() => setSource("catalogue")}
          className={`min-h-10 flex-1 rounded-md text-[14px] font-medium ${source === "catalogue" ? "bg-green-primary text-white" : "text-text-secondary"}`}
        >
          A Herepath ride
        </button>
        <button
          type="button"
          onClick={() => setSource("own")}
          className={`min-h-10 flex-1 rounded-md text-[14px] font-medium ${source === "own" ? "bg-green-primary text-white" : "text-text-secondary"}`}
        >
          Your own route
        </button>
      </div>
      <input type="hidden" name="source" value={source} />

      {source === "catalogue" ? (
        <>
          <Field label="Which ride?">
            <Select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)}>
              {catalogueOptions.map((o) => (
                <option key={`${o.type}:${o.id}`} value={`${o.type}:${o.id}`}>
                  {o.name} ({o.type === "route" ? "Short route" : o.type === "day_ride" ? "Day ride" : "Tour"})
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <Field label="Distance ridden (miles)" hint="Leave blank to use the published distance">
            <TextInput name="distanceMiles" inputMode="decimal" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Route name">
            <TextInput name="ownRouteName" placeholder="e.g. My Sunday loop" required />
          </Field>
          <GpxUploadField geometryFieldName="ownRouteGeometry" includeStartEndFields={false} />
          <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
            <input type="checkbox" name="suggestAsNewRoute" />
            Suggest this as a new route for Herepath
          </label>
        </>
      )}

      <FormRow>
        <Field label="Date">
          <TextInput name="date" type="date" required />
        </Field>
        <Field label="Rating">
          <Select name="rating" defaultValue="">
            <option value="">Not rated</option>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Very good</option>
            <option value="3">3 — Good</option>
            <option value="2">2 — Fair</option>
            <option value="1">1 — Poor</option>
          </Select>
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Start time">
          <TextInput name="startTime" type="time" />
        </Field>
        <Field label="Finish time">
          <TextInput name="finishTime" type="time" />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Weather">
          <TextInput name="weatherConditions" placeholder="e.g. Dry, sunny" />
        </Field>
        <Field label="Temperature (°C)">
          <TextInput name="weatherTemperatureC" type="number" />
        </Field>
      </FormRow>

      <Field label="Bike">
        <TextInput name="bike" placeholder="e.g. Triumph Tiger 900" />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
          <input type="checkbox" name="rodeSolo" checked={rodeSolo} onChange={(e) => setRodeSolo(e.target.checked)} />
          Rode solo
        </label>
        {!rodeSolo && (
          <Field label="Riders with you" className="max-w-[160px]">
            <TextInput name="rodeWithCount" type="number" min={1} defaultValue={1} />
          </Field>
        )}
      </fieldset>

      <Field label="Notes">
        <Textarea name="notes" rows={4} placeholder="How was the ride?" />
      </Field>

      <div className="flex flex-col gap-1.5 text-[13px] text-text-muted">
        Photos
        <ImageFileInput name="photos" multiple gpsFieldName="photoGps" />
        <span className="text-[12px]">Location data is removed before anything is shown publicly</span>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] text-text-muted">Visibility</legend>
        <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
          <input type="radio" name="visibility" value="private" defaultChecked />
          Private — only you can see this
        </label>
        <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
          <input type="radio" name="visibility" value="shared" />
          Shared as a public review
        </label>
      </fieldset>

      <Button type="submit" variant="primary" className="self-start">
        Save ride
      </Button>
    </form>
  );
}
