import { claimStripeEvent, handleStripeEvent, releaseStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe calls this whenever a subscription is created, changed or ends. It checks the call really came from Stripe (the signature
 * covers the exact bytes sent, so the body is read as text), then updates our copy of the rider's subscription.
 * Set it up in Stripe as: <site>/api/stripe/webhook, listening for checkout.session.completed and customer.subscription.*.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return Response.json({ error: "Not allowed." }, { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "Bad signature." }, { status: 400 });
  }

  // Stripe sometimes delivers the same event twice; the second time changes nothing.
  if (!(await claimStripeEvent(event))) return Response.json({ received: true, duplicate: true });

  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (error) {
    // Let Stripe try again, and let the retry through.
    await releaseStripeEvent(event.id);
    console.error("Stripe webhook failed", event.type, error instanceof Error ? error.message : error);
    return Response.json({ error: "Couldn't handle that event." }, { status: 500 });
  }
}
