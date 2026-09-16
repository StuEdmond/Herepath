import { db } from "@/db/client";
import { routes, regions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Field, TextInput, Textarea } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export async function CollectionForm({
  action,
  defaults,
  submitLabel,
  selectedRoutes,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: { name: string; description: string | null };
  submitLabel: string;
  selectedRoutes?: Map<string, number>;
}) {
  const routeRows = await db
    .select({ id: routes.id, name: routes.name, region: regions.name })
    .from(routes)
    .innerJoin(regions, eq(routes.regionId, regions.id))
    .orderBy(routes.name);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Name">
        <TextInput name="name" defaultValue={defaults?.name} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" defaultValue={defaults?.description ?? ""} />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] text-text-muted">Routes (check to include, number sets order)</legend>
        <div className="flex flex-col gap-1 rounded-lg bg-surface p-3">
          {routeRows.map((route, i) => (
            <label key={route.id} className="flex items-center gap-2 text-[14px] text-text-primary">
              <input type="checkbox" name={`include_${route.id}`} defaultChecked={selectedRoutes?.has(route.id)} />
              <input
                type="number"
                name={`position_${route.id}`}
                defaultValue={selectedRoutes?.get(route.id) ?? i}
                className="w-14 rounded border border-text-muted/40 bg-bg px-1 py-0.5 text-[13px]"
              />
              {route.name} <span className="text-text-muted">· {route.region}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" variant="primary" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
