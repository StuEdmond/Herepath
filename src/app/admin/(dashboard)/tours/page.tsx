import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Tag } from "@/components/ui/tag";

export default async function AdminToursPage() {
  const rows = await db.select().from(tours).orderBy(tours.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Tours" newHref="/admin/tours/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/tours/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Days", render: (r) => r.durationDays },
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
