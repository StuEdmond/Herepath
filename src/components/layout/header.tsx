import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { signOutAction } from "@/app/account/actions";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/advice", label: "Advice" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export async function Header() {
  const session = await auth();

  // Read fresh from the database (not the sign-in token) so a name change in Settings shows straight away.
  const [account] = session?.user?.id
    ? await db.select({ name: users.name, email: users.email, image: users.image }).from(users).where(eq(users.id, session.user.id))
    : [];
  const displayName = account?.name ?? account?.email ?? "You";

  return (
    <header className="sticky top-0 z-30 border-b border-surface-raised bg-surface print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-medium uppercase tracking-wide text-text-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/herepath-mark.png" alt="" width={40} height={32} className="h-8 w-10" />
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
          <div className="flex items-center gap-3">
            <Link href="/profile" className="hidden text-[14px] text-text-secondary hover:text-text-primary md:inline">
              Profile
            </Link>
            <Link href="/profile" aria-label="Your profile" className="flex min-w-0 items-center gap-2 text-[14px] text-text-primary">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-[13px] font-medium">
                {account?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.image} alt="" className="h-8 w-8 object-cover" />
                ) : (
                  displayName[0].toUpperCase()
                )}
              </span>
              <span className="max-w-28 truncate">{displayName}</span>
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" className="min-h-9 px-3 text-[13px]">
                Sign out
              </Button>
            </form>
          </div>
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
