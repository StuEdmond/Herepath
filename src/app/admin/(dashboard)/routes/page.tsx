import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { routes, regions } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      needsReview: routes.needsReview,
      imported: routes.importedAt,
    })
    .from(routes)
    .innerJoin(regions, eq(routes.regionId, regions.id))
    .orderBy(routes.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader
        title="Routes"
        newHref="/admin/routes/new"
        count={rows.length}
        extraActions={
          <Link href="/admin/routes/import">
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Import GPX files
            </Button>
          </Link>
        }
      />
      {rows.some((r) => r.needsReview) && (
        <p className="text-[13px] text-text-muted">
          <strong className="text-red-accent">{rows.filter((r) => r.needsReview).length} imported routes still need review.</strong> Open one to write its
          description, rate the bikes and check the ratings. A route marked as needing review can&apos;t be published.
        </p>
      )}
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
                {r.needsReview && <Tag variant="caution">Needs review</Tag>}
                {r.imported && !r.needsReview && <Tag variant="neutral">Imported</Tag>}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
