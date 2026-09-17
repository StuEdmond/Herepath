"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getCookieConsent,
  setCookieConsent,
  subscribeCookieConsent,
  getServerCookieConsentSnapshot,
  type CookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const consent = useSyncExternalStore(subscribeCookieConsent, getCookieConsent, getServerCookieConsentSnapshot);

  if (consent !== null) return null;

  function choose(value: CookieConsent) {
    setCookieConsent(value);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-14 z-50 mx-auto flex max-w-2xl flex-col gap-3 border-t border-surface-raised bg-surface p-4 shadow-lg print:hidden sm:bottom-4 sm:rounded-xl sm:border"
    >
      <p className="text-[14px] text-text-secondary">
        We use one essential cookie to keep the admin area signed in — nothing else, and no analytics or tracking
        cookies yet. Read our{" "}
        <Link href="/privacy" className="underline hover:text-text-primary">
          privacy policy
        </Link>{" "}
        for details.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" className="min-h-10 px-4 text-[14px]" onClick={() => choose("declined")}>
          Decline non-essential
        </Button>
        <Button type="button" variant="secondary" className="min-h-10 px-4 text-[14px]" onClick={() => choose("accepted")}>
          Accept all
        </Button>
      </div>
    </div>
  );
}
