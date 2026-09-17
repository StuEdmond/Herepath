import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import type { LatLng } from "@/lib/geo";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "diary");

export interface ProcessedPhoto {
  /** Public path to the stripped, compressed image — e.g. "/uploads/diary/<id>.jpg". */
  url: string;
  /** GPS location read from the original EXIF data, before it was stripped. */
  gps: LatLng | null;
}

/**
 * Reads GPS location from a photo's EXIF data (for placing it on the mile
 * timeline), then re-encodes the image without any metadata before saving —
 * Section 6 requires stripping location data from publicly displayed photos.
 *
 * Local filesystem storage under /public/uploads is a stand-in for real
 * object storage (Section 2 calls for S3-compatible storage in Phase 2) —
 * swap this for an upload to that bucket before deploying anywhere with
 * more than one server or ephemeral disk.
 */
export async function processAndSavePhoto(buffer: Buffer): Promise<ProcessedPhoto> {
  const gps = await exifr.gps(buffer).catch(() => null);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.jpg`;

  await sharp(buffer)
    .rotate() // apply EXIF orientation before it's stripped
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, filename));

  return {
    url: `/uploads/diary/${filename}`,
    gps: gps ? { lat: gps.latitude, lng: gps.longitude } : null,
  };
}
