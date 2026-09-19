import { Tag } from "@/components/ui/tag";
import { BIKE_TYPE_LABELS } from "@/lib/bike-types";

export interface BikeRating {
  bikeType: string;
  note: string | null;
}

/**
 * Which bikes a ride suits. Bike types rated as suited and those that need extra care are kept in two clearly separate groups,
 * each with its own heading, so nobody reads a caution as a recommendation: the colour and icon help, but the words carry it.
 * A note explaining a caution is shown in full, not tucked into a tooltip.
 */
export function BikeSuitability({
  suited,
  caution,
  variant = "sections",
}: {
  suited: BikeRating[];
  caution: BikeRating[];
  /** "sections" gives each group a heading; "rows" is the compact version used inside a summary card. */
  variant?: "sections" | "rows";
}) {
  if (suited.length === 0 && caution.length === 0) return null;

  const label = (type: string) => BIKE_TYPE_LABELS[type] ?? type;
  const noted = caution.filter((c) => c.note);

  const suitedTags = (
    <div className="flex flex-wrap gap-2">
      {suited.map((s) => (
        <Tag key={s.bikeType} variant="suited" title={s.note ?? undefined}>
          {label(s.bikeType)}
        </Tag>
      ))}
    </div>
  );
  const cautionTags = (
    <div className="flex flex-wrap gap-2">
      {caution.map((c) => (
        <Tag key={c.bikeType} variant="caution" title={c.note ?? undefined}>
          <span className="sr-only">Take extra care: </span>
          {label(c.bikeType)}
        </Tag>
      ))}
    </div>
  );
  const cautionNotes =
    noted.length > 0 ? (
      <ul className="flex flex-col gap-0.5 text-[13px] text-text-secondary">
        {noted.map((c) => (
          <li key={c.bikeType}>
            <span className="font-medium text-text-primary">{label(c.bikeType)}:</span> {c.note}
          </li>
        ))}
      </ul>
    ) : null;

  if (variant === "rows") {
    return (
      <>
        {suited.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-text-muted">Best suited to</span>
            {suitedTags}
          </div>
        )}
        {caution.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-text-muted">Take extra care if you ride</span>
            {cautionTags}
            {cautionNotes}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {suited.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[17px]">Best suited to</h2>
          {suitedTags}
        </div>
      )}
      {caution.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[17px]">Take extra care if you ride</h2>
          {cautionTags}
          {cautionNotes}
        </div>
      )}
    </>
  );
}
