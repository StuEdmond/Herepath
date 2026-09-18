import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { waitlistSignups } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(waitlistSignups).orderBy(desc(waitlistSignups.createdAt));
  const csv = ["email,signed_up", ...rows.map((r) => `"${r.email.replace(/"/g, '""')}",${r.createdAt.toISOString()}`)].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="herepath-waitlist.csv"',
    },
  });
}
