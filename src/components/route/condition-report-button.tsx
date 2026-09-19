"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { reportRideCondition } from "@/app/conditions/actions";
import { Button } from "@/components/ui/button";
import {
  CONDITION_CATEGORIES,
  CONDITION_NOTE_MAX_LENGTH,
  type ConditionReportResult,
  type ConditionTargetType,
} from "@/lib/condition-reports";

/**
 * "Report a problem" for a road that has changed. Signed-in riders choose what has changed and say where; signed-out readers are
 * taken to sign in. Reports go to our team to check, and aren't shown to other riders.
 */
export function ConditionReportButton({ targetType, targetId, signedIn }: { targetType: ConditionTargetType; targetId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  // Held here, not left to the browser, because a submitted form clears itself and a rider shouldn't lose their words to a small mistake.
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState<ConditionReportResult, FormData>(reportRideCondition, {});

  if (state.done) {
    return (
      <p className="text-[13px] text-green-bright" role="status">
        Thanks, we&apos;ll check it and update the page if it holds up.
      </p>
    );
  }

  if (!signedIn) {
    return (
      <Link href="/account/sign-in" className="text-[13px] text-text-muted underline hover:text-text-secondary">
        Sign in to report a problem
      </Link>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-text-muted underline hover:text-text-secondary">
        Report a problem
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-2 rounded-lg bg-surface p-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <p className="text-[13px] text-text-secondary">Has something changed on this road? Tell us and we&apos;ll check it.</p>
      <label className="sr-only" htmlFor={`condition-category-${targetId}`}>
        What has changed
      </label>
      <select
        id={`condition-category-${targetId}`}
        name="category"
        required
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="min-h-10 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
      >
        <option value="" disabled>
          What has changed?
        </option>
        {CONDITION_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`condition-note-${targetId}`}>
        Where and what you saw
      </label>
      <textarea
        id={`condition-note-${targetId}`}
        name="note"
        required
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={CONDITION_NOTE_MAX_LENGTH}
        placeholder="Where, and what you saw. For example: Road shut at the summit for resurfacing until the end of the month."
        className="rounded-lg border border-text-muted/40 bg-surface px-3 py-2 text-[14px] text-text-primary"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="secondary" disabled={pending} className="min-h-10 px-4 text-[14px]">
          {pending ? "Sending…" : "Send report"}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-text-muted underline">
          Cancel
        </button>
        {state.error && (
          <span className="text-[13px] text-red-accent" role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
