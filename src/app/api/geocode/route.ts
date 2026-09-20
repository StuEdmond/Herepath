import { cleanQuery, searchPlaces } from "@/lib/geocode";

export async function GET(request: Request) {
  const query = cleanQuery(new URL(request.url).searchParams.get("q") ?? "");
  if (query.length < 2 || query.length > 100) {
    return Response.json({ error: "Type at least two letters of an address, postcode or place." }, { status: 400 });
  }

  try {
    const results = await searchPlaces(query);
    return Response.json(
      { results },
      // The same search gives the same answer, so Vercel's edge can keep it and spare the lookup services (and our MapTiler allowance).
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return Response.json({ error: "The address search isn't answering just now. Try again, or tap the map instead." }, { status: 502 });
  }
}
