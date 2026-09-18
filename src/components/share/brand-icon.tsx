import { siApple, siFacebook, siGoogleplay, siInstagram, siTiktok, siX, siYoutube } from "simple-icons";

const BRANDS = {
  apple: { path: siApple.path, color: "currentColor" },
  googleplay: { path: siGoogleplay.path, color: `#${siGoogleplay.hex}` },
  facebook: { path: siFacebook.path, color: `#${siFacebook.hex}` },
  instagram: { path: siInstagram.path, color: `#${siInstagram.hex}` },
  youtube: { path: siYoutube.path, color: `#${siYoutube.hex}` },
  // Black in the brand set, so it would disappear on the dark theme — follow the text colour instead.
  x: { path: siX.path, color: "currentColor" },
  tiktok: { path: siTiktok.path, color: "currentColor" },
} as const;

export type Brand = keyof typeof BRANDS;

export function BrandIcon({ brand, className = "h-4 w-4" }: { brand: Brand; className?: string }) {
  const { path, color } = BRANDS[brand];
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className={className} fill={color}>
      <path d={path} />
    </svg>
  );
}
