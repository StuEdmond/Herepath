import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { waitlistSignups } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { deleteWaitlistSignup } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AdminWaitlistPage() {
  const rows = await db.select().from(waitlistSignups).orderBy(desc(waitlistSignups.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px]">
            Waitlist <span className="text-text-muted">({rows.length})</span>
          </h2>
          <p className="text-[13px] text-text-muted">People who asked to be told when Premium or Premium Plus is ready.</p>
        </div>
        {rows.length > 0 && (
          <a href="/admin/waitlist/export">
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Download CSV
            </Button>
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">Nobody on the waitlist yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface">
          <table className="w-full min-w-[420px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-surface-raised text-text-muted">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Signed up</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-raised last:border-0">
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2 text-text-secondary">{row.interest === "premium_plus" ? "Premium Plus" : "Premium"}</td>
                  <td className="px-3 py-2 text-text-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteWaitlistSignup.bind(null, row.id)}>
                      <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
