import { db } from "@/db/client";
import { searchChips } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";

export default async function AdminSearchChipsPage() {
  const rows = await db.select().from(searchChips).orderBy(searchChips.position);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Popular search chips" newHref="/admin/search-chips/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/search-chips/${row.id}`}
        columns={[
          { header: "Position", render: (r) => r.position },
          { header: "Label", render: (r) => r.label },
          { header: "Query", render: (r) => <span className="text-text-muted">{r.query}</span> },
        ]}
      />
    </div>
  );
}
