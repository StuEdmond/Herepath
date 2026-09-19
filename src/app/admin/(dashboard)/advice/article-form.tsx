import { Field, TextInput, Textarea, Select, FormRow, ImageUploadField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { ADVICE_CATEGORIES } from "@/lib/advice";

export interface ArticleDefaults {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  status: string;
}

export function ArticleForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: ArticleDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Title">
        <TextInput name="title" defaultValue={defaults?.title} required />
      </Field>

      <FormRow>
        <Field label="Category">
          <Select name="category" defaultValue={defaults?.category ?? "general"}>
            {ADVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" hint="Drafts are only visible here">
          <Select name="status" defaultValue={defaults?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
      </FormRow>

      <Field label="Short summary" hint="Shown on the article list and in link previews — a sentence or two">
        <Textarea name="excerpt" rows={2} defaultValue={defaults?.excerpt} />
      </Field>

      <Field label="Article text" hint="Leave a blank line between paragraphs. Start a line with “## ” for a heading. Start each line with “- ” for a bullet list.">
        <Textarea name="body" rows={18} defaultValue={defaults?.body} required />
      </Field>

      <ImageUploadField label="Cover image" fileName="coverImageFile" urlName="coverImage" defaultUrl={defaults?.coverImage} />

      {defaults && (
        <Field label="Web address ending" hint="Change only if you need to; a link already shared will stop working">
          <TextInput name="slug" defaultValue={defaults.slug} />
        </Field>
      )}

      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
