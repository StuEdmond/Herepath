import { parseArticleBody } from "@/lib/advice";

/**
 * Renders article or post text: blank lines separate paragraphs, "## " is a heading, "- " lines are a
 * list. Nothing is passed through as HTML, so whatever an author types can only ever appear as text.
 */
export function ArticleBody({ text }: { text: string }) {
  const blocks = parseArticleBody(text);

  return (
    <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-text-secondary">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2 key={i} className="mt-2 text-[22px] text-text-primary">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
