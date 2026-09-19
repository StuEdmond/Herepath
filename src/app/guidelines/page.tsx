import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community guidelines",
  description: "What we ask of riders who post on Herepath, and how posts are checked.",
};

const RULES = [
  {
    heading: "Be decent",
    body: "Disagree with a road, a cafe or a route as strongly as you like, but don't insult, harass or threaten anyone. No hate speech or discrimination of any kind.",
  },
  {
    heading: "Keep it about riding",
    body: "Post ride reports, road reviews and stories. No adverts, spam, affiliate links or promotion of your own business. If you'd like to advertise with us, get in touch through the contact page.",
  },
  {
    heading: "Ride safely, and don't encourage otherwise",
    body: "Don't glorify dangerous, illegal or reckless riding, and don't share content that could put others at risk. Speed figures and stunts aren't what this community is for.",
  },
  {
    heading: "Respect people's privacy",
    body: "Don't share other people's personal details, number plates, or photos of identifiable people without their permission. Take care not to give away where you live or keep your bike.",
  },
  {
    heading: "Only post what's yours",
    body: "Write your own words and use only photos you took, or have permission to use. Don't copy other people's work.",
  },
  {
    heading: "Be honest",
    body: "Say what you found. Don't post fake or misleading reviews, and don't review a business you're connected to without saying so.",
  },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pt-8 pb-16">
      <div>
        <h1 className="text-[28px]">Community guidelines</h1>
        <p className="mt-1 text-text-secondary">Herepath is a place for riders to share what they&apos;ve found on the road. To keep it useful and friendly, we ask you to follow these rules.</p>
      </div>

      <div className="flex flex-col gap-5">
        {RULES.map((rule) => (
          <div key={rule.heading} className="flex flex-col gap-1">
            <h2 className="text-[18px] text-text-primary">{rule.heading}</h2>
            <p className="text-[15px] text-text-secondary">{rule.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-surface-raised pt-5">
        <h2 className="text-[18px] text-text-primary">How posts are checked</h2>
        <p className="text-[15px] text-text-secondary">
          Every blog post is read by our team before it appears, and a post you edit is checked again. Anyone signed in can report a blog post or a rider
          tip they think breaks these rules. We may remove content, or decline to publish it, if it doesn&apos;t follow the guidelines, and we may
          close the accounts of riders who repeatedly break them.
        </p>
        <p className="text-[15px] text-text-secondary">
          You can delete your own posts at any time. To ask us about a decision, use the{" "}
          <Link href="/contact" className="text-green-bright underline">
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
