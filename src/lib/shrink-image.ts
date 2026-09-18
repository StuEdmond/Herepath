const KEEP_AS_IS_BYTES = 800 * 1024;
const MAX_EDGE_FOR_KEEP = 2000;
const TARGET_BYTES = 1024 * 1024;

// Each step trades a little sharpness for size; stops at the first result under the target.
const ATTEMPTS: [edge: number, quality: number][] = [
  [2000, 0.8],
  [1600, 0.72],
  [1280, 0.65],
];

function toJpeg(bitmap: ImageBitmap, edge: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Downsizes a photo in the browser before upload, so phone photos stay well under the ~4.5MB
 * request limit on Vercel. Returns the original file if it is already small, or if it can't be
 * decoded here (the server still resizes whatever it receives).
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    if (file.size <= KEEP_AS_IS_BYTES && Math.max(bitmap.width, bitmap.height) <= MAX_EDGE_FOR_KEEP) return file;

    let best: Blob | null = null;
    for (const [edge, quality] of ATTEMPTS) {
      const blob = await toJpeg(bitmap, edge, quality);
      if (blob && (!best || blob.size < best.size)) best = blob;
      if (blob && blob.size <= TARGET_BYTES) break;
    }

    if (!best || best.size >= file.size) return file;
    return new File([best], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
