"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { FileUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseGpx, simplifyTrack } from "@/lib/gpx";
import { trimLineEnds } from "@/lib/geo";
import { GPX_EXPORT_GUIDES } from "@/lib/gpx-export-guides";
import { Field, TextInput } from "@/components/admin/form-fields";
import { MapSkeleton } from "@/components/map/map-skeleton";

const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <MapSkeleton className="h-56 w-full rounded-lg" />,
});

/** What was read from the file besides the route itself, for the form to fill in. Date and times are in the rider's own time zone. */
export interface ImportedRide {
  name?: string;
  date?: string;
  startTime?: string;
  finishTime?: string;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const HIDDEN_MILES = 0.5;

const OTHER_FORMATS: Record<string, string> = {
  fit: "FIT files",
  tcx: "TCX files",
  kml: "KML files",
  kmz: "KMZ files",
};

function two(n: number): string {
  return String(n).padStart(2, "0");
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

function localTime(iso: string): string {
  const d = new Date(iso);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/**
 * The "Import from your mapping app" part of Log a ride: choose a GPX file and the route is drawn, its distance worked out,
 * and the name, date and times filled in from it. Very long recordings are thinned so they save and draw quickly, and by
 * default the first and last half mile are hidden, because recordings usually start and end at the rider's home.
 */
export function GpxImportField({ onImported }: { onImported: (ride: ImportedRide) => void }) {
  const [track, setTrack] = useState<GeoJSON.LineString | null>(null);
  const [distance, setDistance] = useState("");
  const [hideEnds, setHideEnds] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // What is actually saved: the track, minus its ends when they're hidden. The map shows exactly this.
  const saved = useMemo(() => (track && hideEnds ? trimLineEnds(track, HIDDEN_MILES) : track), [track, hideEnds]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setError(null);
    setSummary(null);

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (OTHER_FORMATS[extension]) {
      setError(`${OTHER_FORMATS[extension]} can't be imported yet. Export a GPX file from your app instead. The help below shows how.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is too big (over 20 MB). Try exporting just this ride.");
      return;
    }

    setBusy(true);
    try {
      const parsed = parseGpx(await file.text());
      setTrack({ type: "LineString", coordinates: simplifyTrack(parsed.geometry.coordinates as [number, number][]) });
      setDistance(String(parsed.distanceMiles));
      setFileName(file.name);

      const ride: ImportedRide = {
        name: parsed.name,
        date: parsed.startTime ? localDate(parsed.startTime) : undefined,
        startTime: parsed.startTime ? localTime(parsed.startTime) : undefined,
        finishTime: parsed.endTime ? localTime(parsed.endTime) : undefined,
      };
      onImported(ride);

      const filled = [ride.name && "name", ride.date && "date", ride.startTime && "start and finish times"].filter(Boolean);
      setSummary(
        filled.length > 0
          ? `Read ${parsed.distanceMiles} miles from your file, and filled in the ${filled.join(", ")}. Please check they look right.`
          : `Read ${parsed.distanceMiles} miles from your file. It has no name or times, so please add those below.`,
      );
    } catch (e) {
      setTrack(null);
      setFileName(null);
      setError(e instanceof Error ? e.message : "Couldn't read this file. Is it a GPX file?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          className={cn(
            buttonVariants({ variant: "primary" }),
            "min-h-11 w-fit cursor-pointer px-4 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green-bright",
          )}
        >
          <FileUp className="h-4 w-4" aria-hidden="true" />
          {track ? "Choose a different GPX file" : "Choose GPX file"}
          {/* No name: the file itself isn't sent, only what's read from it. */}
          <input type="file" accept=".gpx,application/gpx+xml,.fit,.tcx,.kml,.kmz" onChange={handleChange} className="sr-only" />
        </label>
        {busy && <p className="text-[12px] text-text-muted">Reading your file…</p>}
        {!busy && !fileName && !error && <p className="text-[12px] text-text-muted">No file chosen</p>}
        {!busy && fileName && <p className="text-[12px] text-text-secondary">{fileName}</p>}
        {error && (
          <p className="text-[13px] text-red-accent" role="alert">
            {error}
          </p>
        )}
        {summary && <p className="text-[13px] text-text-secondary">{summary}</p>}
      </div>

      {saved && <RouteMap geometry={saved} className="h-56 w-full rounded-lg" />}

      <Field label="Distance (miles)" hint={track ? "Worked out from your file; you can change it." : "Filled in when you choose a file, or type it."}>
        <TextInput name="distanceMiles" value={distance} onChange={(e) => setDistance(e.target.value)} required inputMode="decimal" />
      </Field>

      {track && (
        <label className="flex items-start gap-2 text-[14px] text-text-primary">
          <input type="checkbox" checked={hideEnds} onChange={(e) => setHideEnds(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
          <span>
            Hide the first and last half mile
            <span className="block text-[12px] text-text-muted">
              Recordings usually start and end at home, so this keeps that private. The distance above still counts the whole ride. Photos taken in
              those stretches show at the start or end of the route.
            </span>
          </span>
        </label>
      )}

      <input type="hidden" name="ownRouteGeometry" value={saved ? JSON.stringify(saved) : ""} />

      <details className="rounded-lg border border-surface-raised p-3">
        <summary className="cursor-pointer list-none text-[14px] text-text-primary marker:content-none">How do I get a GPX file out of my app?</summary>
        <div className="mt-3 flex flex-col gap-3 text-[14px] text-text-secondary">
          <p>Most recording apps can export a ride as a GPX file. Here is how for some popular ones. Menus change, so each has a link to its maker&apos;s own help.</p>
          {GPX_EXPORT_GUIDES.map((guide) => (
            <div key={guide.name} className="flex flex-col gap-1">
              <h3 className="text-[15px] text-text-primary">{guide.name}</h3>
              {guide.steps.length > 0 && (
                <ol className="list-inside list-decimal space-y-0.5 pl-1">
                  {guide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {guide.note && <p className="text-[13px] text-text-muted">{guide.note}</p>}
              <a href={guide.helpUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-green-bright underline hover:no-underline">
                {guide.helpLabel}
              </a>
            </div>
          ))}
          <p className="text-[13px] text-text-muted">
            Using another app? Look for Export or Share and choose GPX. FIT, TCX and KML files can&apos;t be imported yet.
          </p>
        </div>
      </details>
    </div>
  );
}
