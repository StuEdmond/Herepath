"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Select, TextInput } from "@/components/admin/form-fields";
import { ROUTE_LICENCES } from "@/lib/route-sources";

/**
 * Where a route came from, on what terms, and whether it has been checked yet. "Still needs review" stops a route being published; it's
 * set on everything the bulk importer creates. A warning appears here if the route is set to Published while it's ticked, because the
 * server would otherwise refuse the save with only a generic error.
 */
export function SourceFields({
  sourceName,
  sourceUrl,
  sourceAuthor,
  sourceLicence,
  needsReview,
  importedOn,
}: {
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceAuthor?: string | null;
  sourceLicence?: string | null;
  needsReview?: boolean;
  importedOn?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const check = () => {
      const status = (form.elements.namedItem("status") as HTMLSelectElement | null)?.value;
      const review = (form.elements.namedItem("needsReview") as HTMLInputElement | null)?.checked;
      setBlocked(status === "published" && !!review);
    };
    form.addEventListener("change", check);
    const frame = requestAnimationFrame(check);
    return () => {
      form.removeEventListener("change", check);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-3 rounded-lg bg-surface p-3">
      <p className="text-[13px] text-text-muted">
        Where this route came from and the terms it can be used on{importedOn ? `. Imported on ${importedOn}` : ""}. Credit is shown on the route&apos;s page
        where the licence needs it. Leave blank for routes we wrote ourselves.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Source">
          <TextInput name="sourceName" defaultValue={sourceName ?? ""} />
        </Field>
        <Field label="Author or credit">
          <TextInput name="sourceAuthor" defaultValue={sourceAuthor ?? ""} />
        </Field>
        <Field label="Link to the source">
          <TextInput name="sourceUrl" defaultValue={sourceUrl ?? ""} inputMode="url" />
        </Field>
        <Field label="Licence">
          <Select name="sourceLicence" defaultValue={sourceLicence ?? ""}>
            <option value="">Not recorded</option>
            {ROUTE_LICENCES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex items-start gap-2 text-[14px] text-text-primary">
        <input type="checkbox" name="needsReview" defaultChecked={needsReview} className="mt-1 h-4 w-4 shrink-0" />
        <span>
          Still needs review
          <span className="block text-[12px] text-text-muted">
            Untick once you&apos;ve written the description, rated the bikes and checked the difficulty, surface and licence. A route can&apos;t be published
            while this is ticked.
          </span>
        </span>
      </label>
      {blocked && (
        <p role="alert" className="rounded-lg bg-red-tint-bg p-3 text-[13px] text-red-tint-text">
          This route is set to Published but is still marked as needing review, so it can&apos;t be saved that way. Untick &ldquo;Still needs review&rdquo; once it&apos;s
          been checked, or set the status back to Draft.
        </p>
      )}
    </div>
  );
}
