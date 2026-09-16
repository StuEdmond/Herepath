import { db } from "@/db/client";
import { regions } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";

export default async function AdminRegionsPage() {
  const rows = await db.select().from(regions).orderBy(regions.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Regions" newHref="/admin/regions/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/regions/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Slug", render: (r) => <span className="text-text-muted">{r.slug}</span> },
        ]}
      />
    </div>
  );
}
