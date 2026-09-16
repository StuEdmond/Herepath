"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextInput } from "@/components/admin/form-fields";

export interface TourDayDraft {
  key: string;
  dayRideId: string;
  overnightLocation: string;
  fuelWarning: string;
}

export function TourDayBuilder({
  dayRideOptions,
  initialDays,
}: {
  dayRideOptions: { id: string; name: string }[];
  initialDays: TourDayDraft[];
}) {
  const [days, setDays] = useState<TourDayDraft[]>(initialDays);

  function update(key: string, patch: Partial<TourDayDraft>) {
    setDays((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function remove(key: string) {
    setDays((prev) => prev.filter((d) => d.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setDays((prev) => {
      const i = prev.findIndex((d) => d.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function add() {
    setDays((prev) => [...prev, { key: crypto.randomUUID(), dayRideId: "", overnightLocation: "", fuelWarning: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {days.map((day, i) => (
          <div key={day.key} className="flex flex-col gap-2 rounded-lg bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-text-muted">Day {i + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px]" onClick={() => move(day.key, -1)}>
                  Up
                </Button>
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px]" onClick={() => move(day.key, 1)}>
                  Down
                </Button>
                <Button type="button" variant="ghost" className="min-h-7 px-2 text-[12px] text-red-accent" onClick={() => remove(day.key)}>
                  Remove
                </Button>
              </div>
            </div>
            <Select value={day.dayRideId} onChange={(e) => update(day.key, { dayRideId: e.target.value })} className="min-h-9 text-[13px]">
              <option value="">Choose a day ride</option>
              {dayRideOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput
                placeholder="Overnight location"
                value={day.overnightLocation}
                onChange={(e) => update(day.key, { overnightLocation: e.target.value })}
                className="min-h-9 text-[13px]"
              />
              <TextInput
                placeholder="Fuel warning (optional)"
                value={day.fuelWarning}
                onChange={(e) => update(day.key, { fuelWarning: e.target.value })}
                className="min-h-9 text-[13px]"
              />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" className="min-h-8 self-start px-3 text-[13px]" onClick={add}>
        + Day
      </Button>
      <input type="hidden" name="tourDaysJson" value={JSON.stringify(days)} />
    </div>
  );
}
