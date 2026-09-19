"use client";

import { Button } from "@/components/ui/button";

/** Deletes a saved trip, after asking. Sits inside a form whose action does the deleting. */
export function DeleteTripButton({ name }: { name: string }) {
  return (
    <Button
      type="submit"
      variant="ghost"
      className="min-h-9 px-2 text-[13px]"
      onClick={(event) => {
        if (!confirm(`Delete "${name}"? This can't be undone.`)) event.preventDefault();
      }}
    >
      Delete
    </Button>
  );
}
