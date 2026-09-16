/**
 * Sample seed data from Section 9 of the brief. All records are flagged
 * is_sample = true. Distances, times, ratings and stops are illustrative
 * and NOT verified — see the brief's own caveat at the top of Section 9.
 *
 * Re-runnable: wipes existing rows (child tables first) before inserting.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const {
  regions,
  landmarks,
  routeLandmarks,
  places,
  routes,
  routeBikeSuitability,
  routeFuelStops,
  dayRides,
  dayRideBikeSuitability,
  dayRideStages,
  dayRidePlacesToEat,
  tours,
  tourRegions,
  tourBikeSuitability,
  tourDays,
  tourOvernightStays,
  collections,
  collectionRoutes,
} = schema;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function main() {
  console.log("Wiping existing data...");
  await db.delete(collectionRoutes);
  await db.delete(collections);
  await db.delete(tourOvernightStays);
  await db.delete(tourDays);
  await db.delete(tourBikeSuitability);
  await db.delete(tourRegions);
  await db.delete(tours);
  await db.delete(dayRidePlacesToEat);
  await db.delete(dayRideStages);
  await db.delete(dayRideBikeSuitability);
  await db.delete(dayRides);
  await db.delete(routeFuelStops);
  await db.delete(routeBikeSuitability);
  await db.delete(routeLandmarks);
  await db.delete(routes);
  await db.delete(places);
  await db.delete(landmarks);
  await db.delete(regions);

  console.log("Seeding regions...");
  const regionRows = await db
    .insert(regions)
    .values([
      { name: "Peak District", slug: "peak-district", description: "Rolling moorland and gritstone edges within reach of several major cities." },
      { name: "Yorkshire Dales", slug: "yorkshire-dales", description: "Limestone dales, drystone walls and some of England's best-loved passes." },
      { name: "Lake District", slug: "lake-district", description: "Cumbria's fells and passes, including the steepest roads in England." },
      { name: "Northern England", slug: "northern-england", description: "The Pennines and Northumberland, remote and lightly trafficked." },
      { name: "Wales", slug: "wales", description: "Snowdonia and the Welsh borders, with sweeping passes and coast roads." },
      { name: "Scotland", slug: "scotland", description: "The Highlands and islands, home to some of Europe's great mountain roads." },
      { name: "South West", slug: "south-west", description: "Somerset, Devon and Cornwall, from Mendip gorges to Atlantic coast roads." },
    ])
    .returning();

  const regionBySlug = Object.fromEntries(regionRows.map((r) => [r.slug, r]));

  console.log("Seeding places (fuel, food, accommodation)...");
  const placeRows = await db
    .insert(places)
    .values([
      { name: "Example fuel stop, Glossop", type: "fuel", address: "Glossop, Derbyshire", tags: [] },
      { name: "Example cafe, Castleton", type: "cafe", address: "Castleton, Derbyshire", tags: ["bike_parking", "hot_food"], priceBand: 2, shortDescription: "Casual cafe on the main street, popular with riders stopping in Castleton." },
      { name: "Example fuel stop, Buxton", type: "fuel", address: "Buxton, Derbyshire", tags: [] },
      { name: "Example hotel, Hebden Bridge", type: "hotel", address: "Hebden Bridge, West Yorkshire", tags: ["secure_parking", "drying_room"], priceBand: 2, shortDescription: "Independent hotel in the town centre with off-street parking." },
      { name: "Example B&B, Hebden Bridge", type: "b_and_b", address: "Hebden Bridge, West Yorkshire", tags: ["hard_standing", "pub_nearby"], priceBand: 1, shortDescription: "Small B&B a short walk from the town centre." },
      { name: "Example hotel, Hawes", type: "hotel", address: "Hawes, North Yorkshire", tags: ["secure_parking", "drying_room"], priceBand: 2, shortDescription: "Traditional coaching inn in the centre of Hawes." },
      { name: "Example campsite, Hawes", type: "campsite", address: "Hawes, North Yorkshire", tags: ["hard_standing"], priceBand: 1, shortDescription: "Basic campsite with hard standing pitches, popular with touring riders." },
      { name: "Example B&B, Alston", type: "b_and_b", address: "Alston, Cumbria", tags: ["drying_room", "pub_nearby"], priceBand: 1, shortDescription: "Family-run B&B in England's highest market town." },
      { name: "Example campsite, Alston", type: "campsite", address: "Alston, Cumbria", tags: ["hard_standing"], priceBand: 1, shortDescription: "Small campsite on the edge of town." },
    ])
    .returning();

  const placeByName = Object.fromEntries(placeRows.map((p) => [p.name, p]));

  console.log("Seeding routes...");
  const allBikeTypes = schema.bikeTypeEnum.enumValues;

  const routeSeeds = [
    {
      name: "Snake Pass (A57)",
      slug: "snake-pass-a57",
      regionSlug: "peak-district",
      introSell:
        "A57 sweeps over the top of the Dark Peak between Glossop and Ladybower, with wide, flowing bends and big moorland views the whole way across.",
      introCharacter:
        "Fast and exposed rather than technical — the surface is generally good, but the moor is prone to low cloud, standing water and sudden crosswinds, and it closes in winter snow more often than you'd expect.",
      distanceMiles: "24",
      ridingTimeMinutes: 50,
      difficulty: 3,
      surfaceQuality: "mixed" as const,
      hazards: "Standing water after rain, sheep on the verges, low cloud reducing visibility near the summit.",
      bestTime: "Spring to autumn, avoid low winter sun heading east in the afternoon.",
      stopOffNote: "Ladybower Reservoir has a large lay-by and viewpoint about a third of the way along.",
      startPoint: { lat: 53.4443, lng: -1.9497, label: "Glossop" },
      endPoint: { lat: 53.403, lng: -1.688, label: "Ladybower Reservoir" },
      landmarks: [
        { name: "Ladybower Reservoir", slug: "ladybower-reservoir", type: "reservoir" as const, lat: "53.403000", lng: "-1.688000" },
        { name: "Dark Peak moors", slug: "dark-peak-moors", type: "viewpoint" as const, lat: "53.450000", lng: "-1.750000" },
      ],
      suitedTypes: ["sports", "naked_and_roadster", "adventure"] as const,
      cautionTypes: ["touring", "cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Wide, flowing bends suit anything with ground clearance and decent brakes.",
      cautionNote: "Long and exposed for a small-capacity bike; heavy tourers will feel the crosswinds near the top.",
      fuelPlace: "Example fuel stop, Glossop",
      fuelMile: "0",
    },
    {
      name: "Winnats Pass",
      slug: "winnats-pass",
      regionSlug: "peak-district",
      introSell:
        "A short, dramatic climb through a limestone gorge just outside Castleton, with steep rock walls closing in on both sides.",
      introCharacter:
        "Only six miles but a proper workout — the gradient is steep and sustained, the bends tighten as you climb, and it gets busy with walkers and tourist traffic in summer.",
      distanceMiles: "6",
      ridingTimeMinutes: 20,
      difficulty: 4,
      surfaceQuality: "mixed" as const,
      hazards: "Steep gradient, tight bends, walkers and slow-moving tourist traffic in summer.",
      bestTime: "Early morning or out of season, to avoid tourist traffic.",
      stopOffNote: "Peveril Castle overlooks Castleton at the foot of the pass.",
      startPoint: { lat: 53.3423, lng: -1.7735, label: "Castleton" },
      endPoint: { lat: 53.3378, lng: -1.7838, label: "Winnats Pass summit" },
      landmarks: [
        { name: "Winnats Pass", slug: "winnats-pass-landmark", type: "pass" as const, lat: "53.343000", lng: "-1.774000" },
        { name: "Peveril Castle", slug: "peveril-castle", type: "castle" as const, lat: "53.342300", lng: "-1.773500" },
      ],
      suitedTypes: ["naked_and_roadster", "adventure"] as const,
      cautionTypes: ["sports", "touring", "cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Upright bikes with good low-speed control make the steep hairpins easy work.",
      cautionNote: "Low-slung sports bikes can ground out on the steepest section; heavy tourers and cruisers struggle with the gradient at low speed.",
      fuelPlace: null,
      fuelMile: null,
    },
    {
      name: "Cat and Fiddle (A537)",
      slug: "cat-and-fiddle-a537",
      regionSlug: "peak-district",
      introSell:
        "One of the best-known biking roads in England, linking Buxton and Macclesfield over open moorland with fast, well-sighted bends.",
      introCharacter:
        "Good surface and generous sightlines make this a genuinely fast road, which is exactly why it demands respect — it has a reputation for high-speed accidents, so ride within what you can see.",
      distanceMiles: "12",
      ridingTimeMinutes: 22,
      difficulty: 3,
      surfaceQuality: "good" as const,
      hazards: "High closing speeds, occasional gravel blown onto the road from the verges.",
      bestTime: "Weekday mornings; weekends attract heavy biker traffic.",
      stopOffNote: "The Cat and Fiddle Inn sits at the summit, one of the highest pubs in England.",
      startPoint: { lat: 53.2596, lng: -1.9142, label: "Buxton" },
      endPoint: { lat: 53.2226, lng: -2.0796, label: "Macclesfield" },
      landmarks: [{ name: "Cat and Fiddle", slug: "cat-and-fiddle-landmark", type: "pass" as const, lat: "53.226000", lng: "-1.929000" }],
      suitedTypes: ["sports", "naked_and_roadster", "adventure", "touring"] as const,
      cautionTypes: ["cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Fast, well-sighted bends reward confident cornering on almost anything road-going.",
      cautionNote: "High average speeds from other traffic make this an uncomfortable road to learn on.",
      fuelPlace: "Example fuel stop, Buxton",
      fuelMile: "0",
    },
    {
      name: "Buttertubs Pass",
      slug: "buttertubs-pass",
      regionSlug: "yorkshire-dales",
      introSell:
        "A classic Dales climb between Wensleydale and Swaledale, named for the limestone potholes near the summit, with some of the best views in the Dales.",
      introCharacter:
        "Narrow and exposed with a number of blind crests — hugely rewarding in good weather, but the moor-top section catches wind and low cloud with little warning.",
      distanceMiles: "6",
      ridingTimeMinutes: 18,
      difficulty: 4,
      surfaceQuality: "mixed" as const,
      hazards: "Blind crests, sheep on the road, narrow passing places.",
      bestTime: "Clear days only — the summit is often in cloud when the valleys are fine.",
      stopOffNote: "Hardraw Force, England's highest single-drop waterfall, is a short detour near Hawes.",
      startPoint: { lat: 54.3235, lng: -2.2179, label: "Hawes" },
      endPoint: { lat: 54.3684, lng: -2.2679, label: "Thwaite" },
      landmarks: [
        { name: "Buttertubs", slug: "buttertubs-landmark", type: "pass" as const, lat: "54.315000", lng: "-2.264000" },
        { name: "Hardraw Force", slug: "hardraw-force", type: "other" as const, lat: "54.323000", lng: "-2.218000" },
      ],
      suitedTypes: ["naked_and_roadster", "adventure", "sports"] as const,
      cautionTypes: ["touring", "cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Light, agile bikes suit the narrow, twisting road well.",
      cautionNote: "Narrow passing places make wide tourers and cruisers hard work when traffic is coming the other way.",
      fuelPlace: null,
      fuelMile: null,
    },
    {
      name: "Hardknott and Wrynose",
      slug: "hardknott-and-wrynose",
      regionSlug: "lake-district",
      introSell:
        "England's steepest road pair, linking Eskdale to the Duddon Valley over two brutal climbs with hairpins stacked one above another.",
      introCharacter:
        "Genuinely demanding — gradients over 30% in places, single-track with passing places, and a rough surface that catches out anyone expecting a normal mountain road. Immensely rewarding for experienced riders, best avoided by anyone else.",
      distanceMiles: "13",
      ridingTimeMinutes: 45,
      difficulty: 5,
      surfaceQuality: "poor" as const,
      hazards: "Gradients over 30%, hairpins, single-track road, poor surface, low-range gearing recommended.",
      bestTime: "Dry daylight only — never attempt in ice, snow or fading light.",
      stopOffNote: "Hardknott Roman Fort sits just below the summit on the Eskdale side.",
      startPoint: { lat: 54.4023, lng: -3.2027, label: "Hardknott Roman Fort" },
      endPoint: { lat: 54.4021, lng: -3.1103, label: "Cockley Beck" },
      landmarks: [
        { name: "Hardknott Pass", slug: "hardknott-pass", type: "pass" as const, lat: "54.399000", lng: "-3.205000" },
        { name: "Hardknott Roman Fort", slug: "hardknott-roman-fort", type: "other" as const, lat: "54.402300", lng: "-3.202700" },
      ],
      suitedTypes: ["adventure", "naked_and_roadster"] as const,
      cautionTypes: ["sports", "touring", "cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Adventure bikes with good low-speed control and torque handle the gradient and loose surface best.",
      cautionNote: "Low ground clearance, high weight or limited low-speed control will all make this pass genuinely hazardous.",
      fuelPlace: null,
      fuelMile: null,
    },
    {
      name: "Horseshoe Pass",
      slug: "horseshoe-pass",
      regionSlug: "wales",
      introSell:
        "A dramatic horseshoe-shaped climb above Llangollen, with wide, well-surfaced bends that make it approachable for newer riders while still looking spectacular.",
      introCharacter:
        "One of the friendlier mountain passes in Wales — the road is wide and the surface good, though it still gets busy with cyclists and tourist traffic on summer weekends.",
      distanceMiles: "8",
      ridingTimeMinutes: 18,
      difficulty: 2,
      surfaceQuality: "good" as const,
      hazards: "Cyclists on summer weekends, occasional loose gravel near the summit car park.",
      bestTime: "Any time in good weather; quieter on weekday mornings.",
      stopOffNote: "Valle Crucis Abbey ruins sit just off the road at the foot of the pass.",
      startPoint: { lat: 52.9744, lng: -3.1697, label: "Llangollen" },
      endPoint: { lat: 53.0225, lng: -3.1866, label: "Llandegla" },
      landmarks: [
        { name: "Horseshoe Pass", slug: "horseshoe-pass-landmark", type: "pass" as const, lat: "52.994500", lng: "-3.200000" },
        { name: "Valle Crucis Abbey", slug: "valle-crucis-abbey", type: "other" as const, lat: "52.998200", lng: "-3.166700" },
      ],
      suitedTypes: allBikeTypes,
      cautionTypes: [] as const,
      suitedNote: "Wide, well-surfaced bends make this approachable on anything, including a first big road on a 125.",
      fuelPlace: null,
      fuelMile: null,
    },
    {
      name: "Bealach na Ba",
      slug: "bealach-na-ba",
      regionSlug: "scotland",
      introSell:
        "The highest road climb in Scotland, switchbacking up from Applecross to a wild, exposed summit with views to Skye on a clear day.",
      introCharacter:
        "A single-track road with passing places, hairpins as tight as anything in the Alps, and weather that changes fast at altitude — magnificent, but not a road to underestimate.",
      distanceMiles: "11",
      ridingTimeMinutes: 35,
      difficulty: 5,
      surfaceQuality: "mixed" as const,
      hazards: "Single-track with passing places, tight hairpins, sudden weather changes, closed in snow.",
      bestTime: "Late spring to early autumn, checking the forecast for the summit specifically.",
      stopOffNote: "The summit car park has sweeping views over to Skye and Raasay in clear weather.",
      startPoint: { lat: 57.4167, lng: -5.6167, label: "Applecross" },
      endPoint: { lat: 57.4595, lng: -5.5119, label: "Tornapress" },
      landmarks: [{ name: "Applecross Pass", slug: "applecross-pass", type: "pass" as const, lat: "57.417000", lng: "-5.680000" }],
      suitedTypes: ["adventure", "naked_and_roadster"] as const,
      cautionTypes: ["sports", "touring", "cruiser", "125cc_and_new_riders"] as const,
      suitedNote: "Confident low-speed handling and good brakes matter more here than outright power.",
      cautionNote: "Single-track hairpins at altitude are unforgiving on a heavy or low-clearance bike.",
      fuelPlace: null,
      fuelMile: null,
    },
    {
      name: "Cheddar Gorge",
      slug: "cheddar-gorge",
      regionSlug: "south-west",
      introSell:
        "A dramatic limestone gorge through the Mendip Hills, with towering rock faces either side of a smooth, well-surfaced road.",
      introCharacter:
        "Short and easy compared with the Peak or Lake District passes, but no less scenic — tourist traffic and cyclists are the main thing to watch for rather than the road itself.",
      distanceMiles: "10",
      ridingTimeMinutes: 20,
      difficulty: 2,
      surfaceQuality: "good" as const,
      hazards: "Heavy tourist traffic and cyclists in summer, occasional rockfall debris.",
      bestTime: "Weekday mornings; summer weekends are very busy.",
      stopOffNote: "Cheddar village at the foot of the gorge has cafes and the show caves.",
      startPoint: { lat: 51.2799, lng: -2.7658, label: "Cheddar" },
      endPoint: { lat: 51.2427, lng: -2.7213, label: "Priddy" },
      landmarks: [
        { name: "Cheddar Gorge", slug: "cheddar-gorge-landmark", type: "viewpoint" as const, lat: "51.281000", lng: "-2.766000" },
        { name: "Mendip Hills", slug: "mendip-hills", type: "viewpoint" as const, lat: "51.280000", lng: "-2.650000" },
      ],
      suitedTypes: allBikeTypes,
      cautionTypes: [] as const,
      suitedNote: "A smooth, gentle climb that suits any bike, including a first ride on a 125.",
      fuelPlace: null,
      fuelMile: null,
    },
  ];

  const routeByName: Record<string, typeof routes.$inferSelect> = {};

  for (const seed of routeSeeds) {
    const [route] = await db
      .insert(routes)
      .values({
        name: seed.name,
        slug: seed.slug,
        regionId: regionBySlug[seed.regionSlug].id,
        introSell: seed.introSell,
        introCharacter: seed.introCharacter,
        distanceMiles: seed.distanceMiles,
        ridingTimeMinutes: seed.ridingTimeMinutes,
        difficulty: seed.difficulty,
        surfaceQuality: seed.surfaceQuality,
        hazards: seed.hazards,
        bestTime: seed.bestTime,
        stopOffNote: seed.stopOffNote,
        startPoint: seed.startPoint,
        endPoint: seed.endPoint,
        geometry: {
          type: "LineString",
          coordinates: [
            [seed.startPoint.lng, seed.startPoint.lat],
            [seed.endPoint.lng, seed.endPoint.lat],
          ],
        },
        isSample: true,
        status: "published",
      })
      .returning();

    routeByName[seed.name] = route;

    const landmarkRows = await db
      .insert(landmarks)
      .values(
        seed.landmarks.map((l) => ({
          name: l.name,
          slug: l.slug,
          type: l.type,
          lat: l.lat,
          lng: l.lng,
          regionId: regionBySlug[seed.regionSlug].id,
        })),
      )
      .returning();

    if (landmarkRows.length > 0) {
      await db.insert(routeLandmarks).values(landmarkRows.map((l) => ({ routeId: route.id, landmarkId: l.id })));
    }

    const suitabilityValues = [
      ...seed.suitedTypes.map((bikeType) => ({
        routeId: route.id,
        bikeType,
        level: "suited" as const,
        note: seed.suitedNote,
      })),
      ...seed.cautionTypes.map((bikeType) => ({
        routeId: route.id,
        bikeType,
        level: "caution" as const,
        note: seed.cautionNote ?? null,
      })),
    ];
    if (suitabilityValues.length > 0) {
      await db.insert(routeBikeSuitability).values(suitabilityValues);
    }

    if (seed.fuelPlace) {
      await db.insert(routeFuelStops).values({
        routeId: route.id,
        placeId: placeByName[seed.fuelPlace].id,
        mileMarker: seed.fuelMile!,
      });
    }
  }

  console.log("Seeding day rides...");

  // Dark Peak loop — full stage breakdown given in the brief (Section 9).
  const [darkPeakLoop] = await db
    .insert(dayRides)
    .values({
      name: "Dark Peak loop",
      slug: "dark-peak-loop",
      regionId: regionBySlug["peak-district"].id,
      introSell:
        "A full day out of Glossop taking in three of the Peak District's best-known roads: Snake Pass, Winnats Pass and the Cat and Fiddle.",
      introCharacter:
        "A long day with a genuine mix of riding — fast open moorland, a steep technical gorge climb, and a famous fast A-road — so pace yourself and fuel up before you start.",
      startLocation: "Glossop",
      finishLocation: "Glossop",
      isLoop: true,
      totalDistanceMiles: "95",
      ridingTimeMinutes: 180,
      fullDayTimeEstimate: "5 to 6 hours",
      bestTime: "Spring to autumn, starting early to beat weekend tourist traffic.",
      parkingNote: "Free on-street parking is available around Glossop town centre.",
      isSample: true,
      status: "published",
    })
    .returning();

  await db.insert(dayRideBikeSuitability).values([
    { dayRideId: darkPeakLoop.id, bikeType: "naked_and_roadster", level: "suited", note: "Suits the mix of fast moorland and technical gorge sections well." },
    { dayRideId: darkPeakLoop.id, bikeType: "adventure", level: "suited", note: "Suits the mix of fast moorland and technical gorge sections well." },
    { dayRideId: darkPeakLoop.id, bikeType: "sports", level: "suited", note: "Fine throughout, though Winnats Pass wants a careful line." },
    { dayRideId: darkPeakLoop.id, bikeType: "125cc_and_new_riders", level: "caution", note: "Winnats Pass's gradient is a step up for a new rider." },
  ]);

  await db.insert(dayRideStages).values([
    { dayRideId: darkPeakLoop.id, position: 1, kind: "start", location: "Glossop", note: "Fuel up in town before you set off." },
    { dayRideId: darkPeakLoop.id, position: 2, kind: "route", routeId: routeByName["Snake Pass (A57)"].id, fromMile: "0", toMile: "24" },
    { dayRideId: darkPeakLoop.id, position: 3, kind: "link", description: "Via Hope Valley", fromMile: "24", toMile: "34" },
    { dayRideId: darkPeakLoop.id, position: 4, kind: "stop", placeId: placeByName["Example cafe, Castleton"].id, mile: "34", stopType: "lunch" },
    { dayRideId: darkPeakLoop.id, position: 5, kind: "route", routeId: routeByName["Winnats Pass"].id, fromMile: "34", toMile: "40" },
    { dayRideId: darkPeakLoop.id, position: 6, kind: "link", description: "Towards Buxton", fromMile: "40", toMile: "55" },
    { dayRideId: darkPeakLoop.id, position: 7, kind: "stop", placeId: placeByName["Example fuel stop, Buxton"].id, mile: "55", stopType: "fuel" },
    { dayRideId: darkPeakLoop.id, position: 8, kind: "route", routeId: routeByName["Cat and Fiddle (A537)"].id, fromMile: "55", toMile: "67" },
    { dayRideId: darkPeakLoop.id, position: 9, kind: "link", description: "Return to Glossop via Macclesfield and Marple", fromMile: "67", toMile: "95" },
    { dayRideId: darkPeakLoop.id, position: 10, kind: "finish", location: "Glossop", note: "End of the Dark Peak loop." },
  ]);

  await db.insert(dayRidePlacesToEat).values([
    { dayRideId: darkPeakLoop.id, placeId: placeByName["Example cafe, Castleton"].id, isSuggestedLunch: true },
  ]);

  // Dales viaduct run — brief only names the one included route (Buttertubs Pass).
  const [dalesViaductRun] = await db
    .insert(dayRides)
    .values({
      name: "Dales viaduct run",
      slug: "dales-viaduct-run",
      regionId: regionBySlug["yorkshire-dales"].id,
      introSell:
        "A loop out of Hawes over Buttertubs Pass and back through Wensleydale, taking in some of the best viaducts and drystone-wall scenery in the Dales.",
      introCharacter:
        "Most of the day is easy, well-surfaced touring roads, with Buttertubs itself as the one genuinely demanding climb — save your concentration for that stretch.",
      startLocation: "Hawes",
      finishLocation: "Hawes",
      isLoop: true,
      totalDistanceMiles: "110",
      ridingTimeMinutes: 200,
      fullDayTimeEstimate: "5 to 6 hours",
      bestTime: "Clear days, since the moor tops catch low cloud.",
      parkingNote: "Public car park in Hawes town centre.",
      isSample: true,
      status: "published",
    })
    .returning();

  await db.insert(dayRideBikeSuitability).values([
    { dayRideId: dalesViaductRun.id, bikeType: "naked_and_roadster", level: "suited", note: "Comfortable all-round choice for the Dales' mix of open and narrow roads." },
    { dayRideId: dalesViaductRun.id, bikeType: "adventure", level: "suited", note: "Comfortable all-round choice for the Dales' mix of open and narrow roads." },
    { dayRideId: dalesViaductRun.id, bikeType: "touring", level: "caution", note: "Buttertubs' narrow passing places are tight on a wide tourer." },
  ]);

  await db.insert(dayRideStages).values([
    { dayRideId: dalesViaductRun.id, position: 1, kind: "start", location: "Hawes", note: "Fuel up before heading out." },
    { dayRideId: dalesViaductRun.id, position: 2, kind: "route", routeId: routeByName["Buttertubs Pass"].id, fromMile: "0", toMile: "6" },
    { dayRideId: dalesViaductRun.id, position: 3, kind: "link", description: "Loop back via Swaledale and Wensleydale", fromMile: "6", toMile: "110" },
    { dayRideId: dalesViaductRun.id, position: 4, kind: "finish", location: "Hawes", note: "End of the Dales viaduct run." },
  ]);

  // Snowdonia day ride and Atlantic Highway — brief marks these "link routes only" in the sample.
  const [snowdoniaDayRide] = await db
    .insert(dayRides)
    .values({
      name: "Snowdonia day ride",
      slug: "snowdonia-day-ride",
      regionId: regionBySlug["wales"].id,
      introSell:
        "A big loop through the heart of Snowdonia, taking in the Llanberis Pass and a stretch of the North Wales coast road.",
      introCharacter:
        "Long rather than technical — expect plenty of scenery and a full day in the saddle, with the pass sections the only real test of concentration.",
      startLocation: "Betws-y-Coed",
      finishLocation: "Betws-y-Coed",
      isLoop: true,
      totalDistanceMiles: "140",
      ridingTimeMinutes: 240,
      fullDayTimeEstimate: "6 to 7 hours",
      bestTime: "Spring to autumn, avoiding peak summer tourist traffic through Betws-y-Coed.",
      parkingNote: "Pay and display car park in Betws-y-Coed.",
      isSample: true,
      status: "published",
    })
    .returning();

  await db.insert(dayRideBikeSuitability).values([
    { dayRideId: snowdoniaDayRide.id, bikeType: "touring", level: "suited", note: "A long day in the saddle rewards a comfortable, wind-protected bike." },
    { dayRideId: snowdoniaDayRide.id, bikeType: "adventure", level: "suited", note: "A long day in the saddle rewards a comfortable, wind-protected bike." },
  ]);

  await db.insert(dayRideStages).values([
    { dayRideId: snowdoniaDayRide.id, position: 1, kind: "start", location: "Betws-y-Coed", note: "Fuel up before setting off." },
    {
      dayRideId: snowdoniaDayRide.id,
      position: 2,
      kind: "link",
      description: "Scenic loop through Snowdonia via the Llanberis Pass and the North Wales coast road",
      fromMile: "0",
      toMile: "140",
    },
    { dayRideId: snowdoniaDayRide.id, position: 3, kind: "finish", location: "Betws-y-Coed", note: "End of the Snowdonia day ride." },
  ]);

  const [atlanticHighway] = await db
    .insert(dayRides)
    .values({
      name: "Atlantic Highway (A39)",
      slug: "atlantic-highway-a39",
      regionId: regionBySlug["south-west"].id,
      introSell:
        "The A39 coast road from Barnstaple to Bude, following the North Devon and Cornwall coastline with sea views for long stretches.",
      introCharacter:
        "An easy, well-surfaced road that rewards a relaxed pace — this is about the views rather than the cornering.",
      startLocation: "Barnstaple",
      finishLocation: "Bude",
      isLoop: false,
      totalDistanceMiles: "90",
      ridingTimeMinutes: 150,
      fullDayTimeEstimate: "4 to 5 hours",
      bestTime: "Spring to autumn, avoiding school-holiday traffic through the coastal towns.",
      parkingNote: "On-street parking available in Barnstaple town centre.",
      isSample: true,
      status: "published",
    })
    .returning();

  await db.insert(dayRideBikeSuitability).values([
    { dayRideId: atlanticHighway.id, bikeType: "cruiser", level: "suited", note: "A relaxed coast road that suits a laid-back pace." },
    { dayRideId: atlanticHighway.id, bikeType: "touring", level: "suited", note: "A relaxed coast road that suits a laid-back pace." },
    { dayRideId: atlanticHighway.id, bikeType: "125cc_and_new_riders", level: "suited", note: "Gentle enough for a new rider building confidence." },
  ]);

  await db.insert(dayRideStages).values([
    { dayRideId: atlanticHighway.id, position: 1, kind: "start", location: "Barnstaple", note: "Fuel up before setting off." },
    {
      dayRideId: atlanticHighway.id,
      position: 2,
      kind: "link",
      description: "Follow the A39 Atlantic Highway along the North Devon and Cornwall coast",
      fromMile: "0",
      toMile: "90",
    },
    { dayRideId: atlanticHighway.id, position: 3, kind: "finish", location: "Bude", note: "End of the Atlantic Highway ride." },
  ]);

  console.log("Seeding tours...");

  // Pennines end to end — the only tour with named overnight stops in the brief,
  // so it gets a full day-by-day breakdown. The other two tours are seeded as
  // drafts with top-level stats only, per the brief's "sample placeholders" note.
  const [pennines] = await db
    .insert(tours)
    .values({
      name: "Pennines end to end",
      slug: "pennines-end-to-end",
      introSell:
        "Four days tracing the spine of England from the Peak District to Hadrian's Wall country, crossing some of the wildest, quietest roads in the Pennines.",
      introCharacter:
        "Long days through remote country — fuel and phone signal are both scarce in stretches, so plan ahead and check the weather each morning.",
      durationDays: 4,
      totalDistanceMiles: "520",
      averageDayMiles: "130",
      startLocation: "Glossop",
      finishLocation: "Haltwhistle",
      bestTime: "Late spring to early autumn.",
      planningNotes: {
        fuel: "Fill up whenever you pass a station in the Dales and Pennines — gaps of 40 miles or more are common.",
        weather: "Moor-top sections catch low cloud and wind with little warning; check the forecast each morning.",
        luggage: "Soft luggage is easier to live with on the narrower Dales and Pennines lanes than a wide top box.",
        breakdownAndSignal: "Phone signal is patchy from Hawes northwards — let someone know your day's route.",
        gettingHome: "Haltwhistle has a mainline rail station if you need to recover the bike separately.",
      },
      isSample: true,
      status: "published",
    })
    .returning();

  await db.insert(tourRegions).values([
    { tourId: pennines.id, regionId: regionBySlug["peak-district"].id },
    { tourId: pennines.id, regionId: regionBySlug["yorkshire-dales"].id },
    { tourId: pennines.id, regionId: regionBySlug["northern-england"].id },
  ]);

  await db.insert(tourBikeSuitability).values([
    { tourId: pennines.id, bikeType: "adventure", level: "suited", note: "Comfortable over long days and handles the rougher Pennines lanes well." },
    { tourId: pennines.id, bikeType: "touring", level: "suited", note: "Comfortable over long days and handles the rougher Pennines lanes well." },
  ]);

  const pennineDaySeeds = [
    {
      name: "Pennines crossing, day 1: Glossop to Hebden Bridge",
      slug: "pennines-crossing-day-1-glossop-to-hebden-bridge",
      regionSlug: "peak-district",
      start: "Glossop",
      finish: "Hebden Bridge",
      featuredRoute: "Snake Pass (A57)",
      linkNote: "Via Woodhead and the Longdendale valley to Hebden Bridge",
      overnight: "Hebden Bridge",
      fuelWarning: undefined as string | undefined,
    },
    {
      name: "Pennines crossing, day 2: Hebden Bridge to Hawes",
      slug: "pennines-crossing-day-2-hebden-bridge-to-hawes",
      regionSlug: "yorkshire-dales",
      start: "Hebden Bridge",
      finish: "Hawes",
      featuredRoute: "Buttertubs Pass",
      linkNote: "Via Skipton and Wharfedale to Wensleydale",
      overnight: "Hawes",
      fuelWarning: undefined as string | undefined,
    },
    {
      name: "Pennines crossing, day 3: Hawes to Alston",
      slug: "pennines-crossing-day-3-hawes-to-alston",
      regionSlug: "northern-england",
      start: "Hawes",
      finish: "Alston",
      featuredRoute: null as string | null,
      linkNote: "Via Swaledale and the North Pennines to Alston",
      overnight: "Alston",
      fuelWarning: "Fuel is scarce between Hawes and Alston — fill up before you leave.",
    },
    {
      name: "Pennines crossing, day 4: Alston to Haltwhistle",
      slug: "pennines-crossing-day-4-alston-to-haltwhistle",
      regionSlug: "northern-england",
      start: "Alston",
      finish: "Haltwhistle",
      featuredRoute: null as string | null,
      linkNote: "Via the South Tyne valley to Haltwhistle",
      overnight: "Haltwhistle",
      fuelWarning: undefined as string | undefined,
    },
  ];

  for (const [index, day] of pennineDaySeeds.entries()) {
    const featuredDistance = day.featuredRoute ? Number(routeByName[day.featuredRoute].distanceMiles) : 0;
    const [dayRide] = await db
      .insert(dayRides)
      .values({
        name: day.name,
        slug: day.slug,
        regionId: regionBySlug[day.regionSlug].id,
        introSell: `Day ${index + 1} of the Pennines end to end tour, from ${day.start} to ${day.finish}.`,
        introCharacter: "Part of a multi-day tour — see the full tour page for planning notes and overnight options.",
        startLocation: day.start,
        finishLocation: day.finish,
        isLoop: false,
        totalDistanceMiles: "130",
        ridingTimeMinutes: 220,
        fullDayTimeEstimate: "6 to 7 hours",
        isSample: true,
        status: "published",
      })
      .returning();

    const stageValues: (typeof dayRideStages.$inferInsert)[] = [
      { dayRideId: dayRide.id, position: 1, kind: "start", location: day.start, note: "Fuel up before setting off." },
    ];
    if (day.featuredRoute) {
      stageValues.push({
        dayRideId: dayRide.id,
        position: 2,
        kind: "route",
        routeId: routeByName[day.featuredRoute].id,
        fromMile: "0",
        toMile: String(featuredDistance),
      });
      stageValues.push({
        dayRideId: dayRide.id,
        position: 3,
        kind: "link",
        description: day.linkNote,
        fromMile: String(featuredDistance),
        toMile: "130",
      });
      stageValues.push({ dayRideId: dayRide.id, position: 4, kind: "finish", location: day.finish, note: `End of day ${index + 1}.` });
    } else {
      stageValues.push({ dayRideId: dayRide.id, position: 2, kind: "link", description: day.linkNote, fromMile: "0", toMile: "130" });
      stageValues.push({ dayRideId: dayRide.id, position: 3, kind: "finish", location: day.finish, note: `End of day ${index + 1}.` });
    }
    await db.insert(dayRideStages).values(stageValues);

    await db.insert(tourDays).values({
      tourId: pennines.id,
      dayNumber: index + 1,
      dayRideId: dayRide.id,
      overnightLocation: day.overnight,
      fuelWarning: day.fuelWarning ?? null,
    });
  }

  await db.insert(tourOvernightStays).values([
    { tourId: pennines.id, dayNumber: 1, placeId: placeByName["Example hotel, Hebden Bridge"].id },
    { tourId: pennines.id, dayNumber: 1, placeId: placeByName["Example B&B, Hebden Bridge"].id },
    { tourId: pennines.id, dayNumber: 2, placeId: placeByName["Example hotel, Hawes"].id },
    { tourId: pennines.id, dayNumber: 2, placeId: placeByName["Example campsite, Hawes"].id },
    { tourId: pennines.id, dayNumber: 3, placeId: placeByName["Example B&B, Alston"].id },
    { tourId: pennines.id, dayNumber: 3, placeId: placeByName["Example campsite, Alston"].id },
  ]);

  // Wales coast to coast and North Coast 500 — brief gives only top-level
  // stats and says overnight stops are "sample placeholders", so these are
  // seeded as drafts (top-level info only) pending a real day-by-day itinerary.
  const [walesCoastToCoast] = await db
    .insert(tours)
    .values({
      name: "Wales coast to coast",
      slug: "wales-coast-to-coast",
      introSell: "A three-day crossing of Wales, from the Cardigan Bay coast to the Severn estuary via Snowdonia and the Elan Valley.",
      introCharacter: "Day-by-day routing is still being finalised — treat the stats below as a planning estimate.",
      durationDays: 3,
      totalDistanceMiles: "380",
      averageDayMiles: "127",
      startLocation: "Aberystwyth",
      finishLocation: "Chepstow",
      bestTime: "Late spring to early autumn.",
      isSample: true,
      status: "draft",
    })
    .returning();

  await db.insert(tourRegions).values([{ tourId: walesCoastToCoast.id, regionId: regionBySlug["wales"].id }]);
  await db.insert(tourBikeSuitability).values([
    { tourId: walesCoastToCoast.id, bikeType: "adventure", level: "suited", note: "Copes well with the mix of mountain passes and border lanes." },
    { tourId: walesCoastToCoast.id, bikeType: "naked_and_roadster", level: "suited", note: "Copes well with the mix of mountain passes and border lanes." },
  ]);

  const [northCoast500] = await db
    .insert(tours)
    .values({
      name: "North Coast 500",
      slug: "north-coast-500",
      introSell: "Scotland's celebrated Highlands loop from Inverness, taking in Applecross, Torridon and the far north coast.",
      introCharacter: "Day-by-day routing is still being finalised — treat the stats below as a planning estimate.",
      durationDays: 6,
      totalDistanceMiles: "516",
      averageDayMiles: "86",
      startLocation: "Inverness",
      finishLocation: "Inverness",
      bestTime: "May to September — single-track sections are hard going with winter weather.",
      isSample: true,
      status: "draft",
    })
    .returning();

  await db.insert(tourRegions).values([{ tourId: northCoast500.id, regionId: regionBySlug["scotland"].id }]);
  await db.insert(tourBikeSuitability).values([
    { tourId: northCoast500.id, bikeType: "adventure", level: "suited", note: "Long open days reward a comfortable, wind-protected bike." },
    { tourId: northCoast500.id, bikeType: "touring", level: "suited", note: "Long open days reward a comfortable, wind-protected bike." },
  ]);

  console.log("Seeding collections...");
  const [peakClassics] = await db
    .insert(collections)
    .values({ name: "Peak District classics", slug: "peak-district-classics", description: "The essential Peak District roads every rider should tick off." })
    .returning();
  await db.insert(collectionRoutes).values([
    { collectionId: peakClassics.id, routeId: routeByName["Snake Pass (A57)"].id, position: 0 },
    { collectionId: peakClassics.id, routeId: routeByName["Winnats Pass"].id, position: 1 },
    { collectionId: peakClassics.id, routeId: routeByName["Cat and Fiddle (A537)"].id, position: 2 },
  ]);

  const [dalesPasses] = await db
    .insert(collections)
    .values({ name: "Yorkshire Dales passes", slug: "yorkshire-dales-passes", description: "The great climbs of the Yorkshire Dales." })
    .returning();
  await db.insert(collectionRoutes).values([{ collectionId: dalesPasses.id, routeId: routeByName["Buttertubs Pass"].id, position: 0 }]);

  const [greatPasses] = await db
    .insert(collections)
    .values({ name: "Britain's great passes", slug: "britains-great-passes", description: "The most celebrated mountain passes across the whole of Britain." })
    .returning();
  await db.insert(collectionRoutes).values([
    { collectionId: greatPasses.id, routeId: routeByName["Winnats Pass"].id, position: 0 },
    { collectionId: greatPasses.id, routeId: routeByName["Hardknott and Wrynose"].id, position: 1 },
    { collectionId: greatPasses.id, routeId: routeByName["Bealach na Ba"].id, position: 2 },
    { collectionId: greatPasses.id, routeId: routeByName["Horseshoe Pass"].id, position: 3 },
  ]);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
