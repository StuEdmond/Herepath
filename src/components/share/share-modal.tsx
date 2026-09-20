"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Download, Link as LinkIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/admin/form-fields";
import { trimLineEnds } from "@/lib/geo";
import { drawShareImage, type ShareFormat } from "@/lib/share-image";
import { MapSnapshot } from "./map-snapshot";
import { BrandIcon } from "./brand-icon";
import { InstagramPanel } from "./instagram-panel";
import { isNativeApp, openExternal, sendImageToInstagramNative, shareImageNative } from "@/lib/native";

export interface ShareableData {
  title: string;
  region?: string;
  date?: string;
  distanceMiles?: number;
  ridingTimeMinutes?: number;
  rating?: number;
  notes?: string;
  photoUrl?: string | null;
  geometry?: GeoJSON.LineString | null;
  url: string;
}

function defaultCaption(data: ShareableData, includeLink: boolean): string {
  const region = data.region ? ` in ${data.region}` : "";
  const tags = ["#Herepath", "#UKMotorcycling", data.region ? `#${data.region.replace(/\s+/g, "")}` : null].filter(Boolean).join(" ");
  const link = includeLink ? `\n\nFull route: ${data.url}` : "";
  return `Rode ${data.title}${region} today. ${tags}${link}`;
}

export function ShareModal({ data, onClose }: { data: ShareableData; onClose: () => void }) {
  const [format, setFormat] = useState<ShareFormat>("square");
  const [showMap, setShowMap] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);
  const [caption, setCaption] = useState(() => defaultCaption(data, true));
  const [captionTouched, setCaptionTouched] = useState(false);
  const [mapCanvas, setMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [native] = useState(() => isNativeApp());
  const [note, setNote] = useState("");
  const [view, setView] = useState<"share" | "instagram">("share");
  // A phone or the app can hand the image to Instagram through the share sheet. A desktop browser can also "share", but its box has no
  // Instagram in it, so that's only counted on touch screens.
  const [canSendToApp] = useState(() => isNativeApp() || (typeof navigator !== "undefined" && "share" in navigator && window.matchMedia("(pointer: coarse)").matches));
  // This modal only ever mounts client-side (after a button click), but guard
  // against `document` anyway in case that ever changes.
  const canvasRef = useRef<HTMLCanvasElement>(typeof document !== "undefined" ? document.createElement("canvas") : (null as never));

  function handleIncludeLinkChange(checked: boolean) {
    setIncludeLink(checked);
    if (!captionTouched) setCaption(defaultCaption(data, checked));
  }

  // Privacy safeguard: hide the first/last half mile of any shared route (Section 5.7).
  const trimmedGeometry = useMemo(() => (data.geometry ? trimLineEnds(data.geometry, 0.5) : null), [data.geometry]);

  useEffect(() => {
    let cancelled = false;
    drawShareImage(canvasRef.current, {
      title: data.title,
      region: data.region,
      date: data.date,
      distanceMiles: data.distanceMiles,
      ridingTimeMinutes: data.ridingTimeMinutes,
      rating: data.rating,
      notes: data.notes,
      photoUrl: data.photoUrl,
      mapCanvas: showMap ? mapCanvas : null,
      showMap,
      showStats,
      showNotes,
      format,
    }).then(() => {
      if (cancelled) return;
      canvasRef.current.toBlob((blob) => {
        if (blob && !cancelled) setPreviewUrl(URL.createObjectURL(blob));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [data, format, showMap, showStats, showNotes, mapCanvas]);

  async function getImageBlob(): Promise<Blob | null> {
    return new Promise((resolve) => canvasRef.current.toBlob(resolve, "image/png"));
  }

  async function handleSaveImage() {
    // The app's web view can't download files, so inside the app the image goes to the share sheet
    // (where "Save to device" and similar options live).
    if (native) {
      await handleMoreApps();
      return;
    }
    const blob = await getImageBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${data.title.toLowerCase().replace(/\s+/g, "-")}-herepath.png`;
    a.click();
  }

  async function handleMoreApps() {
    const blob = await getImageBlob();

    if (native && blob) {
      // Instagram and TikTok ignore shared text, so put the caption on the clipboard too.
      navigator.clipboard?.writeText(caption).then(
        () => setNote("Caption copied — paste it into your post."),
        () => {},
      );
      try {
        await shareImageNative({ title: data.title, text: caption, blob });
      } catch {
        // cancelled, or the sharing plugin isn't in this build of the app
      }
      return;
    }

    const file = blob ? new File([blob], "herepath-ride.png", { type: "image/png" }) : undefined;
    const shareData: ShareData = { title: data.title, text: caption, url: data.url };
    if (file && navigator.canShare?.({ files: [file] })) shareData.files = [file];
    try {
      await navigator.share(shareData);
    } catch {
      // user cancelled — nothing to do
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(data.url).then(
      () => setNote("Link copied."),
      () => {},
    );
  }

  function handleFacebook() {
    void openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`);
  }

  function handleX() {
    void openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(data.url)}`);
  }

  function handleCopyCaption() {
    navigator.clipboard.writeText(caption).then(
      () => setNote("Caption copied — paste it into your post."),
      () => setNote("Couldn't copy the caption. Select it in the box and copy it."),
    );
  }

  async function handleInstagramSend() {
    if (native) {
      // Copied first, while the tap still counts as a user gesture. Instagram can't take a caption from us.
      navigator.clipboard?.writeText(caption).catch(() => {});
      const blob = await getImageBlob();
      if (blob && (await sendImageToInstagramNative(blob)) === "sent") {
        setNote("Caption copied — paste it into your post.");
        return;
      }
      // Instagram isn't installed, or this build of the app can't open it directly: use the share sheet instead.
      setNote("Couldn't open Instagram directly, so here's the share sheet.");
      await handleMoreApps();
      return;
    }
    if (canSendToApp) {
      await handleMoreApps();
      return;
    }
    // Opened first, while the click still counts as a user gesture, so the browser doesn't block it.
    void openExternal("https://www.instagram.com/");
    await handleSaveImage();
    handleCopyCaption();
  }

  async function handleTikTok() {
    if (native || typeof navigator.share === "function") {
      await handleMoreApps();
      return;
    }
    // Opened first, while the click still counts as a user gesture, so the browser doesn't block it.
    window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
    await handleSaveImage();
    await navigator.clipboard.writeText(caption).catch(() => {});
    alert("Image saved and caption copied — upload the image on the TikTok page that just opened and paste the caption.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-2xl bg-bg p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stays mounted on both screens: it draws the map the share image is made from. */}
        {trimmedGeometry && showMap && (
          <MapSnapshot geometry={trimmedGeometry} width={400} height={400} onReady={setMapCanvas} />
        )}

        {view === "instagram" ? (
          <InstagramPanel
            previewUrl={previewUrl}
            format={format}
            onFormatChange={setFormat}
            caption={caption}
            onCaptionChange={(value) => {
              setCaption(value);
              setCaptionTouched(true);
            }}
            canSendToApp={canSendToApp}
            onSend={handleInstagramSend}
            onSaveImage={handleSaveImage}
            onCopyCaption={handleCopyCaption}
            onBack={() => setView("share")}
            onClose={onClose}
            note={note}
          />
        ) : (
          <>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] text-text-primary">Share</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={format === "story" ? "mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-xl bg-surface" : "mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-xl bg-surface"}>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Share preview" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["square", "story", "gallery"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`min-h-9 rounded-lg text-[13px] font-medium capitalize ${format === f ? "bg-green-primary text-white" : "bg-surface text-text-secondary"}`}
            >
              {f === "square" ? "Square post" : f === "story" ? "Story" : "Photo gallery"}
            </button>
          ))}
        </div>

        <fieldset className="flex flex-col gap-1.5 text-[14px] text-text-primary">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
            Route map
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
            Miles, time and rating
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
            Ride notes
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeLink} onChange={(e) => handleIncludeLinkChange(e.target.checked)} />
            Link so friends can ride it
          </label>
        </fieldset>

        <label className="flex flex-col gap-1 text-[13px] text-text-muted">
          Caption
          <Textarea
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              setCaptionTouched(true);
            }}
            rows={3}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            <Button type="button" variant="secondary" onClick={handleFacebook} aria-label="Share on Facebook" title="Facebook" className="min-h-12 px-0">
              <BrandIcon brand="facebook" className="h-6 w-6" />
            </Button>
            <Button type="button" variant="secondary" onClick={handleX} aria-label="Share on X" title="X" className="min-h-12 px-0">
              <BrandIcon brand="x" className="h-5 w-5" />
            </Button>
            <Button type="button" variant="secondary" onClick={() => setView("instagram")} aria-label="Share on Instagram" title="Instagram" className="min-h-12 px-0">
              <BrandIcon brand="instagram" className="h-6 w-6" />
            </Button>
            <Button type="button" variant="secondary" onClick={handleTikTok} aria-label="Share on TikTok" title="TikTok" className="min-h-12 px-0">
              <BrandIcon brand="tiktok" className="h-5 w-5" />
            </Button>
          </div>
          <YoutubeShare youtubeLink={youtubeLink} setYoutubeLink={setYoutubeLink} />
        </div>
        <p className="-mt-2 text-[12px] text-text-muted">The Story format fits TikTok best.</p>
        {note && (
          <p role="status" className="text-[13px] text-green-bright">
            {note}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="secondary" onClick={handleCopyLink} className="min-h-10 text-[13px]">
            <LinkIcon className="h-4 w-4" aria-hidden="true" /> Copy link
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveImage} className="min-h-10 text-[13px]">
            <Download className="h-4 w-4" aria-hidden="true" /> Save image
          </Button>
          {(native || (typeof navigator !== "undefined" && "share" in navigator)) && (
            <Button type="button" variant="secondary" onClick={handleMoreApps} className="min-h-10 text-[13px]">
              <Share2 className="h-4 w-4" aria-hidden="true" /> More apps
            </Button>
          )}
        </div>

        <p className="text-[12px] text-text-muted">
          Shared maps hide the first and last half mile of your ride, so it doesn&apos;t give away where you live or keep your bike.
        </p>
          </>
        )}
      </div>
    </div>
  );
}

function YoutubeShare({ youtubeLink, setYoutubeLink }: { youtubeLink: string; setYoutubeLink: (v: string) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing || !youtubeLink) {
    return (
      <div className="relative">
        <BrandIcon brand="youtube" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
        <input
          type="url"
          placeholder="Paste a YouTube link"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          onBlur={() => {
            if (youtubeLink) setEditing(false);
          }}
          className="min-h-11 w-full rounded-lg border border-text-muted/40 bg-surface pl-10 pr-2 text-[13px] text-text-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="secondary"
        onClick={() => void openExternal(youtubeLink)}
        aria-label="Watch on YouTube"
        title="Watch on YouTube"
        className="min-h-11 flex-1 px-0"
      >
        <BrandIcon brand="youtube" className="h-6 w-6" />
      </Button>
      <Button type="button" variant="ghost" onClick={() => setEditing(true)} className="min-h-11 px-2 text-[13px]">
        Edit
      </Button>
    </div>
  );
}
