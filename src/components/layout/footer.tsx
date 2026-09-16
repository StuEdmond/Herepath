export function Footer() {
  const deadCylinderUrl = process.env.NEXT_PUBLIC_DEAD_CYLINDER_URL;

  return (
    <footer className="border-t border-surface-raised px-4 py-6 pb-24 text-[13px] text-text-muted md:pb-6 print:hidden">
      <p>
        Herepath, from{" "}
        {deadCylinderUrl ? (
          <a href={deadCylinderUrl} className="underline hover:text-text-secondary">
            Dead Cylinder Co.
          </a>
        ) : (
          <span>Dead Cylinder Co.</span>
        )}
      </p>
    </footer>
  );
}
