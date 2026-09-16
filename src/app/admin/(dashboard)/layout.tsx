import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

async function logout() {
  "use server";
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/regions", label: "Regions" },
  { href: "/admin/landmarks", label: "Landmarks" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/routes", label: "Routes" },
  { href: "/admin/day-rides", label: "Day rides" },
  { href: "/admin/tours", label: "Tours" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/search-chips", label: "Search chips" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-24 md:pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-raised pb-4">
        <div>
          <h1 className="text-[22px]">Herepath admin</h1>
          <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-text-primary hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <Button type="submit" variant="secondary" className="min-h-9 px-3 text-[13px]">
            Log out
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
