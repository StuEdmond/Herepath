import { refreshClosures } from "@/lib/closures";

// Reading National Highways' feed for the next 30 days is a couple of large downloads.
export const maxDuration = 60;

/**
 * Vercel runs this once a day (see vercel.json) as a backstop. Pages also refresh closures themselves whenever what we hold is more than
 * half an hour old, so on a busy day this is rarely the one that does the work.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }
  const outcome = await refreshClosures();
  return Response.json(outcome, { status: outcome.ok || outcome.reason === "busy" || outcome.reason === "not-configured" ? 200 : 502 });
}
