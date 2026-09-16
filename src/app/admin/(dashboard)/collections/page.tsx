import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { collections, collectionRoutes } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";

export default async function AdminCollectionsPage() {
  const rows = await db
    .select({ id: collections.id, name: collections.name, slug: collections.slug, routeCount: sql<number>`count(${collectionRoutes.routeId})::int` })
    .from(collections)
    .leftJoin(collectionRoutes, eq(collectionRoutes.collectionId, collections.id))
    .groupBy(collections.id)
    .orderBy(collections.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Collections" newHref="/admin/collections/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/collections/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Routes", render: (r) => r.routeCount },
        ]}
      />
    </div>
  );
}
