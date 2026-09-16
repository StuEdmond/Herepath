import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { routes, regions } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Tag } from "@/components/ui/tag";

export default async function AdminRoutesPage() {
  const rows = await db
    .select({
      id: routes.id,
      name: routes.name,
      region: regions.name,
      distanceMiles: routes.distanceMiles,
      difficulty: routes.difficulty,
      status: routes.status,
      isSample: routes.isSample,
    })
    .from(routes)
    .innerJoin(regions, eq(routes.regionId, regions.id))
    .orderBy(routes.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Routes" newHref="/admin/routes/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/routes/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Region", render: (r) => r.region },
          { header: "Miles", render: (r) => r.distanceMiles },
          { header: "Difficulty", render: (r) => r.difficulty },
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
