import Link from "next/link";
import { db } from "@/db/client";
import { places } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Tag } from "@/components/ui/tag";

export default async function AdminPlacesPage() {
  const rows = await db.select().from(places).orderBy(places.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader title="Places" newHref="/admin/places/new" count={rows.length} />
      <p className="text-[13px] text-text-muted">
        A place appears on ride maps once it has a latitude and longitude.{" "}
        <Link href="/admin/places/preload" className="text-green-bright underline hover:no-underline">
          Preload map places for every ride
        </Link>
      </p>
      <AdminTable
        rows={rows}
        editHref={(row) => `/admin/places/${row.id}`}
        columns={[
          { header: "Name", render: (r) => r.name },
          { header: "Type", render: (r) => <span className="text-text-muted">{r.type.replace(/_/g, " ")}</span> },
          {
            header: "Flags",
            render: (r) => (
              <div className="flex gap-1">
                {r.isSuggested && <Tag variant="caution">Suggested</Tag>}
                {r.isSponsored && <Tag variant="neutral">Sponsored</Tag>}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
