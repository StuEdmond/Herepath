"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, User, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/rides", label: "Your rides", icon: User },
  { href: "/map", label: "Map", icon: Map },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-raised bg-surface md:hidden"
    >
      <ul className="flex">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
