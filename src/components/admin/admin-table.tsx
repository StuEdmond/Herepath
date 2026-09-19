import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface AdminTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
}

export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  editHref,
  emptyMessage = "Nothing here yet.",
}: {
  rows: T[];
  columns: AdminTableColumn<T>[];
  editHref: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="rounded-lg bg-surface p-4 text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-surface">
      <table className="w-full min-w-[480px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-surface-raised text-text-muted">
            {columns.map((col) => (
              <th key={col.header} className="px-3 py-2 font-medium">
                {col.header}
              </th>
            ))}
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-surface-raised last:border-0">
              {columns.map((col) => (
                <td key={col.header} className="px-3 py-2">
                  {col.render(row)}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <Link href={editHref(row)}>
                  <Button type="button" variant="secondary" className="min-h-8 px-3 text-[13px]">
                    Edit
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminListHeader({
  title,
  newHref,
  count,
  extraActions,
}: {
  title: string;
  newHref: string;
  count: number;
  /** Extra buttons shown beside "New". */
  extraActions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[20px]">
        {title} <span className="text-text-muted">({count})</span>
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <Link href={newHref}>
          <Button type="button" variant="primary" className="min-h-9 px-3 text-[13px]">
            New
          </Button>
        </Link>
      </div>
    </div>
  );
}
