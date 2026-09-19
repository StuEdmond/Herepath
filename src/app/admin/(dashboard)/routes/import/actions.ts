"use server";

import { like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { regions, routes } from "@/db/schema";
import { lineDistanceMiles } from "@/lib/gpx";
import { findLikelyDuplicate, summariseExistingRoute, type ExistingRouteSummary, type ImportBatch, type ImportResult, type ImportRow } from "@/lib/route-import";
import { MAX_IMPORT_FILES, MAX_IMPORT_POINTS, isRouteLicence } from "@/lib/route-sources";
import { slugify } from "@/lib/slug";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validCoordinates(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_IMPORT_POINTS * 2) return null;
  const out: [number, number][] = [];
  for (const point of value) {
    if (!Array.isArray(point) || typeof point[0] !== "number" || typeof point[1] !== "number") return null;
    const [lng, lat] = point;
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    out.push([lng, lat]);
  }
  return out;
}

/** A slug nobody else is using: the name's own, or with -2, -3 and so on added. */
async function freeSlug(name: string, taken: Set<string>): Promise<string> {
  const base = slugify(name) || "route";
  const existing = await db.select({ slug: routes.slug }).from(routes).where(like(routes.slug, `${base}%`));
  for (const row of existing) taken.add(row.slug);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

/**
 * Creates a draft route for each row, recording where the files came from and their licence. Everything comes in as an unpublished draft
 * marked "needs review", with no description and no bike ratings, so nothing goes live until someone has written and checked it.
 * Distance is worked out again here from the track, and a route that looks like one already on the site is skipped.
 */
export async function importRoutes(batch: ImportBatch, rows: ImportRow[]): Promise<ImportResult> {
  const sourceName = String(batch?.sourceName ?? "").trim().slice(0, 120);
  const sourceUrl = String(batch?.sourceUrl ?? "").trim().slice(0, 300);
  const sourceAuthor = String(batch?.sourceAuthor ?? "").trim().slice(0, 120);

  if (batch?.declaration !== true) return { ok: false, error: "Please confirm you have the right to publish these files." };
  if (!isRouteLicence(String(batch?.licence))) return { ok: false, error: "Choose the licence these files are under." };
  if (sourceName.length < 2) return { ok: false, error: "Say where the files came from." };
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) return { ok: false, error: "The source link should start with http:// or https://." };
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "There is nothing to import." };
  if (rows.length > MAX_IMPORT_FILES) return { ok: false, error: `Import up to ${MAX_IMPORT_FILES} routes at a time.` };

  const regionIds = new Set((await db.select({ id: regions.id }).from(regions)).map((r) => r.id));
  const existing = await db.select().from(routes);
  const summaries: ExistingRouteSummary[] = existing.map(summariseExistingRoute);

  const created: { id: string; name: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];
  const taken = new Set<string>();

  for (const row of rows) {
    const name = String(row?.name ?? "").trim().slice(0, 120);
    const label = name || "Unnamed route";
    const coordinates = validCoordinates(row?.coordinates);

    if (!name) skipped.push({ name: label, reason: "It has no name." });
    else if (!coordinates) skipped.push({ name, reason: "Its track couldn't be read." });
    else if (!UUID.test(String(row.regionId)) || !regionIds.has(row.regionId)) skipped.push({ name, reason: "Choose a region for it." });
    else if (![1, 2, 3, 4, 5].includes(row.difficulty) || !["good", "mixed", "poor"].includes(row.surface)) skipped.push({ name, reason: "Its difficulty or surface isn't valid." });
    else {
      const duplicate = findLikelyDuplicate(coordinates, summaries);
      if (duplicate) {
        skipped.push({ name, reason: `It looks the same as ${duplicate.name}, which is already on the site.` });
        continue;
      }

      const distanceMiles = lineDistanceMiles(coordinates);
      const startLabel = String(row.startLabel ?? "").trim().slice(0, 80);
      const endLabel = String(row.endLabel ?? "").trim().slice(0, 80);
      const minutes = Number.isFinite(row.ridingTimeMinutes) ? Math.min(3000, Math.max(5, Math.round(row.ridingTimeMinutes))) : 60;
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];

      const [route] = await db
        .insert(routes)
        .values({
          name,
          slug: await freeSlug(name, taken),
          regionId: row.regionId,
          introSell: "",
          introCharacter: "",
          distanceMiles: String(distanceMiles),
          ridingTimeMinutes: minutes,
          difficulty: row.difficulty,
          surfaceQuality: row.surface,
          geometry: { type: "LineString", coordinates },
          startPoint: { lat: first[1], lng: first[0], ...(startLabel && { label: startLabel }) },
          endPoint: { lat: last[1], lng: last[0], ...(endLabel && { label: endLabel }) },
          status: "draft",
          isSample: false,
          sourceName,
          sourceUrl: sourceUrl || null,
          sourceAuthor: sourceAuthor || null,
          sourceLicence: batch.licence,
          importedAt: new Date(),
          needsReview: true,
        })
        .returning({ id: routes.id });
      created.push({ id: route.id, name });
      // Later rows in this batch are checked against this one too.
      summaries.push({
        name,
        start: { lat: first[1], lng: first[0] },
        end: { lat: last[1], lng: last[0] },
        distanceMiles,
      });
    }
  }

  revalidatePath("/admin/routes");
  return { ok: true, created, skipped };
}
