export type ShareFormat = "square" | "story" | "gallery";

export interface ShareImageData {
  title: string;
  region?: string;
  date?: string;
  distanceMiles?: number;
  ridingTimeMinutes?: number;
  rating?: number;
  notes?: string;
  photoUrl?: string | null;
  mapCanvas?: HTMLCanvasElement | null;
  showMap: boolean;
  showStats: boolean;
  showNotes: boolean;
  format: ShareFormat;
}

const SIZES: Record<ShareFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  gallery: { width: 1080, height: 1080 },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, imgW: number, imgH: number, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / imgW, h / imgH);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (imgW - sw) / 2;
  const sy = (imgH - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…");
  }
  return lines;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export async function drawShareImage(canvas: HTMLCanvasElement, data: ShareImageData): Promise<void> {
  const { width, height } = SIZES[data.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pad = width * 0.06;

  // Background
  if (data.photoUrl) {
    try {
      const img = await loadImage(data.photoUrl);
      drawCover(ctx, img, img.naturalWidth, img.naturalHeight, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#22262e";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#22262e";
    ctx.fillRect(0, 0, width, height);
  }

  // Scrim for text legibility
  const scrim = ctx.createLinearGradient(0, height * 0.45, 0, height);
  scrim.addColorStop(0, "rgba(14,15,18,0)");
  scrim.addColorStop(1, "rgba(14,15,18,0.92)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  let cursorY = height - pad;

  // Footer (drawn first, bottom-most)
  ctx.font = `${width * 0.022}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText("Ridden with Herepath · from Dead Cylinder Co.", width / 2, cursorY);
  ctx.textAlign = "left";
  cursorY -= width * 0.055;

  // Map inset
  if (data.showMap && data.mapCanvas) {
    const mapSize = width * 0.28;
    const mapX = width - pad - mapSize;
    const mapY = cursorY - mapSize;
    ctx.save();
    ctx.beginPath();
    const r = width * 0.02;
    ctx.moveTo(mapX + r, mapY);
    ctx.arcTo(mapX + mapSize, mapY, mapX + mapSize, mapY + mapSize, r);
    ctx.arcTo(mapX + mapSize, mapY + mapSize, mapX, mapY + mapSize, r);
    ctx.arcTo(mapX, mapY + mapSize, mapX, mapY, r);
    ctx.arcTo(mapX, mapY, mapX + mapSize, mapY, r);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#343a46";
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    drawCover(ctx, data.mapCanvas, data.mapCanvas.width, data.mapCanvas.height, mapX, mapY, mapSize, mapSize);
    ctx.restore();
  }

  // Stat chips
  if (data.showStats) {
    const stats: string[] = [];
    if (data.distanceMiles != null) stats.push(`${data.distanceMiles} miles`);
    if (data.ridingTimeMinutes != null) stats.push(formatMinutes(data.ridingTimeMinutes));
    if (data.rating != null) stats.push(`★ ${data.rating.toFixed(1)}`);

    if (stats.length > 0) {
      ctx.font = `600 ${width * 0.032}px system-ui, sans-serif`;
      let chipX = pad;
      const chipY = cursorY - width * 0.06;
      for (const stat of stats) {
        const textWidth = ctx.measureText(stat).width;
        const chipW = textWidth + width * 0.06;
        const chipH = width * 0.06;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(stat, chipX + chipW / 2 - textWidth / 2, chipY + chipH * 0.68);
        chipX += chipW + width * 0.02;
      }
      cursorY = chipY - width * 0.03;
    }
  }

  // Notes
  if (data.showNotes && data.notes) {
    ctx.font = `${width * 0.026}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const maxNotesWidth = width - pad * 2 - (data.showMap && data.mapCanvas ? width * 0.32 : 0);
    const lines = wrapText(ctx, data.notes, maxNotesWidth, 3);
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], pad, cursorY);
      cursorY -= width * 0.035;
    }
    cursorY -= width * 0.015;
  }

  // Region + date
  if (data.region || data.date) {
    ctx.font = `${width * 0.028}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText([data.region, data.date].filter(Boolean).join(" · "), pad, cursorY);
    cursorY -= width * 0.06;
  }

  // Title
  ctx.font = `700 ${width * 0.06}px system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  const titleLines = wrapText(ctx, data.title, width - pad * 2, 2);
  for (let i = titleLines.length - 1; i >= 0; i--) {
    ctx.fillText(titleLines[i], pad, cursorY);
    cursorY -= width * 0.07;
  }
}
