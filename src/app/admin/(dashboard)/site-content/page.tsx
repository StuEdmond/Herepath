import Link from "next/link";
import { CONTENT_GROUPS, getContent } from "@/lib/site-content";
import { Field, TextInput, Textarea } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { ImageFileInput } from "@/components/ui/image-file-input";
import { saveSiteContent, resetSiteContent } from "./actions";

export default async function AdminSiteContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const contents = await Promise.all(CONTENT_GROUPS.map((g) => getContent(g.id)));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px]">Site content</h2>
        <p className="text-[13px] text-text-muted">
          Edit the wording and images on the public pages. Changes go live as soon as you save.
        </p>
      </div>

      {CONTENT_GROUPS.map((group, gi) => {
        const values = contents[gi];
        return (
          <details key={group.id} open={saved === group.id} className="rounded-xl bg-surface p-4">
            <summary className="cursor-pointer text-[16px] text-text-primary">{group.label}</summary>

            <div className="mt-3 flex flex-col gap-3">
              {saved === group.id && !error && <p className="text-[13px] text-green-bright">Saved.</p>}
              {saved === group.id && error && (
                <p className="text-[13px] text-red-accent">Your wording was saved, but the image could not be: {error}</p>
              )}
              <Link href={group.path} className="self-start text-[13px] text-green-bright underline">
                View page
              </Link>

              <form action={saveSiteContent.bind(null, group.id)} className="flex max-w-2xl flex-col gap-3">
                {group.fields.map((field) => {
                  const value = values[field.name];

                  if (field.type === "image") {
                    return (
                      <div key={field.name} className="flex flex-col gap-2 text-[13px] text-text-muted">
                        <span>{field.label}</span>
                        {value && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={value} alt="" className="h-32 w-full max-w-sm rounded-lg object-cover" />
                        )}
                        <ImageFileInput name={`file:${field.name}`} />
                        {value && (
                          <label className="flex items-center gap-1.5">
                            <input type="checkbox" name={`remove:${field.name}`} />
                            Remove this image
                          </label>
                        )}
                        {field.hint && <span className="text-[12px]">{field.hint}</span>}
                      </div>
                    );
                  }

                  return (
                    <Field key={field.name} label={field.label} hint={field.hint}>
                      {field.type === "textarea" ? (
                        <Textarea name={field.name} defaultValue={value} rows={field.default.length > 160 ? 5 : 3} />
                      ) : (
                        <TextInput name={field.name} defaultValue={value} />
                      )}
                    </Field>
                  );
                })}
                <Button type="submit" variant="primary" className="self-start">
                  Save {group.label.toLowerCase()}
                </Button>
              </form>

              <form action={resetSiteContent.bind(null, group.id)}>
                <Button type="submit" variant="ghost" className="min-h-9 px-3 text-[13px] text-red-accent">
                  Reset this page to the original wording and images
                </Button>
              </form>
            </div>
          </details>
        );
      })}
    </div>
  );
}
