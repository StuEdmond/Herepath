import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db/client";
import { users, diaryEntries } from "@/db/schema";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { setMembershipTier } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(users.memberSince);
  rows.reverse();
  const rideCounts = new Map(
    (await db.select({ userId: diaryEntries.userId, rides: count() }).from(diaryEntries).groupBy(diaryEntries.userId)).map((r) => [r.userId, r.rides]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Users <span className="text-text-muted">({rows.length})</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          No billing yet — Premium is set manually here ahead of a real membership launch.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-surface-raised text-text-muted">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Member since</th>
                <th className="px-3 py-2 font-medium">Rides</th>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-raised last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${row.id}`} className="underline hover:text-green-bright">
                      {row.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{row.email}</td>
                  <td className="px-3 py-2 text-text-muted">{formatDate(row.memberSince)}</td>
                  <td className="px-3 py-2 text-text-muted">{rideCounts.get(row.id) ?? 0}</td>
                  <td className="px-3 py-2">
                    <Tag variant={row.membershipTier === "premium" ? "suited" : "neutral"}>
                      {row.membershipTier === "premium" ? "Premium" : "Free"}
                    </Tag>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={setMembershipTier.bind(null, row.id, row.membershipTier === "premium" ? "free" : "premium")}>
                      <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                        Make {row.membershipTier === "premium" ? "free" : "premium"}
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
