import { headers } from "next/headers";

/** True when the page is being viewed inside the Herepath mobile app (capacitor.config.ts tags its user agent). */
export async function isHerepathApp(): Promise<boolean> {
  const userAgent = (await headers()).get("user-agent") ?? "";
  return userAgent.includes("HerepathApp");
}
