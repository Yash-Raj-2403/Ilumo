"use client";

import { useMemo, useRef, useState } from "react";
import { Eye, RotateCw, Square, Volume2 } from "lucide-react";
import type { Lesson } from "@/lib/lesson-types";
import { pieces, syllables, TEAMS } from "@/lib/syllables";
import { speakText, stopSpeech } from "@/lib/speech";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { FlipCard } from "../flashcards";
import { LessonPicker } from "./lesson-picker";
import { useStudent } from "../student-provider";

// Learning-disability support (dyslexia and other reading difficulties): comfortable reading,
// reading aloud with the word highlighted, simpler wording, sounding words out, practice that
// repeats until it sticks, and a picture map of the lesson.

const TABS = [
  { id: "read", label: "Read easily" },
  { id: "sound", label: "Sound it out" },
  { id: "practice", label: "Practice" },
  { id: "map", label: "Picture map" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function LearningSupport() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<TabId>("read");
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
        <h1 className="text-4xl font-bold tracking-tight text-ink">Learning Disabilities Support</h1>
        <p className="mt-3 text-xl leading-relaxed text-body">
          Reading made comfortable: easy fonts and spacing, words highlighted as they are read to you, simpler wording, sounding words out, and practice that repeats until it sticks.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
          {["Dyslexia-friendly reading", "Read aloud", "Phonics", "Simpler text", "Extra practice", "Visual learning"].map((f) => (
            <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
          ))}
        </ul>
      </header>

      {!lesson ? (
        <LessonPicker slug="learning" onPick={setLesson} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-ink">Lesson: {lesson.title}</p>
            <button type="button" onClick={() => { stopSpeech(); setLesson(null); }} className="min-h-12 rounded-full bg-white px-6 font-semibold text-brand-deep card-border hover:bg-brand-soft">Choose another lesson</button>
          </div>
          <div role="tablist" aria-label="Learning tools" className="flex flex-wrap gap-2">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => { refs.current[t.id] = el; }}
                role="tab" id={`ltab-${t.id}`} aria-selected={tab === t.id} aria-controls={`lpanel-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
                onClick={() => { stopSpeech(); setTab(t.id); }} onKeyDown={(e) => onKey(e, i)}
                className={`min-h-12 rounded-full px-6 text-lg font-bold ${tab === t.id ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}
              >
                {tab === t.id && <span aria-hidden className="mr-1">✓</span>}{t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`lpanel-${tab}`} aria-labelledby={`ltab-${tab}`} tabIndex={0} className="outline-none">
            {tab === "read" && <ReadEasily lesson={lesson} />}
            {tab === "sound" && <SoundItOut lesson={lesson} />}
            {tab === "practice" && <Practice lesson={lesson} />}
            {tab === "map" && <PictureMap lesson={lesson} />}
          </div>
        </>
      )}
    </div>
  );
}

// ---- read easily ---------------------------------------------------------------------------------------
const TINTS = { none: "#ffffff", cream: "#fbf3dc", blue: "#e6f1fb", peach: "#fde8d9", green: "#e6f4ea" } as const;
const FONTS = {
  standard: "var(--font-outfit), system-ui, sans-serif",
  lexend: "var(--font-lexend), system-ui, sans-serif",
  atkinson: "var(--font-atkinson), system-ui, sans-serif",
} as const;

/** Shorten long sentences without changing the words: break at commas, "and", "which", ";". Used when the AI is unavailable. */
export function simplifyLocal(text: string): string {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text])
    .flatMap((sent) => {
      const s = sent.trim();
      if (s.split(/\s+/).length <= 16) return [s];
      return s.split(/;\s+|,\s+(?=(?:and|but|which|so|because|while)\b)|\s+(?=which\b)/).map((p) => p.trim()).filter(Boolean);
    })
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/[,;]$/, "").replace(/([^.!?])$/, "$1."))
    .join(" ");
}

function ReadEasily({ lesson }: { lesson: Lesson }) {
  const { settings, updateSettings } = useStudent();
  const r = settings.reading;
  const set = (patch: Partial<typeof r>) => updateSettings({ reading: { ...r, ...patch } });
  const [active, setActive] = useState<{ s: number; w: number } | null>(null);
  const [simple, setSimple] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rulerY, setRulerY] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const texts = useMemo(() => lesson.sections.map((s) => `${s.heading}. ${s.content}`), [lesson]);

  const style: React.CSSProperties = {
    fontFamily: FONTS[r.font], fontSize: `${r.size}rem`, lineHeight: r.lineHeight, letterSpacing: `${r.letterSpacing}em`,
    wordSpacing: `${r.letterSpacing * 2}em`, background: TINTS[r.tint], color: "#1b1b1b",
  };

  /** Read one section aloud, lighting up each word as it is said, then carry on if asked. */
  function readFrom(index: number, chain: boolean) {
    stopSpeech();
    if (index >= texts.length) return setActive(null);
    const text = texts[index];
    const starts: number[] = [];
    text.replace(/\S+/g, (w, off: number) => { starts.push(off); return w; });
    setActive({ s: index, w: 0 });
    speakText(text, {
      rate: settings.speechRate,
      onBoundary: (ci) => {
        let w = 0;
        for (let k = 0; k < starts.length; k++) if (starts[k] <= ci) w = k;
        setActive({ s: index, w });
      },
      onEnd: () => (chain ? readFrom(index + 1, true) : setActive(null)),
      onError: () => setActive(null),
    });
  }
  const stop = () => { stopSpeech(); setActive(null); };

  async function simplify(i: number) {
    setBusy(i);
    setNote(null);
    try {
      const res = await authedFetch("/api/voice/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Rewrite this in very simple words with very short sentences.", mode: "explain", title: lesson.title, material: texts[i], current: texts[i], history: [] }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) throw new Error();
      setSimple((m) => ({ ...m, [i]: data.answer }));
    } catch {
      setSimple((m) => ({ ...m, [i]: simplifyLocal(lesson.sections[i].content) }));
      setNote("The AI is busy, so ILUMO shortened the sentences itself.");
    } finally {
      setBusy(null);
    }
  }

  const chip = (on: boolean) => `inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`;
  const btn = "inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold";
  const slider = "block h-11 w-full accent-[var(--color-brand)]";

  return (
    <section aria-labelledby="re-h" className="space-y-6">
      <h2 id="re-h" className="sr-only">Read easily</h2>

      <div className="space-y-5 rounded-3xl bg-white p-5 card-border sm:p-6">
        <h3 className="text-xl font-bold text-ink">Make it comfortable</h3>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-body">Font</legend>
            <div className="flex flex-wrap gap-2">
              {([["lexend", "Lexend"], ["atkinson", "Atkinson Hyperlegible"], ["standard", "Standard"]] as const).map(([id, l]) => (
                <label key={id} className={chip(r.font === id)}><input type="radio" name="font" className="sr-only" checked={r.font === id} onChange={() => set({ font: id })} />{r.font === id && <span aria-hidden className="mr-1">✓</span>}{l}</label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-body">Background</legend>
            <div className="flex flex-wrap gap-2">
              {([["cream", "Cream"], ["blue", "Blue"], ["peach", "Peach"], ["green", "Green"], ["none", "White"]] as const).map(([id, l]) => (
                <label key={id} className={chip(r.tint === id)}><input type="radio" name="tint" className="sr-only" checked={r.tint === id} onChange={() => set({ tint: id })} />{r.tint === id && <span aria-hidden className="mr-1">✓</span>}{l}</label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="r-size" className="block font-semibold text-ink">Text size</label><input id="r-size" type="range" min={1} max={2} step={0.05} value={r.size} onChange={(e) => set({ size: Number(e.target.value) })} className={slider} /></div>
          <div><label htmlFor="r-line" className="block font-semibold text-ink">Space between lines</label><input id="r-line" type="range" min={1.4} max={2.6} step={0.1} value={r.lineHeight} onChange={(e) => set({ lineHeight: Number(e.target.value) })} className={slider} /></div>
          <div><label htmlFor="r-letter" className="block font-semibold text-ink">Space between letters</label><input id="r-letter" type="range" min={0} max={0.15} step={0.01} value={r.letterSpacing} onChange={(e) => set({ letterSpacing: Number(e.target.value) })} className={slider} /></div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-lg font-semibold text-ink">
          <input type="checkbox" checked={r.ruler} onChange={(e) => set({ ruler: e.target.checked })} className="size-6 accent-[var(--color-brand)]" />
          Reading ruler (a band that follows your pointer, or the up and down arrow keys)
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => readFrom(0, true)} className={`${btn} bg-brand text-white`}><Volume2 className="size-5" aria-hidden /> Read it all to me</button>
          <button type="button" onClick={stop} className={`${btn} bg-white text-brand-deep card-border`}><Square className="size-4" aria-hidden /> Stop</button>
        </div>
      </div>
      <p aria-live="polite" className={note ? "rounded-2xl bg-tint-yellow p-3 font-semibold text-ink" : "sr-only"}>{note}</p>

      <div
        ref={box}
        tabIndex={r.ruler ? 0 : -1}
        aria-label="Lesson text"
        onPointerMove={(e) => r.ruler && setRulerY(e.clientY - (box.current?.getBoundingClientRect().top ?? 0))}
        onKeyDown={(e) => {
          if (!r.ruler) return;
          const step = r.size * 16 * r.lineHeight;
          if (e.key === "ArrowDown") { e.preventDefault(); setRulerY((y) => (y ?? 0) + step); }
          if (e.key === "ArrowUp") { e.preventDefault(); setRulerY((y) => Math.max(0, (y ?? 0) - step)); }
        }}
        style={style}
        className="relative overflow-hidden rounded-3xl p-6 card-border sm:p-10"
      >
        {r.ruler && rulerY !== null && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 bg-yellow-300/40 ring-y-2" style={{ top: rulerY - r.size * 8 * r.lineHeight, height: r.size * 16 * r.lineHeight }} />
        )}
        <h3 className="mb-6 text-[1.3em] font-bold">{lesson.title}</h3>
        <div className="max-w-[65ch] space-y-10">
          {lesson.sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-[1.15em] font-bold">
                <Words text={s.heading} on={active?.s === i ? active.w : null} offset={0} />
              </h4>
              <p className="mt-2">
                <Words text={s.content} on={active?.s === i ? active.w : null} offset={s.heading.split(/\s+/).length + 0} />
              </p>
              <div className="mt-3 flex flex-wrap gap-2 font-sans [letter-spacing:0]" style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: "1rem", lineHeight: 1.4, wordSpacing: 0 }}>
                <button type="button" onClick={() => readFrom(i, false)} className={`${btn} bg-white text-brand-deep card-border`}><Volume2 className="size-4" aria-hidden /> Read this part<span className="sr-only">: {s.heading}</span></button>
                <button type="button" onClick={() => simplify(i)} disabled={busy === i} className={`${btn} bg-white text-brand-deep card-border disabled:opacity-60`}><Eye className="size-4" aria-hidden /> {busy === i ? "Simplifying..." : "Simpler words"}<span className="sr-only">: {s.heading}</span></button>
              </div>
              {simple[i] && (
                <div className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
                  <p className="font-bold">In simpler words</p>
                  <p className="mt-1">{simple[i]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Text split into words so one can be highlighted while it is read out. */
function Words({ text, on, offset }: { text: string; on: number | null; offset: number }) {
  // `on` counts words across "heading. content", so the content's words start after the heading's.
  const words = text.split(/(\s+)/);
  let n = 0;
  return (
    <>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return w;
        const idx = offset + n++;
        return <span key={i} className={on === idx ? "rounded bg-yellow-300 px-0.5 text-black" : undefined}>{w}</span>;
      })}
    </>
  );
}

// ---- sound it out ------------------------------------------------------------------------------------
function candidateWords(lesson: Lesson): string[] {
  const out: string[] = [];
  const add = (w: string) => { const c = w.toLowerCase().replace(/[^a-z]/g, ""); if (c.length >= 5 && !out.includes(c)) out.push(c); };
  lesson.importantTerms.forEach((t) => t.term.split(/\s+/).forEach(add));
  lesson.sections.forEach((s) => s.content.split(/\s+/).forEach((w) => w.replace(/[^a-z]/gi, "").length >= 7 && add(w)));
  return out.slice(0, 16);
}

function SoundItOut({ lesson }: { lesson: Lesson }) {
  const { settings } = useStudent();
  const words = useMemo(() => candidateWords(lesson), [lesson]);
  const [word, setWord] = useState(words[0] ?? "photosynthesis");
  const [typed, setTyped] = useState("");
  const parts = syllables(word);
  const ps = pieces(word);
  const usedTeams = TEAMS.filter((t) => word.includes(t.team));
  const say = (t: string, rate = settings.speechRate) => { stopSpeech(); speakText(t, { rate }); };

  function soundByPart() {
    stopSpeech();
    let i = 0;
    const next = () => {
      if (i >= parts.length) return speakText(word, { rate: settings.speechRate });
      speakText(parts[i++], { rate: 0.6, onEnd: () => setTimeout(next, 350) });
    };
    next();
  }

  return (
    <section aria-labelledby="so-h" className="space-y-6">
      <div>
        <h2 id="so-h" className="text-3xl font-bold text-ink">Sound it out</h2>
        <p className="mt-1 text-lg text-body">Pick a word. See it in parts, and hear each part on its own.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <ul className="flex flex-wrap gap-2" aria-label="Words from your lesson">
          {words.map((w) => (
            <li key={w}><button type="button" aria-pressed={w === word} onClick={() => setWord(w)} className={`min-h-12 rounded-full px-5 text-lg font-bold ${w === word ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}>{w}</button></li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const t = typed.trim().toLowerCase().replace(/[^a-z]/g, ""); if (t) { setWord(t); setTyped(""); } }} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="own-word" className="mb-1 block text-sm font-semibold text-brand-deep">Try any word</label>
          <input id="own-word" value={typed} onChange={(e) => setTyped(e.target.value)} className="rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-xl outline-none focus:border-brand" />
        </div>
        <button type="submit" disabled={!typed.trim()} className="min-h-12 rounded-full bg-brand-deep px-6 font-semibold text-white disabled:opacity-40">Show me</button>
      </form>

      <div className="rounded-3xl bg-white p-6 card-border sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">The word</p>
        <p className="mt-2 text-5xl font-extrabold tracking-wide sm:text-7xl" aria-label={word} style={{ fontFamily: FONTS.lexend }}>
          {ps.map((p, i) => (
            <span key={i} className={p.kind === "vowel" ? "text-blue-700" : p.kind === "team" ? "rounded bg-orange-200 px-0.5 text-orange-900 underline decoration-4 underline-offset-8" : "text-ink"}>{p.text}</span>
          ))}
        </p>
        <p className="mt-2 text-base text-body"><span className="font-bold text-blue-700">Blue</span> letters are vowels. <span className="font-bold text-orange-900">Underlined orange</span> letters work as a team.</p>

        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-brand">In parts ({parts.length})</p>
        <ul className="mt-2 flex flex-wrap items-center gap-3">
          {parts.map((s, i) => (
            <li key={i}><button type="button" onClick={() => say(s, 0.6)} className="min-h-16 rounded-2xl bg-tint-blue px-6 text-3xl font-extrabold text-ink card-border hover:bg-brand-soft" style={{ fontFamily: FONTS.lexend }}>{s}<span className="sr-only">, hear this part</span></button></li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => say(word)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-bold text-white"><Volume2 className="size-6" aria-hidden /> Hear the word</button>
          <button type="button" onClick={soundByPart} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-bold text-brand-deep card-border"><Volume2 className="size-5" aria-hidden /> Hear it part by part</button>
        </div>

        {usedTeams.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Letter teams in this word</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {usedTeams.map((t) => <li key={t.team} className="rounded-2xl bg-tint-yellow px-4 py-3 text-lg text-ink"><strong>{t.team}</strong> says <strong>“{t.sound}”</strong></li>)}
            </ul>
          </div>
        )}
        <p className="mt-6 text-sm text-body">Splitting words into parts is a helpful guide, but English has many exceptions. Your voice may say some parts a little differently.</p>
      </div>
    </section>
  );
}

// ---- practice that repeats ---------------------------------------------------------------------------
type Item = { id: string; front: string; back: string; note?: string };

function Practice({ lesson }: { lesson: Lesson }) {
  const items = useMemo<Item[]>(
    () => [
      ...lesson.importantTerms.map((t, i) => ({ id: `t${i}`, front: `What does “${t.term}” mean?`, back: t.meaning })),
      ...lesson.quiz.map((q, i) => ({ id: `q${i}`, front: q.question, back: q.correctAnswer, note: q.explanation })),
    ],
    [lesson],
  );
  const NEED = 2; // right twice in a row to be done with a card
  const [queue, setQueue] = useState<string[]>(() => items.map((i) => i.id));
  const [streak, setStreak] = useState<Record<string, number>>({});
  const [tries, setTries] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const byId = (id: string) => items.find((i) => i.id === id)!;
  const done = queue.length === 0;
  const mastered = items.length - queue.length;

  function answer(gotIt: boolean) {
    const id = queue[0];
    const s = gotIt ? (streak[id] ?? 0) + 1 : 0;
    setStreak((m) => ({ ...m, [id]: s }));
    setTries((t) => t + 1);
    const rest = queue.slice(1);
    if (gotIt && s >= NEED) setQueue(rest); // learned it
    else {
      const at = Math.min(gotIt ? 4 : 2, rest.length); // a missed card comes back sooner
      setQueue([...rest.slice(0, at), id, ...rest.slice(at)]);
    }
    setFlipped(false);
  }
  function restart() { setQueue(items.map((i) => i.id)); setStreak({}); setTries(0); setFlipped(false); }

  if (items.length === 0) return <p className="text-lg text-body">This lesson has nothing to practise yet.</p>;
  if (done) {
    return (
      <div className="space-y-4 rounded-3xl bg-tint-green p-8 card-border">
        <h2 className="text-3xl font-bold text-ink">You know them all! 🎉</h2>
        <p className="text-xl text-ink">You went through {items.length} cards in {tries} tries. Coming back to practise again in a day or two helps it stay.</p>
        <button type="button" onClick={restart} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-bold text-white"><RotateCw className="size-5" aria-hidden /> Practise again</button>
      </div>
    );
  }
  const card = byId(queue[0]);
  return (
    <section aria-labelledby="pr-h" className="space-y-6">
      <div>
        <h2 id="pr-h" className="text-3xl font-bold text-ink">Practice until it sticks</h2>
        <p className="mt-1 text-lg text-body">Look at the card, think, then flip it. Cards you miss come back soon. A card is done when you get it right twice in a row.</p>
      </div>
      <div className="max-w-2xl space-y-2">
        <div role="progressbar" aria-label="Cards learned" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={mastered} className="h-4 overflow-hidden rounded-full bg-brand-soft ring-1 ring-brand-deep/15">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(mastered / items.length) * 100}%` }} />
        </div>
        <p className="text-base font-semibold text-body">{mastered} of {items.length} learned · {queue.length} to go</p>
      </div>

      <div className="max-w-2xl">
        <div className="relative">
          <FlipCard key={card.id + tries} front={card.front} back={<><p className="text-2xl font-bold">{card.back}</p>{card.note && <p className="text-lg text-white/90">{card.note}</p>}</>} frontLabel="Think about it" backLabel="Answer" flipped={flipped} tint="bg-tint-yellow" heightClass="min-h-72" />
          <button type="button" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped} className="absolute inset-0 z-10 rounded-3xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand">
            <span className="sr-only">{flipped ? `Answer: ${card.back}. Select to see the question again.` : `Question: ${card.front}. Select to flip and see the answer.`}</span>
          </button>
        </div>
        {flipped && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => answer(false)} className="min-h-16 rounded-3xl bg-tint-pink px-6 text-xl font-bold text-ink ring-2 ring-rose-700">Not yet</button>
            <button type="button" onClick={() => answer(true)} className="min-h-16 rounded-3xl bg-tint-green px-6 text-xl font-bold text-ink ring-2 ring-emerald-700">I got it</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---- picture map --------------------------------------------------------------------------------------
const EMOJI: [RegExp, string][] = [
  [/sun|light|energy/i, "☀️"], [/water|rain|river|ocean/i, "💧"], [/plant|leaf|leaves|tree|flower|seed/i, "🌱"], [/root|soil/i, "🌿"],
  [/oxygen|air|breath|gas|carbon/i, "💨"], [/food|sugar|eat|nutri/i, "🍎"], [/earth|planet|moon|space|star/i, "🌍"], [/animal|body|heart|brain/i, "🧠"],
  [/number|add|fraction|math|equation/i, "🔢"], [/history|war|king|ancient/i, "🏛️"], [/machine|force|motion|electric/i, "⚙️"],
];
const FALLBACK = ["📘", "🔎", "🧩", "⭐", "💡", "🎯"];
const TINTS_MAP = ["bg-tint-yellow", "bg-tint-blue", "bg-tint-green", "bg-tint-pink", "bg-tint-purple", "bg-tint-yellow"];

function PictureMap({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section aria-labelledby="pm-h" className="space-y-6">
      <div>
        <h2 id="pm-h" className="text-3xl font-bold text-ink">Picture map</h2>
        <p className="mt-1 text-lg text-body">The whole lesson at a glance. Each branch is one idea. Select a branch to open it.</p>
      </div>
      <div className="flex justify-center">
        <div className="rounded-3xl bg-brand-deep px-8 py-6 text-center text-3xl font-extrabold text-white shadow-xl">{lesson.title}</div>
      </div>
      <ul className="relative mx-auto max-w-3xl space-y-4 border-l-4 border-brand/30 pl-6 sm:pl-10">
        {lesson.sections.map((s, i) => {
          const emoji = EMOJI.find(([re]) => re.test(`${s.heading} ${s.content}`))?.[1] ?? FALLBACK[i % FALLBACK.length];
          const terms = lesson.importantTerms.filter((t) => new RegExp(`\\b${t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s.content + " " + s.heading));
          const on = open === i;
          const first = (s.content.match(/[^.!?]+[.!?]+/)?.[0] ?? s.content).trim();
          return (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[2.15rem] top-8 h-1 w-6 bg-brand/30 sm:-left-[3.15rem] sm:w-10" />
              <div className={`rounded-3xl ${TINTS_MAP[i % TINTS_MAP.length]} p-5 card-border`}>
                <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)} className="flex w-full items-center gap-4 text-left">
                  <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-4xl shadow">{emoji}</span>
                  <span className="text-2xl font-bold text-ink">{s.heading}</span>
                </button>
                {terms.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Key words">
                    {terms.map((t) => <li key={t.term} className="rounded-full bg-white px-4 py-1.5 font-bold text-brand-deep ring-1 ring-brand-deep/15">{t.term}</li>)}
                  </ul>
                )}
                {on && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-white p-4">
                    <p className="text-xl leading-relaxed text-ink">{first}</p>
                    <button type="button" onClick={() => { stopSpeech(); speakText(`${s.heading}. ${s.content}`); }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-deep px-5 font-semibold text-white"><Volume2 className="size-4" aria-hidden /> Hear this idea</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
