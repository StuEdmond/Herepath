import exifr from "exifr";
import type { LatLng } from "@/lib/geo";
import { saveImageBuffer } from "@/lib/storage";

export interface ProcessedPhoto {
  /** Public URL of the stripped, compressed image. */
  url: string;
  /** GPS location read from the original EXIF data, before it was stripped. */
  gps: LatLng | null;
}

/**
 * Reads GPS location from a photo's EXIF data (for placing it on the mile
 * timeline), then re-encodes the image without any metadata before saving —
 * Section 6 requires stripping location data from publicly displayed photos.
 */
export async function processAndSavePhoto(buffer: Buffer): Promise<ProcessedPhoto> {
  const gps = await exifr.gps(buffer).catch(() => null);
  const url = await saveImageBuffer(buffer, "diary");
  return { url, gps: gps ? { lat: gps.latitude, lng: gps.longitude } : null };
}
