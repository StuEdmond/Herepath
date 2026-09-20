import { haversineMiles } from "@/lib/geo";
import { MAX_LINK_STRAIGHT_MILES, MIN_LINK_MILES, parsePoint } from "@/lib/road-link";
import { getRoadRoute } from "@/lib/routing";

// A slow routing service shouldn't hold the page's other requests for long.
export const maxDuration = 20;

/** A rider editing a trip asks for a handful of stretches at a time, so this is generous for a person and stops a script draining the allowance. */
const MAX_REQUESTS_PER_HOUR = 300;
const HOUR_MS = 60 * 60 * 1000;
const recent = new Map<string, number[]>();

function tooManyRequests(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < HOUR_MS);
  hits.push(now);
  recent.set(ip, hits);
  // Keep the map from growing for ever on a long-running server.
  if (recent.size > 5000) for (const [key, times] of recent) if (times.every((t) => now - t >= HOUR_MS)) recent.delete(key);
  return hits.length > MAX_REQUESTS_PER_HOUR;
}

/**
 * The road route between two points in the UK: /api/route?from=53.26,-1.91&to=53.34,-1.78
 * Answers are kept in the database and, because they are the same for everyone, by Vercel's edge.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const from = parsePoint(params.get("from"));
  const to = parsePoint(params.get("to"));
  if (!from || !to) return Response.json({ error: "Give two points in the UK, as lat,lng." }, { status: 400 });

  const straight = haversineMiles(from, to);
  if (straight < MIN_LINK_MILES) return Response.json({ error: "Those points are in the same place." }, { status: 400 });
  if (straight > MAX_LINK_STRAIGHT_MILES) return Response.json({ error: `Routes are limited to ${MAX_LINK_STRAIGHT_MILES} miles between points.` }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (tooManyRequests(ip)) return Response.json({ error: "Too many route requests. Try again in a while." }, { status: 429 });

  const outcome = await getRoadRoute(from, to);
  if (outcome.ok) {
    return Response.json(outcome.route, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
  }
  const status = outcome.reason === "limit" ? 429 : outcome.reason === "no-route" ? 404 : outcome.reason === "not-configured" ? 503 : 502;
  return Response.json({ error: outcome.reason }, { status, headers: { "Cache-Control": "no-store" } });
}
