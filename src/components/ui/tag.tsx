import type { ReactNode } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type TagVariant = "suited" | "caution" | "neutral";

export interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<TagVariant, string> = {
  suited: "bg-green-tint-bg text-green-tint-text",
  caution: "bg-red-tint-bg text-red-tint-text",
  neutral: "bg-surface text-text-secondary",
};

export function Tag({ variant = "neutral", children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {variant === "suited" && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      {variant === "caution" && <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}
