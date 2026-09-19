"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Copy, Download, FileUp, Image as ImageIcon, Pause, Play, Printer, SkipBack, SkipForward, Square } from "lucide-react";
import sampleLesson from "@/data/mockPhotosynthesisLesson.json";
import type { Lesson, LessonContent } from "@/lib/lesson-types";
import { lessonsFor } from "@/lib/categories";
import { DEFAULT_LAYOUT, paginate, toBRF, toBraille } from "@/lib/braille";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { findBestBlock, parseCommand, rateWords, stepRate } from "@/lib/voice/commands";
import { VoiceBar, useVoiceMode, type Voice } from "./voice-mode";
import { useStudent, type ReadItem } from "../student-provider";

// Blind & low vision support: read anything aloud (text-to-speech, with OCR for
// pictures and PDFs), hear image descriptions, and export the same content as braille.

type Block = { id: string; kind: "heading" | "text" | "image"; text: string };
type Doc = { title: string; blocks: Block[] };

const withIds = (b: { kind: Block["kind"]; text: string }[]): Block[] => b.map((x, i) => ({ ...x, id: `b-${i}` }));

function lessonToDoc(title: string, l: LessonContent): Doc {
  const b: { kind: Block["kind"]; text: string }[] = [
    { kind: "heading", text: l.title },
    { kind: "text", text: `Summary. ${l.summary}` },
  ];
  l.sections.forEach((s) => b.push({ kind: "heading", text: s.heading }, { kind: "text", text: s.content }));
  b.push({ kind: "heading", text: "Key points" }, ...l.keyPoints.map((k) => ({ kind: "text" as const, text: k })));
  if (l.importantTerms.length) {
    b.push({ kind: "heading", text: "Important terms" }, ...l.importantTerms.map((t) => ({ kind: "text" as const, text: `${t.term}: ${t.meaning}` })));
  }
  l.visualDescriptions.forEach((v) => b.push({ kind: "image", text: `${v.title}. ${v.description}` }));
  return { title, blocks: withIds(b) };
}

const textToDoc = (title: string, text: string): Doc =>
  ({ title, blocks: withIds(text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean).map((t) => ({ kind: "text" as const, text: t }))) });

const spoken = (b: Block) => (b.kind === "image" ? `Image description. ${b.text}` : b.text);

export function BlindLowVisionSupport() {
  const { lessons: all } = useStudent();
  const lessons = lessonsFor(all, "blind-low-vision");
  const voice = useVoiceMode();
  const [doc, setDoc] = useState<Doc | null>(null);

  // As soon as someone arrives, ILUMO asks how it can help, then opens the microphone by itself.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const titles = ["the sample lesson, Photosynthesis", ...lessons.map((l) => l.title)];
    voice.greet(
      voice.supported
        ? `Hello! I'm ILUMO. How can I help you today? You can ask me to read something. For example: ${titles.slice(0, 3).join(", or ")}. Or say help to hear everything I can do. Press the space bar any time to talk to me.`
        : "Hello! I'm ILUMO. Voice commands aren't available in this browser, but everything on this page works with the keyboard.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (doc) return <Reader key={doc.title} doc={doc} voice={voice} onExit={() => setDoc(null)} />;
  return <Source lessons={lessons} voice={voice} onLoad={setDoc} />;
}

// ---- choose what to read ------------------------------------------------------
const SAMPLE_TITLE = "Photosynthesis (sample)";
const ORDINALS: Record<string, number> = { one: 1, first: 1, two: 2, second: 2, three: 3, third: 3, four: 4, fourth: 4, five: 5, fifth: 5, six: 6, sixth: 6 };

function Source({ lessons, voice, onLoad }: { lessons: Lesson[]; voice: Voice; onLoad: (d: Doc) => void }) {
  const choices = useMemo(
    () => [{ title: SAMPLE_TITLE, spoken: "the sample lesson, Photosynthesis", doc: () => lessonToDoc(SAMPLE_TITLE, sampleLesson as LessonContent) },
      ...lessons.map((l) => ({ title: l.title, spoken: l.title, doc: () => lessonToDoc(l.title, l) }))],
    [lessons],
  );
  const options = choices.map((c, i) => `${i + 1}, ${c.spoken}`).join(". ");

  // Voice on the list: pick by name or number.
  useEffect(() => {
    voice.setHandler((text) => {
      const t = text.toLowerCase();
      const intent = parseCommand(text);
      if (intent.type === "help" || /\b(options|list|what (is|are) there)\b/.test(t)) {
        return voice.say(`You can read: ${options}. Say the name or the number. To read your own file, use the choose file button on this page, or paste text.`);
      }
      const num = /\b(\d)\b/.exec(t)?.[1] ?? Object.entries(ORDINALS).find(([w]) => new RegExp(`\\b${w}\\b`).test(t))?.[1];
      let pick = num ? choices[Number(num) - 1] : undefined;
      pick ??= choices.find((c) => t.includes(c.title.toLowerCase().replace(/ \(sample\)/, ""))) ?? (/\bsample\b/.test(t) ? choices[0] : undefined);
      if (pick) return onLoad(pick.doc());
      voice.say(`I didn't catch which one. You can read: ${options}.`);
    });
    return () => voice.setHandler(null);
  }, [voice, choices, options, onLoad]);

  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function readNew() {
    setError(null);
    if (file) {
      if (file.size === 0) return setError("That file looks empty. Please choose another one.");
      if (file.size > 8 * 1024 * 1024) return setError("That file is too large. Please use one under 8 MB.");
      const title = file.name.replace(/\.[^.]+$/, "");
      if (/\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/")) {
        const doc = textToDoc(title, await file.text());
        return doc.blocks.length ? onLoad(doc) : setError("That file looks empty. Please choose another one.");
      }
      if (!/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) return setError("This file type isn't supported yet. Try a PDF or image.");
      setBusy(true);
      try {
        const form = new FormData();
        form.set("file", file);
        const res = await authedFetch("/api/ocr", { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "We couldn't read that material right now. Please try again.");
        onLoad({ title: data.title || title, blocks: withIds(data.blocks) });
      } catch (e) {
        setError(e instanceof Error && e.name !== "TimeoutError" && e.name !== "TypeError" ? e.message : "We couldn't read that material right now. Please check your connection and try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (pasted.trim()) return onLoad(textToDoc("Pasted text", pasted));
    setError("Choose a file or paste some text first.");
  }

  const card = "flex w-full flex-col items-start gap-2 rounded-3xl bg-white p-6 text-left card-border hover:bg-brand-soft";
  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Blind &amp; Low Vision Support</h1>
        <p className="mt-3 text-xl leading-relaxed text-body">
          Have anything read aloud, hear every picture described, and turn it into braille you can print.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
          {["Read aloud", "Image descriptions", "Reads pictures & PDFs (OCR)", "Braille export", "Large text", "High contrast"].map((f) => (
            <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
          ))}
        </ul>
      </header>

      <VoiceBar voice={voice} />

      <section aria-labelledby="mylessons">
        <h2 id="mylessons" className="mb-4 text-2xl font-bold text-ink">Read a lesson</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <button type="button" className={card} onClick={() => onLoad(lessonToDoc("Photosynthesis (sample)", sampleLesson as LessonContent))}>
              <span className="text-xl font-bold text-ink">Photosynthesis</span>
              <span className="text-body">Sample lesson with a diagram description.</span>
            </button>
          </li>
          {lessons.map((l) => (
            <li key={l.id}>
              <button type="button" className={card} onClick={() => onLoad(lessonToDoc(l.title, l))}>
                <span className="text-xl font-bold text-ink">{l.title}</span>
                <span className="line-clamp-2 text-body">{l.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="readnew" className="max-w-3xl rounded-3xl bg-tint-blue p-6 card-border sm:p-8">
        <h2 id="readnew" className="text-2xl font-bold text-ink">Read something new</h2>
        <p className="mt-1 text-lg text-body">Upload a PDF, a photo of a page, or a text file. ILUMO reads the text and describes any pictures.</p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="ocr-file" className="mb-2 block font-semibold text-brand-deep">Choose a file (PDF, image or text)</label>
            <input
              id="ocr-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
              className="block w-full rounded-2xl border-2 border-brand-deep/20 bg-white p-3 text-lg file:mr-4 file:rounded-full file:border-0 file:bg-brand-deep file:px-5 file:py-2 file:font-semibold file:text-white"
            />
          </div>
          <div>
            <label htmlFor="ocr-text" className="mb-2 block font-semibold text-brand-deep">Or paste text</label>
            <textarea
              id="ocr-text"
              rows={5}
              value={pasted}
              onChange={(e) => { setPasted(e.target.value); setError(null); }}
              className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white p-4 text-lg outline-none focus:border-brand"
              placeholder="Paste anything you want read aloud."
            />
          </div>
          <div aria-live="assertive">
            {error && <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">{error}</p>}
          </div>
          <button
            type="button"
            onClick={readNew}
            disabled={busy}
            className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand-deep px-8 text-lg font-semibold text-white disabled:opacity-60"
          >
            <FileUp className="size-5" aria-hidden /> {busy ? "Reading your material..." : "Read this to me"}
          </button>
          <p role="status" className="sr-only">{busy ? "Reading your material. This can take up to a minute." : ""}</p>
        </div>
      </section>
    </div>
  );
}

// ---- the reader -----------------------------------------------------------------
const RATES = [0.75, 1, 1.25, 1.5, 2];

function Reader({ doc, voice, onExit }: { doc: Doc; voice: Voice; onExit: () => void }) {
  const { speech, speechAvailable, settings, updateSettings, stepTextSize, playQueue, pauseQueue, resumeQueue, stopQueue, setSpeechRate, speakOne, registerReadables } = useStudent();
  const items = useMemo<ReadItem[]>(() => doc.blocks.map((b) => ({ id: b.id, text: spoken(b) })), [doc]);
  const current = doc.blocks.findIndex((b) => b.id === speech.currentId);
  const activeRef = useRef<HTMLLIElement>(null);
  const brailleActions = useRef<BrailleActions | null>(null);
  const registerActions = useCallback((a: BrailleActions) => { brailleActions.current = a; }, []);
  const lastIdx = useRef(0); // the part most recently read, so "repeat" works after Stop
  const history = useRef<{ q: string; a: string }[]>([]);
  const [autoRead, setAutoRead] = useState(() => {
    try { return localStorage.getItem("ilumo:autoread") !== "0"; } catch { return true; }
  });
  useEffect(() => {
    if (current >= 0) {
      lastIdx.current = current;
      voice.setEcho(doc.blocks[current].text); // so the microphone ignores the text being read out
    }
  }, [current, doc, voice]);

  useEffect(() => {
    registerReadables(items);
    return () => {
      registerReadables(null);
      stopQueue();
    };
  }, [items, registerReadables, stopQueue]);

  // Start reading on its own as soon as the text is ready (after OCR, upload or choosing a lesson).
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !speechAvailable) return;
    started.current = true;
    const hint = "Press the space bar any time to talk to me.";
    if (!autoRead) return;
    voice.say(`${doc.title}. ${items.length} parts. ${hint}`, () => playQueue(items, 0), undefined, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechAvailable]);

  // Everything the student can say while reading.
  const latest = useRef({ current, status: speech.status, rate: settings.speechRate, speaking: speech.currentId });
  useEffect(() => {
    latest.current = { current, status: speech.status, rate: settings.speechRate, speaking: speech.currentId };
  });

  // Talking opens the microphone. Reading pauses meanwhile, and picks up again if nothing is said.
  const pausedForTalk = useRef(false);
  useEffect(() => {
    voice.setHooks({
      onOpen: () => {
        const { status, speaking } = latest.current;
        if (status === "playing" && speaking !== "voice") {
          pauseQueue();
          pausedForTalk.current = true;
        } else if (speaking === "voice") stopQueue();
      },
      onHeard: () => { pausedForTalk.current = false; },
      onNoVoice: () => {
        if (!pausedForTalk.current) return false;
        pausedForTalk.current = false;
        resumeQueue();
        return true;
      },
    });
    return () => voice.setHooks({});
  }, [voice, pauseQueue, resumeQueue, stopQueue]);
  useEffect(() => {
    const idx = () => (latest.current.current >= 0 ? latest.current.current : lastIdx.current);
    const play = (i: number) => playQueue(items, Math.max(0, Math.min(items.length - 1, i)));
    const blocks = doc.blocks;

    async function askTutor(mode: "explain" | "question" | "summary", text: string) {
      const here = idx();
      voice.say("One moment.", undefined, undefined, false);
      try {
        const res = await authedFetch("/api/voice/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: text, mode, title: doc.title,
            material: blocks.map((b) => b.text).join("\n"),
            current: blocks[here]?.text ?? "",
            history: history.current,
          }),
          signal: AbortSignal.timeout(45_000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.answer) throw new Error("no answer");
        history.current = [...history.current, { q: text, a: data.answer }].slice(-3);
        voice.say(data.answer, undefined, `${data.answer} Say continue to keep reading, or ask me more.`);
      } catch {
        // The AI isn't reachable: fall back to the material itself.
        if (mode === "explain") return voice.say("I couldn't put that in other words just now, so I'll read that part again.", () => play(here), undefined, false);
        const hit = findBestBlock(text, blocks);
        if (hit) return voice.say("I couldn't ask the AI just now. Here's the closest part of the material.", () => play(blocks.indexOf(hit)), undefined, false);
        voice.say("Sorry, I couldn't find that in the material.");
      }
    }

    voice.setHandler(async (text) => {
      const intent = parseCommand(text);
      const { status, rate } = latest.current;
      switch (intent.type) {
        case "help":
          return voice.say("You can say: repeat. Explain that. Faster or slower. Pause, continue or stop. Next or go back. Read the summary. Describe the image. Download braille. Or ask me any question about the material.");
        case "stop":
          stopQueue();
          return voice.say("Stopped. Say continue to keep going.");
        case "pause":
          return pauseQueue();
        case "resume":
          return status === "paused" ? resumeQueue() : play(latest.current.current >= 0 ? latest.current.current : lastIdx.current);
        case "restart":
          return play(0);
        case "repeat":
          if (intent.slower) setSpeechRate(stepRate(rate, -1));
          return status === "playing" && intent.slower ? undefined : play(idx());
        case "next":
          return idx() >= blocks.length - 1 ? voice.say("That's the end of the material.") : play(idx() + 1);
        case "previous":
          return play(idx() - 1);
        case "faster":
        case "slower":
        case "speed": {
          const target = intent.type === "speed" ? intent.rate : stepRate(rate, intent.type === "faster" ? intent.steps : -intent.steps);
          if (target === rate) return voice.say(target >= 2 ? "I'm already reading as fast as I can." : "I'm already reading as slowly as I can.");
          setSpeechRate(target); // restarts the current part at the new speed if it was reading
          return status === "playing" ? undefined : voice.say(`Okay, ${rateWords(target)}.`);
        }
        case "summary": {
          const i = blocks.findIndex((b) => /^summary\b/i.test(b.text));
          return i >= 0 ? play(i) : askTutor("summary", "Give me a short summary of this material.");
        }
        case "image": {
          const after = blocks.findIndex((b, i) => b.kind === "image" && i > idx());
          const i = after >= 0 ? after : blocks.findIndex((b) => b.kind === "image");
          return i >= 0 ? play(i) : voice.say("There are no pictures or diagrams in this material.");
        }
        case "where": {
          const c = latest.current.current;
          return voice.say(c >= 0 ? `You're on part ${c + 1} of ${blocks.length}.` : `This has ${blocks.length} parts. I'm not reading right now.`);
        }
        case "braille": {
          const a = brailleActions.current;
          if (!a) return;
          if (intent.action === "print") { voice.say("Opening the print window for your braille."); return a.printBraille(); }
          if (intent.action === "copy") { a.copy(); return voice.say("Braille copied."); }
          voice.say("Preparing your braille file. It will appear in your downloads.");
          return a.download();
        }
        case "large-print":
          voice.say("Opening the print window for large print.");
          return brailleActions.current?.printLarge();
        case "exit":
          voice.say("Back to your list. What would you like to read?");
          return onExit();
        case "explain":
          return askTutor("explain", text);
        case "ask":
          return askTutor("question", text);
      }
    });
    return () => voice.setHandler(null);
  }, [voice, items, doc, playQueue, pauseQueue, resumeQueue, stopQueue, setSpeechRate, onExit]);

  // Keep the block being read in view.
  useEffect(() => {
    if (current >= 0) activeRef.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [current]);

  const btn = "inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold disabled:opacity-40";
  const solid = `${btn} bg-brand-deep text-white`;
  const ghost = `${btn} bg-white text-brand-deep card-border`;
  const playing = speech.status === "playing";
  const paused = speech.status === "paused";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-body">Blind &amp; Low Vision Support</p>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">{doc.title}</h1>
        </div>
        <button type="button" onClick={onExit} className={ghost}>
          <ArrowLeft className="size-4" aria-hidden /> Choose something else
        </button>
      </header>

      <VoiceBar voice={voice} />

      <section aria-label="Reading controls" className="sticky top-2 z-20 space-y-4 rounded-3xl bg-white p-4 shadow-lg card-border sm:p-5">
        {!speechAvailable && <p className="font-semibold text-ink">Read aloud isn&apos;t supported in this browser. You can still use the text and braille below.</p>}
        <div className="flex flex-wrap items-center gap-2">
          {playing ? (
            <button type="button" onClick={pauseQueue} className={solid}><Pause className="size-5" aria-hidden /> Pause</button>
          ) : (
            <button type="button" onClick={paused ? resumeQueue : () => playQueue(items, Math.max(0, current))} className={solid} disabled={!speechAvailable}>
              <Play className="size-5" aria-hidden /> {paused ? "Resume" : "Play"}
            </button>
          )}
          <button type="button" onClick={stopQueue} disabled={speech.status === "idle"} className={ghost}><Square className="size-4" aria-hidden /> Stop</button>
          <button type="button" onClick={() => playQueue(items, current - 1)} disabled={current <= 0} className={ghost}><SkipBack className="size-4" aria-hidden /> Previous</button>
          <button type="button" onClick={() => playQueue(items, current + 1)} disabled={current < 0 || current >= items.length - 1} className={ghost}><SkipForward className="size-4" aria-hidden /> Next</button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-body">Reading speed</legend>
            <div className="flex flex-wrap gap-2">
              {RATES.map((r) => (
                <label key={r} className={`inline-flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-full px-4 font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${settings.speechRate === r ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`}>
                  <input type="radio" name="rate" checked={settings.speechRate === r} onChange={() => setSpeechRate(r)} className="sr-only" />
                  {r}×
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="mb-1 text-sm font-semibold text-body">Display</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => stepTextSize(-1)} className={ghost}><span aria-hidden>A−</span><span className="sr-only">Smaller text</span></button>
              <button type="button" onClick={() => stepTextSize(1)} className={ghost}><span aria-hidden>A+</span><span className="sr-only">Larger text</span></button>
              <button type="button" aria-pressed={settings.highContrast} onClick={() => updateSettings({ highContrast: !settings.highContrast })} className={settings.highContrast ? solid : ghost}>
                High contrast {settings.highContrast ? "on" : "off"}
              </button>
            </div>
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-base font-semibold text-ink">
          <input
            type="checkbox"
            checked={autoRead}
            onChange={(e) => {
              setAutoRead(e.target.checked);
              try { localStorage.setItem("ilumo:autoread", e.target.checked ? "1" : "0"); } catch { /* storage blocked */ }
            }}
            className="size-6 accent-[var(--color-brand)]"
          />
          Start reading automatically when material opens
        </label>
        <p aria-live="polite" className="text-base font-semibold text-body">
          {current >= 0 ? `Reading part ${current + 1} of ${items.length}${paused ? " (paused)" : ""}` : `${items.length} parts. Press Play to begin.`}
        </p>
      </section>

      <section aria-labelledby="text">
        <h2 id="text" className="sr-only">Text</h2>
        <ol className="space-y-3">
          {doc.blocks.map((b, i) => {
            const on = i === current;
            return (
              <li
                key={b.id}
                ref={on ? activeRef : undefined}
                aria-current={on ? "true" : undefined}
                className={`rounded-3xl p-5 sm:p-6 ${on ? "bg-brand-soft reading-highlight" : b.kind === "image" ? "bg-tint-blue card-border" : "bg-white card-border"}`}
              >
                {on && <p className="mb-1 text-sm font-bold text-brand">Reading now</p>}
                {b.kind === "image" && (
                  <p className="mb-2 flex items-center gap-2 text-lg font-bold text-ink"><ImageIcon className="size-5" aria-hidden /> Image description</p>
                )}
                {b.kind === "heading" ? (
                  <h3 className="text-2xl font-bold text-ink">{b.text}</h3>
                ) : (
                  <p className="max-w-prose text-xl leading-[1.8] text-ink">{b.text}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.kind === "image" ? (
                    <button type="button" onClick={() => speakOne(b.id, spoken(b))} className={ghost}>Hear Description<span className="sr-only">: {b.text.slice(0, 40)}</span></button>
                  ) : (
                    <button type="button" onClick={() => playQueue(items, i)} disabled={!speechAvailable} className={ghost}>Read from here<span className="sr-only">: {b.text.slice(0, 40)}</span></button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <BraillePanel doc={doc} onActions={registerActions} />
    </div>
  );
}

// ---- braille export and printing -----------------------------------------------------------------
export type BrailleActions = { download: () => void; printBraille: () => void; printLarge: () => void; copy: () => void };

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BraillePanel({ doc, onActions }: { doc: Doc; onActions: (a: BrailleActions) => void }) {
  const [cols, setCols] = useState(DEFAULT_LAYOUT.cols);
  const [rows, setRows] = useState(DEFAULT_LAYOUT.rows);
  const [withImages, setWithImages] = useState(true);
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [printing, setPrinting] = useState<"braille" | "large" | null>(null);

  const pages = useMemo(() => {
    const text = doc.blocks
      .filter((b) => withImages || b.kind !== "image")
      .map((b) => (b.kind === "image" ? `Image description. ${b.text}` : b.text))
      .join("\n\n");
    return paginate(toBraille(text), { cols, rows });
  }, [doc, cols, rows, withImages]);
  const shown = pages[Math.min(page, pages.length - 1)];
  const slug = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ilumo";
  const plain = pages.map((p) => p.join("\n")).join("\n\n");
  const field = "min-h-11 rounded-xl border-2 border-brand-deep/20 bg-white px-3 text-lg";

  const downloadBrf = () => download(`${slug}.brf`, toBRF(pages), "text/plain");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  // Printing works by showing a print-only copy of the pages, then opening the print window.
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 150);
    return () => clearTimeout(t);
  }, [printing]);

  useEffect(() => {
    onActions({ download: downloadBrf, printBraille: () => setPrinting("braille"), printLarge: () => setPrinting("large"), copy });
  });

  const solid = "inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white";
  const ghost = "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-deep card-border";

  return (
    <section aria-labelledby="braille" className="space-y-6 rounded-3xl bg-tint-yellow p-6 card-border sm:p-8">
      <div>
        <h2 id="braille" className="text-3xl font-bold text-ink">Braille and printing</h2>
        <p className="mt-2 max-w-2xl text-lg text-body">
          Turn this material into braille for a braille printer (embosser), or print it in large type.
          You can also say “download braille”, “print braille” or “print large text”.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-5">
        <div>
          <label htmlFor="b-cols" className="mb-1 block text-sm font-semibold text-body">Cells per line</label>
          <select id="b-cols" value={cols} onChange={(e) => { setCols(Number(e.target.value)); setPage(0); }} className={field}>
            {[28, 32, 36, 40].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="b-rows" className="mb-1 block text-sm font-semibold text-body">Lines per page</label>
          <select id="b-rows" value={rows} onChange={(e) => { setRows(Number(e.target.value)); setPage(0); }} className={field}>
            {[20, 25, 27].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-lg font-semibold text-ink">
          <input type="checkbox" checked={withImages} onChange={(e) => { setWithImages(e.target.checked); setPage(0); }} className="size-6 accent-[var(--color-brand)]" />
          Include image descriptions
        </label>
      </div>
      <p className="text-base text-body">This will be {pages.length} braille {pages.length === 1 ? "page" : "pages"}.</p>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={downloadBrf} className={solid}><Download className="size-5" aria-hidden /> Download for braille printer (.brf)</button>
        <button type="button" onClick={() => setPrinting("braille")} className={ghost}><Printer className="size-5" aria-hidden /> Print braille pages</button>
        <button type="button" onClick={() => setPrinting("large")} className={ghost}><Printer className="size-5" aria-hidden /> Print large text</button>
        <button type="button" onClick={() => download(`${slug}-braille.txt`, plain, "text/plain;charset=utf-8")} className={ghost}><Download className="size-5" aria-hidden /> Braille text (.txt)</button>
        <button type="button" onClick={copy} className={ghost}><Copy className="size-5" aria-hidden /> {copied ? "Copied" : "Copy braille"}</button>
      </div>
      <p role="status" className="sr-only">{copied ? "Braille copied to the clipboard." : ""}</p>

      <details className="rounded-2xl bg-white p-5 card-border">
        <summary className="min-h-11 cursor-pointer text-lg font-semibold text-brand-deep">How do I print braille?</summary>
        <div className="mt-3 space-y-3 text-lg text-ink">
          <p><strong>On a braille embosser:</strong></p>
          <ol className="list-decimal space-y-1 pl-6">
            <li>Choose “Download for braille printer (.brf)”. A BRF file is the standard braille-ready format.</li>
            <li>Open the file in your embosser&apos;s software (for example Duxbury, BrailleBlaster or the maker&apos;s own program), or copy it to the embosser&apos;s memory card.</li>
            <li>Load braille paper, pick 40 cells and 25 lines per page (the settings above match that), and press Emboss.</li>
          </ol>
          <p><strong>Without an embosser:</strong> “Print braille pages” prints the braille dots on normal paper, which can be used with braille label sheets or given to a teacher. “Print large text” prints the words in big, high-contrast letters for low vision.</p>
          <p className="text-base text-body">This is uncontracted (Grade 1) English braille. Please ask a braille teacher to check anything important before it is embossed.</p>
        </div>
      </details>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-ink">Preview (page {Math.min(page, pages.length - 1) + 1} of {pages.length})</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="min-h-11 rounded-full bg-white px-4 font-semibold text-brand-deep card-border disabled:opacity-40">Previous page</button>
            <button type="button" onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))} disabled={page >= pages.length - 1} className="min-h-11 rounded-full bg-white px-4 font-semibold text-brand-deep card-border disabled:opacity-40">Next page</button>
          </div>
        </div>
        <p className="mb-2 text-sm text-body">For sighted helpers and teachers. A screen reader gets the text above, not these dots.</p>
        <pre aria-hidden className="max-w-full overflow-x-auto rounded-2xl bg-white p-4 text-2xl leading-snug text-ink card-border">{shown.join("\n")}</pre>
      </div>
      <p className="text-base text-body">
        Want more? <Link href="/student/new" className="font-semibold text-brand underline underline-offset-4">Upload more material</Link>
      </p>

      {printing &&
        createPortal(
          <div id="print-area" data-mode={printing}>
            {printing === "braille" ? (
              pages.map((p, i) => (
                <pre key={i} className="print-braille-page">{p.join("\n")}</pre>
              ))
            ) : (
              <div className="print-large">
                <h1>{doc.title}</h1>
                {doc.blocks.map((b) => (b.kind === "heading" ? <h2 key={b.id}>{b.text}</h2> : <p key={b.id}>{b.kind === "image" ? `Image description. ${b.text}` : b.text}</p>))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </section>
  );
}
