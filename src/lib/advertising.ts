/** Shared by the Advertise with us form and the admin enquiries list (no database code). */
export const BUSINESS_TYPES = [
  { value: "food", label: "Cafe, pub or restaurant" },
  { value: "stay", label: "Hotel or B&B" },
  { value: "camping", label: "Campsite" },
  { value: "bike", label: "Bike shop or garage" },
  { value: "gear", label: "Riding gear or clothing" },
  { value: "services", label: "Insurance, breakdown cover or other rider services" },
  { value: "other", label: "Something else" },
] as const;

export function businessTypeLabel(value: string): string {
  return BUSINESS_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const ENQUIRY_MESSAGE_MAX = 1500;

/** Keeps only an http(s) web address (adding https:// if it was left off); anything else becomes null. */
export function cleanWebsite(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
