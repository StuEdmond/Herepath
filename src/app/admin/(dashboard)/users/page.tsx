import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db/client";
import { users, diaryEntries, subscriptions, membershipTierEnum } from "@/db/schema";
import { TIER_LABELS, type TierId } from "@/lib/plans";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { setMembershipTier } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(users.memberSince);
  rows.reverse();
  const paid = new Map((await db.select().from(subscriptions)).map((s) => [s.userId, s]));
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
          Paid subscriptions come from Stripe and show here as &ldquo;Paid&rdquo;. &ldquo;Set by hand&rdquo; is a level you give someone yourself (testers, friends, founding members), and a subscription never changes it.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-surface-raised text-text-muted">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Member since</th>
                <th className="px-3 py-2 font-medium">Rides</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Set by hand</th>
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
                    {(() => {
                      const subscription = paid.get(row.id);
                      const paying = !!subscription && ["active", "trialing", "past_due"].includes(subscription.status);
                      const tier: TierId = paying && row.membershipTier === "free" ? "premium" : row.membershipTier;
                      return (
                        <div className="flex flex-col gap-0.5">
                          <Tag variant={tier === "free" ? "neutral" : "suited"} className="w-fit">
                            {TIER_LABELS[tier]}
                          </Tag>
                          {subscription && (
                            <span className="text-[12px] text-text-muted">
                              Paid {subscription.plan}, {subscription.status}
                              {subscription.cancelAtPeriodEnd ? ", ending" : ""}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={setMembershipTier.bind(null, row.id)} className="flex items-center justify-end gap-2">
                      <label className="sr-only" htmlFor={`tier-${row.id}`}>
                        Level set by hand
                      </label>
                      <select
                        id={`tier-${row.id}`}
                        name="tier"
                        defaultValue={row.membershipTier}
                        className="min-h-8 rounded-lg border border-text-muted/40 bg-surface px-2 text-[13px] text-text-primary"
                      >
                        {membershipTierEnum.enumValues.map((value) => (
                          <option key={value} value={value}>
                            {TIER_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                        Set
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
