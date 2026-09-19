export type ReportResult = { done?: boolean; error?: string };

export const REPORT_REASONS = [
  { value: "offensive", label: "Offensive or abusive" },
  { value: "spam", label: "Spam or advertising" },
  { value: "inaccurate", label: "Not accurate" },
  { value: "other", label: "Something else" },
] as const;

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
