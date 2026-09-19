import Link from "next/link";
import { Field, TextInput, Textarea, Select } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { ImageFileInput } from "@/components/ui/image-file-input";
import { BLOG_BODY_MAX, BLOG_BODY_MIN, BLOG_TITLE_MAX } from "@/lib/blog-limits";
import { rideTypeLabel, type RideOption } from "@/lib/blog";

export interface PostDefaults {
  title: string;
  body: string;
  coverImage: string | null;
  ride: string;
}

const ERRORS: Record<string, string> = {
  guidelines: "Please confirm you've read the community guidelines.",
  title: `Add a title of up to ${BLOG_TITLE_MAX} characters.`,
  body: `Your post needs to be between ${BLOG_BODY_MIN} and ${BLOG_BODY_MAX.toLocaleString("en-GB")} characters.`,
  limit: "You already have the maximum number of posts waiting for review. Please wait for a decision on one first.",
};

export function PostForm({
  action,
  rides,
  defaults,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  rides: RideOption[];
  defaults?: PostDefaults;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {error && ERRORS[error] && (
        <p role="alert" className="rounded-lg bg-red-tint-bg p-3 text-[14px] text-red-tint-text">
          {ERRORS[error]}
        </p>
      )}

      <Field label="Title">
        <TextInput name="title" defaultValue={defaults?.title} maxLength={BLOG_TITLE_MAX} required placeholder="e.g. A wet weekend in the Dales" />
      </Field>

      <Field label="Which Herepath ride is it about? (optional)" hint="Adds a link to that ride under your post">
        <Select name="ride" defaultValue={defaults?.ride ?? ""}>
          <option value="">Not about a specific ride</option>
          {rides.map((r) => (
            <option key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
              {r.name} ({rideTypeLabel(r.type)})
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Your post"
        hint="Leave a blank line between paragraphs. Start a line with “## ” for a heading, or start each line with “- ” for a bullet list."
      >
        <Textarea name="body" rows={14} defaultValue={defaults?.body} minLength={BLOG_BODY_MIN} maxLength={BLOG_BODY_MAX} required />
      </Field>

      <div className="flex flex-col gap-2 text-[13px] text-text-muted">
        <span>Cover photo (optional)</span>
        {defaults?.coverImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={defaults.coverImage} alt="" className="h-32 w-full max-w-xs rounded-lg object-cover" />
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="removeCover" />
              Remove this photo
            </label>
          </>
        )}
        <ImageFileInput name="coverImageFile" />
        <span className="text-[12px]">Only use photos you took yourself, or have permission to use.</span>
      </div>

      <label className="flex items-start gap-2 text-[14px] text-text-primary">
        <input type="checkbox" name="guidelines" required className="mt-1" />
        <span>
          I&apos;ve read the{" "}
          <Link href="/faq#guidelines" target="_blank" className="text-green-bright underline">
            community guidelines
          </Link>{" "}
          and this post follows them.
        </span>
      </label>

      <p className="text-[13px] text-text-muted">
        Every post is checked by our team before it appears. Your name from your profile is shown as the author. If you edit a post after
        it&apos;s published, it goes back for another check.
      </p>

      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
