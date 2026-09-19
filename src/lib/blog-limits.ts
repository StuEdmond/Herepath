/** Limits and small helpers for rider blog posts (no database code, so forms can import them). */
export const BLOG_TITLE_MAX = 120;
export const BLOG_BODY_MIN = 80;
export const BLOG_BODY_MAX = 8000;
/** How many posts one rider can have waiting for review at once. */
export const BLOG_MAX_PENDING = 3;

/** A plain one-paragraph preview of a post's text for lists and share previews. */
export function excerptOf(body: string, max = 170): string {
  const flat = body
    .replace(/^##\s+/gm, "")
    .replace(/^-\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
