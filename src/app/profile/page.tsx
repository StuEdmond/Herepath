import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getDiaryEntries, getSavedRides } from "@/lib/your-rides";
import { updateBikes } from "../account/actions";
import { Field, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { DiaryEntryCard } from "@/components/diary/diary-entry-card";

export const metadata: Metadata = { title: "Profile" };

const TYPE_PATH: Record<string, string> = { route: "routes", day_ride: "day-rides", tour: "tours" };
const RIDES_PREVIEW = 3;
const SAVED_PREVIEW = 4;

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[18px]">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-[13px] text-green-bright underline hover:no-underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const { saved } = await searchParams;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const [entries, savedRides] = await Promise.all([getDiaryEntries(session.user.id), getSavedRides(session.user.id)]);
  const milesRidden = entries.reduce((sum, e) => sum + Number(e.distanceMiles), 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[18px] font-medium text-text-primary">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              (user?.name ?? user?.email ?? "R")[0].toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[22px]">{user?.name ?? "Your profile"}</h1>
            <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-text-muted">
              <span className="truncate">{user?.email}</span>
              <Tag variant={user?.membershipTier === "premium" ? "suited" : "neutral"} className="px-2 py-0.5 text-[12px]">
                {user?.membershipTier === "premium" ? "Premium" : "Free"}
              </Tag>
            </p>
          </div>
        </div>
        <Link href="/account/settings">
          <Button type="button" variant="secondary" className="min-h-10 px-4 text-[14px]">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Button>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your rides" href="/rides" linkLabel="Full diary, map and progress" />
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Rides logged" value={entries.length} />
          <StatTile label="Miles ridden" value={Math.round(milesRidden)} />
        </div>
        {entries.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">No rides logged yet — log your first ride to start your diary.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.slice(0, RIDES_PREVIEW).map((entry) => (
              <DiaryEntryCard key={entry.id} entry={entry} />
            ))}
            {entries.length > RIDES_PREVIEW && (
              <Link href="/rides" className="self-start text-[14px] text-green-bright underline hover:no-underline">
                See all {entries.length} rides
              </Link>
            )}
          </div>
        )}
        <Link href="/diary/new" className="self-start">
          <Button type="button" variant="primary">
            Log a ride
          </Button>
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your bike(s)" />
        <form action={updateBikes} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
          <Field label="What do you ride?" hint="Add more than one, separated by commas">
            <TextInput name="mainBike" defaultValue={user?.mainBike ?? ""} placeholder="e.g. Triumph Tiger 900, Yamaha MT-07" />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary" className="min-h-10 px-4 text-[14px]">
              Save bikes
            </Button>
            {saved === "bikes" && <span className="text-[13px] text-green-bright">Saved.</span>}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Saved rides" href="/saved" linkLabel={savedRides.length > SAVED_PREVIEW ? `See all ${savedRides.length}` : undefined} />
        {savedRides.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-[14px] text-text-muted">
            Nothing saved yet — use &ldquo;Want to ride&rdquo; on a route, day ride or tour page.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {savedRides.slice(0, SAVED_PREVIEW).map((s) => (
              <Link key={`${s.targetType}-${s.targetId}`} href={`/${TYPE_PATH[s.targetType]}/${s.slug}`}>
                <Card>
                  <CardImage src={s.heroImage ?? undefined} alt={s.name} badge={<TripTypeBadge type={s.targetType === "day_ride" ? "day-ride" : s.targetType} />} />
                  <CardBody>
                    <h3 className="text-[14px]">{s.name}</h3>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
