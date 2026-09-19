import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { updateProfile, changePassword, deleteAccount, signOutAction } from "../actions";
import { Field, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { ArrowLeft } from "lucide-react";
import { DeleteAccountButton } from "./delete-account-button";

export const metadata: Metadata = { title: "Settings" };

export default async function AccountSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; password?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const { saved, password } = await searchParams;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-4 pt-8 pb-16">
      <div className="flex flex-col gap-1">
        <Link href="/profile" className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Profile
        </Link>
        <h1 className="text-[24px]">Settings</h1>
        <p className="text-[13px] text-text-muted">{user?.email}</p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface p-4">
        <div className="flex items-center gap-2">
          <Tag variant={user?.membershipTier === "premium" ? "suited" : "neutral"}>
            {user?.membershipTier === "premium" ? "Premium" : "Free"}
          </Tag>
          <span className="text-[13px] text-text-muted">
            {user?.membershipTier === "premium" ? "Thanks for being an early Premium tester." : "Premium is coming soon."}
          </span>
        </div>
        {user?.membershipTier !== "premium" && (
          <Link href="/pricing" className="text-[13px] text-green-bright underline">
            See what&apos;s included
          </Link>
        )}
      </div>

      <form action={updateProfile} className="flex flex-col gap-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={user?.name ?? ""} />
        </Field>
        <Field label="Your bike(s)" hint="Add more than one, separated by commas">
          <TextInput name="mainBike" defaultValue={user?.mainBike ?? ""} placeholder="e.g. Triumph Tiger 900, Yamaha MT-07" />
        </Field>
        {saved && <p className="text-[13px] text-green-bright">Saved.</p>}
        <Button type="submit" variant="primary" className="self-start">
          Save changes
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-4">
        <h2 className="text-[16px] text-text-primary">Appearance</h2>
        <p className="text-[13px] text-text-muted">Choose light or dark, or follow your phone&apos;s own setting.</p>
        <ThemeSelector />
      </div>

      <form action={changePassword} className="flex flex-col gap-3 border-t border-surface-raised pt-4">
        <h2 className="text-[16px] text-text-primary">{user?.passwordHash ? "Change password" : "Set a password"}</h2>
        {user?.passwordHash && (
          <Field label="Current password">
            <TextInput name="currentPassword" type="password" autoComplete="current-password" required />
          </Field>
        )}
        <Field label="New password" hint="At least 8 characters">
          <TextInput name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        {password === "changed" && <p className="text-[13px] text-green-bright">Password updated.</p>}
        {password === "wrong" && <p className="text-[13px] text-red-accent">That isn&apos;t your current password.</p>}
        {password === "short" && <p className="text-[13px] text-red-accent">Use at least 8 characters.</p>}
        <Button type="submit" variant="secondary" className="self-start">
          {user?.passwordHash ? "Change password" : "Set password"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-4">
        <h2 className="text-[16px] text-text-primary">Your data</h2>
        <p className="text-[13px] text-text-muted">Download a copy of your profile, ride diary, reviews, place tips, blog posts and saved rides.</p>
        <a href="/account/data-export">
          <Button type="button" variant="secondary" className="min-h-9 px-3 text-[13px]">
            Download my data
          </Button>
        </a>
      </div>

      <form action={signOutAction} className="border-t border-surface-raised pt-4">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-4">
        <h2 className="text-[16px] text-text-primary">Delete account</h2>
        <p className="text-[13px] text-text-muted">
          Permanently deletes your account, bike details, ride diary and photos, reviews, place tips, blog posts and saved rides. This can&apos;t be undone.
        </p>
        <form action={deleteAccount}>
          <DeleteAccountButton />
        </form>
      </div>
    </div>
  );
}
