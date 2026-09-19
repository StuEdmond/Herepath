"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_APP_GUIDES } from "@/lib/nav-app-guides";
import { isNativeApp, openExternal, shareFileNative } from "@/lib/native";
import { Button } from "@/components/ui/button";

const noSubscribe = () => () => {};

/**
 * "Use in Beeline, Garmin or TomTom": step-by-step help for getting a ride's GPX file into each navigation app, under the map.
 * Inside the Herepath app it also has a button that opens the phone's share sheet with the file, so a navigation app on the
 * phone (Beeline, Garmin Drive and so on) can take it directly.
 */
export function NavAppHandoff({ gpxHref, filename, rideName, note }: { gpxHref: string; filename: string; rideName: string; note?: string }) {
  const [active, setActive] = useState<string>(NAV_APP_GUIDES[0].id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inApp = useSyncExternalStore(noSubscribe, isNativeApp, () => false);
  const guide = NAV_APP_GUIDES.find((g) => g.id === active) ?? NAV_APP_GUIDES[0];

  async function sendToApp() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(gpxHref);
      if (!response.ok) throw new Error("download failed");
      const blob = new Blob([await response.text()], { type: "application/gpx+xml" });
      await shareFileNative({ title: rideName, filename, blob, dialogTitle: "Send to a navigation app" });
    } catch (error) {
      // Closing the share sheet without choosing an app isn't a problem worth reporting.
      if (!/cancel|dismiss/i.test(String((error as Error)?.message))) {
        setMessage("Couldn't open the share sheet. Please try again, or use the steps below.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="group rounded-lg border border-surface-raised p-3">
      <summary className="cursor-pointer list-none text-[14px] text-text-primary marker:content-none">Use in Beeline, Garmin or TomTom</summary>

      <div className="mt-3 flex flex-col gap-3">
        {inApp && (
          <div className="flex flex-col gap-1.5">
            <Button type="button" variant="primary" className="min-h-10 self-start px-4 text-[14px]" onClick={sendToApp} disabled={busy}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {busy ? "Preparing…" : "Send to a navigation app"}
            </Button>
            <p className="text-[13px] text-text-muted">Opens your phone&apos;s share menu. Pick Beeline, Garmin Drive or another navigation app from the list.</p>
            {message && <p className="text-[13px] text-red-accent">{message}</p>}
          </div>
        )}

        <div role="tablist" aria-label="Navigation app" className="flex flex-wrap gap-1.5">
          {NAV_APP_GUIDES.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              id={`nav-tab-${g.id}`}
              aria-selected={g.id === active}
              aria-controls="nav-panel"
              onClick={() => setActive(g.id)}
              className={cn(
                "min-h-9 rounded-full px-3 text-[13px] transition-colors",
                g.id === active ? "bg-green-primary text-white" : "bg-surface-raised text-text-secondary hover:text-text-primary",
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="nav-panel" aria-labelledby={`nav-tab-${guide.id}`} className="flex flex-col gap-2 text-[14px] text-text-secondary">
          <p>{guide.intro}</p>
          <ol className="list-inside list-decimal space-y-1 pl-1">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {note && <p className="text-[13px] text-text-muted">{note}</p>}
          {guide.note && <p className="text-[13px] text-text-muted">{guide.note}</p>}
          {guide.help.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-[13px]">
              {guide.help.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-bright underline hover:no-underline"
                    onClick={(event) => {
                      if (isNativeApp()) {
                        event.preventDefault();
                        void openExternal(link.url);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-[13px] text-text-muted">
          Using Google Maps, or new to GPX files?{" "}
          <Link href="/gpx-guide" className="text-green-bright underline hover:no-underline">
            See the full guide
          </Link>
        </p>
      </div>
    </details>
  );
}
