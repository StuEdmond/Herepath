import Link from "next/link";
import { Flag, MapPin, Coffee, UtensilsCrossed, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStage {
  id: string;
  kind: "start" | "route" | "link" | "stop" | "finish";
  location?: string | null;
  note?: string | null;
  description?: string | null;
  fromMile?: string | null;
  toMile?: string | null;
  mile?: string | null;
  stopType?: "lunch" | "coffee" | "fuel" | null;
  route?: { name: string; slug: string } | null;
  place?: { name: string } | null;
}

const STOP_ICONS = { lunch: UtensilsCrossed, coffee: Coffee, fuel: Fuel } as const;

function mileRange(from?: string | null, to?: string | null): string | null {
  if (from == null || to == null) return null;
  return `Mile ${from} to ${to}`;
}

export function StageTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <ol className="flex flex-col">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        return (
          <li key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StageIcon stage={stage} />
              {!isLast && <span className="w-px flex-1 bg-surface-raised" aria-hidden="true" />}
            </div>
            <div className={cn("flex flex-col gap-1 pb-5", stage.kind === "route" && "w-full")}>
              <StageContent stage={stage} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StageIcon({ stage }: { stage: TimelineStage }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
  if (stage.kind === "start") {
    return (
      <span className={cn(base, "bg-green-primary text-white")}>
        <MapPin className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  if (stage.kind === "finish") {
    return (
      <span className={cn(base, "bg-red-accent text-white")}>
        <Flag className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  if (stage.kind === "stop" && stage.stopType) {
    const Icon = STOP_ICONS[stage.stopType];
    return (
      <span className={cn(base, "bg-surface-raised text-text-primary")}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  return <span className={cn(base, stage.kind === "route" ? "bg-green-bright" : "bg-surface-raised")} />;
}

function StageContent({ stage }: { stage: TimelineStage }) {
  if (stage.kind === "start") {
    return (
      <>
        <span className="font-medium text-text-primary">Start — {stage.location}</span>
        {stage.note && <span className="text-[14px] text-text-secondary">{stage.note}</span>}
      </>
    );
  }
  if (stage.kind === "finish") {
    return (
      <>
        <span className="font-medium text-text-primary">Finish — {stage.location}</span>
        {stage.note && <span className="text-[14px] text-text-secondary">{stage.note}</span>}
      </>
    );
  }
  if (stage.kind === "route" && stage.route) {
    return (
      <Link
        href={`/routes/${stage.route.slug}`}
        className="flex flex-col gap-0.5 rounded-lg bg-green-tint-bg px-3 py-2 text-green-tint-text hover:bg-green-tint-bg/80"
      >
        <span className="text-[12px] uppercase tracking-wide opacity-80">Featured route</span>
        <span className="font-medium">{stage.route.name}</span>
        {mileRange(stage.fromMile, stage.toMile) && <span className="text-[13px]">{mileRange(stage.fromMile, stage.toMile)}</span>}
      </Link>
    );
  }
  if (stage.kind === "link") {
    return (
      <span className="text-[14px] text-text-secondary">
        {stage.description}
        {mileRange(stage.fromMile, stage.toMile) && (
          <span className="text-text-muted"> · {mileRange(stage.fromMile, stage.toMile)}</span>
        )}
      </span>
    );
  }
  if (stage.kind === "stop") {
    return (
      <span className="text-[14px] text-text-secondary">
        <span className="font-medium capitalize text-text-primary">{stage.stopType}</span>
        {stage.place && <> — {stage.place.name}</>}
        {stage.mile != null && <span className="text-text-muted"> · Mile {stage.mile}</span>}
      </span>
    );
  }
  return null;
}
