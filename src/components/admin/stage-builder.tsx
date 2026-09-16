"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextInput } from "@/components/admin/form-fields";

export type StageKind = "start" | "route" | "link" | "stop" | "finish";

export interface StageDraft {
  key: string;
  kind: StageKind;
  location: string;
  note: string;
  routeId: string;
  fromMile: string;
  toMile: string;
  description: string;
  placeId: string;
  mile: string;
  stopType: "lunch" | "coffee" | "fuel";
}

function emptyStage(kind: StageKind): StageDraft {
  return {
    key: crypto.randomUUID(),
    kind,
    location: "",
    note: "",
    routeId: "",
    fromMile: "",
    toMile: "",
    description: "",
    placeId: "",
    mile: "",
    stopType: "lunch",
  };
}

export function StageBuilder({
  routeOptions,
  placeOptions,
  initialStages,
}: {
  routeOptions: { id: string; name: string }[];
  placeOptions: { id: string; name: string }[];
  initialStages: StageDraft[];
}) {
  const [stages, setStages] = useState<StageDraft[]>(
    initialStages.length > 0 ? initialStages : [emptyStage("start"), emptyStage("finish")],
  );

  function update(key: string, patch: Partial<StageDraft>) {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function remove(key: string) {
    setStages((prev) => prev.filter((s) => s.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setStages((prev) => {
      const i = prev.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function add(kind: StageKind) {
    setStages((prev) => [...prev, emptyStage(kind)]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex flex-col gap-2 rounded-lg bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-text-muted">Stage {i + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px]" onClick={() => move(stage.key, -1)}>
                  Up
                </Button>
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px]" onClick={() => move(stage.key, 1)}>
                  Down
                </Button>
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px] text-red-accent" onClick={() => remove(stage.key)}>
                  Remove
                </Button>
              </div>
            </div>

            <Select value={stage.kind} onChange={(e) => update(stage.key, { kind: e.target.value as StageKind })} className="min-h-9 text-[13px]">
              <option value="start">Start</option>
              <option value="route">Featured route</option>
              <option value="link">Link road</option>
              <option value="stop">Stop</option>
              <option value="finish">Finish</option>
            </Select>

            {(stage.kind === "start" || stage.kind === "finish") && (
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  placeholder="Location"
                  value={stage.location}
                  onChange={(e) => update(stage.key, { location: e.target.value })}
                  className="min-h-9 text-[13px]"
                />
                <TextInput
                  placeholder="Note"
                  value={stage.note}
                  onChange={(e) => update(stage.key, { note: e.target.value })}
                  className="min-h-9 text-[13px]"
                />
              </div>
            )}

            {stage.kind === "route" && (
              <div className="grid gap-2 sm:grid-cols-3">
                <Select value={stage.routeId} onChange={(e) => update(stage.key, { routeId: e.target.value })} className="min-h-9 text-[13px]">
                  <option value="">Choose a route</option>
                  {routeOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
                <TextInput
                  placeholder="From mile"
                  value={stage.fromMile}
                  onChange={(e) => update(stage.key, { fromMile: e.target.value })}
                  className="min-h-9 text-[13px]"
                  inputMode="decimal"
                />
                <TextInput
                  placeholder="To mile"
                  value={stage.toMile}
                  onChange={(e) => update(stage.key, { toMile: e.target.value })}
                  className="min-h-9 text-[13px]"
                  inputMode="decimal"
                />
              </div>
            )}

            {stage.kind === "link" && (
              <div className="grid gap-2 sm:grid-cols-3">
                <TextInput
                  placeholder="Description"
                  value={stage.description}
                  onChange={(e) => update(stage.key, { description: e.target.value })}
                  className="min-h-9 text-[13px] sm:col-span-1"
                />
                <TextInput
                  placeholder="From mile"
                  value={stage.fromMile}
                  onChange={(e) => update(stage.key, { fromMile: e.target.value })}
                  className="min-h-9 text-[13px]"
                  inputMode="decimal"
                />
                <TextInput
                  placeholder="To mile"
                  value={stage.toMile}
                  onChange={(e) => update(stage.key, { toMile: e.target.value })}
                  className="min-h-9 text-[13px]"
                  inputMode="decimal"
                />
              </div>
            )}

            {stage.kind === "stop" && (
              <div className="grid gap-2 sm:grid-cols-3">
                <Select value={stage.placeId} onChange={(e) => update(stage.key, { placeId: e.target.value })} className="min-h-9 text-[13px]">
                  <option value="">Choose a place</option>
                  {placeOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <TextInput
                  placeholder="Mile"
                  value={stage.mile}
                  onChange={(e) => update(stage.key, { mile: e.target.value })}
                  className="min-h-9 text-[13px]"
                  inputMode="decimal"
                />
                <Select
                  value={stage.stopType}
                  onChange={(e) => update(stage.key, { stopType: e.target.value as StageDraft["stopType"] })}
                  className="min-h-9 text-[13px]"
                >
                  <option value="lunch">Lunch</option>
                  <option value="coffee">Coffee</option>
                  <option value="fuel">Fuel</option>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["start", "route", "link", "stop", "finish"] as const).map((kind) => (
          <Button key={kind} type="button" variant="secondary" className="min-h-8 px-3 text-[13px] capitalize" onClick={() => add(kind)}>
            + {kind === "route" ? "Featured route" : kind}
          </Button>
        ))}
      </div>

      <input type="hidden" name="stagesJson" value={JSON.stringify(stages)} />
    </div>
  );
}
