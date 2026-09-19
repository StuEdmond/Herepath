import { Field, TextInput, Textarea } from "@/components/admin/form-fields";

/**
 * The admin fields that keep a ride honest about how fresh it is: when the road was last checked, and any warning about it as it is
 * now. Used on the route, day ride and tour forms. The conditions note is dated automatically when it is added or changed.
 */
export function FreshnessFields({ lastVerifiedOn, conditionsNote }: { lastVerifiedOn?: string | null; conditionsNote?: string | null }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-3">
      <p className="text-[13px] text-text-muted">
        Shown to riders at the top of the page: when our team last checked the road, and any current warning. Riders can report problems, which
        arrive under Road reports.
      </p>
      <Field label="Last checked on" hint="The date someone last rode or checked this road. Leave empty if it hasn't been checked; the page then says so.">
        <TextInput name="lastVerifiedOn" type="date" defaultValue={lastVerifiedOn ?? ""} className="max-w-[12rem]" />
      </Field>
      <Field
        label="Current conditions note"
        hint="A warning about the road as it is now, such as a closure or roadworks. Shown in a highlighted box, dated with today when you add or change it. Clear it when the problem is over."
      >
        <Textarea name="conditionsNote" rows={2} defaultValue={conditionsNote ?? ""} />
      </Field>
    </div>
  );
}
