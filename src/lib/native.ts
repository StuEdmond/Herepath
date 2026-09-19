import { Capacitor } from "@capacitor/core";

/** True when running inside the Herepath mobile app rather than a normal browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Opens the phone's own share sheet with a file attached. The app's web view has no Web Share
 * API and can't download files, so the file is written to the app's cache first. Rejects if the
 * user cancels or the native plugins aren't in the installed app build.
 */
export async function shareFileNative({
  title,
  text,
  filename,
  blob,
  dialogTitle,
}: {
  title: string;
  text?: string;
  filename: string;
  blob: Blob;
  dialogTitle: string;
}): Promise<void> {
  const [{ Share }, { Filesystem, Directory }] = await Promise.all([import("@capacitor/share"), import("@capacitor/filesystem")]);
  const { uri } = await Filesystem.writeFile({ path: filename, data: await blobToBase64(blob), directory: Directory.Cache });
  await Share.share({ title, text, files: [uri], dialogTitle });
}

/** Opens the phone's share sheet with a ride image attached. */
export async function shareImageNative({ title, text, blob }: { title: string; text: string; blob: Blob }): Promise<void> {
  await shareFileNative({ title, text, filename: `herepath-ride-${Date.now()}.png`, blob, dialogTitle: "Share your ride" });
}

/** Opens a link outside the app — in an in-app browser sheet on the phone, a new tab on the web. */
export async function openExternal(url: string): Promise<void> {
  if (isNativeApp()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch {
      // plugin missing from this app build — fall back to the browser behaviour below
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
