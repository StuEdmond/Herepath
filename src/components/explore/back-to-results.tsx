"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { LAST_SEARCH_KEY } from "@/lib/last-search";

function subscribe() {
  return () => {};
}

function lastSearch(): string {
  try {
    const saved = sessionStorage.getItem(LAST_SEARCH_KEY);
    return saved && saved.startsWith("/explore") ? saved : "/explore";
  } catch {
    return "/explore";
  }
}

/** Returns to the Explore search exactly as the rider left it, filters and map/grid view included. */
export function BackToResults() {
  const href = useSyncExternalStore(subscribe, lastSearch, () => "/explore");

  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-text-secondary hover:text-text-primary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to results
    </Link>
  );
}
