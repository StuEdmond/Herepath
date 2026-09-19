"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resetUserPassword, type ResetPasswordResult } from "../actions";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<ResetPasswordResult, FormData>(resetUserPassword, {});

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="secondary" disabled={pending} className="min-h-9 self-start px-3 text-[13px]">
        {pending ? "Resetting…" : "Reset password"}
      </Button>
      {state.error && <p className="text-[13px] text-red-accent">{state.error}</p>}
      {state.password && (
        <div className="flex flex-col gap-1 rounded-lg bg-bg p-3">
          <p className="text-[13px] text-text-muted">New temporary password — shown once, so copy it now:</p>
          <code className="select-all text-[18px] text-text-primary">{state.password}</code>
          <p className="text-[12px] text-text-muted">
            Send it to the rider and ask them to change it under Account settings. Their old password no longer works, though a phone or
            browser that is already signed in stays signed in.
          </p>
        </div>
      )}
    </form>
  );
}
