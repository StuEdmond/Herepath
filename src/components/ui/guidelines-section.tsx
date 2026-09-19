import Link from "next/link";
import { GUIDELINE_RULES, GUIDELINES_INTRO, HOW_POSTS_ARE_CHECKED } from "@/lib/guidelines";

/** The community guidelines, as a section of the FAQ page (linked to as /faq#guidelines). */
export function GuidelinesSection() {
  return (
    <section id="guidelines" className="mt-6 flex scroll-mt-24 flex-col gap-5 border-t border-surface-raised pt-8">
      <div>
        <h2 className="text-[24px]">Community guidelines</h2>
        <p className="mt-1 text-[15px] text-text-secondary">{GUIDELINES_INTRO}</p>
      </div>

      <div className="flex flex-col gap-4">
        {GUIDELINE_RULES.map((rule) => (
          <div key={rule.heading} className="flex flex-col gap-1">
            <h3 className="text-[17px] text-text-primary">{rule.heading}</h3>
            <p className="text-[15px] text-text-secondary">{rule.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] text-text-primary">How posts are checked</h3>
        {HOW_POSTS_ARE_CHECKED.map((paragraph) => (
          <p key={paragraph} className="text-[15px] text-text-secondary">
            {paragraph}
          </p>
        ))}
        <p className="text-[15px] text-text-secondary">
          To ask us about a decision, use the{" "}
          <Link href="/contact" className="text-green-bright underline">
            contact page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
