/** Shared by the "Report a problem" form, the server action that saves it, and the admin page that reads it. */

export const CONDITION_CATEGORIES = [
  { value: "closure", label: "The road is closed" },
  { value: "roadworks", label: "Roadworks or a diversion" },
  { value: "surface", label: "Surface problem (gravel, potholes, flooding)" },
  { value: "hazard", label: "Another hazard" },
  { value: "other", label: "Something else has changed" },
] as const;

export type ConditionCategory = (typeof CONDITION_CATEGORIES)[number]["value"];

export function conditionCategoryLabel(value: string): string {
  return CONDITION_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const CONDITION_NOTE_MIN_LENGTH = 10;
export const CONDITION_NOTE_MAX_LENGTH = 500;
/** How many reports one rider can send in a day, so a mistake or a prankster can't bury the real ones. */
export const MAX_CONDITION_REPORTS_PER_DAY = 5;

export type ConditionTargetType = "route" | "day_ride" | "tour";

export type ConditionReportResult = { done?: boolean; error?: string };

/** A date from an admin form field, or null unless it is a proper YYYY-MM-DD. */
export function readDateField(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(new Date(`${text}T00:00:00`).getTime()) ? text : null;
}

/** Today's date in the UK, as YYYY-MM-DD. */
export function todayInUk(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/**
 * The date to show beside a conditions note: today when the note is new or has been changed, the old date when the note is unchanged,
 * and none when there's no note. Saves admin remembering to date it.
 */
export function conditionsNoteDate(note: string | null, previous?: { note: string | null; on: string | null } | null): string | null {
  if (!note) return null;
  if (previous && previous.note === note && previous.on) return previous.on;
  return todayInUk();
}

/** "12 August 2026" from a date stored as YYYY-MM-DD. */
export function formatVerifiedDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
