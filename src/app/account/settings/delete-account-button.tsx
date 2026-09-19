"use client";

import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  return (
    <Button
      type="submit"
      variant="danger"
      className="min-h-9 px-3 text-[13px]"
      onClick={(e) => {
        if (!confirm("Delete your account? This permanently removes your ride diary and photos, reviews, place tips, blog posts and saved rides, and can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      Delete my account
    </Button>
  );
}
