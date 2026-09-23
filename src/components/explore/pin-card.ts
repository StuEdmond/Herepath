import type { ExploreResult } from "@/lib/explore";
import { DIFFICULTY_LABELS } from "@/components/ui/difficulty-gauge";

const TYPE_LABEL: Record<ExploreResult["type"], string> = {
  route: "Route",
  "day-ride": "Day ride",
  tour: "Tour",
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** The details shown for a ride, in order. Anything a ride doesn't have is left out. */
function detailRows(result: ExploreResult): [string, string][] {
  const rows: [string, string][] = [["Distance", `${result.distanceMiles} miles`]];

  if (result.type === "tour") {
    if (result.durationDays != null) rows.push(["Duration", `${result.durationDays} ${result.durationDays === 1 ? "day" : "days"}`]);
  } else if (result.ridingTimeMinutes != null) {
    rows.push(["Riding time", formatMinutes(result.ridingTimeMinutes)]);
  }

  if (result.startName) rows.push(["Start", result.startName]);
  if (result.finishName) rows.push(["Finish", result.finishName]);
  if (result.surface) rows.push(["Road surface", result.surface.charAt(0).toUpperCase() + result.surface.slice(1)]);

  if (result.difficulty != null) {
    const level = Math.min(5, Math.max(1, Math.round(result.difficulty)));
    rows.push(["Difficulty", `${level} of 5 · ${DIFFICULTY_LABELS[level - 1]}`]);
  }
  return rows;
}

/**
 * Builds the card that appears when a rider hovers a pin on the Explore map. Made from plain text nodes
 * so nothing in a ride's details can be treated as page markup. On touch screens there is no hover, so
 * a "View ride" link is added for opening the ride.
 */
export function buildPinCard(result: ExploreResult, onOpen?: () => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "herepath-pin-card";

  if (result.heroImage) {
    const thumb = document.createElement("img");
    thumb.className = "herepath-pin-card-thumb";
    thumb.src = result.heroImage;
    thumb.alt = "";
    thumb.loading = "lazy";
    // A stored image that no longer loads (deleted, or a broken admin edit) just leaves the card as it was before thumbnails.
    thumb.addEventListener("error", () => thumb.remove());
    card.appendChild(thumb);
  }

  const type = document.createElement("div");
  type.className = "herepath-pin-card-type";
  type.textContent = TYPE_LABEL[result.type];
  card.appendChild(type);

  const title = document.createElement("div");
  title.className = "herepath-pin-card-title";
  title.textContent = result.name;
  card.appendChild(title);

  const list = document.createElement("dl");
  list.className = "herepath-pin-card-rows";
  for (const [label, value] of detailRows(result)) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.append(dt, dd);
  }
  card.appendChild(list);

  if (onOpen) {
    const open = document.createElement("button");
    open.type = "button";
    open.className = "herepath-pin-card-open";
    open.textContent = "View ride →";
    open.addEventListener("click", onOpen);
    card.appendChild(open);
  }

  return card;
}
