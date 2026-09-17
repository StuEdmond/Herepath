import { cn } from "@/lib/utils";

export type TripType = "route" | "day-ride" | "tour";

const LABELS: Record<TripType, string> = {
  route: "Short route",
  "day-ride": "Day ride",
  tour: "Tour",
};

export interface TripTypeBadgeProps {
  type: TripType;
  className?: string;
}

export function TripTypeBadge({ type, className }: TripTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-red-accent-strong px-2 py-1 text-[13px] font-medium text-white",
        className,
      )}
    >
      {LABELS[type]}
    </span>
  );
}
