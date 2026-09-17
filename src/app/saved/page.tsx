import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSavedRides } from "@/lib/your-rides";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";

export const metadata: Metadata = { title: "Saved" };

const TYPE_PATH: Record<string, string> = { route: "routes", day_ride: "day-rides", tour: "tours" };

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");

  const saved = await getSavedRides(session.user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-10">
      <h1 className="text-[24px]">Saved</h1>
      {saved.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">
          Nothing saved yet — use &ldquo;Want to ride&rdquo; on a route, day ride or tour page.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {saved.map((s) => (
            <Link key={`${s.targetType}-${s.targetId}`} href={`/${TYPE_PATH[s.targetType]}/${s.slug}`}>
              <Card>
                <CardImage src={s.heroImage ?? undefined} alt={s.name} badge={<TripTypeBadge type={s.targetType === "day_ride" ? "day-ride" : s.targetType} />} />
                <CardBody>
                  <h3 className="text-[15px]">{s.name}</h3>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
