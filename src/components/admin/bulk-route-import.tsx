"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { importRoutes } from "@/app/admin/(dashboard)/routes/import/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { DIFFICULTY_LABELS } from "@/components/ui/difficulty-gauge";
import { lineDistanceMiles, parseGpxTracks, simplifyTrack } from "@/lib/gpx";
import { estimateRidingMinutes, findLikelyDuplicate, type ExistingRouteSummary, type ImportResult } from "@/lib/route-import";
import { MAX_IMPORT_FILES, MAX_IMPORT_FILE_BYTES, MAX_IMPORT_POINTS, ROUTE_LICENCES, isRouteLicence } from "@/lib/route-sources";
import { cn } from "@/lib/utils";

interface RowState {
  key: string;
  fileName: string;
  name: string;
  regionId: string;
  coordinates: [number, number][];
  distanceMiles: number;
  ridingTimeMinutes: number;
  difficulty: number;
  surface: "good" | "mixed" | "poor";
  startLabel: string;
  endLabel: string;
  include: boolean;
  duplicateOf: string | null;
}

const FIELD = "min-h-10 w-full rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary";

function nameFromFile(fileName: string): string {
  return fileName
    .replace(/\.gpx$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function BulkRouteImport({ regions, existing }: { regions: { id: string; name: string }[]; existing: ExistingRouteSummary[] }) {
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [licence, setLicence] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [defaultRegion, setDefaultRegion] = useState("");

  const [rows, setRows] = useState<RowState[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, startImporting] = useTransition();

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;

    setReading(true);
    setResult(null);
    setProblem(null);
    const errors: string[] = [];
    const added: RowState[] = [];

    for (const file of files) {
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        errors.push(`${file.name}: too big (over ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB).`);
        continue;
      }
      if (!/\.gpx$/i.test(file.name)) {
        errors.push(`${file.name}: not a GPX file.`);
        continue;
      }
      try {
        const tracks = parseGpxTracks(await file.text());
        tracks.forEach((track, index) => {
          const coordinates = simplifyTrack(track.coordinates, MAX_IMPORT_POINTS);
          const distanceMiles = lineDistanceMiles(track.coordinates);
          const base = track.name || nameFromFile(file.name);
          const duplicate = findLikelyDuplicate(coordinates, existing);
          added.push({
            key: `${file.name}:${index}:${Date.now()}:${added.length}`,
            fileName: file.name,
            name: tracks.length > 1 && !track.name ? `${base} (${index + 1})` : base,
            regionId: defaultRegion,
            coordinates,
            distanceMiles,
            ridingTimeMinutes: estimateRidingMinutes(distanceMiles),
            difficulty: 3,
            surface: "mixed",
            startLabel: "",
            endLabel: "",
            include: !duplicate,
            duplicateOf: duplicate?.name ?? null,
          });
        });
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "couldn't be read."}`);
      }
    }

    setRows((current) => {
      const all = [...current, ...added];
      if (all.length > MAX_IMPORT_FILES) errors.push(`Only the first ${MAX_IMPORT_FILES} routes are kept. Import these, then add the rest.`);
      // A route that repeats one already chosen in this batch is flagged too.
      return all.slice(0, MAX_IMPORT_FILES).map((row, i, list) => {
        if (row.duplicateOf) return row;
        const earlier = list.slice(0, i).filter((r) => r.include).map((r) => ({
          name: r.name,
          start: { lat: r.coordinates[0][1], lng: r.coordinates[0][0] },
          end: { lat: r.coordinates[r.coordinates.length - 1][1], lng: r.coordinates[r.coordinates.length - 1][0] },
          distanceMiles: r.distanceMiles,
        }));
        const same = findLikelyDuplicate(row.coordinates, earlier);
        return same ? { ...row, include: false, duplicateOf: `${same.name} (also in this batch)` } : row;
      });
    });
    setFileErrors(errors);
    setReading(false);
  }

  function update(key: string, changes: Partial<RowState>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  function applyRegionToAll(regionId: string) {
    setDefaultRegion(regionId);
    setRows((current) => current.map((row) => (row.regionId ? row : { ...row, regionId })));
  }

  const chosen = rows.filter((row) => row.include);

  function submit() {
    setProblem(null);
    if (sourceName.trim().length < 2) return setProblem("Say where the files came from.");
    if (!isRouteLicence(licence)) return setProblem("Choose the licence these files are under.");
    if (!declaration) return setProblem("Please confirm you have the right to publish these files.");
    if (chosen.length === 0) return setProblem("Choose at least one route to import.");
    const noRegion = chosen.find((row) => !row.regionId);
    if (noRegion) return setProblem(`Choose a region for ${noRegion.name}.`);
    const noName = chosen.find((row) => !row.name.trim());
    if (noName) return setProblem(`${noName.fileName} needs a name.`);

    startImporting(async () => {
      const outcome = await importRoutes(
        { sourceName, sourceUrl, sourceAuthor, licence, declaration },
        chosen.map((row) => ({
          name: row.name,
          regionId: row.regionId,
          coordinates: row.coordinates,
          difficulty: row.difficulty,
          surface: row.surface,
          ridingTimeMinutes: row.ridingTimeMinutes,
          startLabel: row.startLabel,
          endLabel: row.endLabel,
        })),
      );
      setResult(outcome);
      if (outcome.ok) setRows((current) => current.filter((row) => !row.include));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <div>
          <h3 className="text-[17px] text-text-primary">1. Where the files came from</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            Only import files you have the right to publish: your own recordings, or files whose author or licence allows it. Don&apos;t import
            routes exported from another route app or website unless its terms allow reuse. Most don&apos;t. This is recorded against every route,
            and credit is shown on its page where the licence needs it.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] text-text-muted">
            Source (person, club or site)
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Peak District Riders Club" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-text-muted">
            Author or credit (optional)
            <input value={sourceAuthor} onChange={(e) => setSourceAuthor(e.target.value)} placeholder="e.g. Sam Rider" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-text-muted">
            Link to the source (optional)
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://" inputMode="url" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-text-muted">
            Licence
            <select value={licence} onChange={(e) => setLicence(e.target.value)} className={FIELD}>
              <option value="">Choose…</option>
              {ROUTE_LICENCES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-start gap-2 text-[14px] text-text-primary">
          <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
          <span>I have the right to publish these files on Herepath under the licence above.</span>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <div>
          <h3 className="text-[17px] text-text-primary">2. Choose the GPX files</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            Up to {MAX_IMPORT_FILES} at a time. A file with several tracks becomes several routes. Everything comes in as an unpublished draft with no
            description and no bike ratings, so nothing goes live until you&apos;ve written and checked it.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className={cn(buttonVariants({ variant: "primary" }), "min-h-11 cursor-pointer px-4 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2")}>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {rows.length > 0 ? "Add more GPX files" : "Choose GPX files"}
            <input type="file" accept=".gpx,application/gpx+xml" multiple onChange={handleFiles} className="sr-only" />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-text-muted">
            Region for all (you can change each one)
            <select value={defaultRegion} onChange={(e) => applyRegionToAll(e.target.value)} className={cn(FIELD, "w-56")}>
              <option value="">Choose…</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {reading && <p className="text-[13px] text-text-muted">Reading your files…</p>}
        {fileErrors.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-[13px] text-red-accent" role="alert">
            {fileErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </section>

      {rows.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[17px] text-text-primary">3. Check each route ({chosen.length} of {rows.length} will be imported)</h3>
          <p className="text-[13px] text-text-muted">
            Distance and riding time are worked out from the track (riding time is a guess at 35 mph). Difficulty and surface are only starting points,
            since the route can&apos;t be published until they&apos;ve been checked.
          </p>
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.key} className={cn("flex flex-col gap-3 rounded-xl bg-surface p-4", !row.include && "opacity-60")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-[14px] text-text-primary">
                    <input type="checkbox" checked={row.include} disabled={!!row.duplicateOf} onChange={(e) => update(row.key, { include: e.target.checked })} className="h-4 w-4" />
                    Import this route
                  </label>
                  <span className="text-[12px] text-text-muted">
                    {row.fileName} · {row.distanceMiles} miles · {row.coordinates.length} points
                  </span>
                </div>
                {row.duplicateOf && <p className="text-[13px] text-red-tint-text">Looks the same as {row.duplicateOf}, so it will be left out.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted sm:col-span-2">
                    Name
                    <input value={row.name} onChange={(e) => update(row.key, { name: e.target.value })} className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Region
                    <select value={row.regionId} onChange={(e) => update(row.key, { regionId: e.target.value })} className={FIELD}>
                      <option value="">Choose…</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Riding time (minutes)
                    <input type="number" min={5} value={row.ridingTimeMinutes} onChange={(e) => update(row.key, { ridingTimeMinutes: Number(e.target.value) })} className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Difficulty (starting point)
                    <select value={row.difficulty} onChange={(e) => update(row.key, { difficulty: Number(e.target.value) })} className={FIELD}>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <option key={d} value={d}>
                          {d} · {DIFFICULTY_LABELS[d - 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Road surface (starting point)
                    <select value={row.surface} onChange={(e) => update(row.key, { surface: e.target.value as RowState["surface"] })} className={FIELD}>
                      <option value="good">Good</option>
                      <option value="mixed">Mixed</option>
                      <option value="poor">Poor</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Start name (optional)
                    <input value={row.startLabel} onChange={(e) => update(row.key, { startLabel: e.target.value })} placeholder="e.g. Glossop" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                    Finish name (optional)
                    <input value={row.endLabel} onChange={(e) => update(row.key, { endLabel: e.target.value })} placeholder="e.g. Ladybower" className={FIELD} />
                  </label>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" className="min-h-11 px-5 text-[14px]" onClick={submit} disabled={importing}>
              {importing ? "Importing…" : `Import ${chosen.length} ${chosen.length === 1 ? "route" : "routes"} as drafts`}
            </Button>
            <button type="button" className="text-[13px] text-text-muted underline" onClick={() => setRows([])}>
              Clear the list
            </button>
          </div>
        </section>
      )}

      {problem && (
        <p className="text-[14px] text-red-accent" role="alert">
          {problem}
        </p>
      )}

      {result && (
        <section className="flex flex-col gap-2 rounded-xl bg-surface p-4" role="status">
          {result.ok ? (
            <>
              <h3 className="text-[17px] text-text-primary">
                Imported {result.created.length} {result.created.length === 1 ? "route" : "routes"} as drafts
              </h3>
              {result.created.length > 0 && (
                <>
                  <p className="text-[13px] text-text-muted">Open each one to write the description, rate the bikes, check the ratings and tick it as reviewed before publishing.</p>
                  <ul className="flex flex-col gap-1 text-[14px]">
                    {result.created.map((route) => (
                      <li key={route.id}>
                        <Link href={`/admin/routes/${route.id}`} className="text-green-bright underline hover:no-underline">
                          {route.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {result.skipped.length > 0 && (
                <>
                  <h4 className="pt-2 text-[15px] text-text-primary">Left out</h4>
                  <ul className="flex flex-col gap-0.5 text-[13px] text-text-secondary">
                    {result.skipped.map((s, i) => (
                      <li key={`${s.name}-${i}`}>
                        {s.name}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="text-[14px] text-red-accent">{result.error}</p>
          )}
        </section>
      )}
    </div>
  );
}
