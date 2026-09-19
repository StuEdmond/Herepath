import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRides, rideConditionReports, routes, tours, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { conditionCategoryLabel } from "@/lib/condition-reports";
import { deleteRoadReport, reopenRoadReport, resolveRoadReport } from "./actions";

const RESOLVED_SHOWN = 30;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface RideInfo {
  name: string;
  editHref: string;
  publicHref: string;
}

export default async function AdminRoadReportsPage() {
  const reports = await db
    .select({
      id: rideConditionReports.id,
      targetType: rideConditionReports.targetType,
      targetId: rideConditionReports.targetId,
      category: rideConditionReports.category,
      note: rideConditionReports.note,
      resolvedAt: rideConditionReports.resolvedAt,
      createdAt: rideConditionReports.createdAt,
      reporterName: users.name,
      reporterEmail: users.email,
    })
    .from(rideConditionReports)
    .innerJoin(users, eq(rideConditionReports.reporterId, users.id))
    .orderBy(desc(rideConditionReports.createdAt));

  const idsOf = (type: string) => [...new Set(reports.filter((r) => r.targetType === type).map((r) => r.targetId))];
  const [routeRows, dayRideRows, tourRows] = await Promise.all([
    idsOf("route").length ? db.select({ id: routes.id, name: routes.name, slug: routes.slug }).from(routes).where(inArray(routes.id, idsOf("route"))) : [],
    idsOf("day_ride").length ? db.select({ id: dayRides.id, name: dayRides.name, slug: dayRides.slug }).from(dayRides).where(inArray(dayRides.id, idsOf("day_ride"))) : [],
    idsOf("tour").length ? db.select({ id: tours.id, name: tours.name, slug: tours.slug }).from(tours).where(inArray(tours.id, idsOf("tour"))) : [],
  ]);
  const rides = new Map<string, RideInfo>();
  for (const r of routeRows) rides.set(r.id, { name: r.name, editHref: `/admin/routes/${r.id}`, publicHref: `/routes/${r.slug}` });
  for (const r of dayRideRows) rides.set(r.id, { name: r.name, editHref: `/admin/day-rides/${r.id}`, publicHref: `/day-rides/${r.slug}` });
  for (const r of tourRows) rides.set(r.id, { name: r.name, editHref: `/admin/tours/${r.id}`, publicHref: `/tours/${r.slug}` });

  const open = reports.filter((r) => !r.resolvedAt);
  const resolved = reports.filter((r) => r.resolvedAt).slice(0, RESOLVED_SHOWN);

  const card = (report: (typeof reports)[number]) => {
    const ride = rides.get(report.targetId);
    return (
      <div key={report.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="flex flex-wrap items-center gap-2 text-[15px] text-text-primary">
            {ride ? (
              <Link href={ride.publicHref} target="_blank" className="hover:underline">
                {ride.name}
              </Link>
            ) : (
              "A ride that has since been removed"
            )}
            <Tag variant={report.resolvedAt ? "neutral" : "caution"}>{conditionCategoryLabel(report.category)}</Tag>
          </p>
          <p className="text-[13px] text-text-muted">
            {report.reporterName ?? report.reporterEmail} · {formatDate(report.createdAt)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{report.note}</p>
        <div className="flex flex-wrap items-center gap-2">
          {ride && (
            <Link href={ride.editHref}>
              <Button type="button" variant="secondary" className="min-h-8 px-3 text-[13px]">
                Edit ride (add a conditions note)
              </Button>
            </Link>
          )}
          {report.resolvedAt ? (
            <form action={reopenRoadReport.bind(null, report.id)}>
              <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                Reopen
              </Button>
            </form>
          ) : (
            <form action={resolveRoadReport.bind(null, report.id)}>
              <Button type="submit" variant="primary" className="min-h-8 px-3 text-[13px]">
                Mark as dealt with
              </Button>
            </form>
          )}
          <form action={deleteRoadReport.bind(null, report.id)}>
            <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
              Delete
            </Button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Road reports <span className="text-text-muted">({open.length} open)</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          Riders tell us when a road has changed. Nothing here is shown to other riders. If a report holds up, open the ride and add a Current
          conditions note, which shows at the top of its page, then mark the report as dealt with.
        </p>
      </div>

      {open.length === 0 ? <p className="rounded-lg bg-surface p-4 text-text-secondary">No open reports.</p> : <div className="flex flex-col gap-3">{open.map(card)}</div>}

      {resolved.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-[16px] text-text-secondary">Dealt with (latest {resolved.length})</h3>
          {resolved.map(card)}
        </div>
      )}
    </div>
  );
}
