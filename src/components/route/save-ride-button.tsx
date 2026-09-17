"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSavedRide } from "@/app/saved/actions";
import type { tripTargetEnum } from "@/db/schema";

type TripTarget = (typeof tripTargetEnum.enumValues)[number];

export function SaveRideButton({ targetType, targetId, initialSaved }: { targetType: TripTarget; targetId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-pressed={saved}
      className={cn(
        "flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
        saved ? "bg-green-tint-bg text-green-tint-text" : "bg-surface text-text-secondary hover:text-text-primary",
      )}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleSavedRide(targetType, targetId, pathname);
          if (!result.signedIn) {
            router.push("/account/sign-in");
            return;
          }
          setSaved(result.saved);
        });
      }}
    >
      <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      {saved ? "Saved" : "Want to ride"}
    </button>
  );
}
