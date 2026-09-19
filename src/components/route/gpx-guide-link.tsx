import Link from "next/link";

/** Small pointer to the how-to page, shown beside GPX download buttons. */
export function GpxGuideLink({ className }: { className?: string }) {
  return (
    <Link href="/gpx-guide" className={className ?? "text-green-bright underline hover:no-underline"}>
      New to GPX files? See how to use one
    </Link>
  );
}
