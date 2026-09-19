// Captions for audio and video: types, cleaning, and the file formats people ask for.

export type Segment = {
  start: number; // seconds
  end: number;
  text: string;
  /** "speech" is what someone said; "sound" is described, e.g. [Bell rings]. */
  kind: "speech" | "sound";
};

export type CaptionedMedia = {
  title: string;
  segments: Segment[];
  summary: string;
  keyPoints: string[];
};

/** Make model output safe to show: real numbers, in order, no overlaps, inside the media length. */
export function sanitizeSegments(raw: unknown, duration?: number): Segment[] {
  if (!Array.isArray(raw)) return [];
  const max = duration && duration > 0 ? duration : Infinity;
  const out: Segment[] = [];
  let cursor = 0;
  for (const r of raw as Record<string, unknown>[]) {
    const text = typeof r?.text === "string" ? r.text.replace(/\s+/g, " ").trim() : "";
    let start = Number(r?.start);
    let end = Number(r?.end);
    if (!text || !Number.isFinite(start)) continue;
    start = Math.max(cursor, Math.min(start, max));
    if (!Number.isFinite(end) || end <= start) end = start + Math.max(1.5, text.length / 15);
    end = Math.min(end, max);
    if (end <= start) continue;
    out.push({ start: round(start), end: round(end), text: text.slice(0, 400), kind: r?.kind === "sound" ? "sound" : "speech" });
    cursor = start; // keep order; a caption may start before the last one ends only slightly
  }
  // Trim overlaps so two captions are never on screen together.
  for (let i = 0; i < out.length - 1; i++) if (out[i].end > out[i + 1].start) out[i].end = out[i + 1].start;
  return out.filter((s) => s.end > s.start);
}

const round = (n: number) => Math.round(n * 100) / 100;

export function activeIndex(segments: Segment[], t: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (t < s.start) hi = mid - 1;
    else if (t >= s.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

export function clock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const stamp = (t: number, sep: "." | ",") => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(ms % 1000, 3)}`;
};

/** WebVTT, for web players. */
export const toVTT = (segs: Segment[]) =>
  "WEBVTT\n\n" + segs.map((s, i) => `${i + 1}\n${stamp(s.start, ".")} --> ${stamp(s.end, ".")}\n${s.text}\n`).join("\n");

/** SubRip (.srt), for most video editors and players. */
export const toSRT = (segs: Segment[]) =>
  segs.map((s, i) => `${i + 1}\n${stamp(s.start, ",")} --> ${stamp(s.end, ",")}\n${s.text}\n`).join("\n");

export const toTranscript = (title: string, segs: Segment[]) =>
  `${title}\n\n` + segs.map((s) => `[${clock(s.start)}] ${s.text}`).join("\n") + "\n";
