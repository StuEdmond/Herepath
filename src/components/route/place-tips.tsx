import type { PlaceReviewView } from "@/lib/place-reviews";

/** Short rider tips left about a place when they logged a ride. Shows nothing until there are some. */
export function PlaceTips({ reviews }: { reviews: PlaceReviewView[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 border-l-2 border-surface-raised pl-2.5 pt-0.5">
      <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Rider tips</span>
      {reviews.map((review, i) => (
        <p key={i} className="text-[13px] text-text-secondary">
          &ldquo;{review.text}&rdquo; <span className="text-text-muted">— {review.author}</span>
        </p>
      ))}
    </div>
  );
}
