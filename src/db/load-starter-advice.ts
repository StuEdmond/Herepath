/**
 * Loads three starter advice articles as DRAFTS (nothing goes public until you publish them in
 * Admin > Advice). Safe to re-run: an article is only added if its web address isn't already used.
 *
 *   npm run db:advice-starters              # add missing drafts
 *   npm run db:advice-starters -- --publish # add them already published
 *
 * These are general starting points, not expert guidance: read and edit them before publishing.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { adviceArticles } from "./schema";

const publish = process.argv.includes("--publish");

const STARTERS = [
  {
    slug: "pre-ride-checks-two-minute-walk-around",
    title: "Pre-ride checks: the two-minute walk-around",
    category: "maintenance",
    excerpt: "A quick routine that catches most problems before they catch you, using the T-CLOCS checklist.",
    body: `Most breakdowns and many crashes start with something you could have spotted in two minutes. Riders often remember the checklist as T-CLOCS. Walk around the bike in this order every time you set off, and it soon becomes automatic.

## T is for tyres and wheels

- Check the pressures when the tyres are cold, using the figures in your handbook.
- Look for cuts, bulges, nails and uneven wear. The legal minimum tread depth for a bike over 50cc is 1mm across three-quarters of the tyre, though many riders replace them sooner.
- Spin each wheel if you can and look for wobbles, dents and loose spokes.

## C is for controls

- Levers, throttle and pedals should move smoothly and return on their own.
- Check the brake and clutch lever play, and that cables aren't frayed.
- Turn the bars lock to lock: nothing should snag.

## L is for lights and electrics

- Test headlight (dipped and main beam), tail light, brake light (front and rear lever) and indicators.
- Check the horn and the battery terminals.

## O is for oil and other fluids

- Check engine oil, brake fluid and coolant levels, and look under the bike for drips.
- Make sure you have enough fuel for the ride you planned, plus some in hand.

## C is for chassis

- Chain: check tension and lubrication, or the belt or shaft for damage.
- Give the suspension a bounce and look at the fork seals for oil.
- Look over nuts and bolts, especially after a bumpy ride.

## S is for stands

- Make sure the side stand and centre stand spring back up and the kill switch cut-out works.

If something looks wrong, don't ride it: fix it, or get it looked at by a mechanic. Check your own bike's handbook for the exact figures and intervals.`,
  },
  {
    slug: "camping-by-motorcycle-what-to-pack",
    title: "Camping by motorcycle: what to pack",
    category: "camping",
    excerpt: "A packing list for a night or a week under canvas, when every kilo and every litre of luggage counts.",
    body: `Motorcycle camping is about carrying less, and carrying it well. Pack the heavy items low and close to the centre of the bike, keep what you need first (waterproofs, tea) at the top, and keep the load balanced side to side.

## The essentials

- A tent that packs small. Practise putting it up at home before you set off.
- A sleeping bag rated for the coldest night you might face, and a compact sleeping mat.
- A small stove, gas and something to cook in. Check that your campsite allows stoves.
- A head torch, with spare batteries.
- A dry bag or waterproof liner, so your sleeping gear stays dry whatever the weather.

## Worth the space

- A lightweight camping chair after a long day in the saddle.
- Earplugs and an eye mask if you're a light sleeper.
- A microfibre towel and a small wash kit.
- A padlock and cable to secure your gear.

## Bike-specific extras

- Bungee cords or luggage straps, and a spare. Check them at every stop.
- A puncture repair kit and a way to inflate a tyre.
- Something to put under the side stand on soft ground, such as a flattened drinks can or a small plate.

## Before you go

Book the campsite if it's busy, check it accepts motorcycles and small tents, and tell someone your route and when you'll arrive. Plan fuel stops, since rural areas can have long gaps between petrol stations.`,
  },
  {
    slug: "a-toolkit-for-the-road",
    title: "A toolkit for the road",
    category: "tools",
    excerpt: "What to carry so a minor problem doesn't end your ride, and what's better left to a mechanic.",
    body: `The tools under your seat are usually just enough to remove a wheel in a pinch. A little more thought gets you home from the most common problems. Start with what actually fits your bike, then add to it.

## Start with what fits your bike

- Use your handbook to find the sizes of the bolts and nuts you're most likely to need, and carry the right spanners, sockets and Allen keys.
- Add a small adjustable spanner and a pair of pliers.
- A multi-bit screwdriver covers screws, and a few spare fuses cover most electrical faults.

## Useful for the common problems

- Tyre pressure gauge and a small pump or CO2 inflator.
- A puncture repair kit suitable for your tyres (tubed or tubeless).
- Zip ties, insulating tape and a length of wire cover a surprising number of roadside repairs.
- Chain lube, and a rag to keep your hands clean.
- A torch, in case it gets dark before the repair is done.

## Carry these too

- A charged phone and a small power bank.
- Your breakdown cover details, saved on your phone.
- A simple first aid kit and a hi-vis vest.

## Know your limits

Tightening a loose bolt is a good roadside job. Brake work, and anything that affects steering or the frame, isn't. If in doubt, call your breakdown provider rather than risking it.`,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  for (const article of STARTERS) {
    const [existing] = await db.select({ id: adviceArticles.id }).from(adviceArticles).where(eq(adviceArticles.slug, article.slug));
    if (existing) {
      console.log(`Skipping "${article.title}" (already there)`);
      continue;
    }
    await db.insert(adviceArticles).values({
      ...article,
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
    });
    console.log(`Added "${article.title}" as ${publish ? "published" : "a draft"}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
