import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function store(buffer: Buffer, folder: string): Promise<string> {
  const filename = `${crypto.randomUUID()}.jpg`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${filename}`, buffer, { access: "public", contentType: "image/jpeg" });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Image uploads on Vercel need a Blob store — add BLOB_READ_WRITE_TOKEN to the project's environment variables.");
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
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
