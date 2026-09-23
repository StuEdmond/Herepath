"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, LogOut, Route as RouteIcon, Settings, User, X } from "lucide-react";
import { signOutAction } from "@/app/account/actions";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/rides", label: "Your rides", icon: RouteIcon },
  { href: "/saved", label: "Saved rides", icon: Bookmark },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const;

/**
 * The account button in the header: a name and avatar that opens a panel from the right with links to the rider's own pages
 * and sign out, instead of the header itself trying to hold them all.
 */
export function AccountMenu({ name, email, image }: { name: string; email: string | null; image: string | null }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className="flex min-w-0 items-center gap-1.5 rounded-full text-[14px] text-text-primary hover:text-text-secondary"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-[13px] font-medium">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-8 w-8 object-cover" />
          ) : (
            name[0].toUpperCase()
          )}
        </span>
        <span className="max-w-20 truncate sm:max-w-28">{name}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50" />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-surface-raised bg-surface p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-text-primary">{name}</p>
                {email && <p className="truncate text-[13px] text-text-muted">{email}</p>}
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Account" className="flex flex-col gap-1 border-t border-surface-raised pt-2">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-[14px] text-text-primary hover:bg-surface-raised"
                >
                  <Icon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            <form action={signOutAction} className="mt-auto border-t border-surface-raised pt-3">
              <Button type="submit" variant="secondary" fullWidth className="min-h-10 gap-2 text-[13px]">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
