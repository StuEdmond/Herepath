import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ rating, reviewCount, className }: StarRatingProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[15px] text-text-secondary", className)}
      aria-label={
        reviewCount !== undefined
          ? `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`
          : `Rated ${rating.toFixed(1)} out of 5`
      }
    >
      <Star className="h-4 w-4 fill-green-bright text-green-bright" aria-hidden="true" />
      <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-text-muted">· {reviewCount} reviews</span>
      )}
    </span>
  );
}
