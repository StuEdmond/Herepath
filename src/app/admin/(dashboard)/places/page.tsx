import Link from "next/link";
import { db } from "@/db/client";
import { places } from "@/db/schema";
import { AdminListHeader, AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export default async function AdminPlacesPage() {
  const rows = await db.select().from(places).orderBy(places.name);

  return (
    <div className="flex flex-col gap-4">
      <AdminListHeader
        title="Places"
        newHref="/admin/places/new"
        count={rows.length}
        extraActions={
          <Link href="/admin/places/preload">
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Preload map places
            </Button>
          </Link>
        }
      />
      <p className="text-[13px] text-text-muted">
        A place appears on ride maps once it has a latitude and longitude. &ldquo;Preload map places&rdquo; looks up fuel, food and stay pins for every
        ride ahead of time, so riders don&apos;t wait.
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
