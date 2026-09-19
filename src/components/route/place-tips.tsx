import type { PlaceReviewView } from "@/lib/place-reviews";
import { auth } from "@/lib/auth";
import { reportPlaceReview } from "@/app/places/actions";
import { ReportButton } from "@/components/ui/report-button";

/** Short rider tips left about a place when they logged a ride. Shows nothing until there are some. */
export async function PlaceTips({ reviews }: { reviews: PlaceReviewView[] }) {
  if (reviews.length === 0) return null;
  const signedIn = !!(await auth())?.user?.id;

  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-surface-raised pl-2.5 pt-0.5">
      <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Rider tips</span>
      {reviews.map((review) => (
        <div key={review.id} className="flex flex-col gap-0.5">
          <p className="text-[13px] text-text-secondary">
            &ldquo;{review.text}&rdquo; <span className="text-text-muted">— {review.author}</span>
          </p>
          <ReportButton action={reportPlaceReview} targetId={review.id} signedIn={signedIn} label="Report this tip" />
        </div>
      ))}
    </div>
  );
}
