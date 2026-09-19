"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Download, FileVideo } from "lucide-react";
import sample from "@/data/sampleCaptions.json";
import { activeIndex, clock, sanitizeSegments, toSRT, toTranscript, toVTT, type CaptionedMedia as Media, type Segment } from "@/lib/captions";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { CaptionStyleControls, useCaptionClasses } from "./caption-style";
import { useNotify } from "./visual-alerts";

type Loaded = Media & { src: string; isVideo: boolean; duration?: number };

const TYPE_OK = /^(audio|video)\//;
const MAX = 15 * 1024 * 1024;

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Captions for a recording: speech word for word, plus described sounds like [Bell rings]. */
export function CaptionedMedia() {
  const notify = useNotify();
  const [media, setMedia] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useSample() {
    setError(null);
    setMedia({
      title: sample.title,
      src: sample.src,
      isVideo: true,
      duration: sample.duration,
      segments: sample.segments as Segment[],
      summary: sample.summary,
      keyPoints: sample.keyPoints,
    });
  }

  async function caption(file: File) {
    setError(null);
    const type = (file.type || "").split(";")[0];
    if (file.size === 0) return setError("That file looks empty. Please choose another one.");
    if (!TYPE_OK.test(type)) return setError("This file type isn't supported. Try an MP3, WAV, M4A, MP4 or WebM file.");
    if (file.size > MAX) return setError("That recording is too big. Please use one under 15 MB, or a shorter clip.");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await authedFetch("/api/captions", { method: "POST", body: form, signal: AbortSignal.timeout(110_000) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't caption that recording right now. Please try again.");
      setMedia({
        title: data.title || file.name,
        src: URL.createObjectURL(file),
        isVideo: type.startsWith("video/"),
        segments: sanitizeSegments(data.segments),
        summary: data.summary ?? "",
        keyPoints: data.keyPoints ?? [],
      });
      notify("Captions are ready.", "success");
    } catch (e) {
      const network = e instanceof Error && (e.name === "TimeoutError" || e.name === "TypeError");
      setError(network ? "That took too long or the connection dropped. Please try again with a shorter clip." : e instanceof Error ? e.message : "We couldn't caption that recording.");
    } finally {
      setBusy(false);
    }
  }

  if (media) return <Player key={media.src} media={media} onExit={() => setMedia(null)} />;

  return (
    <section aria-labelledby="cm-h" className="space-y-6">
      <div>
        <h2 id="cm-h" className="text-3xl font-bold text-ink">Captions for any recording</h2>
        <p className="mt-2 max-w-2xl text-lg text-body">
          Add a lecture, a video or a voice recording. ILUMO writes what is said, and describes important sounds, so you can read everything.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 card-border">
          <h3 className="text-xl font-bold text-ink">Try a sample</h3>
          <p className="mt-1 text-body">A short talk about photosynthesis, with a bell sound at the start.</p>
          <button type="button" onClick={useSample} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white">
            <FileVideo className="size-5" aria-hidden /> Watch with captions
          </button>
        </div>
        <div className="rounded-3xl bg-tint-blue p-6 card-border">
          <h3 className="text-xl font-bold text-ink">Caption your own file</h3>
          <label htmlFor="cm-file" className="mt-1 block text-body">Audio or video, up to 15 MB (MP3, WAV, M4A, MP4, WebM)</label>
          <input
            id="cm-file"
            type="file"
            accept="audio/*,video/*"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) caption(f); e.target.value = ""; }}
            className="mt-3 block w-full rounded-2xl border-2 border-brand-deep/20 bg-white p-3 text-lg file:mr-4 file:rounded-full file:border-0 file:bg-brand-deep file:px-5 file:py-2 file:font-semibold file:text-white"
          />
        </div>
      </div>
      <div aria-live="polite">
        {busy && (
          <p role="status" className="rounded-2xl bg-tint-yellow p-4 text-lg font-semibold text-ink ring-1 ring-black/10">
            Writing your captions. This can take up to a minute for longer recordings...
          </p>
        )}
        {error && <p role="alert" className="rounded-2xl bg-tint-pink p-4 text-lg font-semibold text-ink ring-1 ring-black/20">⚠ {error}</p>}
      </div>
    </section>
  );
}

function Player({ media, onExit }: { media: Loaded; onExit: () => void }) {
  const el = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const activeRow = useRef<HTMLLIElement>(null);
  const [t, setT] = useState(0);
  const [overlay, setOverlay] = useState(true);
  const capClass = useCaptionClasses();
  const idx = useMemo(() => activeIndex(media.segments, t), [media.segments, t]);
  const current = idx >= 0 ? media.segments[idx] : null;

  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [idx]);

  const seek = (s: Segment) => {
    if (!el.current) return;
    el.current.currentTime = s.start;
    void el.current.play();
  };
  const slug = media.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "captions";
  const btn = "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft";
  const mediaProps = {
    ref: el,
    src: media.src,
    controls: true,
    onTimeUpdate: () => setT(el.current?.currentTime ?? 0),
    onSeeked: () => setT(el.current?.currentTime ?? 0),
    className: "w-full rounded-2xl bg-black",
  };

  return (
    <section aria-labelledby="pl-h" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="pl-h" className="text-3xl font-bold text-ink">{media.title}</h2>
        <button type="button" onClick={onExit} className={btn}>Caption another recording</button>
      </div>

      <div className="relative">
        {media.isVideo ? <video {...mediaProps} playsInline /> : <audio {...mediaProps} />}
        {media.isVideo && overlay && current && (
          <p aria-hidden className={`pointer-events-none absolute inset-x-3 bottom-16 mx-auto w-fit max-w-[95%] rounded-xl px-4 py-2 text-center ${capClass}`}>
            {current.text}
          </p>
        )}
      </div>

      <div className="min-h-[7rem]" aria-live="off">
        <p className="mb-1 text-sm font-semibold text-body">Now saying</p>
        <p className={`rounded-2xl px-5 py-4 ${capClass} ${current?.kind === "sound" ? "italic" : ""}`}>{current ? current.text : "…"}</p>
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-5 card-border">
        <CaptionStyleControls />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {media.isVideo && (
            <label className="flex min-h-11 items-center gap-3 text-lg font-semibold text-ink">
              <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} className="size-6 accent-[var(--color-brand)]" />
              Show captions on the video
            </label>
          )}
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-body">Playback speed</legend>
            <div className="flex gap-2">
              {[0.75, 1, 1.25].map((r) => (
                <button key={r} type="button" onClick={() => { if (el.current) el.current.playbackRate = r; }} className={`min-h-11 min-w-14 rounded-full px-4 font-semibold ${btn.replace("min-h-12", "")}`}>{r}×</button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-2xl font-bold text-ink">Full transcript</h3>
        <p className="mb-3 text-body">Select any line to jump to that moment.</p>
        <ol className="max-h-[26rem] space-y-2 overflow-y-auto rounded-3xl bg-white p-3 card-border">
          {media.segments.map((s, i) => {
            const on = i === idx;
            return (
              <li key={i} ref={on ? activeRow : undefined}>
                <button
                  type="button"
                  onClick={() => seek(s)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-start gap-4 rounded-2xl p-3 text-left text-xl ${on ? "bg-brand-soft ring-4 ring-brand" : "hover:bg-brand-soft/60"}`}
                >
                  <span className="mt-1 w-12 shrink-0 font-mono text-base font-bold text-brand">{clock(s.start)}</span>
                  <span className={`text-ink ${s.kind === "sound" ? "italic" : ""}`}>
                    {s.kind === "sound" && <Bell className="mr-2 inline size-5 text-amber-600" aria-label="Sound" />}
                    {s.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {(media.summary || media.keyPoints.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {media.summary && (
            <div className="rounded-3xl bg-tint-yellow p-6 card-border">
              <h3 className="text-xl font-bold text-ink">In short</h3>
              <p className="mt-2 text-xl leading-relaxed text-ink">{media.summary}</p>
            </div>
          )}
          {media.keyPoints.length > 0 && (
            <div className="rounded-3xl bg-tint-green p-6 card-border">
              <h3 className="text-xl font-bold text-ink">Main points</h3>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-xl text-ink">{media.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => download(`${slug}.vtt`, toVTT(media.segments), "text/vtt")} className={btn}><Download className="size-5" aria-hidden /> Captions (.vtt)</button>
        <button type="button" onClick={() => download(`${slug}.srt`, toSRT(media.segments), "text/plain")} className={btn}><Download className="size-5" aria-hidden /> Captions (.srt)</button>
        <button type="button" onClick={() => download(`${slug}-transcript.txt`, toTranscript(media.title, media.segments), "text/plain;charset=utf-8")} className={btn}><Download className="size-5" aria-hidden /> Transcript (.txt)</button>
      </div>
    </section>
  );
}
