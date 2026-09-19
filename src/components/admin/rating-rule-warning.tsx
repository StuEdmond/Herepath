"use client";

import { useEffect, useRef, useState } from "react";

const BEGINNER_BIKES = ["cruiser", "125cc_and_new_riders"];

/**
 * A warning inside the route form when its ratings break the honesty rule: a route that is difficulty 4 or 5, or has a poor surface,
 * can't have Cruiser or 125cc marked as suited. The server refuses to save it, but only shows a generic error, so this says why first.
 */
export function RatingRuleWarning() {
  const ref = useRef<HTMLDivElement>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";
    const check = () => {
      const demanding = Number(value("difficulty")) >= 4 || value("surfaceQuality") === "poor";
      setBroken(demanding && BEGINNER_BIKES.some((type) => value(`suitability_${type}`) === "suited"));
    };
    form.addEventListener("change", check);
    const frame = requestAnimationFrame(check);
    return () => {
      form.removeEventListener("change", check);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref}>
      {broken && (
        <p role="alert" className="rounded-lg bg-red-tint-bg p-3 text-[13px] text-red-tint-text">
          This route is difficulty 4 or 5, or has a poor surface, so Cruiser and 125cc and new riders can&apos;t be marked as Suited. Change them to Caution (with a note
          saying why) or Not set, or this can&apos;t be saved.
        </p>
      )}
    </div>
  );
}
