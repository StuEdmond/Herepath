import { cn } from "@/lib/utils";

export const DIFFICULTY_LABELS = [
  "Relaxed",
  "Easy",
  "Moderate",
  "Challenging",
  "Very challenging",
] as const;

export const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: "Wide roads, gentle bends, good surface.",
  2: "Some bends and gradients, good surface, suitable for new riders taking care.",
  3: "Frequent bends, elevation changes, some narrower sections.",
  4: "Tight bends, steep gradients, narrow or busy sections.",
  5: "Hairpins, very steep gradients, single-track or poor surface; experienced riders only.",
};

export interface DifficultyGaugeProps {
  level: 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
  /** Writes the rating out beside the bars ("4 of 5 · Challenging"), so it can be read without seeing the graphic. */
  showValue?: boolean;
  className?: string;
}

export function DifficultyGauge({ level, showLabel = true, showValue = false, className }: DifficultyGaugeProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-end gap-2">
        <div className="flex items-end gap-1" role="img" aria-label={`Difficulty ${level} of 5 · ${DIFFICULTY_LABELS[level - 1]}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-2.5 rounded-sm",
                i < level ? "bg-green-bright" : "bg-surface-raised",
              )}
              style={{ height: `${10 + i * 5}px` }}
              aria-hidden="true"
            />
          ))}
        </div>
        {showValue && (
          <span className="font-sans text-[13px] leading-none text-text-secondary">
            {level} of 5 · {DIFFICULTY_LABELS[level - 1]}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-[13px] text-text-muted">
          Difficulty {level} of 5 · {DIFFICULTY_LABELS[level - 1]}
        </span>
      )}
    </div>
  );
}
