/**
 * How to get a Herepath GPX file into each navigation app. Shown in the panel under ride maps and on the GPX guide page,
 * so both say the same thing. These follow each maker's own help pages, which are linked from every entry.
 */
export interface NavAppGuide {
  id: "beeline" | "garmin" | "tomtom" | "other";
  name: string;
  /** Where the steps start: some apps take the file on the phone, some need a computer. */
  intro: string;
  steps: string[];
  note?: string;
  help: { label: string; url: string }[];
}

export const NAV_APP_GUIDES: NavAppGuide[] = [
  {
    id: "beeline",
    name: "Beeline",
    intro: "Beeline takes the file straight on your phone.",
    steps: [
      "Download the GPX file to your phone.",
      "When your phone asks which app to open it with, choose Beeline. Or open Beeline, tap Options (the cog on an iPhone) at the top right, make sure the route type is set to motorcycle, and choose Import GPX route.",
      "Pick the mode you want to ride in: turn-by-turn, breadcrumb or waypoint.",
    ],
    note: "Beeline accepts files up to 4 MB, and turn-by-turn routes up to 1,500 km. For a long tour, import one day at a time.",
    help: [{ label: "Beeline's guide to importing GPX routes", url: "https://support.beeline.co/en/articles/10570038-importing-and-exporting-gpx-routes" }],
  },
  {
    id: "garmin",
    name: "Garmin (zūmo)",
    intro: "Garmin sends the file through its Garmin Drive phone app.",
    steps: [
      "Download the GPX file to your phone.",
      "Open it in the Garmin Drive app (choose Garmin Drive when your phone asks which app to use), with your phone paired to your zūmo.",
      "Drive sends it to your device. On the device, use Convert to Trip and choose Start to Finish (or Finish to Start).",
    ],
    note: "The steps differ a little between models and app versions, so check Garmin's own guide for your device.",
    help: [
      { label: "Garmin's guide for the zūmo XT", url: "https://support.garmin.com/en-US/?faq=viCuQqsnlg2kOvcxESjqh7" },
      { label: "Garmin's guide for the zūmo XT2 and XT3", url: "https://support.garmin.com/en-US/?faq=9OVeSAcFCJ0kUS4UT1J876" },
    ],
  },
  {
    id: "tomtom",
    name: "TomTom Rider",
    intro: "TomTom imports the file from a computer.",
    steps: [
      "Download the GPX file to your computer.",
      "Connect your Rider with MyDrive Connect, open My Routes in MyDrive and choose Import a GPX file. Or go to Plan.TomTom.com, open My Items, then Routes, and choose Import GPX file.",
      "The route appears in My Routes on your device.",
    ],
    note: "TomTom shows an imported GPX file as a track, not as a route with turn-by-turn directions. Your Rider needs at least 400 MB free to import files.",
    help: [
      { label: "TomTom's guide to importing on Plan.TomTom.com", url: "https://help.tomtom.com/hc/en-us/articles/360013958599-Importing-items-in-Plan-TomTom-com" },
      {
        label: "TomTom Rider manual: importing a track GPX file",
        url: "https://download.tomtom.com/open/manuals/Rider_Wi-Fi/html/en-gb/ImportingatrackGPXfile-MyDrive-CONNECTEDandNOTCONNECTED.htm",
      },
    ],
  },
  {
    id: "other",
    name: "Another app or sat-nav",
    intro: "Most navigation devices and motorcycle route apps can import a GPX file.",
    steps: [
      "Download the GPX file.",
      "In the app or on the maker's website, look for import route, import GPX or import track.",
      "If it asks whether the file is a track or a route, choose track. Our files are tracks.",
    ],
    help: [],
  },
];
