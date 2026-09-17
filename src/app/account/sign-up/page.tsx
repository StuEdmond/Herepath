import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 p-4 pt-16">
      <div>
        <h1 className="text-[24px]">Create an account</h1>
        <p className="text-text-secondary">Save rides and start your ride diary.</p>
      </div>

      <form action={signUp} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[13px] text-text-muted">
          Name
          <input
            type="text"
            name="name"
            required
            className="min-h-12 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
          />
        </label>
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
            minLength={8}
            className="min-h-12 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
          />
          <span className="text-[12px] text-text-muted">At least 8 characters</span>
        </label>
        {error === "exists" && <p className="text-[13px] text-red-accent">An account with that email already exists.</p>}
        {error === "invalid" && <p className="text-[13px] text-red-accent">Please fill in every field.</p>}
        <Button type="submit" variant="primary" fullWidth>
          Create account
        </Button>
      </form>

      <p className="text-[14px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/account/sign-in" className="text-green-bright underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
