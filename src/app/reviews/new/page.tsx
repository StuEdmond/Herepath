import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createReview } from "../actions";
import { Field, TextInput, Textarea, Select } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Write a review" };

const TARGET_LABELS: Record<string, string> = { route: "route", day_ride: "day ride", tour: "tour" };

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ targetType?: string; targetId?: string; name?: string; returnSlug?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/account/sign-in`);
  if (!params.targetType || !params.targetId || !params.returnSlug) redirect("/explore");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pt-8">
      <div>
        <h1 className="text-[22px]">Write a review</h1>
        <p className="text-text-secondary">
          {params.name ? <>Reviewing {params.name}</> : <>Reviewing this {TARGET_LABELS[params.targetType]}</>}
        </p>
      </div>
      <form action={createReview} className="flex flex-col gap-3">
        <input type="hidden" name="targetType" value={params.targetType} />
        <input type="hidden" name="targetId" value={params.targetId} />
        <input type="hidden" name="returnSlug" value={params.returnSlug} />

        <Field label="Rating">
          <Select name="rating" defaultValue="5" required>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Very good</option>
            <option value="3">3 — Good</option>
            <option value="2">2 — Fair</option>
            <option value="1">1 — Poor</option>
          </Select>
        </Field>
        <Field label="Bike ridden" hint="e.g. Triumph Tiger 900">
          <TextInput name="bikeRidden" />
        </Field>
        <Field label="Your review">
          <Textarea name="text" rows={4} placeholder="How was the road, the views, the stops along the way?" />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Post review
        </Button>
      </form>
    </div>
  );
}
