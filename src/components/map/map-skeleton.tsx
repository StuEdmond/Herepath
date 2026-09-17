export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={className ?? "h-64 w-full rounded-lg"}
      style={{ background: "var(--surface-raised)" }}
      role="img"
      aria-label="Map loading"
    />
  );
}
