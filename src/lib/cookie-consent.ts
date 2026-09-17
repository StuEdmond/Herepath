const STORAGE_KEY = "herepath-cookie-consent";

export type CookieConsent = "accepted" | "declined";

const listeners = new Set<() => void>();

/** Nothing non-essential exists yet, but this gates any future analytics/tracking script. */
export function getCookieConsent(): CookieConsent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(value: CookieConsent | null): void {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private browsing / blocked storage — the banner will just reappear next visit.
  }
  for (const listener of listeners) listener();
}

export function subscribeCookieConsent(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getServerCookieConsentSnapshot(): CookieConsent | null {
  return null;
}
