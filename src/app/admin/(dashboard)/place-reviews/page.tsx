import { desc, eq, sql, count } from "drizzle-orm";
import { db } from "@/db/client";
import { placeReviews, placeReviewReports, places, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { reportReasonLabel } from "@/lib/place-review-limits";
import { deletePlaceReview, dismissPlaceReviewReports } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPlaceReviewsPage() {
  const [rows, reportRows] = await Promise.all([
    db
      .select({
        id: placeReviews.id,
        text: placeReviews.text,
        createdAt: placeReviews.createdAt,
        placeName: places.name,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(placeReviews)
      .innerJoin(places, eq(placeReviews.placeId, places.id))
      .innerJoin(users, eq(placeReviews.userId, users.id))
      .orderBy(desc(placeReviews.createdAt)),
    db
      .select({
        reviewId: placeReviewReports.placeReviewId,
        reports: count(),
        reasons: sql<string>`string_agg(distinct ${placeReviewReports.reason}, ',')`,
      })
      .from(placeReviewReports)
      .groupBy(placeReviewReports.placeReviewId),
  ]);

  const reportsByReview = new Map(reportRows.map((r) => [r.reviewId, { count: r.reports, reasons: r.reasons.split(",").map(reportReasonLabel) }]));
  // Reported tips first (most reports on top), then the rest newest first.
  const sorted = [...rows].sort((a, b) => (reportsByReview.get(b.id)?.count ?? 0) - (reportsByReview.get(a.id)?.count ?? 0));
  const reportedCount = reportsByReview.size;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Place tips <span className="text-text-muted">({rows.length})</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          One-line tips riders leave about cafes, pubs, hotels and campsites when logging a ride. They show publicly on the place, and riders can
          report them — reported tips are listed first.
          {reportedCount > 0 && <strong className="text-red-accent"> {reportedCount} reported.</strong>}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No tips yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((row) => {
            const report = reportsByReview.get(row.id);
            return (
              <div key={row.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] text-text-primary">
                    {row.placeName}
                    {report && (
                      <Tag variant="caution">
                        Reported {report.count > 1 ? `×${report.count}` : ""}
                      </Tag>
                    )}
                  </p>
                  <p className="text-[13px] text-text-muted">
                    {row.authorName ?? row.authorEmail} · {formatDate(row.createdAt)}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{row.text}</p>
                {report && <p className="text-[13px] text-red-accent">Reason: {report.reasons.join(", ")}</p>}
                <div className="flex flex-wrap gap-2">
                  <form action={deletePlaceReview.bind(null, row.id)}>
                    <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
                      Delete tip
                    </Button>
                  </form>
                  {report && (
                    <form action={dismissPlaceReviewReports.bind(null, row.id)}>
                      <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                        Keep tip, dismiss reports
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
