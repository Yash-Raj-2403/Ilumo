"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MousePointerClick, Timer, Volume2 } from "lucide-react";
import type { Lesson } from "@/lib/lesson-types";
import { listen, recognitionSupported, type Listener } from "@/lib/voice/recognition";
import { LessonPicker } from "./lesson-picker";
import { useStudent } from "../student-provider";

// Physical & motor support: big, well-spaced buttons; nothing to drag; one-switch scanning;
// dwell (hover) clicking; voice control; and answers that never time out on you.

const SIZE = {
  l: "min-h-16 px-8 text-xl",
  xl: "min-h-24 px-10 text-2xl",
  xxl: "min-h-32 px-12 text-3xl",
} as const;
const BASE_SECONDS = 30;

// ---- switch scanning ---------------------------------------------------------------------------
function useSwitchScanning(root: React.RefObject<HTMLElement | null>, enabled: boolean, seconds: number) {
  const index = useRef(-1);
  const items = () =>
    [...(root.current?.querySelectorAll<HTMLElement>("[data-scan]") ?? [])].filter(
      (el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null,
    );
  const clear = () => root.current?.querySelectorAll("[data-scanning]").forEach((el) => el.removeAttribute("data-scanning"));

  const select = () => {
    const el = items()[index.current];
    if (el) el.click();
  };
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      const list = items();
      if (list.length === 0) return;
      clear();
      index.current = (index.current + 1) % list.length;
      const el = list[index.current];
      el.setAttribute("data-scanning", "true");
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
    }, Math.max(0.6, seconds) * 1000);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
        if (!e.repeat) selectRef.current();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey, true);
      clear();
      index.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, seconds]);

  return select;
}

// ---- dwell clicking -------------------------------------------------------------------------------
function useDwell(root: React.RefObject<HTMLElement | null>, enabled: boolean, ms: number) {
  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    let target: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      target?.classList.remove("dwelling");
      target = null;
    };
    const over = (e: PointerEvent) => {
      const next = (e.target as HTMLElement).closest<HTMLElement>("button, a, [data-scan]");
      if (next === target) return;
      cancel();
      if (!next || (next as HTMLButtonElement).disabled || next.hasAttribute("data-nodwell")) return;
      target = next;
      next.style.setProperty("--dwell-ms", `${ms}ms`);
      next.classList.add("dwelling");
      timer = setTimeout(() => {
        const t = target;
        cancel();
        t?.click();
      }, ms);
    };
    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", cancel);
    return () => {
      el.removeEventListener("pointerover", over);
      el.removeEventListener("pointerleave", cancel);
      cancel();
    };
  }, [root, enabled, ms]);
}

// ---- voice control ------------------------------------------------------------------------------
type VoiceAct = { type: "next" | "back" | "start" | "listen" | "time" | "off" | "help" } | { type: "pick"; index: number };
const WORD_NUM: Record<string, number> = { a: 0, one: 0, "1": 0, b: 1, two: 1, "2": 1, c: 2, three: 2, "3": 2, d: 3, four: 3, "4": 3 };

export function parseMotorVoice(raw: string): VoiceAct | null {
  const t = raw.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (/\b(stop|turn off) (voice|listening)\b/.test(t)) return { type: "off" };
  if (/\bmore time\b|\badd time\b/.test(t)) return { type: "time" };
  if (/\b(start|begin) (the )?(quiz|test|questions)\b/.test(t)) return { type: "start" };
  if (/\b(help|what can i say)\b/.test(t)) return { type: "help" };
  if (/\b(repeat|read (it|that|this)|listen|say it)\b/.test(t)) return { type: "listen" };
  const pick = /\b(?:select|choose|pick|answer|option)?\s*(a|b|c|d|one|two|three|four|1|2|3|4)\b$/.exec(t);
  if (pick && /(select|choose|pick|answer|option)/.test(t) || (pick && t.split(" ").length === 1 && t in WORD_NUM)) return { type: "pick", index: WORD_NUM[pick![1]] };
  if (/\b(next|continue|forward|done)\b/.test(t)) return { type: "next" };
  if (/\b(back|previous|go back)\b/.test(t)) return { type: "back" };
  return null;
}

// ---- the page ---------------------------------------------------------------------------------------
export function MotorSupport() {
  const { settings } = useStudent();
  const m = settings.motor;
  const root = useRef<HTMLDivElement>(null);
  const select = useSwitchScanning(root, m.scan, m.scanSeconds);
  useDwell(root, m.dwell, m.dwellMs);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  return (
    <div ref={root} className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Physical &amp; Motor Support</h1>
        <p className="mt-3 text-xl leading-relaxed text-body">
          Big buttons with lots of space, nothing to drag, full keyboard use, and no rush. Use a switch, hover to click, or use your voice.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
          {["Large buttons", "No dragging", "Switch scanning", "Dwell clicking", "Voice control", "Extra time"].map((f) => (
            <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
          ))}
        </ul>
      </header>

      <AccessPanel />

      {m.scan && (
        <div className="fixed bottom-24 left-4 z-40 md:bottom-6 md:left-[calc(16rem+1.5rem)]">
          <button type="button" data-nodwell onClick={select} className="min-h-20 rounded-full bg-[#d9480f] px-10 text-2xl font-extrabold text-white shadow-2xl ring-4 ring-white">
            Select (or press Space)
          </button>
        </div>
      )}

      {lesson ? <MotorLesson lesson={lesson} onExit={() => setLesson(null)} /> : <LessonPicker slug="motor" onPick={setLesson} />}
    </div>
  );
}

function AccessPanel() {
  const { settings, updateSettings } = useStudent();
  const m = settings.motor;
  const set = (patch: Partial<typeof m>) => updateSettings({ motor: { ...m, ...patch } });
  const opt = (on: boolean) => `inline-flex min-h-14 cursor-pointer items-center rounded-full px-6 text-lg font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`;
  const toggle = (on: boolean) => `inline-flex min-h-14 items-center gap-3 rounded-full px-6 text-lg font-bold ${on ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`;
  return (
    <section aria-labelledby="ac-h" className="space-y-6 rounded-3xl bg-tint-blue p-6 card-border sm:p-8">
      <h2 id="ac-h" className="text-2xl font-bold text-ink">How do you want to use ILUMO?</h2>

      <fieldset>
        <legend className="mb-2 text-lg font-bold text-ink">Button size</legend>
        <div className="flex flex-wrap gap-3">
          {([["l", "Large"], ["xl", "Extra large"], ["xxl", "Huge"]] as const).map(([id, label]) => (
            <label key={id} data-scan className={opt(m.size === id)}>
              <input type="radio" name="motor-size" className="sr-only" checked={m.size === id} onChange={() => set({ size: id })} />
              {m.size === id && <span aria-hidden className="mr-1">✓</span>}{label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-3xl bg-white p-5 card-border">
          <button type="button" data-scan aria-pressed={m.scan} onClick={() => set({ scan: !m.scan })} className={toggle(m.scan)}>
            <MousePointerClick className="size-6" aria-hidden /> Switch scanning: {m.scan ? "on" : "off"}
          </button>
          <p className="text-base text-body">ILUMO highlights one button at a time. Press your switch (Space or Enter) to choose the highlighted one.</p>
          <label htmlFor="scan-speed" className="block font-semibold text-ink">Speed: a new button every {m.scanSeconds} second{m.scanSeconds === 1 ? "" : "s"}</label>
          <input id="scan-speed" type="range" min={1} max={6} step={1} value={m.scanSeconds} onChange={(e) => set({ scanSeconds: Number(e.target.value) })} className="block h-11 w-full accent-[var(--color-brand)]" />
        </div>
        <div className="space-y-3 rounded-3xl bg-white p-5 card-border">
          <button type="button" data-scan aria-pressed={m.dwell} onClick={() => set({ dwell: !m.dwell })} className={toggle(m.dwell)}>
            <MousePointerClick className="size-6" aria-hidden /> Hover to click: {m.dwell ? "on" : "off"}
          </button>
          <p className="text-base text-body">Rest the pointer on a button and it clicks by itself after a moment. A bar shows the time left.</p>
          <label htmlFor="dwell-time" className="block font-semibold text-ink">Wait {(m.dwellMs / 1000).toFixed(1)} seconds</label>
          <input id="dwell-time" type="range" min={800} max={3000} step={100} value={m.dwellMs} onChange={(e) => set({ dwellMs: Number(e.target.value) })} className="block h-11 w-full accent-[var(--color-brand)]" />
        </div>
        <div className="space-y-3 rounded-3xl bg-white p-5 card-border">
          <fieldset>
            <legend className="mb-2 flex items-center gap-2 text-lg font-bold text-ink"><Timer className="size-5" aria-hidden /> Time to answer</legend>
            <div className="flex flex-wrap gap-2">
              {[[0, "No timer"], [1, "30 s"], [2, "1 min"], [3, "90 s"], [4, "2 min"]].map(([f, l]) => (
                <label key={f} data-scan className={`inline-flex min-h-12 cursor-pointer items-center rounded-full px-4 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand ${m.timeFactor === f ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`}>
                  <input type="radio" name="motor-time" className="sr-only" checked={m.timeFactor === f} onChange={() => set({ timeFactor: f as number })} />
                  {m.timeFactor === f && <span aria-hidden className="mr-1">✓</span>}{l}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-base text-body">A timer never marks you wrong. When it ends you can add more time with one press.</p>
        </div>
      </div>
    </section>
  );
}

// ---- lesson: one section at a time, then the questions --------------------------------------------
function MotorLesson({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const { settings, updateSettings, speakOne } = useStudent();
  const m = settings.motor;
  const btn = `${SIZE[m.size]} inline-flex items-center justify-center gap-3 rounded-3xl font-extrabold`;
  const [stage, setStage] = useState<"read" | "quiz" | "done">("read");
  const [s, setS] = useState(0);
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [extra, setExtra] = useState(0);
  const question = lesson.quiz[q];
  const base = BASE_SECONDS * m.timeFactor;
  const left = Math.max(0, base + extra - Math.floor((now - startedAt) / 1000));
  const timed = stage === "quiz" && m.timeFactor > 0 && picked === null;

  // The countdown just ticks the clock. It never picks an answer for you.
  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [timed]);

  const startQuestion = () => { setStartedAt(Date.now()); setNow(Date.now()); setExtra(0); };
  const addTime = () => setExtra((e) => e + Math.max(30, base));
  const next = () => {
    if (stage === "read") { if (s < lesson.sections.length - 1) setS(s + 1); else { setStage("quiz"); startQuestion(); } return; }
    if (stage === "quiz") { if (picked === null) return; if (q < lesson.quiz.length - 1) { setQ(q + 1); setPicked(null); startQuestion(); } else setStage("done"); }
  };
  const back = () => { if (stage === "read" && s > 0) setS(s - 1); };
  const pick = (o: string) => { if (picked !== null) return; setPicked(o); if (o === question.correctAnswer) setScore((x) => x + 1); };
  const listenNow = () => {
    if (stage === "read") { const sec = lesson.sections[s]; speakOne("ml", `${sec.heading}. ${sec.content}`); }
    else if (stage === "quiz") speakOne("ml", `${question.question}. ${question.options.map((o, i) => `${"ABCD"[i]}. ${o}`).join(". ")}`);
  };

  // Voice control.
  const act = useRef<(a: VoiceAct) => void>(() => {});
  useEffect(() => {
    act.current = (a) => {
      if (a.type === "next") next();
      else if (a.type === "back") back();
      else if (a.type === "start") { setStage("quiz"); setQ(0); setPicked(null); setScore(0); startQuestion(); }
      else if (a.type === "listen") listenNow();
      else if (a.type === "time") addTime();
      else if (a.type === "off") updateSettings({ motor: { ...m, voice: false } });
      else if (a.type === "help") speakOne("ml", "You can say: next, back, start quiz, select A, B, C or D, repeat, more time, or stop voice.");
      else if (a.type === "pick" && stage === "quiz" && question?.options[a.index]) pick(question.options[a.index]);
    };
  });
  const [supported] = useState(() => recognitionSupported());
  useEffect(() => {
    if (!m.voice || !supported) return;
    const l: Listener = listen({
      onHeard: (text) => { setHeard(text); const a = parseMotorVoice(text); if (a) act.current(a); },
      onError: () => updateSettings({ motor: { ...m, voice: false } }),
    });
    return () => l.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.voice, supported]);

  return (
    <section aria-labelledby="ml-h" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="ml-h" className="text-3xl font-bold text-ink">{lesson.title}</h2>
        <button type="button" data-scan onClick={onExit} className={`${btn} bg-white text-brand-deep card-border`}>Choose another lesson</button>
      </div>

      <div className="rounded-3xl bg-white p-6 card-border">
        <button type="button" data-scan aria-pressed={m.voice} disabled={!supported} onClick={() => updateSettings({ motor: { ...m, voice: !m.voice } })} className={`${btn} ${m.voice ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"} disabled:opacity-40`}>
          <Mic className="size-7" aria-hidden /> Voice control: {m.voice ? "on" : "off"}
        </button>
        <p className="mt-3 text-lg text-body" aria-live="polite">
          {!supported ? "Voice control needs Chrome, Edge or Safari." : m.voice ? `Listening. Say “next”, “back”, “select A”, “more time” or “help”.${heard ? ` Heard: “${heard}”.` : ""}` : "Say “next”, “select B” and more, hands free."}
        </p>
      </div>

      {stage === "read" && (
        <div className="space-y-6">
          <p className="text-lg font-semibold text-body">Part {s + 1} of {lesson.sections.length}</p>
          <div className="rounded-3xl bg-white p-8 card-border">
            <h3 className="text-3xl font-bold text-ink">{lesson.sections[s].heading}</h3>
            <p className="mt-4 max-w-prose text-2xl leading-[1.7] text-ink">{lesson.sections[s].content}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <button type="button" data-scan disabled={s === 0} onClick={back} className={`${btn} bg-white text-brand-deep card-border disabled:opacity-40`}>← Back</button>
            <button type="button" data-scan onClick={listenNow} className={`${btn} bg-tint-yellow text-ink card-border`}><Volume2 className="size-7" aria-hidden /> Listen</button>
            <button type="button" data-scan onClick={next} className={`${btn} bg-brand text-white`}>{s < lesson.sections.length - 1 ? "Next →" : "Start the questions →"}</button>
          </div>
        </div>
      )}

      {stage === "quiz" && question && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-body">Question {q + 1} of {lesson.quiz.length}</p>
            {timed && (
              <p role="timer" className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xl font-bold ${left === 0 ? "bg-tint-yellow text-ink ring-2 ring-amber-600" : "bg-white text-ink card-border"}`}>
                <Timer className="size-5" aria-hidden /> {left === 0 ? "No rush. Take your time." : `${left} seconds`}
              </p>
            )}
          </div>
          {timed && left === 0 && <button type="button" data-scan onClick={addTime} className={`${btn} w-full bg-tint-yellow text-ink ring-2 ring-amber-600`}>Add more time</button>}
          <div className="rounded-3xl bg-tint-yellow p-8 card-border">
            <h3 className="text-3xl font-bold leading-snug text-ink">{question.question}</h3>
            <button type="button" data-scan onClick={listenNow} className={`${btn} mt-4 bg-white text-brand-deep card-border`}><Volume2 className="size-7" aria-hidden /> Listen</button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {question.options.map((o, i) => {
              const right = picked !== null && o === question.correctAnswer;
              const wrong = picked === o && o !== question.correctAnswer;
              return (
                <li key={o}>
                  <button type="button" data-scan disabled={picked !== null} onClick={() => pick(o)} className={`${btn} w-full justify-start text-left ${right ? "bg-tint-green text-ink ring-4 ring-emerald-700" : wrong ? "bg-tint-pink text-ink ring-4 ring-rose-700" : "bg-white text-ink card-border"}`}>
                    <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-deep text-2xl text-white">{"ABCD"[i]}</span>
                    {o}{right && <span className="sr-only"> Correct answer</span>}{wrong && <span className="sr-only"> Your answer</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div aria-live="polite">
            {picked !== null && (
              <div className={`rounded-2xl p-6 text-2xl text-ink ring-2 ${picked === question.correctAnswer ? "bg-tint-green ring-emerald-700" : "bg-tint-yellow ring-amber-600"}`}>
                <p className="font-bold">{picked === question.correctAnswer ? "That's right!" : "Not quite."}</p>
                <p className="mt-1">{question.explanation}</p>
              </div>
            )}
          </div>
          {picked !== null && <button type="button" data-scan onClick={next} className={`${btn} w-full bg-brand text-white`}>{q < lesson.quiz.length - 1 ? "Next question →" : "See my score →"}</button>}
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-6 rounded-3xl bg-white p-8 card-border">
          <p className="text-6xl font-extrabold text-brand-deep">{score} out of {lesson.quiz.length}</p>
          <p className="text-2xl text-ink">{score === lesson.quiz.length ? "You got them all. Great work!" : "Good effort. You can try again any time."}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <button type="button" data-scan onClick={() => { setStage("read"); setS(0); setQ(0); setPicked(null); setScore(0); }} className={`${btn} bg-brand text-white`}>Start again</button>
            <button type="button" data-scan onClick={onExit} className={`${btn} bg-white text-brand-deep card-border`}>Choose another lesson</button>
          </div>
        </div>
      )}
    </section>
  );
}
