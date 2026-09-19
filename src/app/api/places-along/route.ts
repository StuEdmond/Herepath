import { getPlacesAlong, getRideLines } from "@/lib/places-along";
import { PLACE_KINDS, type PlaceKind } from "@/lib/place-kinds";

// OpenStreetMap can take a while to answer for a long tour.
export const maxDuration = 30;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "";
  const slug = params.get("slug") ?? "";
  const kind = params.get("kind") ?? "";

  if (!slug || !PLACE_KINDS.some((k) => k.id === kind)) {
    return Response.json({ error: "Unknown ride or kind of place." }, { status: 400 });
  }

  const lines = await getRideLines(type, slug);
  if (!lines) return Response.json({ error: "Ride not found." }, { status: 404 });

  const result = await getPlacesAlong(kind as PlaceKind, lines);
  return Response.json(result, {
    // Places barely change day to day, so browsers and Vercel's edge can keep a copy for a while.
    headers: { "Cache-Control": result.osmOk ? "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" : "no-store" },
  });
}
