"use client";

import { useState, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import exifr from "exifr";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shrinkImage } from "@/lib/shrink-image";

interface Picked {
  name: string;
  before: number;
  after: number;
}

const WARN_TOTAL_BYTES = 4 * 1024 * 1024;

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A clear "Choose image" button. Photos are shrunk in the browser as soon as they are chosen, so
 * uploads stay small. With gpsFieldName set, each photo's GPS position is read first and sent in a
 * hidden field, because re-encoding a photo drops its location data.
 */
export function ImageFileInput({
  name,
  multiple = false,
  gpsFieldName,
  className,
}: {
  name: string;
  multiple?: boolean;
  gpsFieldName?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [gps, setGps] = useState("[]");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setPicked([]);
      setGps("[]");
      return;
    }

    setBusy(true);
    try {
      const positions = gpsFieldName
        ? await Promise.all(
            files.map(async (file) => {
              const position = await exifr.gps(file).catch(() => null);
              return position ? { lat: position.latitude, lng: position.longitude } : null;
            }),
          )
        : [];
      const shrunk = await Promise.all(files.map((file) => shrinkImage(file)));

      const transfer = new DataTransfer();
      shrunk.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;

      setPicked(files.map((file, i) => ({ name: file.name, before: file.size, after: shrunk[i].size })));
      setGps(JSON.stringify(positions));
    } finally {
      setBusy(false);
    }
  }

  const total = picked.reduce((sum, p) => sum + p.after, 0);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "min-h-10 w-fit cursor-pointer bg-surface px-4 text-[14px] hover:bg-surface-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green-bright",
        )}
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        {multiple ? "Choose images" : "Choose image"}
        <input type="file" name={name} accept="image/*" multiple={multiple} onChange={handleChange} className="sr-only" />
      </label>

      {busy && <p className="text-[12px] text-text-muted">Optimising…</p>}
      {!busy && picked.length === 0 && <p className="text-[12px] text-text-muted">No file chosen</p>}
      {!busy &&
        picked.map((p, i) => (
          <p key={`${p.name}-${i}`} className="text-[12px] text-text-secondary">
            {p.name}
            {p.after < p.before ? ` — ${mb(p.before)} → ${mb(p.after)}` : ` — ${mb(p.after)}`}
          </p>
        ))}
      {!busy && total > WARN_TOTAL_BYTES && (
        <p className="text-[12px] text-red-accent">
          These add up to {mb(total)}. Uploading more than about 4.5 MB at once can fail — add fewer photos at a time.
        </p>
      )}

      {gpsFieldName && <input type="hidden" name={gpsFieldName} value={gps} />}
    </div>
  );
}
