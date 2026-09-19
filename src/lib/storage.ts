import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function store(buffer: Buffer, folder: string): Promise<string> {
  const filename = `${crypto.randomUUID()}.jpg`;

  // A Blob store connected in the Vercel dashboard provides BLOB_STORE_ID (the SDK then authenticates
  // itself); older or manually created stores provide BLOB_READ_WRITE_TOKEN instead.
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${filename}`, buffer, { access: "public", contentType: "image/jpeg" });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Image uploads need a Blob store — connect one to this project in Vercel's Storage tab, then redeploy.");
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Removes images we stored (Blob or the local uploads folder) once nothing uses them any more, such as
 * when a rider closes their account. Links to anywhere else are left alone. Failures are logged, not
 * thrown, so a storage hiccup can't undo a deletion that has already happened in the database.
 */
export async function deleteStoredImages(urls: (string | null | undefined)[]): Promise<void> {
  const wanted = [...new Set(urls.filter((u): u is string => !!u))];

  const blobUrls = wanted.filter((u) => {
    try {
      return new URL(u).hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  });
  if (blobUrls.length > 0 && (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)) {
    try {
      const { del } = await import("@vercel/blob");
      await del(blobUrls);
    } catch (error) {
      console.error("Couldn't delete stored images", error);
    }
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  for (const url of wanted.filter((u) => u.startsWith("/uploads/"))) {
    const file = path.join(process.cwd(), "public", url);
    if (!file.startsWith(uploadsRoot + path.sep)) continue;
    await rm(file, { force: true }).catch((error) => console.error("Couldn't delete stored image", error));
  }
}

/** Re-encodes an image (orientation applied, metadata stripped, max 2000px) and stores it. Returns its public URL. */
export async function saveImageBuffer(input: Buffer, folder: string): Promise<string> {
  const processed = await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return store(processed, folder);
}

async function saveFile(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 8MB`);
  return saveImageBuffer(Buffer.from(await file.arrayBuffer()), folder);
}

/** URL of the image uploaded through a single file input, or null if nothing was chosen. */
export async function uploadedImage(formData: FormData, field: string, folder: string): Promise<string | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  return saveFile(file, folder);
}

/** URLs of every image chosen in a multi-file input. */
export async function uploadedImages(formData: FormData, field: string, folder: string): Promise<string[]> {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(files.map((file) => saveFile(file, folder)));
}
