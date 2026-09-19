"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { REPORT_REASONS, type ReportResult } from "@/lib/report";

/**
 * "Report" control for rider-written content. Signed-in readers choose a reason and send it;
 * signed-out readers are taken to sign in. The action decides what is being reported.
 */
export function ReportButton({
  action,
  targetId,
  signedIn,
  label,
}: {
  action: (previous: ReportResult, formData: FormData) => Promise<ReportResult>;
  targetId: string;
  signedIn: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportResult, FormData>(action, {});

  if (state.done) return <span className="text-[12px] text-text-muted">Thanks — we&apos;ll take a look.</span>;

  if (!signedIn) {
    return (
      <Link href="/account/sign-in" className="text-[12px] text-text-muted underline hover:text-text-secondary">
        {label}
      </Link>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-text-muted underline hover:text-text-secondary">
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-1 flex flex-wrap items-center gap-2">
      <input type="hidden" name="targetId" value={targetId} />
      <label className="sr-only" htmlFor={`reason-${targetId}`}>
        Reason for reporting
      </label>
      <select
        id={`reason-${targetId}`}
        name="reason"
        required
        defaultValue=""
        className="min-h-9 rounded-lg border border-text-muted/40 bg-surface px-2 text-[13px] text-text-primary"
      >
        <option value="" disabled>
          Why are you reporting it?
        </option>
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary" disabled={pending} className="min-h-9 px-3 text-[13px]">
        {pending ? "Sending…" : "Send report"}
      </Button>
      <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-text-muted underline">
        Cancel
      </button>
      {state.error && <span className="text-[12px] text-red-accent">{state.error}</span>}
    </form>
  );
}
