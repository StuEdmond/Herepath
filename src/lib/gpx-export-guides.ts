/**
 * How riders get a GPX file out of the apps they record with, shown under the import on the Log a ride page. These follow
 * each maker's own help pages, which are linked from every entry; menus change, so the steps are kept short and general.
 */
export interface GpxExportGuide {
  name: string;
  /** Empty for apps where we only point to the maker's own help page. */
  steps: string[];
  note?: string;
  helpUrl: string;
  helpLabel: string;
}

export const GPX_EXPORT_GUIDES: GpxExportGuide[] = [
  {
    name: "Beeline",
    steps: ["Open the ride in the Beeline app, tap Options at the top right, and choose Share / download.", "Save the GPX file to your phone, or send it to yourself."],
    helpUrl: "https://support.beeline.co/en/articles/10570038-importing-and-exporting-gpx-routes",
    helpLabel: "Beeline's guide to exporting GPX routes",
  },
  {
    name: "Strava",
    steps: ["On the Strava website (not the phone app), open the activity.", "Click the More menu (the three dots) and choose Export GPX."],
    note: "This works for rides recorded with GPS. Strava only offers it on its website.",
    helpUrl: "https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export",
    helpLabel: "Strava's help on exporting",
  },
  {
    name: "Garmin Connect",
    steps: ["On connect.garmin.com in a web browser, open the activity.", "Click the gear icon at the top right and choose Export to GPX."],
    note: "This is only on the Garmin Connect website, not in the phone app.",
    helpUrl: "https://support.garmin.com/en-US/?faq=qzf6fPRX2r6kxlwI3zFh9A",
    helpLabel: "Garmin's guide to exporting an activity",
  },
  {
    name: "REVER",
    steps: ["On the REVER website, open your ride.", "Click the Download GPX icon at the top right and choose Track."],
    note: "Exporting from REVER needs a Pro membership.",
    helpUrl: "https://www.rever.co/tips/download-gpx-file-transfer-to-garmin-gps-unit",
    helpLabel: "REVER's guide to downloading a GPX file",
  },
  {
    name: "Calimoto",
    steps: [],
    helpUrl: "https://support.calimoto.com/hc/en-us/articles/9036207495068-GPX-Import-Export",
    helpLabel: "Calimoto's guide to GPX import and export",
  },
  {
    name: "Komoot",
    steps: [],
    helpUrl: "https://support.komoot.com/hc/en-us/articles/10115477099674-Export-and-import-Routes-and-Activities",
    helpLabel: "Komoot's guide to exporting routes and activities",
  },
];
