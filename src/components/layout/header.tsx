import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-surface-raised bg-surface print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-[18px] font-medium text-text-primary">
          Herepath
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-text-secondary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        {session?.user ? (
          <Link href="/rides" className="text-[14px] text-text-secondary hover:text-text-primary">
            Your rides
          </Link>
        ) : (
          <Link href="/account/sign-in">
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
