import type { Metadata } from "next";
import Link from "next/link";
import { NAV_APP_GUIDES } from "@/lib/nav-app-guides";

export const metadata: Metadata = {
  title: "Using a GPX file",
  description: "How to download a Herepath GPX file and use it in Google Maps or your sat-nav.",
};

const LINK = "text-green-bright underline hover:no-underline";

export default function GpxGuidePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pt-8 pb-16 text-[15px] text-text-secondary">
      <div>
        <h1 className="text-[28px] text-text-primary">Using a GPX file</h1>
        <p className="mt-1">How to get a Herepath route onto Google Maps, or into your sat-nav.</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">What is a GPX file?</h2>
        <p>
          A GPX file is a small file that holds the exact line of a route. Map apps and sat-navs read it to draw that line for you. On
          most phones, tapping a GPX file won&apos;t do anything by itself. You need to import it into an app, and this page shows how.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Step 1: Download the file</h2>
        <p>
          On any route, day ride or tour page, press <strong className="font-medium text-text-primary">Download GPX</strong> under the
          map. The file is saved to your Downloads folder on a computer, or to your phone&apos;s Downloads or Files app.
        </p>
        <p>
          A tour has a file for the whole tour, with each day as its own line, and a separate file for each day if you&apos;d rather
          do one day at a time.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Step 2: Import it into Google My Maps</h2>
        <p>
          Google Maps itself can&apos;t open a GPX file. Google My Maps can. It&apos;s a free Google tool that puts your own lines on a
          map, and it uses the same Google account as Google Maps. It&apos;s easiest to do this on a computer.
        </p>
        <ol className="list-inside list-decimal space-y-1 pl-1">
          <li>
            Go to{" "}
            <a href="https://www.google.com/mymaps" className={LINK} target="_blank" rel="noopener noreferrer">
              google.com/mymaps
            </a>{" "}
            and sign in with your Google account.
          </li>
          <li>
            Click <strong className="font-medium text-text-primary">Create a new map</strong>.
          </li>
          <li>
            In the panel on the left, under &ldquo;Untitled layer&rdquo;, click{" "}
            <strong className="font-medium text-text-primary">Import</strong>.
          </li>
          <li>
            Drag the .gpx file in, or choose <strong className="font-medium text-text-primary">Select a file from your device</strong>{" "}
            and pick it from your Downloads folder.
          </li>
          <li>The route appears on the map as a line. Click &ldquo;Untitled map&rdquo; to give the map a name you&apos;ll recognise.</li>
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Step 3: See it on your phone</h2>
        <ol className="list-inside list-decimal space-y-1 pl-1">
          <li>Open the Google Maps app, signed in with the same Google account.</li>
          <li>
            Tap <strong className="font-medium text-text-primary">Saved</strong> (on some versions, <strong className="font-medium text-text-primary">You</strong>),
            then <strong className="font-medium text-text-primary">Maps</strong>.
          </li>
          <li>Pick the map you just made. Your route shows as a line you can follow.</li>
        </ol>
        <p>Google sometimes moves these menus around. If you can&apos;t find your map, look for &ldquo;My Maps&rdquo; in Google Maps help.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] text-text-primary">Good to know</h2>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            <strong className="font-medium text-text-primary">It&apos;s a line to follow, not turn-by-turn directions.</strong> Google Maps
            shows an imported line but won&apos;t give voice directions along it.
          </li>
          <li>
            <strong className="font-medium text-text-primary">For voice directions,</strong> use the{" "}
            <strong className="font-medium text-text-primary">Open in Google Maps</strong> button on a route page. It hands Google a set of
            points along the route, so Google may choose its own roads between them. Or import the GPX file into a sat-nav or motorcycle
            route app, which follows the line exactly.
          </li>
          <li>
            <strong className="font-medium text-text-primary">Set everything up before you set off.</strong> Please don&apos;t use your
            phone while riding, and check the road and weather before you go.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] text-text-primary">Using it in Beeline, Garmin, TomTom or another sat-nav</h2>
        <p>
          Many motorcycle sat-navs and route apps can import GPX files, and the route follows our line exactly, because the file holds the whole
          track. Here is how for some of the most popular.
        </p>
        {NAV_APP_GUIDES.map((guide) => (
          <div key={guide.id} className="flex flex-col gap-1.5">
            <h3 className="text-[16px] text-text-primary">{guide.name}</h3>
            <p>{guide.intro}</p>
            <ol className="list-inside list-decimal space-y-1 pl-1">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {guide.note && <p className="text-[13px] text-text-muted">{guide.note}</p>}
            {guide.help.map((link) => (
              <a key={link.url} href={link.url} className={`${LINK} text-[13px]`} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        ))}
        <p>
          In the Herepath app on Android, the <strong className="font-medium text-text-primary">Send to a navigation app</strong> button under a
          ride&apos;s map opens your phone&apos;s share menu, so you can send the file straight to Beeline or Garmin Drive.
        </p>
        <p>
          Stuck? Send us a message through the{" "}
          <Link href="/contact" className={LINK}>
            contact page
          </Link>{" "}
          and tell us what device you&apos;re using.
        </p>
      </section>
    </div>
  );
}
