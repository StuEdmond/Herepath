import { like } from "drizzle-orm";
import { db } from "@/db/client";
import { siteContent } from "@/db/schema";

export type ContentFieldType = "text" | "textarea" | "image";

export interface ContentField {
  name: string;
  label: string;
  type: ContentFieldType;
  default: string;
  hint?: string;
}

export interface ContentGroup {
  id: string;
  label: string;
  path: string;
  fields: ContentField[];
}

const text = (name: string, label: string, def: string, hint?: string): ContentField => ({ name, label, type: "text", default: def, hint });
const area = (name: string, label: string, def: string, hint?: string): ContentField => ({ name, label, type: "textarea", default: def, hint });
const image = (name: string, label: string, hint?: string): ContentField => ({ name, label, type: "image", default: "", hint });

const BENEFIT_DEFAULTS = [
  ["Curated routes, day rides & tours", "Hand-picked UK roads, from a quick blast to a multi-day crossing."],
  ["Honest difficulty ratings", "Real difficulty and bike-suitability ratings, not marketing spin."],
  ["GPX export & app hand-off", "Download a GPX file or open straight in Google Maps or Apple Maps."],
  ["Your ride diary", "Log every ride with photos, notes, weather and who you rode with."],
  ["Share your rides", "Branded share images for Instagram, X and Facebook, with a privacy safeguard built in."],
  ["Search, filter, map view", "Find a ride by region, difficulty, bike type, or a place name you already know."],
] as const;

const STEP_DEFAULTS = [
  ["Search & filter", "Find a route by region, difficulty or bike type."],
  ["Ride it your way", "Download the GPX or hand off to Google or Apple Maps."],
  ["Log & share", "Save it to your diary and share the ride if you want to."],
] as const;

const FAQ_DEFAULTS = [
  ["Is Herepath free to use?", "Yes. Browsing, searching, saving rides and keeping a ride diary are all free. We're planning an optional Premium tier — see the pricing page for what's coming."],
  ["Do I need an account?", "No account is needed to browse routes, day rides and tours. You'll need a free account to save rides, keep a diary, or leave a review."],
  ["How are difficulty and bike-suitability ratings decided?", "They're set by hand based on road surface, technicality and how exposed a route is to weather — not generated automatically."],
  ["Can I download a GPX file for my own sat-nav or app?", "Yes. Every route, day ride and tour page has a GPX download, plus direct hand-off buttons for Google Maps and Apple Maps."],
  ["Do you provide turn-by-turn navigation?", "No — Herepath is a guide first. We hand you off to the navigation app you already use rather than building our own."],
  ["Can I share my rides?", "Yes. Diary entries and public ride pages have a share button that generates a branded image for Instagram, X or Facebook, or you can just copy a link."],
  ["Is my ride data private?", "Shared route maps trim the first and last half mile so a ride doesn't reveal where you live or keep your bike. Only what you choose to share publicly is visible to others."],
  ['Why do some rides say "Sample content"?', "We're in beta. A handful of routes are illustrative until we've collected real GPX recordings from riders — those are clearly tagged so you know what you're looking at."],
  ["What's coming next?", "Real GPX-recorded routes replacing the remaining sample content, an optional Premium tier, and video ride recaps built from your diary."],
  ["Can I write for the Rider blog?", "Yes. Once you have an account, you can write a post from the Rider blog page or your Profile. Every post is checked by our team before it appears, and it needs to follow the community guidelines further down this page."],
  ["How do I report a post or a rider tip?", "Every rider tip and blog post has a “Report” link. Choose a reason and send it, and our team will take a look. You need to be signed in to report something."],
  ["Can my business advertise on Herepath?", "Yes — see the Advertise with us page. Sponsored listings are always clearly labelled, so riders can tell what's an advert."],
] as const;

export const FAQ_SLOTS = 15;

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "home",
    label: "Home page",
    path: "/",
    fields: [
      text("heroTitle", "Headline", "Ancient roads. Modern riders."),
      area("heroBody", "Intro paragraph", "Herepath curates the best motorcycling roads in the UK — honestly rated, GPX-ready, and handed off to the maps app you already trust."),
      text("heroPrimaryCta", "Main button", "Explore routes"),
      text("heroSecondaryCta", "Second button", "See what's free"),
      area("heroNote", "Small print under the buttons", "No credit card, browsing is free forever. We're in beta, so a few rides are illustrative sample content until real GPX recordings are uploaded."),
      image("heroImage", "Hero image", "Wide banner shown under the hero buttons. Leave empty to hide it."),
      text("heroImageAlt", "Hero image description", "", "Short description for screen readers."),
      ...BENEFIT_DEFAULTS.flatMap(([title, body], i) => [
        text(`benefit${i + 1}Title`, `Benefit ${i + 1} title`, title),
        area(`benefit${i + 1}Body`, `Benefit ${i + 1} text`, body),
      ]),
      image("featureImage", "Feature image", "Second image, shown between the benefit cards and “How it works”. Leave empty to hide it."),
      text("featureImageAlt", "Feature image description", ""),
      text("stepsHeading", "“How it works” heading", "How it works"),
      ...STEP_DEFAULTS.flatMap(([title, body], i) => [
        text(`step${i + 1}Title`, `Step ${i + 1} title`, title),
        area(`step${i + 1}Body`, `Step ${i + 1} text`, body),
      ]),
      text("finalHeading", "Closing heading", "Ready to find your next ride?"),
      text("finalPrimaryCta", "Closing main button", "Explore routes"),
      text("finalSecondaryCta", "Closing second button", "See pricing"),
    ],
  },
  {
    id: "pricing",
    label: "Pricing page",
    path: "/pricing",
    fields: [
      text("title", "Heading", "Free to explore. Premium coming soon."),
      text("subtitle", "Sub-heading", "No billing yet — Premium is on our roadmap, not live."),
      text("freeLabel", "Free plan name", "Free"),
      text("freePrice", "Free plan price", "£0"),
      text("freePriceNote", "Free plan price note", "forever"),
      area(
        "freeFeatures",
        "Free plan features",
        "Browse every route, day ride and tour\nSearch, filters and map view\nSave rides and keep a ride diary\nGPX export and Google/Apple Maps hand-off\nShare your rides",
        "One feature per line.",
      ),
      text("freeCta", "Free plan button", "Start exploring"),
      text("premiumLabel", "Premium plan name", "Premium · coming soon"),
      text("premiumPrice", "Premium plan price", "TBC"),
      area(
        "premiumFeatures",
        "Premium plan features",
        "Video ride recaps, built from your diary\nOffline-ready maps for weak-signal areas\nUnlimited cloud photo backup for your diary\nEarly access to new tours\nPriority support and feature requests",
        "One feature per line.",
      ),
      text("waitlistButton", "Waitlist button", "Notify me"),
      text("waitlistSuccess", "Waitlist confirmation", "You're on the list — we'll email you when Premium launches."),
    ],
  },
  {
    id: "faq",
    label: "FAQ page",
    path: "/faq",
    fields: [
      text("title", "Heading", "Frequently asked questions"),
      ...Array.from({ length: FAQ_SLOTS }, (_, i) => {
        const [q, a] = FAQ_DEFAULTS[i] ?? ["", ""];
        return [
          text(`q${i + 1}`, `Question ${i + 1}`, q, i >= FAQ_DEFAULTS.length ? "Spare slot — leave the question empty to hide it." : undefined),
          area(`a${i + 1}`, `Answer ${i + 1}`, a),
        ];
      }).flat(),
    ],
  },
  {
    id: "about",
    label: "About page",
    path: "/about",
    fields: [
      text("title", "Heading", "About Herepath"),
      text("tagline", "Tagline", "Ancient roads. Modern riders."),
      image("image", "Page image", "Shown under the tagline. Leave empty to hide it."),
      text("imageAlt", "Image description", ""),
      text("s1Heading", "Section 1 heading", "Where the name comes from"),
      area(
        "s1Body",
        "Section 1 text",
        "A herepath — pronounced “here-path” — was an Old English “army path”: a road used by King Alfred's forces across ninth-century Wessex, and relied on for generations afterwards by ordinary travellers making long journeys across the country.\n\nWe liked the idea of roads that outlast the reasons they were first built — the same spirit behind the passes and moorland roads on this site, most of them centuries old and still the best way to see Britain from a bike.",
        "Leave a blank line between paragraphs.",
      ),
      text("s2Heading", "Section 2 heading", "What Herepath is"),
      area(
        "s2Body",
        "Section 2 text",
        "Herepath is a guide first, an app second. We curate UK motorcycle routes, day rides and multi-day tours with honest difficulty and bike-suitability ratings, then hand you off to the navigation app you already use — Google Maps, Apple Maps, or a GPX file for your own device. We don't do turn-by-turn navigation ourselves.",
        "Leave a blank line between paragraphs.",
      ),
      text("s3Heading", "Section 3 heading", "Dead Cylinder Co."),
      text("s3Before", "Section 3 text before the link", "Herepath has its own identity but is made by the same people behind"),
      text("s3After", "Section 3 text after the link", ", a British motorcycle heritage apparel brand."),
    ],
  },
  {
    id: "advertise",
    label: "Advertise page",
    path: "/advertise",
    fields: [
      text("title", "Heading", "Advertise with Herepath"),
      area(
        "intro",
        "Intro",
        "Reach riders while they're planning where to eat, stay and camp. Herepath lists the cafes, pubs, hotels, B&Bs and campsites that riders on these roads actually use, and we're talking to a small number of local businesses first while we're in beta.",
      ),
      text("whoHeading", "“Who it's for” heading", "Who it's for"),
      area(
        "whoFor",
        "Who it's for",
        "Cafes, pubs and restaurants on popular routes\nHotels, B&Bs and campsites for overnight stops\nBike shops, garages and riding-gear retailers\nInsurance, breakdown cover and other rider services",
        "One per line.",
      ),
      text("howHeading", "“How it works” heading", "How it works"),
      area(
        "howBody",
        "How it works",
        "A sponsored listing appears alongside the other places on the relevant day ride and tour pages, with a clear “Sponsored” label so riders always know it's an advert.\n\nWe don't sell better reviews. Rider tips on your listing are written by real riders and never edited or removed because of advertising.\n\nTell us about your business and we'll reply by email with what's available and what it costs. There's no obligation.",
        "Leave a blank line between paragraphs.",
      ),
      text("formHeading", "Form heading", "Tell us about your business"),
      text("success", "Message after sending", "Thanks — we've got your enquiry and will be in touch by email."),
    ],
  },
  {
    id: "app",
    label: "Mobile app",
    path: "/",
    fields: [
      text("heading", "Heading", "Get the Herepath app"),
      text("body", "Text under the heading", "The Herepath app is coming soon to iPhone and Android."),
      text("appStoreUrl", "App Store link", "", "Paste the full link once the iPhone app is published. Leave empty to show “Coming soon”."),
      text("googlePlayUrl", "Google Play link", "", "Paste the full link once the Android app is published. Leave empty to show “Coming soon”."),
    ],
  },
  {
    id: "contact",
    label: "Contact page",
    path: "/contact",
    fields: [
      text("title", "Heading", "Contact us"),
      text("intro", "Intro", "Questions, feedback, or something not working right? We read every message."),
      text("success", "Message after sending", "Thanks — your message is in, and we'll get back to you by email."),
    ],
  },
];

export function findGroup(id: string): ContentGroup | undefined {
  return CONTENT_GROUPS.find((g) => g.id === id);
}

/** Current copy for a page: admin overrides where set, defaults everywhere else. */
export async function getContent(groupId: string): Promise<Record<string, string>> {
  const group = findGroup(groupId);
  if (!group) throw new Error(`Unknown content group: ${groupId}`);

  const rows = await db.select().from(siteContent).where(like(siteContent.key, `${groupId}.%`));
  const overrides = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(group.fields.map((f) => [f.name, overrides.get(`${groupId}.${f.name}`) ?? f.default]));
}

/** Splits a multi-line field into its non-empty lines. */
export function lines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Splits text on blank lines into paragraphs. */
export function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
