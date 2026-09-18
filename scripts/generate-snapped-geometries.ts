/**
 * One-time enrichment script — NOT part of the running app.
 *
 * The sample seed data (Section 9) only ever had straight lines between a
 * route's start and end point, since there's no real GPX recording behind
 * it. This snaps those same start/end pairs onto the real road network via
 * OSRM's public demo routing server, purely so the sample content looks
 * right for demos while real GPX files aren't available yet.
 *
 * Writes src/db/sample-geometries.json, which seed.ts reads at seed time —
 * so `npm run db:seed` itself never needs network access, and swapping in a
 * real GPX later is just replacing that route's geometry in admin.
 *
 * Run with: npx tsx scripts/generate-snapped-geometries.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

type LngLat = [number, number];

const SEGMENTS: Record<string, { from: LngLat; to: LngLat }> = {
  // The 8 sample routes (Section 9) — start/end exactly as seeded today.
  "route:snake-pass-a57": { from: [-1.9497, 53.4443], to: [-1.688, 53.403] },
  "route:winnats-pass": { from: [-1.7735, 53.3423], to: [-1.7838, 53.3378] },
  "route:cat-and-fiddle-a537": { from: [-1.9142, 53.2596], to: [-2.0796, 53.2226] },
  "route:buttertubs-pass": { from: [-2.2179, 54.3235], to: [-2.2679, 54.3684] },
  "route:hardknott-and-wrynose": { from: [-3.2027, 54.4023], to: [-3.1103, 54.4021] },
  "route:horseshoe-pass": { from: [-3.1697, 52.9744], to: [-3.1866, 53.0225] },
  "route:bealach-na-ba": { from: [-5.6167, 57.4167], to: [-5.5119, 57.4595] },
  "route:cheddar-gorge": { from: [-2.7658, 51.2799], to: [-2.7213, 51.2427] },

  // Day ride with no featured route — its own direct geometry.
  "dayride:atlantic-highway": { from: [-4.0587, 51.0781], to: [-4.5423, 50.829] },

  // Connectors between featured routes / towns within a day ride or tour.
  "connector:ladybower-castleton": { from: [-1.688, 53.403], to: [-1.7735, 53.3423] },
  "connector:winnats-buxton": { from: [-1.7838, 53.3378], to: [-1.9142, 53.2596] },
  "connector:macclesfield-glossop": { from: [-2.0796, 53.2226], to: [-1.9497, 53.4443] },
  "connector:thwaite-hawes": { from: [-2.2679, 54.3684], to: [-2.2179, 54.3235] },
  "connector:betws-llanberis": { from: [-3.8004, 53.0955], to: [-4.1264, 53.1191] },
  "connector:llanberis-conwy": { from: [-4.1264, 53.1191], to: [-3.8286, 53.2799] },
  "connector:conwy-betws": { from: [-3.8286, 53.2799], to: [-3.8004, 53.0955] },
  "connector:ladybower-hebden": { from: [-1.688, 53.403], to: [-1.9977, 53.7448] },
  "connector:hebden-hawes": { from: [-1.9977, 53.7448], to: [-2.2179, 54.3235] },
  "connector:hawes-alston": { from: [-2.2179, 54.3235], to: [-2.4318, 54.811] },
  "connector:alston-haltwhistle": { from: [-2.4318, 54.811], to: [-2.4469, 54.97] },
};

interface OsrmResponse {
  code: string;
  routes?: { geometry: GeoJSON.LineString; distance: number }[];
}

/**
 * Douglas-Peucker simplification. OSRM's full-detail geometry is
 * survey-grade (hundreds to thousands of points) — far more than a small
 * illustrative map needs, and it bloats every page that embeds a route's
 * geometry. Simplifying keeps the visual shape while cutting payload size
 * by 80-90%.
 */
function simplify(points: LngLat[], epsilon: number): LngLat[] {
  if (points.length <= 2) return points;

  function perpendicularDistance(point: LngLat, lineStart: LngLat, lineEnd: LngLat): number {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(x - x1, y - y1);
    const t = ((x - x1) * dx + (y - y1) * dy) / lengthSquared;
    const clampedT = Math.max(0, Math.min(1, t));
    const projX = x1 + clampedT * dx;
    const projY = y1 + clampedT * dy;
    return Math.hypot(x - projX, y - projY);
  }

  function douglasPeucker(pts: LngLat[]): LngLat[] {
    if (pts.length <= 2) return pts;
    let maxDist = 0;
    let maxIndex = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const dist = perpendicularDistance(pts[i], pts[0], pts[pts.length - 1]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    if (maxDist > epsilon) {
      const left = douglasPeucker(pts.slice(0, maxIndex + 1));
      const right = douglasPeucker(pts.slice(maxIndex));
      return [...left.slice(0, -1), ...right];
    }
    return [pts[0], pts[pts.length - 1]];
  }

  return douglasPeucker(points);
}

async function snapOne(from: LngLat, to: LngLat): Promise<GeoJSON.LineString> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = (await res.json()) as OsrmResponse;
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error(`OSRM: ${data.code}`);
  return data.routes[0].geometry;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SIMPLIFY_EPSILON_DEGREES = 0.0002; // ~22m — keeps road shape, drops near-collinear points

async function main() {
  const result: Record<string, GeoJSON.LineString> = {};
  const entries = Object.entries(SEGMENTS);

  for (const [key, { from, to }] of entries) {
    process.stdout.write(`Snapping ${key}... `);
    try {
      const raw = await snapOne(from, to);
      const simplified = simplify(raw.coordinates as LngLat[], SIMPLIFY_EPSILON_DEGREES);
      result[key] = { type: "LineString", coordinates: simplified };
      console.log(`ok (${raw.coordinates.length} → ${simplified.length} points)`);
    } catch (err) {
      console.log(`FAILED (${(err as Error).message}) — falling back to a straight line`);
      result[key] = { type: "LineString", coordinates: [from, to] };
    }
    // Be polite to the free public demo server.
    await sleep(400);
  }

  const outPath = path.join(process.cwd(), "src", "db", "sample-geometries.json");
  await writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${entries.length} geometries to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
