import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { DynamicTrackMap } from "@/components/map/dynamic-track-map";
import type { TrackLine } from "@/components/map/track-map";
import { LinkButton } from "@/components/ui/link-button";
import { GpxGuideLink } from "./gpx-guide-link";
import { NavAppHandoff } from "./nav-app-handoff";

const DAY_COLORS = ["#4fae82", "#4a90d9", "#d9a544", "#9b72cf", "#3bc4b0", "#d97bb0"];

export function TourMapCard({
  slug,
  name,
  days,
}: {
  slug: string;
  name: string;
  days: { dayNumber: number; name: string; slug: string; geometry: GeoJSON.LineString | null }[];
}) {
  const lines: TrackLine[] = days
    .filter((d) => d.geometry)
    .map((d) => ({
      id: `day-${d.dayNumber}`,
      geometry: d.geometry!,
      color: DAY_COLORS[(d.dayNumber - 1) % DAY_COLORS.length],
      width: 4,
    }));

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
      {lines.length > 0 ? (
        <DynamicTrackMap lines={lines} className="h-64 w-full rounded-lg sm:h-80" placesFor={{ type: "tour", slug }} />
      ) : (
        <p className="p-2 text-[14px] text-text-muted">Map available once each day&apos;s GPX track is added in admin.</p>
      )}

      {lines.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {days
            .filter((d) => d.geometry)
            .map((d) => (
              <span key={d.dayNumber} className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DAY_COLORS[(d.dayNumber - 1) % DAY_COLORS.length] }}
                  aria-hidden="true"
                />
                Day {d.dayNumber}
              </span>
            ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/tours/${slug}/gpx`} variant="primary" className="min-h-10 px-4 text-[14px]">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download full tour GPX
        </LinkButton>
        <LinkButton href={`/tours/${slug}/print`} target="_blank" variant="secondary" className="min-h-10 px-4 text-[14px]">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Printable tour sheet
        </LinkButton>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-text-primary">Download by day</span>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Link
              key={d.dayNumber}
              href={`/day-rides/${d.slug}/gpx`}
              className="rounded-full bg-surface-raised px-3 py-1 text-[13px] text-text-secondary hover:text-text-primary"
            >
              Day {d.dayNumber} GPX
            </Link>
          ))}
        </div>
      </div>

      <p className="text-[13px] text-text-muted">
        Each day opens separately in Google Maps or Apple Maps from its day ride page.{" "}
        <GpxGuideLink className="underline hover:text-text-secondary" />
      </p>

      <NavAppHandoff
        gpxHref={`/tours/${slug}/gpx`}
        filename={`${slug}.gpx`}
        rideName={name}
        note="This is the whole tour, with each day as its own line. To ride one day at a time, use that day's GPX above instead."
      />
    </div>
  );
}
