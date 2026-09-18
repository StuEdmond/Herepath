import Link from "next/link";
import { Users, User as UserIcon } from "lucide-react";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { StarRating } from "@/components/ui/star-rating";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { deleteDiaryEntry } from "@/app/diary/actions";
import { ShareButton } from "@/components/share/share-button";
import type { DiaryEntryView } from "@/lib/your-rides";

const TYPE_PATH: Record<string, string> = { route: "routes", day_ride: "day-rides", tour: "tours" };
const TYPE_BADGE: Record<string, "route" | "day-ride" | "tour"> = { route: "route", day_ride: "day-ride", tour: "tour" };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function DiaryEntryCard({ entry }: { entry: DiaryEntryView }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicPath = entry.targetType && entry.slug ? `/${TYPE_PATH[entry.targetType]}/${entry.slug}` : "/";

  const nameContent =
    entry.targetType && entry.slug ? (
      <Link href={publicPath} className="hover:underline">
        {entry.name}
      </Link>
    ) : (
      <span>{entry.name}</span>
    );

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {entry.targetType && <TripTypeBadge type={TYPE_BADGE[entry.targetType]} />}
          {!entry.targetType && <Tag variant="neutral">Your own route</Tag>}
          <h3 className="text-[16px] text-text-primary">{nameContent}</h3>
        </div>
        {entry.rating && <StarRating rating={entry.rating} />}
      </div>

      <p className="text-[13px] text-text-muted">
        {formatDate(entry.date)}
        {entry.startTime && entry.finishTime && ` · ${entry.startTime} to ${entry.finishTime}`} · {entry.distanceMiles} miles
      </p>

      <div className="flex flex-wrap gap-1.5">
        {entry.weatherConditions && <Tag variant="neutral">{entry.weatherConditions}</Tag>}
        {entry.bike && <Tag variant="neutral">{entry.bike}</Tag>}
        <Tag variant="neutral">
          {entry.rodeSolo ? (
            <>
              <UserIcon className="h-3.5 w-3.5" aria-hidden="true" /> Solo
            </>
          ) : (
            <>
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> With {entry.rodeWithCount ?? "friends"}
            </>
          )}
        </Tag>
      </div>

      {entry.notes && <p className="text-[14px] text-text-secondary">{entry.notes}</p>}

      {entry.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {entry.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={photo.url} alt="" loading="lazy" className="aspect-square w-full rounded-md object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[12px] text-text-muted">
          {entry.visibility === "shared" ? "Shared as a public review" : "Private · Share as review"}
        </span>
        <div className="flex items-center gap-2">
          <ShareButton
            className="min-h-8 px-2 text-[12px]"
            data={{
              title: entry.name,
              region: entry.region ?? undefined,
              date: formatDate(entry.date),
              distanceMiles: Number(entry.distanceMiles),
              rating: entry.rating ?? undefined,
              notes: entry.notes ?? undefined,
              photoUrl: entry.photos[0]?.url ?? null,
              geometry: entry.geometry,
              url: `${siteUrl}${publicPath}`,
            }}
          />
          <form action={deleteDiaryEntry.bind(null, entry.id)}>
            <Button type="submit" variant="ghost" className="min-h-8 px-2 text-[12px] text-red-accent">
              Delete
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
