import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { advertisingEnquiries } from "@/db/schema";
import { businessTypeLabel } from "@/lib/advertising";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { setEnquiryStatus, deleteEnquiry } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABEL = { new: "New", contacted: "Contacted", closed: "Closed" } as const;
const STATUS_ORDER = { new: 0, contacted: 1, closed: 2 } as const;

export default async function AdminAdvertisingPage() {
  const rows = await db.select().from(advertisingEnquiries).orderBy(desc(advertisingEnquiries.createdAt));
  const sorted = [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Advertising enquiries <span className="text-text-muted">({rows.length})</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          From the Advertise with us form. Reply by email, then mark it contacted. To run a sponsored listing, tick <strong>Sponsored</strong> on the
          business&apos;s place under Places — it then shows a clear &ldquo;Sponsored&rdquo; label to riders.
          {newCount > 0 && <strong className="text-red-accent"> {newCount} new.</strong>}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No enquiries yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-[17px]">{row.businessName}</h3>
                  <p className="text-[13px] text-text-muted">
                    {businessTypeLabel(row.businessType)} · {formatDate(row.createdAt)}
                  </p>
                </div>
                <Tag variant={row.status === "new" ? "caution" : row.status === "contacted" ? "suited" : "neutral"}>{STATUS_LABEL[row.status]}</Tag>
              </div>

              <p className="text-[14px] text-text-secondary">
                {row.contactName} ·{" "}
                <a href={`mailto:${row.email}`} className="text-green-bright underline">
                  {row.email}
                </a>
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
              {row.website && /^https?:\/\//.test(row.website) && (
                <a href={row.website} target="_blank" rel="noopener noreferrer" className="break-all text-[13px] text-green-bright underline">
                  {row.website}
                </a>
              )}
              <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{row.message}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {row.status !== "contacted" && (
                  <form action={setEnquiryStatus.bind(null, row.id, "contacted")}>
                    <Button type="submit" variant="primary" className="min-h-8 px-3 text-[13px]">
                      Mark contacted
                    </Button>
                  </form>
                )}
                {row.status !== "closed" && (
                  <form action={setEnquiryStatus.bind(null, row.id, "closed")}>
                    <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                      Close
                    </Button>
                  </form>
                )}
                {row.status !== "new" && (
                  <form action={setEnquiryStatus.bind(null, row.id, "new")}>
                    <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                      Reopen
                    </Button>
                  </form>
                )}
                <form action={deleteEnquiry.bind(null, row.id)}>
                  <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
