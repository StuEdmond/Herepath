import type { CapacitorConfig } from "@capacitor/cli";

// The app is a native shell around the live website. To test against a dev server running on
// this computer from the Android emulator, run with CAP_SERVER_URL=http://10.0.2.2:3000
const serverUrl = process.env.CAP_SERVER_URL || "https://herepath.vercel.app";

const config: CapacitorConfig = {
  // Permanent once the app is published to Google Play — decide before the first release.
  appId: "com.herepath",
  appName: "Herepath",
  webDir: "mobile-web",
  appendUserAgent: "HerepathApp",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    errorPath: "offline.html",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0e0f12",
    },
  },
};

export default config;
