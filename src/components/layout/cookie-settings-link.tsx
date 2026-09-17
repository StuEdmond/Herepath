"use client";

import { setCookieConsent } from "@/lib/cookie-consent";

export function CookieSettingsLink() {
  return (
    <button type="button" className="underline hover:text-text-secondary" onClick={() => setCookieConsent(null)}>
      Cookie settings
    </button>
  );
}
