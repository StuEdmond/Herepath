import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password");
  const next = (formData.get("next") as string) || "/admin";

  if (typeof password === "string" && password === process.env.ADMIN_PASSWORD) {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
    const store = await cookies();
    store.set(ADMIN_SESSION_COOKIE, secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    redirect(next);
  }

  redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-4 pt-16">
      <h1 className="text-[24px]">Admin login</h1>
      <p className="text-text-secondary">Enter the admin password to manage Herepath content.</p>
      <form action={login} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={params.next ?? "/admin"} />
        <label className="flex flex-col gap-1 text-[13px] text-text-muted">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="min-h-12 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
          />
        </label>
        {params.error && (
          <p className="text-[13px] text-red-accent">Incorrect password. Try again.</p>
        )}
        <Button type="submit" variant="primary" fullWidth>
          Log in
        </Button>
      </form>
    </div>
  );
}
