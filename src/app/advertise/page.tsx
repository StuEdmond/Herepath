import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Field, TextInput, Textarea, Select } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { BUSINESS_TYPES, ENQUIRY_MESSAGE_MAX } from "@/lib/advertising";
import { getContent, lines, paragraphs } from "@/lib/site-content";
import { submitAdvertisingEnquiry } from "./actions";

export const metadata: Metadata = {
  title: "Advertise with us",
  description: "Reach UK riders planning where to eat, stay and camp.",
};

const ERRORS: Record<string, string> = {
  missing: "Please fill in your business name, your name and a message.",
  email: "That email address doesn't look right.",
  type: "Please choose what kind of business you run.",
  limit: "You've sent several enquiries today already — we'll reply to those first.",
};

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  const c = await getContent("advertise");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-4 pt-8 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px]">{c.title}</h1>
        <p className="text-[16px] text-text-secondary">{c.intro}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px]">{c.whoHeading}</h2>
        <ul className="flex flex-col gap-2">
          {lines(c.whoFor).map((line) => (
            <li key={line} className="flex items-start gap-2 text-[15px] text-text-secondary">
              <Check className="mt-1 h-4 w-4 shrink-0 text-green-bright" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px]">{c.howHeading}</h2>
        {paragraphs(c.howBody).map((p) => (
          <p key={p} className="text-[15px] text-text-secondary">
            {p}
          </p>
        ))}
      </section>

      <section id="enquire" className="flex scroll-mt-24 flex-col gap-3 rounded-xl bg-surface p-5">
        <h2 className="text-[20px]">{c.formHeading}</h2>

        {sent === "1" ? (
          <p className="flex items-start gap-2 text-[15px] text-text-secondary">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-bright" aria-hidden="true" />
            {c.success}
          </p>
        ) : (
          <form action={submitAdvertisingEnquiry} className="flex flex-col gap-3">
            {error && ERRORS[error] && (
              <p role="alert" className="rounded-lg bg-red-tint-bg p-3 text-[14px] text-red-tint-text">
                {ERRORS[error]}
              </p>
            )}

            <Field label="Business name">
              <TextInput name="businessName" required maxLength={150} autoComplete="organization" />
            </Field>
            <Field label="Your name">
              <TextInput name="contactName" required maxLength={150} autoComplete="name" />
            </Field>
            <Field label="Email address">
              <TextInput name="email" type="email" required maxLength={200} autoComplete="email" />
            </Field>
            <Field label="Phone (optional)">
              <TextInput name="phone" type="tel" maxLength={40} autoComplete="tel" />
            </Field>
            <Field label="What kind of business is it?">
              <Select name="businessType" required defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Website (optional)">
              <TextInput name="website" inputMode="url" maxLength={200} placeholder="www.example.co.uk" autoComplete="url" />
            </Field>
            <Field label="What would you like to promote?" hint="A few lines about your business and where it is">
              <Textarea name="message" rows={5} required maxLength={ENQUIRY_MESSAGE_MAX} />
            </Field>

            {/* Hidden from people, not from bots: if it's filled in, the enquiry is discarded. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Leave this field empty
                <input type="text" name="company_site" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <Button type="submit" variant="primary" className="self-start">
              Send enquiry
            </Button>
            <p className="text-[12px] text-text-muted">
              We&apos;ll use these details only to reply to your enquiry. See our{" "}
              <Link href="/privacy" className="underline">
                privacy policy
              </Link>{" "}
              for how we handle data.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
