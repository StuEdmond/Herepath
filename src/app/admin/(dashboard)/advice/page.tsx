import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { adviceArticles } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Tag } from "@/components/ui/tag";
import { categoryLabel } from "@/lib/advice";

export default async function AdminAdvicePage() {
  const rows = await db.select().from(adviceArticles).orderBy(desc(adviceArticles.updatedAt));

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Advice articles" newHref="/admin/advice/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/advice/${row.id}`}
        emptyMessage="No articles yet — click New to write the first one."
        columns={[
          { header: "Title", render: (r) => r.title },
          { header: "Category", render: (r) => <span className="text-text-muted">{categoryLabel(r.category)}</span> },
          {
            header: "Status",
            render: (r) => <Tag variant={r.status === "published" ? "suited" : "neutral"}>{r.status === "published" ? "Published" : "Draft"}</Tag>,
          },
        ]}
      />
    </div>
  );
}
