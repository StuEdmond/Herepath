import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { signInWithCredentials } from "../actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign in" };

const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 p-4 pt-16">
      <div>
        <h1 className="text-[24px]">Sign in</h1>
        <p className="text-text-secondary">Sign in to save rides and keep your ride diary.</p>
      </div>

      {hasGoogle && (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/profile" });
          }}
        >
          <Button type="submit" variant="secondary" fullWidth>
            Continue with Google
          </Button>
        </form>
      )}

      {hasGoogle && (
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <span className="h-px flex-1 bg-surface-raised" />
          or
          <span className="h-px flex-1 bg-surface-raised" />
        </div>
      )}

      <form action={signInWithCredentials} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[13px] text-text-muted">
          Email
          <input
            type="email"
            name="email"
            required
            className="min-h-12 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-text-muted">
          Password
          <input
            type="password"
            name="password"
            required
            className="min-h-12 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
          />
        </label>
        {error && <p className="text-[13px] text-red-accent">Incorrect email or password.</p>}
        <Button type="submit" variant="primary" fullWidth>
          Sign in
        </Button>
      </form>

      <p className="text-[14px] text-text-secondary">
        New to Herepath?{" "}
        <Link href="/account/sign-up" className="text-green-bright underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
