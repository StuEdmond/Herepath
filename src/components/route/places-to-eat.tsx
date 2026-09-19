import { MapPin, Globe } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { PlaceTips } from "./place-tips";
import type { PlaceReviewView } from "@/lib/place-reviews";

export interface PlaceToEatEntry {
  id: string;
  name: string;
  type: string;
  address: string | null;
  websiteUrl: string | null;
  tags: string[];
  priceBand: number | null;
  shortDescription: string | null;
  isSuggestedLunch: boolean;
  /** Mile marker if this place also appears as a stop on the route; null if it's an off-route alternative. */
  stageMile: number | null;
  reviews: PlaceReviewView[];
}

const PRICE_LABELS = ["£", "££", "£££"];

function stopLabel(entry: PlaceToEatEntry, suggestedMile: number | null): string {
  if (entry.isSuggestedLunch) return "Suggested lunch stop";
  if (entry.stageMile == null) return "Alternative stop";
  if (suggestedMile == null) return "On route";
  return entry.stageMile < suggestedMile ? "Early stop" : "Late lunch";
}

export function PlacesToEat({ entries }: { entries: PlaceToEatEntry[] }) {
  const suggestedMile = entries.find((e) => e.isSuggestedLunch)?.stageMile ?? null;
  const sorted = [...entries].sort((a, b) => (a.stageMile ?? Infinity) - (b.stageMile ?? Infinity));

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[17px]">Places to eat</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((entry) => (
          <Card key={entry.id}>
            <CardBody>
              <Tag variant={entry.isSuggestedLunch ? "suited" : "neutral"} className="self-start">
                {stopLabel(entry, suggestedMile)}
              </Tag>
              <h3 className="text-[16px]">{entry.name}</h3>
              <p className="text-[13px] text-text-muted">
                {entry.stageMile != null ? `On route · Mile ${entry.stageMile}` : "Not on the direct route"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Tag variant="neutral" className="capitalize">
                  {entry.type.replace(/_/g, " ")}
                </Tag>
                {entry.priceBand && <Tag variant="neutral">{PRICE_LABELS[entry.priceBand - 1]}</Tag>}
                {entry.tags.map((tag) => (
                  <Tag key={tag} variant="neutral">
                    {tag.replace(/_/g, " ")}
                  </Tag>
                ))}
              </div>
              {entry.shortDescription && <p className="text-[14px] text-text-secondary">{entry.shortDescription}</p>}
              <PlaceTips reviews={entry.reviews} />
              <div className="flex flex-wrap gap-2 pt-1">
                <LinkButton
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${entry.name} ${entry.address ?? ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="min-h-9 px-3 text-[13px]"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Directions
                </LinkButton>
                {entry.websiteUrl && (
                  <LinkButton href={entry.websiteUrl} target="_blank" rel="noopener noreferrer" variant="secondary" className="min-h-9 px-3 text-[13px]">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    Website
                  </LinkButton>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-text-muted">Opening times change, so check before you ride.</p>
        <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]" disabled title="Coming soon">
          Suggest a place
        </Button>
      </div>
    </div>
  );
}
