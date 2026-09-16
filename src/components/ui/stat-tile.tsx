import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg bg-surface p-3", className)}>
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="font-heading text-[20px] leading-tight text-text-primary">{value}</span>
    </div>
  );
}
