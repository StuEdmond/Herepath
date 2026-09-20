import Stripe from "stripe";

/** Stripe is set up when its secret key is present. Without it the site shows the Premium waitlist and never takes a payment. */
export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Stripe isn't set up: STRIPE_SECRET_KEY is missing.");
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });
  return client;
}

/** The site's own address, for the pages Stripe sends riders back to. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://herepath.vercel.app").replace(/\/$/, "");
}
