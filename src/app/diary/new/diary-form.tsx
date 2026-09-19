"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createDiaryEntry } from "../actions";
import { GpxImportField, type ImportedRide } from "@/components/diary/gpx-import-field";
import { Field, TextInput, Textarea, Select, FormRow } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { ImageFileInput } from "@/components/ui/image-file-input";
import { PLACE_REVIEW_MAX_LENGTH } from "@/lib/place-review-limits";
import type { ReviewablePlace } from "@/lib/place-reviews";

export interface CatalogueOption {
  id: string;
  name: string;
  type: "route" | "day_ride" | "tour";
}

const PLACE_TYPE_LABELS: Record<string, string> = {
  cafe: "Cafe",
  pub: "Pub",
  restaurant: "Restaurant",
  hotel: "Hotel",
  b_and_b: "B&B",
  campsite: "Campsite",
};

export function DiaryForm({
  catalogueOptions,
  reviewablePlacesByTarget,
}: {
  catalogueOptions: CatalogueOption[];
  reviewablePlacesByTarget: Record<string, ReviewablePlace[]>;
}) {
  // Importing a recording is the common way in, so it comes first.
  const [source, setSource] = useState<"catalogue" | "own">("own");
  const [rodeSolo, setRodeSolo] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState(catalogueOptions[0] ? `${catalogueOptions[0].type}:${catalogueOptions[0].id}` : "");

  // These four can be filled in from an imported file, so the form holds them rather than leaving them to the browser.
  const [routeName, setRouteName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [finishTime, setFinishTime] = useState("");
  const importedNameRef = useRef("");

  function applyImport(ride: ImportedRide) {
    // A name the rider typed themselves is kept; one from an earlier import is replaced.
    if (ride.name) {
      const name = ride.name;
      setRouteName((current) => (current.trim() === "" || current === importedNameRef.current ? name : current));
      importedNameRef.current = name;
    }
    if (ride.date) setDate(ride.date);
    if (ride.startTime) setStartTime(ride.startTime);
    if (ride.finishTime) setFinishTime(ride.finishTime);
  }

  const [targetType, targetId] = selectedTarget.split(":");
  const reviewablePlaces = reviewablePlacesByTarget[selectedTarget] ?? [];

  return (
    <form action={createDiaryEntry} className="flex flex-col gap-4">
      <div className="flex rounded-lg bg-surface p-1">
        <button
          type="button"
          onClick={() => setSource("own")}
          className={`min-h-10 flex-1 rounded-md text-[14px] font-medium ${source === "own" ? "bg-green-primary text-white" : "text-text-secondary"}`}
        >
          Import from your app
        </button>
        <button
          type="button"
          onClick={() => setSource("catalogue")}
          className={`min-h-10 flex-1 rounded-md text-[14px] font-medium ${source === "catalogue" ? "bg-green-primary text-white" : "text-text-secondary"}`}
        >
          A Herepath ride
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
          <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
            <div>
              <h2 className="text-[16px] text-text-primary">Import from your mapping app</h2>
              <p className="mt-0.5 text-[13px] text-text-muted">
                Choose the GPX file your app saved of your ride. We draw it on the map and fill in the distance, name, date and times for you.
              </p>
            </div>
            <GpxImportField onImported={applyImport} />
          </div>
          <Field label="Route name">
            <TextInput name="ownRouteName" placeholder="e.g. My Sunday loop" required value={routeName} onChange={(e) => setRouteName(e.target.value)} />
          </Field>
          <label className="flex items-center gap-1.5 text-[14px] text-text-primary">
            <input type="checkbox" name="suggestAsNewRoute" />
            Suggest this as a new route for Herepath
          </label>
        </>
      )}

      <FormRow>
        <Field label="Date">
          <TextInput name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
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
          <TextInput name="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="Finish time">
          <TextInput name="finishTime" type="time" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} />
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

      {source === "catalogue" && reviewablePlaces.length > 0 && (
        <fieldset key={selectedTarget} className="flex flex-col gap-3 rounded-xl bg-surface p-3">
          <legend className="px-1 text-[15px] text-text-primary">Places on this ride</legend>
          <p className="-mt-1 text-[13px] text-text-muted">
            Stopped anywhere? Leave a line for other riders — it&apos;s shown publicly on that place, so please follow the{" "}
            <Link href="/faq#guidelines" target="_blank" className="underline">
              community guidelines
            </Link>
            . Skip any you didn&apos;t visit.
          </p>
          {reviewablePlaces.map((place) => (
            <Field key={place.id} label={`${place.name} · ${PLACE_TYPE_LABELS[place.type] ?? place.type}`}>
              <TextInput name={`placeReview_${place.id}`} maxLength={PLACE_REVIEW_MAX_LENGTH} placeholder="e.g. Great bacon rolls, plenty of bike parking" />
            </Field>
          ))}
        </fieldset>
      )}

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
