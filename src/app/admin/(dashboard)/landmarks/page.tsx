import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { landmarks, regions } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";

export default async function AdminLandmarksPage() {
  const rows = await db
    .select({ id: landmarks.id, name: landmarks.name, type: landmarks.type, region: regions.name })
    .from(landmarks)
    .innerJoin(regions, eq(landmarks.regionId, regions.id))
    .orderBy(landmarks.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Landmarks" newHref="/admin/landmarks/new" count={rows.length} />
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/landmarks/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Type", render: (r) => <span className="text-text-muted">{r.type}</span> },
          { header: "Region", render: (r) => r.region },
        ]}
      />
    </div>
  );
}
