import Link from "next/link";
import { db } from "@/db/client";
import { regions, landmarks, places, routes, dayRides, tours, collections } from "@/db/schema";
import { StatTile } from "@/components/ui/stat-tile";

export default async function AdminDashboardPage() {
  const [regionCount, landmarkCount, placeCount, routeCount, dayRideCount, tourCount, collectionCount] =
    await Promise.all([
      db.$count(regions),
      db.$count(landmarks),
      db.$count(places),
      db.$count(routes),
      db.$count(dayRides),
      db.$count(tours),
      db.$count(collections),
    ]);

  const tiles = [
    { label: "Regions", value: regionCount, href: "/admin/regions" },
    { label: "Landmarks", value: landmarkCount, href: "/admin/landmarks" },
    { label: "Places", value: placeCount, href: "/admin/places" },
    { label: "Routes", value: routeCount, href: "/admin/routes" },
    { label: "Day rides", value: dayRideCount, href: "/admin/day-rides" },
    { label: "Tours", value: tourCount, href: "/admin/tours" },
    { label: "Collections", value: collectionCount, href: "/admin/collections" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <Link key={tile.href} href={tile.href}>
          <StatTile label={tile.label} value={tile.value} className="hover:bg-surface-raised" />
        </Link>
      ))}
    </div>
  );
}
