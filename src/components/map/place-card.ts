import type { AlongPlace } from "@/lib/place-kinds";

type CardPlace = Pick<AlongPlace, "name" | "label" | "note" | "source" | "sponsored" | "website">;

function element(tag: string, className: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  if (text) el.textContent = text;
  return el;
}

/**
 * The card shown for a fuel, food or stay pin. Built from plain text nodes so nothing from OpenStreetMap can be treated
 * as page markup. The website link is only added once the card has been pinned open by a click, because a hover card
 * can't be clicked.
 */
export function buildPlaceCard(place: CardPlace, withLink: boolean): HTMLElement {
  const card = element("div", "herepath-pin-card");
  card.appendChild(element("div", "herepath-pin-card-type", place.label));
  card.appendChild(element("div", "herepath-pin-card-title", place.name));
  if (place.note) card.appendChild(element("div", "herepath-pin-card-sub", place.note));

  const source = place.sponsored ? "Sponsored" : place.source === "osm" ? "From OpenStreetMap" : "Herepath listing";
  card.appendChild(element("div", place.sponsored ? "herepath-pin-card-badge" : "herepath-pin-card-source", source));

  if (withLink && place.website) {
    const link = element("a", "herepath-pin-card-link", "Visit website") as HTMLAnchorElement;
    link.href = place.website;
    link.target = "_blank";
    link.rel = place.sponsored ? "sponsored noopener noreferrer" : "nofollow noopener noreferrer";
    card.appendChild(link);
  }
  return card;
}
