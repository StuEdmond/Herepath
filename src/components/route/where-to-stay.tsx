import { ChevronDown } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { PlaceTips } from "./place-tips";
import { SponsoredTag } from "./sponsored-tag";
import type { PlaceReviewView } from "@/lib/place-reviews";

export interface OvernightPlace {
  id: string;
  name: string;
  type: "hotel" | "b_and_b" | "campsite";
  address: string | null;
  tags: string[];
  shortDescription: string | null;
  reviews: PlaceReviewView[];
  isSponsored: boolean;
}

const TYPE_LABELS: Record<OvernightPlace["type"], string> = {
  hotel: "Hotel",
  b_and_b: "B&B",
  campsite: "Camping",
};

const TYPE_ORDER: OvernightPlace["type"][] = ["hotel", "b_and_b", "campsite"];

export function WhereToStay({ nights }: { nights: { dayNumber: number; places: OvernightPlace[] }[] }) {
  if (nights.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[17px]">Where to stay</h2>
      <div className="flex flex-col gap-2">
        {nights.map((night, i) => (
          <details key={night.dayNumber} open={i === 0} className="group rounded-lg bg-surface p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-text-primary">
              Night {i + 1} — after day {night.dayNumber}
              <ChevronDown className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-3 flex flex-col gap-4">
              {TYPE_ORDER.map((type) => {
                const places = night.places.filter((p) => p.type === type);
                if (places.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium uppercase tracking-wide text-text-muted">{TYPE_LABELS[type]}</span>
                    {places.map((place) => (
                      <div key={place.id} className="flex flex-col gap-1 rounded-lg bg-surface-raised p-3">
                        <span className="flex flex-wrap items-center gap-2 font-medium text-text-primary">
                          {place.name}
                          {place.isSponsored && <SponsoredTag />}
                        </span>
                        {place.shortDescription && <span className="text-[14px] text-text-secondary">{place.shortDescription}</span>}
                        <PlaceTips reviews={place.reviews} />
                        {place.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {place.tags.map((tag) => (
                              <Tag key={tag} variant="neutral">
                                {tag.replace(/_/g, " ")}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
