export const ADVICE_CATEGORIES = [
  { value: "maintenance", label: "Pre-ride maintenance" },
  { value: "camping", label: "Camping essentials" },
  { value: "tools", label: "Tool kits" },
  { value: "gear", label: "Gear reviews" },
  { value: "general", label: "General advice" },
] as const;

export function categoryLabel(value: string): string {
  return ADVICE_CATEGORIES.find((c) => c.value === value)?.label ?? "General advice";
}

export type ArticleBlock =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

/**
 * Turns an article's plain text into blocks. Blank lines separate blocks; a block starting "## " is a
 * heading; a block where every line starts "- " is a bullet list; anything else is a paragraph.
 * There is no HTML or Markdown pass-through, so article text can never inject markup.
 */
export function parseArticleBody(body: string): ArticleBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): ArticleBlock => {
      if (block.startsWith("## ")) return { kind: "heading", text: block.slice(3).trim() };
      const lines = block.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) return { kind: "list", items: lines.map((l) => l.slice(2).trim()) };
      return { kind: "paragraph", text: block };
    });
}

export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 220));
}
