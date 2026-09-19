import Link from "next/link";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { DifficultyGauge } from "@/components/ui/difficulty-gauge";
import { Tag } from "@/components/ui/tag";
import type { ExploreResult } from "@/lib/explore";

const TYPE_PATH: Record<ExploreResult["type"], string> = {
  route: "routes",
  "day-ride": "day-rides",
  tour: "tours",
};

const BIKE_TYPE_LABELS: Record<string, string> = {
  sports: "Sports",
  naked_and_roadster: "Naked and roadster",
  adventure: "Adventure",
  touring: "Touring",
  cruiser: "Cruiser",
  "125cc_and_new_riders": "125cc and new riders",
};

export function ResultCard({ result, matchedLandmarkName }: { result: ExploreResult; matchedLandmarkName?: string | null }) {
  const distanceLabel =
    result.type === "tour" ? `${result.durationDays} days · ${result.distanceMiles} miles` : `${result.distanceMiles} miles`;

  return (
    <Link href={`/${TYPE_PATH[result.type]}/${result.slug}`}>
      <Card>
        <CardImage
          src={result.heroImage ?? undefined}
          alt={result.name}
          badge={<TripTypeBadge type={result.type} />}
        />
        <CardBody>
          <h3 className="text-[16px]">{result.name}</h3>
          <p className="text-[13px] text-text-muted">{result.regionNames.join(", ")}</p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-secondary">{distanceLabel}</span>
            {result.difficulty ? (
              <DifficultyGauge level={result.difficulty as 1 | 2 | 3 | 4 | 5} showLabel={false} showValue />
            ) : (
              <span className="text-[12px] text-text-muted">No reviews yet</span>
            )}
          </div>
          {(result.landmarkNames.length > 0 || result.suitedBikeTypes.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.landmarkNames.slice(0, 3).map((name) => (
                <Tag key={name} variant={name === matchedLandmarkName ? "suited" : "neutral"}>
                  {name}
                </Tag>
              ))}
              {result.suitedBikeTypes.slice(0, 2).map((bikeType) => (
                <Tag key={bikeType} variant="neutral">
                  {BIKE_TYPE_LABELS[bikeType] ?? bikeType}
                </Tag>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}
