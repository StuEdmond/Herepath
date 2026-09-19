/** The community guidelines, shown in the FAQ. Kept in one place so every mention says the same thing. */
export const GUIDELINES_PATH = "/faq#guidelines";

export const GUIDELINES_INTRO =
  "Herepath is a place for riders to share what they've found on the road. To keep it useful and friendly, we ask everyone who posts a blog post or a rider tip to follow these rules.";

export const GUIDELINE_RULES = [
  {
    heading: "Be decent",
    body: "Disagree with a road, a cafe or a route as strongly as you like, but don't insult, harass or threaten anyone. No hate speech or discrimination of any kind.",
  },
  {
    heading: "Keep it about riding",
    body: "Post ride reports, road reviews and stories. No adverts, spam, affiliate links or promotion of your own business. If you'd like to advertise with us, see the Advertise with us page.",
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
] as const;

export const HOW_POSTS_ARE_CHECKED = [
  "Every blog post is read by our team before it appears, and a post you edit is checked again. Anyone signed in can report a blog post or a rider tip they think breaks these rules. We may remove content, or decline to publish it, if it doesn't follow the guidelines, and we may close the accounts of riders who repeatedly break them.",
  "You can delete your own posts at any time.",
] as const;
