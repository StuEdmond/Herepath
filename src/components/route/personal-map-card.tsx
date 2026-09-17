import { DynamicTrackMap } from "@/components/map/dynamic-track-map";
import type { TrackLine } from "@/components/map/track-map";

export function PersonalMapCard({ lines }: { lines: { id: string; geometry: GeoJSON.LineString }[] }) {
  if (lines.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-4 text-[14px] text-text-muted">
        Log a ride to start filling in your personal map.
      </div>
    );
  }

  const trackLines: TrackLine[] = lines.map((l) => ({ id: l.id, geometry: l.geometry, color: "#4fae82", width: 3 }));

  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <DynamicTrackMap lines={trackLines} className="h-64 w-full sm:h-80" />
    </div>
  );
}
