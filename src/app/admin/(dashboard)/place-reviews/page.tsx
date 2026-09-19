import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { placeReviews, places, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { deletePlaceReview } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPlaceReviewsPage() {
  const rows = await db
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
    .orderBy(desc(placeReviews.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Place tips <span className="text-text-muted">({rows.length})</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          One-line tips riders leave about cafes, pubs, hotels and campsites when logging a ride. They show publicly on the place — delete
          anything inappropriate.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No tips yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15px] text-text-primary">{row.placeName}</p>
                <p className="text-[13px] text-text-muted">
                  {row.authorName ?? row.authorEmail} · {formatDate(row.createdAt)}
                </p>
              </div>
              <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{row.text}</p>
              <form action={deletePlaceReview.bind(null, row.id)}>
                <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
                  Delete
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
