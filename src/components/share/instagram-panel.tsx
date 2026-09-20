"use client";

import { ArrowLeft, Bookmark, ClipboardCopy, Download, Heart, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/admin/form-fields";
import type { ShareFormat } from "@/lib/share-image";
import { BrandIcon } from "./brand-icon";

/** Instagram rejects captions longer than this. */
export const INSTAGRAM_CAPTION_LIMIT = 2200;

interface InstagramPanelProps {
  previewUrl: string | null;
  format: ShareFormat;
  onFormatChange: (format: ShareFormat) => void;
  caption: string;
  onCaptionChange: (caption: string) => void;
  /** True on a phone or in the app, where the share sheet can hand the image straight to Instagram. */
  canSendToApp: boolean;
  onSend: () => void;
  onSaveImage: () => void;
  onCopyCaption: () => void;
  onBack: () => void;
  onClose: () => void;
  note: string;
}

export function InstagramPanel({
  previewUrl,
  format,
  onFormatChange,
  caption,
  onCaptionChange,
  canSendToApp,
  onSend,
  onSaveImage,
  onCopyCaption,
  onBack,
  onClose,
  note,
}: InstagramPanelProps) {
  const story = format === "story";
  const over = caption.length > INSTAGRAM_CAPTION_LIMIT;

  return (
    <>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Back to share options" className="text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-2 text-[18px] text-text-primary">
          <BrandIcon brand="instagram" className="h-5 w-5" /> Instagram
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text-primary">Format</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["square", "Post"],
              ["story", "Story"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFormatChange(value)}
              className={`min-h-9 rounded-lg text-[13px] font-medium ${(value === "story") === story ? "bg-green-primary text-white" : "bg-surface text-text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[340px] rounded-xl border border-text-muted/30 bg-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-text-muted/30" aria-hidden="true" />
          <span className="text-[13px] font-medium text-text-primary">your_username</span>
        </div>
        <div className={story ? "mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-md bg-bg" : "aspect-square w-full overflow-hidden rounded-md bg-bg"}>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="How your Instagram post will look" className="h-full w-full object-cover" />
          )}
        </div>
        {!story && (
          <div className="mt-2 flex items-center gap-3 text-text-primary" aria-hidden="true">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
            <Bookmark className="ml-auto h-5 w-5" />
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1 text-[13px] font-medium text-text-primary">
        Caption
        <Textarea value={caption} onChange={(e) => onCaptionChange(e.target.value)} rows={5} placeholder="Write a caption…" />
        <span className={`self-end text-[12px] font-normal ${over ? "text-red-500" : "text-text-muted"}`}>
          {caption.length}/{INSTAGRAM_CAPTION_LIMIT}
        </span>
      </label>
      {over && <p className="-mt-2 text-[12px] text-red-500">Instagram won&apos;t accept a caption this long. Shorten it before you post.</p>}

      <ol className="list-decimal space-y-1 pl-5 text-[13px] text-text-secondary">
        {canSendToApp ? (
          <>
            <li>Tap Send to Instagram and choose {story ? "Stories" : "Feed"} when your phone asks.</li>
            <li>Paste the caption. It&apos;s copied for you, and Instagram can&apos;t fill it in itself.</li>
          </>
        ) : (
          <>
            <li>Save the image and copy the caption.</li>
            <li>Open Instagram, choose Create (+) and pick the saved image.</li>
            <li>Paste the caption and share.</li>
          </>
        )}
      </ol>

      <div className="flex flex-col gap-2">
        {canSendToApp ? (
          <Button type="button" onClick={onSend} className="min-h-11">
            <BrandIcon brand="instagram" className="h-5 w-5" /> Send to Instagram
          </Button>
        ) : (
          <Button type="button" onClick={onSend} className="min-h-11">
            <BrandIcon brand="instagram" className="h-5 w-5" /> Open Instagram
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onSaveImage} className="min-h-10 text-[13px]">
            <Download className="h-4 w-4" aria-hidden="true" /> Save image
          </Button>
          <Button type="button" variant="secondary" onClick={onCopyCaption} className="min-h-10 text-[13px]">
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" /> Copy caption
          </Button>
        </div>
      </div>

      {note && (
        <p role="status" className="text-[13px] text-green-bright">
          {note}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        Shared maps hide the first and last half mile of your ride, so it doesn&apos;t give away where you live or keep your bike.
      </p>
    </>
  );
}
