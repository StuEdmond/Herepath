import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Herepath handles your data and cookies.",
};

export default function PrivacyPage() {
  const deadCylinderUrl = process.env.NEXT_PUBLIC_DEAD_CYLINDER_URL;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pt-8 pb-16 text-[15px] text-text-secondary">
      <div>
        <h1 className="text-[28px] text-text-primary">Privacy policy</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Last updated 17 September 2026. This is a draft policy for the current build and will be reviewed
          properly before launch.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Who we are</h2>
        <p>
          Herepath is a UK motorcycle route guide, made by the team behind Dead Cylinder Co. This policy explains
          what data we collect when you use the site, and the choices you have over it.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">What we collect today</h2>
        <p>
          Herepath doesn&apos;t currently have rider accounts, so we don&apos;t collect any personal data through the
          site itself. Browsing the guide, searching for routes, and downloading GPX files doesn&apos;t require you to
          give us any information.
        </p>
        <p>
          Our hosting provider records standard web server logs for every request (IP address, browser type, pages
          visited) — this is normal infrastructure logging used only to keep the site secure and working, not for
          tracking individuals, and isn&apos;t linked to anything else.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Cookies</h2>
        <p>
          We use one essential cookie, to keep our admin team signed in to the content management area. It doesn&apos;t
          track you and isn&apos;t set for ordinary visitors.
        </p>
        <p>
          We don&apos;t currently use analytics, advertising or tracking cookies of any kind. If that changes, we&apos;ll
          ask for your consent first through the cookie banner, and you&apos;ll be able to decline anything that
          isn&apos;t strictly necessary to run the site.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">When accounts arrive</h2>
        <p>
          We&apos;re building rider accounts, a private ride diary, reviews and ride sharing. When those launch:
        </p>
        <ul className="list-inside list-disc pl-1">
          <li>Your ride diary is private by default — you choose what to share as a public review.</li>
          <li>Shared ride maps hide the first and last half mile, so they don&apos;t reveal where you live or keep your bike.</li>
          <li>Photos you upload have location data removed before they&apos;re shown publicly.</li>
          <li>You&apos;ll be able to download a copy of your data, or delete your account and everything tied to it, at any time.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Maps</h2>
        <p>
          Route maps use OpenStreetMap data. Map tiles are provided by a third-party tile service and loading them
          may share your IP address with that provider, in the same way loading any embedded map does.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Sponsored content</h2>
        <p>Any sponsored place listing is clearly labelled &ldquo;Sponsored&rdquo; wherever it appears.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Contact</h2>
        <p>
          Questions about this policy or your data can be sent to the contact details on our{" "}
          {deadCylinderUrl ? (
            <a href={deadCylinderUrl} className="text-green-bright underline hover:no-underline">
              Dead Cylinder Co.
            </a>
          ) : (
            <span>Dead Cylinder Co.</span>
          )}{" "}
          site.
        </p>
      </section>
    </div>
  );
}
