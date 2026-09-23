import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "./account-menu";

// The last three are also in the footer, so on a phone they're left out to keep the header to one tidy row.
const NAV_LINKS = [
  { href: "/explore", label: "Explore", desktopOnly: false },
  { href: "/plan", label: "Plan", desktopOnly: false },
  { href: "/advice", label: "Advice", desktopOnly: false },
  { href: "/blog", label: "Blog", desktopOnly: false },
  { href: "/pricing", label: "Pricing", desktopOnly: false },
  { href: "/faq", label: "FAQ", desktopOnly: true },
  { href: "/about", label: "About", desktopOnly: true },
  { href: "/contact", label: "Contact", desktopOnly: true },
] as const;

export async function Header() {
  const session = await auth();

  // Read fresh from the database (not the sign-in token) so a name change in Settings shows straight away.
  const [account] = session?.user?.id
    ? await db.select({ name: users.name, email: users.email, image: users.image }).from(users).where(eq(users.id, session.user.id))
    : [];
  const displayName = account?.name ?? account?.email ?? "You";

  return (
    <header className="sticky top-0 z-30 border-b border-surface-raised bg-surface pt-[env(safe-area-inset-top)] print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="order-1 flex items-center gap-2 text-[16px] font-medium uppercase tracking-wide text-text-primary md:gap-2.5 md:text-[17px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/herepath-mark.png" alt="" width={40} height={32} className="h-8 w-10" />
          Herepath
        </Link>

        {/* On a phone the links drop to their own row under the logo and account, so the top row stays tidy. */}
        <nav aria-label="Primary" className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-text-secondary md:order-2 md:w-auto">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={link.desktopOnly ? "hidden hover:text-text-primary md:inline" : "hover:text-text-primary"}>
              {link.label}
            </Link>
          ))}
        </nav>

        {session?.user ? (
          <div className="order-2 flex min-w-0 items-center md:order-3">
            <AccountMenu name={displayName} email={account?.email ?? null} image={account?.image ?? null} />
          </div>
        ) : (
          <Link href="/account/sign-in" className="order-2 md:order-3">
            <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
