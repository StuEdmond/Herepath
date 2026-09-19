"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PLACE_KINDS } from "@/lib/place-kinds";
import { preloadPlacesJob, type PreloadResult } from "./actions";

export interface PreloadRide {
  type: "route" | "day-ride" | "tour";
  slug: string;
  name: string;
}

type JobState = { state: "waiting" } | { state: "running" } | { state: "finished"; result: PreloadResult };

const TYPE_LABEL: Record<PreloadRide["type"], string> = { route: "Route", "day-ride": "Day ride", tour: "Tour" };
const PAUSE_BETWEEN_JOBS_MS = 1200;

function describe(job: JobState): string {
  if (job.state === "waiting") return "Waiting";
  if (job.state === "running") return "Looking up…";
  const r = job.result;
  if (r.status === "done") return `Done · ${r.count} found`;
  if (r.status === "partial") return `Partly done · ${r.count} found so far`;
  return `${r.status === "skipped" ? "Skipped" : "Failed"} · ${r.reason}`;
}

/** Runs the lookups one after another so the free OpenStreetMap service isn't hit with several at once. */
export function PreloadRunner({ rides }: { rides: PreloadRide[] }) {
  const jobs = rides.flatMap((ride) => PLACE_KINDS.map((kind) => ({ ride, kind: kind.id, kindLabel: kind.label, key: `${ride.type}:${ride.slug}:${kind.id}` })));
  const [states, setStates] = useState<Record<string, JobState>>({});
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  const finished = jobs.filter((j) => states[j.key]?.state === "finished").length;
  const partial = jobs.filter((j) => {
    const s = states[j.key];
    return s?.state === "finished" && (s.result.status === "partial" || s.result.status === "error");
  }).length;

  async function run() {
    stopRef.current = false;
    setRunning(true);
    setStates({});
    for (const job of jobs) {
      if (stopRef.current) break;
      setStates((s) => ({ ...s, [job.key]: { state: "running" } }));
      // A long tour can run out of time on the first go; what was found is kept, so one more go usually finishes it.
      let result = await preloadPlacesJob(job.ride.type, job.ride.slug, job.kind);
      if (result.status === "partial" && !stopRef.current) result = await preloadPlacesJob(job.ride.type, job.ride.slug, job.kind);
      setStates((s) => ({ ...s, [job.key]: { state: "finished", result } }));
      await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_JOBS_MS));
    }
    setRunning(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <Button type="button" variant="secondary" onClick={() => (stopRef.current = true)}>
            Stop after this one
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={run} disabled={jobs.length === 0}>
            {finished > 0 ? "Run again" : "Preload places"}
          </Button>
        )}
        <span className="text-[14px] text-text-secondary" role="status">
          {finished} of {jobs.length} done{partial > 0 ? ` · ${partial} incomplete` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-raised" aria-hidden="true">
        <div className="h-full bg-green-primary transition-all" style={{ width: `${jobs.length ? (finished / jobs.length) * 100 : 0}%` }} />
      </div>

      <div className="overflow-x-auto rounded-lg bg-surface">
        <table className="w-full min-w-[520px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-surface-raised text-text-muted">
              <th className="px-3 py-2 font-medium">Ride</th>
              <th className="px-3 py-2 font-medium">Places</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const state = states[job.key] ?? { state: "waiting" as const };
              return (
                <tr key={job.key} className="border-b border-surface-raised last:border-0">
                  <td className="px-3 py-2">
                    {job.ride.name} <span className="text-text-muted">· {TYPE_LABEL[job.ride.type]}</span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{job.kindLabel}</td>
                  <td className="px-3 py-2 text-text-secondary">{describe(state)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
