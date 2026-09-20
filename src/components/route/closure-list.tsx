import { OctagonAlert } from "lucide-react";
import type { RideClosure } from "@/lib/closures";

const MAX_SHOWN = 5;
/** A closure spanning longer than this is a long scheduled job, usually worked at night, so it may not apply all day. */
const LONG_SPAN_DAYS = 7;

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

function when(closure: RideClosure): string {
  const start = closure.startsAt ? new Date(closure.startsAt) : null;
  const end = closure.endsAt ? new Date(closure.endsAt) : null;
  const long = start && end && end.getTime() - start.getTime() > LONG_SPAN_DAYS * 24 * 60 * 60 * 1000;
  const until = end ? (long ? dayFormat.format(end) : dateFormat.format(end)) : null;

  if (closure.status === "active") return until ? `Closed now, until ${until}` : "Closed now";
  if (closure.status === "suspended") return `Scheduled${start ? ` from ${dateFormat.format(start)}` : ""}${until ? ` to ${until}` : ""}, and not in force at the moment`;
  return `Planned${start ? ` from ${long ? dayFormat.format(start) : dateFormat.format(start)}` : ""}${until ? ` to ${until}` : ""}`;
}

function isLong(closure: RideClosure): boolean {
  return !!closure.startsAt && !!closure.endsAt && new Date(closure.endsAt).getTime() - new Date(closure.startsAt).getTime() > LONG_SPAN_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Road closures reported on a ride's road, from National Highways. It only covers motorways and major A roads in England, so it
 * can't say a ride is clear; the wording says to check before riding either way.
 */
export function ClosureList({ closures, heading = "Road closures reported on this ride" }: { closures: RideClosure[]; heading?: string }) {
  if (closures.length === 0) return null;
  const shown = closures.slice(0, MAX_SHOWN);
  const closedNow = closures.some((c) => c.status === "active");

  return (
    <div className="flex gap-2 rounded-lg bg-red-tint-bg p-3 text-[14px] text-red-tint-text" role="note">
      <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="font-medium">
          {heading}
          {closedNow ? ": part of it is closed now" : ""}
        </p>
        <ul className="flex flex-col gap-1.5">
          {shown.map((closure) => (
            <li key={closure.id}>
              <span className="block">{closure.comment}</span>
              <span className="block text-[13px] opacity-90">
                {when(closure)}
                {isLong(closure) ? ". It runs over a long period and may only apply at certain times, such as overnight" : ""}
              </span>
            </li>
          ))}
        </ul>
        {closures.length > MAX_SHOWN && <p className="text-[13px]">And {closures.length - MAX_SHOWN} more.</p>}
        <p className="text-[12px] opacity-80">
          Source: National Highways, which covers motorways and major A roads in England only. Closures on other roads won&apos;t appear here, so check
          before you ride.
        </p>
      </div>
    </div>
  );
}
