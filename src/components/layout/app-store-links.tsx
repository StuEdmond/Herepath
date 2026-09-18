import { BrandIcon, type Brand } from "@/components/share/brand-icon";
import { getContent } from "@/lib/site-content";
import { isHerepathApp } from "@/lib/app-detect";
import { cn } from "@/lib/utils";

function StoreBadge({ brand, small, name, url }: { brand: Brand; small: string; name: string; url: string }) {
  const content = (
    <>
      <BrandIcon brand={brand} className="h-6 w-6 shrink-0" />
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">{url ? small : "Coming soon"}</span>
        <span className="text-[15px] font-medium text-text-primary">{name}</span>
      </span>
    </>
  );
  const base = "flex min-h-12 items-center gap-2.5 rounded-lg border border-text-muted/40 bg-surface px-4";

  if (!url) return <div className={cn(base, "opacity-70")}>{content}</div>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cn(base, "hover:bg-surface-raised")}>
      {content}
    </a>
  );
}

/** Links to the iPhone and Android apps. Addresses are edited in Admin → Site content; blank shows "Coming soon". */
export async function AppStoreBadges({ className }: { className?: string }) {
  if (await isHerepathApp()) return null;
  const c = await getContent("app");
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <StoreBadge brand="apple" small="Download on the" name="App Store" url={c.appStoreUrl} />
      <StoreBadge brand="googleplay" small="Get it on" name="Google Play" url={c.googlePlayUrl} />
    </div>
  );
}
