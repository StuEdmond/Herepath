import { db } from "@/db/client";
import { contactMessages } from "@/db/schema";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { markContactMessageRead, deleteContactMessage } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminContactMessagesPage() {
  const rows = await db.select().from(contactMessages).orderBy(contactMessages.createdAt);
  rows.reverse();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[20px]">
        Messages <span className="text-text-muted">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No messages yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {!row.isRead && <Tag variant="caution">Unread</Tag>}
                  <p className="text-[15px] text-text-primary">
                    {row.name} <span className="text-text-muted">&lt;{row.email}&gt;</span>
                  </p>
                </div>
                <p className="text-[13px] text-text-muted">{formatDate(row.createdAt)}</p>
              </div>
              <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{row.message}</p>
              <div className="flex gap-2 pt-1">
                <form action={markContactMessageRead.bind(null, row.id, !row.isRead)}>
                  <Button type="submit" variant="secondary" className="min-h-8 px-3 text-[13px]">
                    Mark as {row.isRead ? "unread" : "read"}
                  </Button>
                </form>
                <form action={deleteContactMessage.bind(null, row.id)}>
                  <Button type="submit" variant="danger" className="min-h-8 px-3 text-[13px]">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
