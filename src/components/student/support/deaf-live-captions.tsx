"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square, Trash2 } from "lucide-react";
import { listen, recognitionSupported, type Listener } from "@/lib/voice/recognition";
import { CaptionStyleControls, useCaptionClasses } from "./caption-style";
import { useNotify } from "./visual-alerts";

type Line = { text: string; at: Date };

/** Live captions of what people around you are saying, using the microphone. */
export function LiveCaptions() {
  const notify = useNotify();
  const capClass = useCaptionClasses();
  const [supported] = useState(() => recognitionSupported());
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const listener = useRef<Listener | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const stop = () => {
    listener.current?.stop();
    listener.current = null;
    setOn(false);
    setInterim("");
  };
  useEffect(() => () => listener.current?.stop(), []);

  const start = () => {
    setProblem(null);
    listener.current = listen({
      onHeard: (text) => { setLines((l) => [...l, { text, at: new Date() }]); setInterim(""); },
      onInterim: setInterim,
      onError: (kind) => {
        listener.current = null;
        setOn(false);
        const msg = kind === "denied" ? "The microphone is blocked. Allow it in your browser's address bar, then try again." : kind === "network" ? "Live captions need an internet connection." : "This browser can't do live captions. Try Chrome, Edge or Safari.";
        setProblem(msg);
        notify(msg, "warning");
      },
    });
    setOn(true);
    notify("Live captions are on.", "success");
  };

  // Keep the newest words in view.
  useEffect(() => {
    const b = box.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [lines, interim]);

  const transcript = lines.map((l) => `[${l.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${l.text}`).join("\n");
  const btn = "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft disabled:opacity-40";

  return (
    <section aria-labelledby="lc-h" className="space-y-6">
      <div>
        <h2 id="lc-h" className="text-3xl font-bold text-ink">Live captions</h2>
        <p className="mt-2 max-w-2xl text-lg text-body">
          Put your device near the person speaking (a teacher, a classmate, a video) and read what they say as they say it.
        </p>
      </div>

      {!supported ? (
        <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-lg font-semibold text-ink ring-1 ring-black/10">
          Live captions need Chrome, Edge or Safari. You can still use captions for recordings.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {on ? (
            <button type="button" onClick={() => { stop(); notify("Live captions are off."); }} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-rose-700 px-8 text-lg font-bold text-white">
              <Square className="size-5" aria-hidden /> Stop live captions
            </button>
          ) : (
            <button type="button" onClick={start} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-brand px-8 text-lg font-bold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
              <Mic className="size-6" aria-hidden /> Start live captions
            </button>
          )}
          <span className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold ring-2 ${on ? (interim ? "bg-tint-green text-ink ring-emerald-700" : "bg-white text-ink ring-brand") : "bg-white text-body ring-brand-deep/20"}`}>
            <span aria-hidden className={`size-3 rounded-full ${on ? (interim ? "bg-emerald-600" : "bg-brand") : "bg-body/40"}`} />
            {!on ? "Not listening" : interim ? "Someone is speaking" : "Listening"}
          </span>
        </div>
      )}
      {problem && <p role="alert" className="rounded-2xl bg-tint-pink p-4 text-lg font-semibold text-ink ring-1 ring-black/20">⚠ {problem}</p>}

      <div ref={box} aria-live="off" aria-label="Live captions" tabIndex={0} className={`h-[22rem] overflow-y-auto rounded-3xl p-5 ${capClass}`}>
        {lines.length === 0 && !interim && <p className="opacity-70">Captions will appear here.</p>}
        {lines.map((l, i) => <p key={i} className="mb-3">{l.text}</p>)}
        {interim && <p className="opacity-70">{interim}</p>}
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-5 card-border">
        <CaptionStyleControls />
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={lines.length === 0} onClick={() => { const url = URL.createObjectURL(new Blob([transcript], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "live-captions.txt"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }} className={btn}>
            <Download className="size-5" aria-hidden /> Save what was said
          </button>
          <button type="button" disabled={lines.length === 0 && !interim} onClick={() => { setLines([]); setInterim(""); }} className={btn}>
            <Trash2 className="size-5" aria-hidden /> Clear
          </button>
        </div>
      </div>
      <p className="text-base text-body">
        Your browser turns speech into text, and some browsers send the audio to their own service to do it. Live captions can miss words in noisy rooms, so treat them as a helper, not a perfect record.
      </p>
    </section>
  );
}
