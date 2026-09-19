import { Download, Map as MapIcon, Navigation } from "lucide-react";
import { DynamicTrackMap } from "@/components/map/dynamic-track-map";
import type { TrackLine } from "@/components/map/track-map";
import { LinkButton } from "@/components/ui/link-button";
import { buildStagedMapLinks, type MapStage } from "@/lib/map-links";

export function DayRideMapCard({
  slug,
  geometry,
  highlightSegments,
}: {
  slug: string;
  geometry: GeoJSON.LineString;
  /** Featured routes' own geometry, drawn in the brand green on top of the muted full-ride line. */
  highlightSegments: { id: string; geometry: GeoJSON.LineString }[];
}) {
  const stages = buildStagedMapLinks(geometry);

  const lines: TrackLine[] = [
    { id: "full-ride", geometry, color: "#8a93a3", width: 3 },
    ...highlightSegments.map((seg) => ({ id: seg.id, geometry: seg.geometry, color: "#4fae82", width: 5 })),
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
      <DynamicTrackMap lines={lines} className="h-64 w-full rounded-lg sm:h-80" />

      <div className="flex flex-col gap-1">
        <LinkButton href={`/day-rides/${slug}/gpx`} variant="primary" className="min-h-10 self-start px-4 text-[14px]">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download full ride GPX
        </LinkButton>
        <p className="text-[13px] text-text-muted">One file with the whole ride, for your sat-nav or route app.</p>
      </div>

      {stages.length === 1 ? (
        <StageLinks stage={stages[0]} showLabel={false} />
      ) : (
        <details className="group rounded-lg border border-surface-raised p-3">
          <summary className="cursor-pointer list-none text-[14px] text-text-primary marker:content-none">
            Open in Google Maps or Apple Maps
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[13px] text-text-muted">
              Map apps only accept short routes in one go, so this ride opens in {stages.length} legs. Open them in order. For one
              continuous route, use the GPX download above.
            </p>
            {stages.map((stage) => (
              <StageLinks key={stage.index} stage={stage} showLabel />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function StageLinks({ stage, showLabel }: { stage: MapStage; showLabel: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showLabel && (
        <span className="text-[13px] font-medium text-text-muted">
          Leg {stage.index} of {stage.total}
        </span>
      )}
      <LinkButton href={stage.googleUrl} target="_blank" rel="noopener noreferrer" variant="secondary" className="min-h-9 px-3 text-[13px]">
        <MapIcon className="h-4 w-4" aria-hidden="true" />
        Google Maps
      </LinkButton>
      <LinkButton href={stage.appleUrl} target="_blank" rel="noopener noreferrer" variant="secondary" className="min-h-9 px-3 text-[13px]">
        <Navigation className="h-4 w-4" aria-hidden="true" />
        Apple Maps
      </LinkButton>
    </div>
  );
}
