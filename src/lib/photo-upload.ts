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
export async function processAndSavePhoto(buffer: Buffer, browserGps: LatLng | null = null): Promise<ProcessedPhoto> {
  // The browser shrinks big photos before upload, which drops their EXIF data — in that case it
  // sends the location it read beforehand.
  const exif = await exifr.gps(buffer).catch(() => null);
  const gps = exif ? { lat: exif.latitude, lng: exif.longitude } : browserGps;
  const url = await saveImageBuffer(buffer, "diary");
  return { url, gps };
}
