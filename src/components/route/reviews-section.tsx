import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import type { ReviewWithAuthor } from "@/lib/reviews";

export function ReviewsSection({
  reviews,
  average,
  writeReviewHref,
  disabledReason,
  ratedFromCompletedRiders,
}: {
  reviews: ReviewWithAuthor[];
  average: number | null;
  /** Where "Write a review" should go — omit if the action should be disabled. */
  writeReviewHref?: string;
  /** Shown as a tooltip when the button is disabled (e.g. "Log this ride to review it"). */
  disabledReason?: string;
  ratedFromCompletedRiders?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px]">Rider reviews</h2>
        {writeReviewHref ? (
          <Link href={writeReviewHref}>
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Write a review
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]" disabled title={disabledReason}>
            Write a review
          </Button>
        )}
      </div>

      {average !== null ? (
        <StarRating rating={average} reviewCount={reviews.length} />
      ) : (
        <p className="text-[14px] text-text-muted">
          No reviews yet{ratedFromCompletedRiders ? " from riders who completed it" : ""} — be the first to ride and
          review it.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 rounded-lg bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary">{review.authorName}</span>
                <StarRating rating={review.rating} />
              </div>
              {review.bikeRidden && <span className="text-[13px] text-text-muted">Rode a {review.bikeRidden}</span>}
              {review.text && <p className="text-[14px] text-text-secondary">{review.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
