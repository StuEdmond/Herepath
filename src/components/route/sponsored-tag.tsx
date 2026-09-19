/** Marks a paid listing as advertising. Always shown wherever a sponsored place appears. */
export function SponsoredTag() {
  return (
    <span
      title="This is an advert: the business pays to be listed here"
      className="inline-flex items-center rounded-full border border-text-muted/50 px-2.5 py-0.5 text-[12px] font-medium uppercase tracking-wide text-text-secondary"
    >
      Sponsored
    </span>
  );
}
