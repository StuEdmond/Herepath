import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dayRides, regions } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Tag } from "@/components/ui/tag";

export default async function AdminDayRidesPage() {
  const rows = await db
    .select({
      id: dayRides.id,
      name: dayRides.name,
      region: regions.name,
      totalDistanceMiles: dayRides.totalDistanceMiles,
      status: dayRides.status,
      isSample: dayRides.isSample,
    })
    .from(dayRides)
    .innerJoin(regions, eq(dayRides.regionId, regions.id))
    .orderBy(dayRides.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Day rides" newHref="/admin/day-rides/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/day-rides/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Region", render: (r) => r.region },
          { header: "Miles", render: (r) => r.totalDistanceMiles },
          {
            header: "Status",
            render: (r) => (
              <div className="flex gap-1">
                <Tag variant={r.status === "published" ? "suited" : "neutral"}>{r.status}</Tag>
                {r.isSample && <Tag variant="caution">Sample</Tag>}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
