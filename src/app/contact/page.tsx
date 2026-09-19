import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Field, TextInput, Textarea } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { getContent } from "@/lib/site-content";
import { submitContactMessage } from "./actions";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const c = await getContent("contact");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">{c.title}</h1>
        <p className="mt-1 text-text-secondary">{c.intro}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4">
        <p className="text-[14px] text-text-secondary">Run a cafe, pub, hotel, campsite or other business for riders?</p>
        <Link href="/advertise">
          <Button type="button" variant="secondary" className="min-h-10 px-4 text-[14px]">
            Advertise with us
          </Button>
        </Link>
      </div>

      {sent === "1" ? (
        <div className="flex items-start gap-2 rounded-xl bg-surface p-5 text-[15px] text-text-secondary">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-bright" aria-hidden="true" />
          <p>{c.success}</p>
        </div>
      ) : (
        <form action={submitContactMessage} className="flex flex-col gap-3">
          <Field label="Your name">
            <TextInput name="name" required autoComplete="name" />
          </Field>
          <Field label="Email address">
            <TextInput name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Message">
            <Textarea name="message" rows={5} required placeholder="What's on your mind?" />
          </Field>
          <Button type="submit" variant="primary" className="self-start">
            Send message
          </Button>
        </form>
      )}
    </div>
  );
}
