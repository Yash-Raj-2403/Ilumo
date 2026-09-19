"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, Mic, Plus, Square, Trash2, Volume2 } from "lucide-react";
import { GROUPS, QUICK, type Symbol } from "@/data/aac";
import type { Lesson } from "@/lib/lesson-types";
import { listen, recognitionSupported, type Listener } from "@/lib/voice/recognition";
import { LessonPicker } from "./lesson-picker";
import { useStudent } from "../student-provider";

// Speech & non-speaking support: a symbol communication board that speaks for you, typing that
// speaks, speech to text for those who can speak a little, and questions answered by tapping.

const TABS = [
  { id: "board", label: "Communication board" },
  { id: "type", label: "Type to talk" },
  { id: "say", label: "Speech to text" },
  { id: "tap", label: "Tap to answer" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function SpeechSupport() {
  const [tab, setTab] = useState<TabId>("board");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (dir || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const n = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + dir + TABS.length) % TABS.length;
      setTab(TABS[n].id);
      refs.current[TABS[n].id]?.focus();
    }
  }
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Speech &amp; Non-speaking Support</h1>
        <p className="mt-3 text-xl leading-relaxed text-body">
          You never have to speak to learn here. Tap pictures or type and ILUMO says it out loud. Answer questions by tapping, and use speech to text if you can speak.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
          {["Symbol communication", "Text to speech", "Speech to text", "Tap to answer", "No pressure to speak"].map((f) => (
            <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
          ))}
        </ul>
      </header>

      <div role="tablist" aria-label="Speech tools" className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            role="tab" id={`stab-${t.id}`} aria-selected={tab === t.id} aria-controls={`spanel-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)} onKeyDown={(e) => onKey(e, i)}
            className={`min-h-12 rounded-full px-6 text-lg font-bold ${tab === t.id ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}
          >
            {tab === t.id && <span aria-hidden className="mr-1">✓</span>}{t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`spanel-${tab}`} aria-labelledby={`stab-${tab}`} tabIndex={0} className="outline-none">
        {tab === "board" && <Board />}
        {tab === "type" && <TypeToTalk />}
        {tab === "say" && <SpeechToText />}
        {tab === "tap" && <TapToAnswer />}
      </div>
    </div>
  );
}

// ---- communication board -----------------------------------------------------------------------
function Board() {
  const { speakOne, stopQueue, settings, updateSettings } = useStudent();
  const [strip, setStrip] = useState<Symbol[]>([]);
  const [group, setGroup] = useState(GROUPS[0].id);
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const g = GROUPS.find((x) => x.id === group) ?? GROUPS[0];
  const custom = settings.aacCustom;
  const sentence = strip.map((s) => s.label).join(" ");
  const big = "flex min-h-28 flex-col items-center justify-center gap-1 rounded-3xl p-3 text-center text-lg font-bold text-ink card-border transition active:scale-95";

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim();
    if (!l || custom.length >= 24) return;
    updateSettings({ aacCustom: [...custom, { emoji: emoji.trim() || "⭐", label: l.slice(0, 40) }] });
    setEmoji("");
    setLabel("");
  }

  return (
    <section aria-labelledby="bd-h" className="space-y-6">
      <div>
        <h2 id="bd-h" className="text-3xl font-bold text-ink">Communication board</h2>
        <p className="mt-1 text-lg text-body">Tap pictures to build what you want to say. Then press Speak.</p>
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-5 card-border">
        <h3 className="text-xl font-bold text-ink">Say it now</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK.map((q) => (
            <li key={q.label}>
              <button type="button" onClick={() => speakOne("aac", q.label)} className={`${big} w-full bg-tint-purple`}>
                <span aria-hidden className="text-4xl">{q.emoji}</span>{q.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl bg-white p-5 card-border">
        <h3 className="mb-3 text-xl font-bold text-ink">My sentence</h3>
        <div aria-live="polite" className="flex min-h-24 flex-wrap items-center gap-3 rounded-2xl bg-canvas p-4 ring-2 ring-brand-deep/15">
          {strip.length === 0 && <p className="text-lg text-body">Tap pictures below to add them here.</p>}
          {strip.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xl font-bold text-ink card-border">
              <span aria-hidden className="text-3xl">{s.emoji}</span>{s.label}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={strip.length === 0} onClick={() => speakOne("aac", sentence)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-bold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] disabled:opacity-40">
            <Volume2 className="size-6" aria-hidden /> Speak
          </button>
          <button type="button" disabled={strip.length === 0} onClick={() => setStrip((s) => s.slice(0, -1))} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border disabled:opacity-40">
            <Delete className="size-5" aria-hidden /> Undo
          </button>
          <button type="button" disabled={strip.length === 0} onClick={() => { setStrip([]); stopQueue(); }} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border disabled:opacity-40">
            <Trash2 className="size-5" aria-hidden /> Clear
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div role="group" aria-label="Word groups" className="flex flex-wrap gap-2">
          {GROUPS.map((x) => (
            <button key={x.id} type="button" aria-pressed={group === x.id} onClick={() => setGroup(x.id)} className={`min-h-12 rounded-full px-5 font-bold ${group === x.id ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}>
              {group === x.id && <span aria-hidden className="mr-1">✓</span>}{x.title}
            </button>
          ))}
          {custom.length > 0 && (
            <button type="button" aria-pressed={group === "mine"} onClick={() => setGroup("mine")} className={`min-h-12 rounded-full px-5 font-bold ${group === "mine" ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}>
              {group === "mine" && <span aria-hidden className="mr-1">✓</span>}My words
            </button>
          )}
        </div>
        <ul className={`grid grid-cols-2 gap-3 rounded-3xl p-4 sm:grid-cols-3 lg:grid-cols-4 ${group === "mine" ? "bg-tint-yellow" : g.tint}`}>
          {(group === "mine" ? custom : g.items).map((s, i) => (
            <li key={`${s.label}-${i}`} className="relative">
              <button type="button" onClick={() => { setStrip((x) => [...x, s]); }} className={`${big} w-full bg-white`}>
                <span aria-hidden className="text-4xl">{s.emoji}</span>{s.label}
              </button>
              {group === "mine" && (
                <button type="button" onClick={() => updateSettings({ aacCustom: custom.filter((_, k) => k !== i) })} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-white text-rose-700 shadow ring-1 ring-rose-200">
                  <Trash2 className="size-4" aria-hidden /><span className="sr-only">Remove {s.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={addCustom} className="space-y-3 rounded-3xl bg-white p-5 card-border">
        <h3 className="text-xl font-bold text-ink">Add my own word</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label htmlFor="c-emoji" className="mb-1 block text-sm font-semibold text-brand-deep">Picture</label>
            <input id="c-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="🐶" className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-2xl outline-none focus:border-brand" />
          </div>
          <div className="min-w-56 flex-1">
            <label htmlFor="c-label" className="mb-1 block text-sm font-semibold text-brand-deep">Word or phrase</label>
            <input id="c-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. my dog" className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-lg outline-none focus:border-brand" />
          </div>
          <button type="submit" disabled={!label.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white disabled:opacity-40"><Plus className="size-5" aria-hidden /> Add</button>
        </div>
        <p className="text-sm text-body">Paste any emoji as the picture. Your words are saved to your account.</p>
      </form>
    </section>
  );
}

// ---- type to talk ---------------------------------------------------------------------------
function TypeToTalk() {
  const { speakOne, stopQueue, updateSettings, settings } = useStudent();
  const [text, setText] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  function speak(t: string) {
    const v = t.trim();
    if (!v) return;
    speakOne("type", v);
    setRecent((r) => [v, ...r.filter((x) => x !== v)].slice(0, 8));
  }
  return (
    <section aria-labelledby="tt-h" className="space-y-5">
      <div>
        <h2 id="tt-h" className="text-3xl font-bold text-ink">Type to talk</h2>
        <p className="mt-1 text-lg text-body">Type anything and ILUMO says it for you.</p>
      </div>
      <div className="space-y-3 rounded-3xl bg-white p-5 card-border">
        <label htmlFor="tt-text" className="block text-sm font-semibold text-brand-deep">What do you want to say?</label>
        <textarea id="tt-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white p-4 text-2xl outline-none focus:border-brand" />
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={!text.trim()} onClick={() => speak(text)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-bold text-white disabled:opacity-40"><Volume2 className="size-6" aria-hidden /> Speak</button>
          <button type="button" onClick={stopQueue} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border"><Square className="size-5" aria-hidden /> Stop</button>
          <button type="button" disabled={!text.trim() || settings.aacCustom.length >= 24} onClick={() => { updateSettings({ aacCustom: [...settings.aacCustom, { emoji: "💬", label: text.trim().slice(0, 40) }] }); }} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border disabled:opacity-40">Save to my words</button>
        </div>
      </div>
      {recent.length > 0 && (
        <div>
          <h3 className="mb-2 text-xl font-bold text-ink">Said recently</h3>
          <ul className="flex flex-wrap gap-2">
            {recent.map((r) => <li key={r}><button type="button" onClick={() => speak(r)} className="min-h-12 rounded-full bg-white px-5 text-lg font-semibold text-brand-deep card-border hover:bg-brand-soft">{r}</button></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---- speech to text ---------------------------------------------------------------------------
function SpeechToText() {
  const { speakOne } = useStudent();
  const [supported] = useState(() => recognitionSupported());
  const [on, setOn] = useState(false);
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const ref = useRef<Listener | null>(null);
  useEffect(() => () => ref.current?.stop(), []);

  const start = () => {
    setProblem(null);
    ref.current = listen({
      onHeard: (t) => { setText((x) => (x ? `${x} ${t}` : t)); setInterim(""); },
      onInterim: setInterim,
      onError: (k) => {
        ref.current = null;
        setOn(false);
        setProblem(k === "denied" ? "The microphone is blocked. Allow it in your browser's address bar." : k === "network" ? "Speech to text needs an internet connection." : "This browser can't do speech to text. Try Chrome, Edge or Safari.");
      },
    });
    setOn(true);
  };
  const stop = () => { ref.current?.stop(); ref.current = null; setOn(false); setInterim(""); };

  return (
    <section aria-labelledby="sp-h" className="space-y-5">
      <div>
        <h2 id="sp-h" className="text-3xl font-bold text-ink">Speech to text</h2>
        <p className="mt-1 text-lg text-body">If you can say some words, speak and they appear as text. You can fix any mistakes, then use them as an answer or have them spoken back.</p>
      </div>
      {!supported ? (
        <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-lg font-semibold text-ink">Speech to text needs Chrome, Edge or Safari.</p>
      ) : (
        <button type="button" onClick={on ? stop : start} className={`inline-flex min-h-14 items-center gap-3 rounded-full px-8 text-lg font-bold text-white ${on ? "bg-rose-700" : "bg-brand shadow-[0_10px_25px_rgba(91,77,245,0.35)]"}`}>
          {on ? <><Square className="size-5" aria-hidden /> Stop listening</> : <><Mic className="size-6" aria-hidden /> Start speaking</>}
        </button>
      )}
      {problem && <p role="alert" className="rounded-2xl bg-tint-pink p-4 text-lg font-semibold text-ink ring-1 ring-black/20">⚠ {problem}</p>}
      <div className="rounded-3xl bg-white p-5 card-border">
        <label htmlFor="sp-text" className="mb-2 block text-sm font-semibold text-brand-deep">Your words</label>
        <textarea id="sp-text" rows={5} value={on && interim ? `${text}${text ? " " : ""}${interim}` : text} onChange={(e) => setText(e.target.value)} readOnly={on && !!interim} className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white p-4 text-2xl outline-none focus:border-brand" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={!text.trim()} onClick={() => speakOne("stt", text)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white disabled:opacity-40"><Volume2 className="size-5" aria-hidden /> Speak it back</button>
          <button type="button" disabled={!text} onClick={() => setText("")} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-deep card-border disabled:opacity-40"><Trash2 className="size-5" aria-hidden /> Clear</button>
        </div>
      </div>
      <p className="text-base text-body">Your browser turns speech into text, and some browsers send the audio to their own service to do it. It can miss words, so check the text.</p>
    </section>
  );
}

// ---- tap to answer ------------------------------------------------------------------------------
function TapToAnswer() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  if (!lesson) {
    return (
      <section aria-labelledby="ta-h" className="space-y-5">
        <div>
          <h2 id="ta-h" className="text-3xl font-bold text-ink">Tap to answer</h2>
          <p className="mt-1 text-lg text-body">Answer questions by tapping a big button. No speaking or typing needed.</p>
        </div>
        <LessonPicker slug="speech" onPick={setLesson} />
      </section>
    );
  }
  return <TapQuiz lesson={lesson} onExit={() => setLesson(null)} />;
}

function TapQuiz({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const { speakOne } = useStudent();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = lesson.quiz[i];
  const ok = picked === q?.correctAnswer;
  const SHAPES = ["🔴", "🟦", "🟢", "🟨"]; // a symbol as well as a letter, so options don't depend on colour alone

  if (done) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-8 card-border">
        <h2 className="text-3xl font-bold text-ink">{lesson.title}</h2>
        <p className="text-5xl font-extrabold text-brand-deep">{score} out of {lesson.quiz.length}</p>
        <p className="text-xl text-ink">{score === lesson.quiz.length ? "You got them all. Great work!" : "Good effort. Try again any time."}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { setI(0); setPicked(null); setScore(0); setDone(false); }} className="min-h-14 rounded-full bg-brand px-8 text-lg font-bold text-white">Try again</button>
          <button type="button" onClick={onExit} className="min-h-14 rounded-full bg-white px-8 text-lg font-semibold text-brand-deep card-border">Choose another lesson</button>
        </div>
      </div>
    );
  }
  return (
    <section aria-labelledby="tq-h" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="tq-h" className="text-3xl font-bold text-ink">{lesson.title}</h2>
          <p className="text-lg text-body" aria-live="polite">Question {i + 1} of {lesson.quiz.length}</p>
        </div>
        <button type="button" onClick={onExit} className="min-h-12 rounded-full bg-white px-6 font-semibold text-brand-deep card-border">Choose another lesson</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-tint-yellow p-6 card-border">
        <p className="flex-1 text-3xl font-bold leading-snug text-ink">{q.question}</p>
        <button type="button" onClick={() => speakOne("tq", `${q.question}. ${q.options.join(". ")}`)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border"><Volume2 className="size-5" aria-hidden /> Hear</button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const right = picked !== null && o === q.correctAnswer;
          const wrong = picked === o && !ok;
          return (
            <li key={o} className="flex gap-2">
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => { setPicked(o); if (o === q.correctAnswer) setScore((s) => s + 1); }}
                className={`flex min-h-28 flex-1 items-center gap-4 rounded-3xl p-5 text-left text-2xl font-bold text-ink ${right ? "bg-tint-green ring-4 ring-emerald-700" : wrong ? "bg-tint-pink ring-4 ring-rose-700" : "bg-white card-border hover:bg-brand-soft"}`}
              >
                <span aria-hidden className="text-4xl">{right ? "✅" : wrong ? "❌" : SHAPES[k % 4]}</span>
                <span className="sr-only">Option {"ABCD"[k]}: </span>{o}
              </button>
              <button type="button" onClick={() => speakOne("tq-o", o)} className="grid w-14 place-items-center rounded-3xl bg-white text-brand-deep card-border" aria-label={`Hear option ${"ABCD"[k]}`}><Volume2 className="size-6" aria-hidden /></button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {picked !== null && (
          <div className={`rounded-2xl p-5 text-xl text-ink ring-2 ${ok ? "bg-tint-green ring-emerald-700" : "bg-tint-yellow ring-amber-600"}`}>
            <p className="font-bold">{ok ? "That's right!" : "Not quite."}</p>
            <p className="mt-1">{q.explanation}</p>
          </div>
        )}
      </div>
      {picked !== null && (
        <button type="button" onClick={() => (i === lesson.quiz.length - 1 ? setDone(true) : (setI(i + 1), setPicked(null)))} className="min-h-14 rounded-full bg-brand px-10 text-lg font-bold text-white">
          {i === lesson.quiz.length - 1 ? "See my score" : "Next question"}
        </button>
      )}
    </section>
  );
}
