import Link from "next/link";
import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { blogPosts, blogPostReports, users } from "@/db/schema";
import { getLinkedRide } from "@/lib/blog";
import { reportReasonLabel } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Textarea } from "@/components/admin/form-fields";
import { ArticleBody } from "@/components/ui/article-body";
import { approveBlogPost, rejectBlogPost, deleteBlogPostAsAdmin, dismissBlogPostReports } from "./actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 } as const;

export default async function AdminBlogPostsPage() {
  const [rows, reportRows] = await Promise.all([
    db
      .select({ post: blogPosts, authorName: users.name, authorEmail: users.email })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.userId, users.id))
      .orderBy(asc(blogPosts.createdAt)),
    db
      .select({
        postId: blogPostReports.postId,
        reports: count(),
        reasons: sql<string>`string_agg(distinct ${blogPostReports.reason}, ',')`,
      })
      .from(blogPostReports)
      .groupBy(blogPostReports.postId),
  ]);

  const reports = new Map(reportRows.map((r) => [r.postId, { count: r.reports, reasons: r.reasons.split(",").map(reportReasonLabel) }]));
  // Reported posts first, then waiting posts (oldest first, so nobody is left waiting), then everything else.
  const sorted = [...rows].sort(
    (a, b) =>
      Number(reports.has(b.post.id)) - Number(reports.has(a.post.id)) || STATUS_ORDER[a.post.status] - STATUS_ORDER[b.post.status],
  );
  const pendingCount = rows.filter((r) => r.post.status === "pending").length;
  const rides = await Promise.all(sorted.map((r) => getLinkedRide(r.post.targetType, r.post.targetId)));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">
          Blog posts <span className="text-text-muted">({rows.length})</span>
        </h2>
        <p className="text-[13px] text-text-muted">
          Riders&apos; posts wait here until you approve them. Reported posts are listed first.
          {pendingCount > 0 && <strong className="text-red-accent"> {pendingCount} waiting for review.</strong>}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-text-secondary">No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(({ post, authorName, authorEmail }, i) => {
            const report = reports.get(post.id);
            const ride = rides[i];
            return (
              <div key={post.id} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[17px]">{post.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {report && <Tag variant="caution">Reported {report.count > 1 ? `×${report.count}` : ""}</Tag>}
                    <Tag variant={post.status === "approved" ? "suited" : post.status === "rejected" ? "caution" : "neutral"}>
                      {post.status === "pending" ? "Waiting for review" : post.status === "approved" ? "Live" : "Rejected"}
                    </Tag>
                  </div>
                </div>
                <p className="text-[13px] text-text-muted">
                  {authorName ?? authorEmail} · submitted {formatDate(post.createdAt)}
                  {ride ? ` · about ${ride.name}` : ""}
                </p>
                {report && <p className="text-[13px] text-red-accent">Reported for: {report.reasons.join(", ")}</p>}
                {post.status === "rejected" && post.moderatorNote && (
                  <p className="text-[13px] text-text-muted">Note sent to the rider: {post.moderatorNote}</p>
                )}

                <details className="rounded-lg bg-bg p-3" open={post.status === "pending"}>
                  <summary className="cursor-pointer text-[14px] text-text-primary">Read the post</summary>
                  <div className="mt-3 flex flex-col gap-3">
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage} alt="" className="max-h-56 w-full max-w-md rounded-lg object-cover" />
                    )}
                    <ArticleBody text={post.body} />
                  </div>
                </details>

                <div className="flex flex-wrap items-start gap-2">
                  {post.status !== "approved" && (
                    <form action={approveBlogPost.bind(null, post.id)}>
                      <Button type="submit" variant="primary" className="min-h-9 px-3 text-[13px]">
                        Approve and publish
                      </Button>
                    </form>
                  )}
                  {post.status === "approved" && (
                    <Link href={`/blog/${post.slug}`}>
                      <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
                        View live post
                      </Button>
                    </Link>
                  )}
                  {report && (
                    <form action={dismissBlogPostReports.bind(null, post.id)}>
                      <Button type="submit" variant="secondary" className="min-h-9 px-3 text-[13px]">
                        Keep post, dismiss reports
                      </Button>
                    </form>
                  )}
                  <form action={deleteBlogPostAsAdmin.bind(null, post.id)}>
                    <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
                      Delete permanently
                    </Button>
                  </form>
                </div>

                {post.status !== "rejected" && (
                  <form action={rejectBlogPost.bind(null, post.id)} className="flex max-w-lg flex-col gap-2">
                    <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                      {post.status === "approved" ? "Take down, with a note for the rider (optional)" : "Reject, with a note for the rider (optional)"}
                      <Textarea name="note" rows={2} maxLength={500} placeholder="e.g. Please remove the personal details and resubmit" />
                    </label>
                    <Button type="submit" variant="secondary" className="min-h-9 self-start px-3 text-[13px]">
                      {post.status === "approved" ? "Take down" : "Reject"}
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
