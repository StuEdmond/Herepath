import Link from "next/link";
import { countDistinct, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { regions, landmarks, places, routes, dayRides, tours, collections, placeReviewReports, blogPosts, blogPostReports } from "@/db/schema";
import { StatTile } from "@/components/ui/stat-tile";

export default async function AdminDashboardPage() {
  const [regionCount, landmarkCount, placeCount, routeCount, dayRideCount, tourCount, collectionCount, reportedTipRows, postsToReview, reportedPostRows] =
    await Promise.all([
      db.$count(regions),
      db.$count(landmarks),
      db.$count(places),
      db.$count(routes),
      db.$count(dayRides),
      db.$count(tours),
      db.$count(collections),
      db.select({ n: countDistinct(placeReviewReports.placeReviewId) }).from(placeReviewReports),
      db.$count(blogPosts, eq(blogPosts.status, "pending")),
      db.select({ n: countDistinct(blogPostReports.postId) }).from(blogPostReports),
    ]);
  const reportedTips = reportedTipRows[0]?.n ?? 0;
  const reportedPosts = reportedPostRows[0]?.n ?? 0;

  const tiles = [
    { label: "Regions", value: regionCount, href: "/admin/regions" },
    { label: "Landmarks", value: landmarkCount, href: "/admin/landmarks" },
    { label: "Places", value: placeCount, href: "/admin/places" },
    { label: "Routes", value: routeCount, href: "/admin/routes" },
    { label: "Day rides", value: dayRideCount, href: "/admin/day-rides" },
    { label: "Tours", value: tourCount, href: "/admin/tours" },
    { label: "Collections", value: collectionCount, href: "/admin/collections" },
    { label: "Posts to review", value: postsToReview, href: "/admin/blog-posts", attention: postsToReview > 0 },
    { label: "Reported posts", value: reportedPosts, href: "/admin/blog-posts", attention: reportedPosts > 0 },
    { label: "Reported tips", value: reportedTips, href: "/admin/place-reviews", attention: reportedTips > 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <Link key={tile.label} href={tile.href}>
          <StatTile
            label={tile.label}
            value={tile.value}
            className={tile.attention ? "bg-red-tint-bg hover:bg-red-tint-bg/80" : "hover:bg-surface-raised"}
          />
        </Link>
      ))}
    </div>
  );
}
