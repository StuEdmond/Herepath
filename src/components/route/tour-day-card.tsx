import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { DifficultyGauge } from "@/components/ui/difficulty-gauge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";

export interface TourDayInfo {
  dayNumber: number;
  dayRideName: string;
  dayRideSlug: string;
  startLocation: string;
  finishLocation: string;
  totalDistanceMiles: string;
  ridingTimeMinutes: number;
  hardestDifficulty: number | null;
  featuredRoadNames: string[];
  overnightLocation: string;
  fuelWarning: string | null;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function TourDayCard({ day }: { day: TourDayInfo }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px]">Day {day.dayNumber}</h3>
        <span className="text-[13px] text-text-muted">
          {day.startLocation} → {day.finishLocation}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[14px]">
        <div>
          <span className="block text-[12px] text-text-muted">Miles</span>
          <span className="font-medium text-text-primary">{day.totalDistanceMiles}</span>
        </div>
        <div>
          <span className="block text-[12px] text-text-muted">Riding time</span>
          <span className="font-medium text-text-primary">{formatMinutes(day.ridingTimeMinutes)}</span>
        </div>
        <div>
          <span className="block text-[12px] text-text-muted">Hardest section</span>
          {day.hardestDifficulty ? (
            <DifficultyGauge level={day.hardestDifficulty as 1 | 2 | 3 | 4 | 5} showLabel={false} />
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </div>
      </div>

      {day.featuredRoadNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {day.featuredRoadNames.map((name) => (
            <Tag key={name} variant="neutral">
              {name}
            </Tag>
          ))}
        </div>
      )}

      <p className="text-[14px] text-text-secondary">
        <span className="font-medium text-text-primary">Overnight — </span>
        {day.overnightLocation}
      </p>

      {day.fuelWarning && (
        <div className="flex gap-2 rounded-lg bg-red-tint-bg p-2.5 text-[13px] text-red-tint-text">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{day.fuelWarning}</p>
        </div>
      )}

      <Link href={`/day-rides/${day.dayRideSlug}`}>
        <Button type="button" variant="secondary" className="min-h-9 self-start px-3 text-[13px]">
          View day ride
        </Button>
      </Link>
    </div>
  );
}
