import Link from "next/link";
import { CookieSettingsLink } from "./cookie-settings-link";

export function Footer() {
  const deadCylinderUrl = process.env.NEXT_PUBLIC_DEAD_CYLINDER_URL;

  return (
    <footer className="flex flex-col gap-2 border-t border-surface-raised px-4 py-6 pb-24 text-[13px] text-text-muted md:pb-6 print:hidden">
      <p>
        Herepath, from{" "}
        {deadCylinderUrl ? (
          <a href={deadCylinderUrl} className="underline hover:text-text-secondary">
            Dead Cylinder Co.
          </a>
        ) : (
          <span>Dead Cylinder Co.</span>
        )}
      </p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/about" className="underline hover:text-text-secondary">
          About
        </Link>
        <Link href="/privacy" className="underline hover:text-text-secondary">
          Privacy policy
        </Link>
        <CookieSettingsLink />
      </nav>
    </footer>
  );
}
