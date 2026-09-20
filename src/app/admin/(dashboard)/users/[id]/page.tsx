import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { getMembership } from "@/lib/membership";
import { TIER_LABELS } from "@/lib/plans";
import { getDiaryEntries } from "@/lib/your-rides";
import { Tag } from "@/components/ui/tag";
import { ResetPasswordForm } from "./reset-password-form";

const TYPE_LABEL = { route: "Route", day_ride: "Day ride", tour: "Tour" } as const;

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) notFound();

  const membership = await getMembership(id);
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, id));
  const entries = await getDiaryEntries(id);
  const totalMiles = entries.reduce((sum, e) => sum + Number(e.distanceMiles), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/users" className="text-[13px] text-text-muted underline">
          All users
        </Link>
        <h2 className="text-[20px]">{user.name ?? user.email}</h2>
        <p className="text-[13px] text-text-muted">
          {user.email} · member since {formatDate(user.memberSince)} · {TIER_LABELS[membership.tier]}
          {user.mainBike ? ` · ${user.mainBike}` : ""}
        </p>
      </div>

      <section className="flex flex-col gap-1 rounded-xl bg-surface p-4">
        <h3 className="text-[16px]">Plan</h3>
        <p className="text-[13px] text-text-muted">
          Level now: {TIER_LABELS[membership.tier]}
          {membership.source === "subscription" ? " (paid subscription)" : membership.source === "admin" ? " (set by hand)" : ""}. Set by hand: {TIER_LABELS[membership.adminTier]}.
        </p>
        {subscription ? (
          <p className="text-[13px] text-text-muted">
            Stripe subscription: {subscription.plan}, {subscription.status}
            {subscription.currentPeriodEnd ? `, current period ends ${formatDate(subscription.currentPeriodEnd)}` : ""}
            {subscription.cancelAtPeriodEnd ? ", set to cancel at the end of it" : ""}. Customer {subscription.stripeCustomerId}.
          </p>
        ) : (
          <p className="text-[13px] text-text-muted">No paid subscription.</p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
        <h3 className="text-[16px]">Password</h3>
        <p className="text-[13px] text-text-muted">
          {user.passwordHash
            ? "Generate a new temporary password if this rider is locked out."
            : "This rider signed up with Google and has no password. Resetting gives them one they can sign in with."}
        </p>
        <ResetPasswordForm userId={user.id} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[16px]">
          Logged rides <span className="text-text-muted">({entries.length})</span>
          {entries.length > 0 && <span className="text-[13px] text-text-muted"> · {Math.round(totalMiles)} miles in total</span>}
        </h3>
        <p className="text-[12px] text-text-muted">
          Ride names, dates and distances only — private notes and photos aren&apos;t shown here.
        </p>

        {entries.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-text-secondary">No rides logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-surface">
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-surface-raised text-text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Ride</th>
                  <th className="px-3 py-2 font-medium">Miles</th>
                  <th className="px-3 py-2 font-medium">Rating</th>
                  <th className="px-3 py-2 font-medium">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-surface-raised last:border-0">
                    <td className="px-3 py-2 text-text-muted">{formatDate(entry.date)}</td>
                    <td className="px-3 py-2">
                      {entry.name}{" "}
                      <span className="text-[12px] text-text-muted">
                        {entry.targetType ? TYPE_LABEL[entry.targetType] : "Own route"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{entry.distanceMiles}</td>
                    <td className="px-3 py-2">{entry.rating ? `${entry.rating}/5` : "—"}</td>
                    <td className="px-3 py-2">
                      <Tag variant={entry.visibility === "shared" ? "suited" : "neutral"}>
                        {entry.visibility === "shared" ? "Shared" : "Private"}
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
