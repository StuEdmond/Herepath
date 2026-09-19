import Link from "next/link";
import { db } from "@/db/client";
import { regions, routes } from "@/db/schema";
import { BulkRouteImport } from "@/components/admin/bulk-route-import";
import { summariseExistingRoute, type ExistingRouteSummary } from "@/lib/route-import";

export default async function ImportRoutesPage() {
  const [regionRows, existingRoutes] = await Promise.all([db.select().from(regions).orderBy(regions.name), db.select().from(routes)]);

  const existing: ExistingRouteSummary[] = existingRoutes.map(summariseExistingRoute);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <Link href="/admin/routes" className="text-[13px] text-text-muted hover:text-text-primary hover:underline">
          ← Routes
        </Link>
        <h2 className="mt-1 text-[20px]">Import GPX files</h2>
        <p className="mt-1 text-[14px] text-text-secondary">
          Bring in several routes at once from GPX files you have the right to use. Each becomes an unpublished draft that records where it came from
          and its licence.
        </p>
      </div>
      <BulkRouteImport regions={regionRows.map((r) => ({ id: r.id, name: r.name }))} existing={existing} />
    </div>
  );
}
