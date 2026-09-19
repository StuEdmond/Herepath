"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Bookmark, User, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/explore", label: "Explore", icon: Compass, isActive: (path: string, view: string | null) => path === "/explore" && view !== "map" },
  { href: "/saved", label: "Saved", icon: Bookmark, isActive: (path: string) => path.startsWith("/saved") },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    // Your rides, the diary and account settings all live under Profile.
    isActive: (path: string) => ["/profile", "/rides", "/diary", "/account", "/reviews"].some((p) => path.startsWith(p)),
  },
  { href: "/explore?view=map", label: "Map", icon: Map, isActive: (path: string, view: string | null) => path === "/explore" && view === "map" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const view = useSearchParams().get("view");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-raised bg-surface pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="flex">
        {ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname, view);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[12px]",
                  active ? "text-green-bright" : "text-text-muted",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
