import { Download, Map as MapIcon, Navigation } from "lucide-react";
import { DynamicTrackMap } from "@/components/map/dynamic-track-map";
import type { TrackLine } from "@/components/map/track-map";
import { LinkButton } from "@/components/ui/link-button";
import { buildStagedMapLinks } from "@/lib/map-links";

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

      <LinkButton href={`/day-rides/${slug}/gpx`} variant="primary" className="min-h-10 self-start px-4 text-[14px]">
        <Download className="h-4 w-4" aria-hidden="true" />
        Download full ride GPX
      </LinkButton>

      <div className="flex flex-col gap-2">
        {stages.map((stage) => (
          <div key={stage.index} className="flex flex-wrap items-center gap-2">
            {stages.length > 1 && (
              <span className="text-[13px] font-medium text-text-muted">
                Stage {stage.index} of {stage.total}
              </span>
            )}
            <LinkButton
              href={stage.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="min-h-9 px-3 text-[13px]"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Google Maps
            </LinkButton>
            <LinkButton
              href={stage.appleUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="min-h-9 px-3 text-[13px]"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Apple Maps
            </LinkButton>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-text-muted">Map apps will split this ride into stages to keep you on the right roads.</p>
    </div>
  );
}
