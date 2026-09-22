"use client";

import { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Send } from "lucide-react";
import sampleLesson from "@/data/mockPhotosynthesisLesson.json";
import type { LessonContent } from "@/lib/lesson-types";
import { lessonsFor } from "@/lib/categories";
import { authedFetch } from "@/lib/session/authed-fetch";
import { findBestBlock } from "@/lib/voice/commands";
import { useStudent } from "../student-provider";
import { useNotify } from "./visual-alerts";

// Lessons in text and pictures only: numbered steps, short sentences, plain-language help,
// sign-language look-ups and videos, questions asked by typing, and a text quiz.

const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
const card = "rounded-3xl bg-white p-6 card-border sm:p-8";
const btn = "inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-semibold";

type Pick = { key: string; title: string; content: LessonContent };

export function DeafLesson() {
  const { lessons: all } = useStudent();
  const lessons = lessonsFor(all, "deaf-hoh");
  const [pick, setPick] = useState<Pick | null>(null);

  if (!pick) {
    return (
      <section aria-labelledby="dl-h" className="space-y-6">
        <div>
          <h2 id="dl-h" className="text-3xl font-bold text-ink">Lessons you can see</h2>
          <p className="mt-2 max-w-2xl text-lg text-body">Step-by-step pictures and short sentences, sign-language help, and everything by text. No sound needed.</p>
        </div>
        <SignLookup />
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <button type="button" onClick={() => setPick({ key: "sample", title: "Photosynthesis", content: sampleLesson as LessonContent })} className={`${card} w-full text-left hover:bg-brand-soft`}>
              <span className="block text-xl font-bold text-ink">Photosynthesis</span>
              <span className="text-body">Sample lesson</span>
            </button>
          </li>
          {lessons.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => setPick({ key: l.id, title: l.title, content: l })} className={`${card} w-full text-left hover:bg-brand-soft`}>
                <span className="block text-xl font-bold text-ink">{l.title}</span>
                <span className="line-clamp-2 text-body">{l.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return <Lesson key={pick.key} pick={pick} onExit={() => setPick(null)} />;
}

// ---- sign language look-ups ------------------------------------------------------------------
const signLinks = (word: string) => {
  const w = encodeURIComponent(word.trim().toLowerCase());
  return [
    { label: "ASL", href: `https://www.signasl.org/sign/${w}` },
    { label: "BSL", href: `https://www.signbsl.com/sign/${w}` },
    { label: "Videos", href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`sign language ${word.trim()}`)}` },
  ];
};

function SignLinks({ word }: { word: string }) {
  return (
    <span className="flex flex-wrap gap-2">
      {signLinks(word).map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-brand-deep card-border hover:bg-brand-soft">
          {l.label} <ExternalLink className="size-3.5" aria-hidden /> <span className="sr-only">for {word}, opens in a new tab</span>
        </a>
      ))}
    </span>
  );
}

function SignLookup() {
  const [word, setWord] = useState("");
  return (
    <div className="rounded-3xl bg-tint-purple p-6 card-border">
      <h3 className="text-xl font-bold text-ink">Find the sign for a word</h3>
      <p className="mt-1 text-body">Type a word and open a sign-language dictionary or video search in a new tab.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="sign-word" className="mb-1 block text-sm font-semibold text-brand-deep">Word</label>
          <input id="sign-word" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. photosynthesis" className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-lg outline-none focus:border-brand" />
        </div>
        {word.trim() && <SignLinks word={word} />}
      </div>
    </div>
  );
}

// ---- sign-language video for a lesson -----------------------------------------------------------
function embedFor(url: string): { kind: "iframe" | "video" | "link"; src: string } | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com") {
    const id = u.pathname.match(/\/(\d+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|ogv)$/i.test(u.pathname)) return { kind: "video", src: url };
  return { kind: "link", src: url };
}

function SignVideo({ lessonKey }: { lessonKey: string }) {
  const { settings, updateSettings } = useStudent();
  const saved = settings.signVideos[lessonKey];
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const embed = saved ? embedFor(saved) : null;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!embedFor(v)) return setError("Please paste a web address that starts with https://");
    updateSettings({ signVideos: { ...settings.signVideos, [lessonKey]: v } });
    setUrl("");
    setError(null);
  }
  function remove() {
    const rest = { ...settings.signVideos };
    delete rest[lessonKey];
    updateSettings({ signVideos: rest });
  }

  return (
    <section aria-labelledby="sv-h" className={`${card} space-y-4`}>
      <h3 id="sv-h" className="text-2xl font-bold text-ink">Sign-language video</h3>
      {saved && embed ? (
        <div className="space-y-3">
          {embed.kind === "iframe" && <iframe src={embed.src} title="Sign-language video for this lesson" allowFullScreen className="aspect-video w-full rounded-2xl bg-black" />}
          {embed.kind === "video" && <video src={embed.src} controls className="aspect-video w-full rounded-2xl bg-black" />}
          {embed.kind === "link" && <a href={embed.src} target="_blank" rel="noopener noreferrer" className={`${btn} bg-brand-deep text-white`}>Open the sign-language video <ExternalLink className="size-4" aria-hidden /></a>}
          <button type="button" onClick={remove} className={`${btn} bg-white text-brand-deep card-border`}>Remove this video</button>
        </div>
      ) : (
        <form onSubmit={save} noValidate className="space-y-3">
          <p className="text-lg text-body">
            ILUMO doesn&apos;t make sign-language videos yet. If your teacher, parent or an interpreter has one for this lesson, paste its link here (YouTube, Vimeo or a video file) and it will play right here next time too.
          </p>
          <label htmlFor="sv-url" className="block text-sm font-semibold text-brand-deep">Video link</label>
          <input id="sv-url" value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }} placeholder="https://" inputMode="url" className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-lg outline-none focus:border-brand" />
          <div aria-live="assertive">{error && <p role="alert" className="font-semibold text-rose-700">⚠ {error}</p>}</div>
          <button type="submit" className={`${btn} bg-brand-deep text-white`}>Save video</button>
        </form>
      )}
    </section>
  );
}

// ---- the lesson ---------------------------------------------------------------------------------
function Lesson({ pick, onExit }: { pick: Pick; onExit: () => void }) {
  const { content: c } = pick;
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">{pick.title}</h2>
          <p className="mt-1 text-lg text-body">{c.summary}</p>
        </div>
        <button type="button" onClick={onExit} className={`${btn} bg-white text-brand-deep card-border`}>Choose another lesson</button>
      </div>

      <Steps lesson={c} />
      <Terms lesson={c} />
      <SignVideo lessonKey={pick.key} />
      <Ask lesson={c} title={pick.title} />
      <Quiz lesson={c} />
    </div>
  );
}

function Steps({ lesson }: { lesson: LessonContent }) {
  const notify = useNotify();
  const [simple, setSimple] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function simpler(i: number) {
    const s = lesson.sections[i];
    setBusy(i);
    try {
      const res = await authedFetch("/api/voice/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Explain this in very simple words with very short sentences, for someone who finds long sentences hard to read.",
          mode: "explain", title: lesson.title, material: `${s.heading}. ${s.content}`, current: `${s.heading}. ${s.content}`, history: [],
        }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) throw new Error();
      setSimple((m) => ({ ...m, [i]: data.answer }));
    } catch {
      notify("We couldn't simplify that right now. The steps above are already in short sentences.", "warning");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="st-h" className="space-y-5">
      <h3 id="st-h" className="text-3xl font-bold text-ink">Steps</h3>
      <ol className="space-y-5">
        {lesson.sections.map((s, i) => (
          <li key={i} className={`${card} flex gap-5`}>
            <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-deep text-2xl font-extrabold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-3">
              <h4 className="flex items-center gap-2 text-2xl font-bold text-ink"><BookOpen className="size-6 text-brand" aria-hidden /> <span><span className="sr-only">Step {i + 1}: </span>{s.heading}</span></h4>
              <ul className="space-y-2">
                {sentences(s.content).map((line, n) => (
                  <li key={n} className="flex gap-3 text-xl leading-relaxed text-ink"><span aria-hidden className="mt-3 size-2.5 shrink-0 rounded-full bg-brand" />{line}</li>
                ))}
              </ul>
              {simple[i] ? (
                <div className="rounded-2xl bg-tint-yellow p-4 text-xl text-ink ring-1 ring-black/10">
                  <p className="font-bold">In simpler words</p>
                  <p className="mt-1">{simple[i]}</p>
                </div>
              ) : (
                <button type="button" onClick={() => simpler(i)} disabled={busy === i} className={`${btn} bg-white text-brand-deep card-border hover:bg-brand-soft disabled:opacity-60`}>
                  {busy === i ? "Making it simpler..." : "Say it in simpler words"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Terms({ lesson }: { lesson: LessonContent }) {
  if (lesson.importantTerms.length === 0) return null;
  return (
    <section aria-labelledby="tm-h" className="space-y-4">
      <h3 id="tm-h" className="text-3xl font-bold text-ink">Important words</h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        {lesson.importantTerms.map((t) => (
          <li key={t.term} className="space-y-3 rounded-3xl bg-tint-blue p-5 card-border">
            <p className="text-xl font-bold text-brand-deep">{t.term}</p>
            <p className="text-lg text-ink">{t.meaning}</p>
            <div>
              <p className="mb-1 text-sm font-semibold text-body">See the sign</p>
              <SignLinks word={t.term} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Ask({ lesson, title }: { lesson: LessonContent; title: string }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const material = useMemo(() => [lesson.summary, ...lesson.sections.map((s) => `${s.heading}. ${s.content}`), ...lesson.keyPoints, ...lesson.importantTerms.map((t) => `${t.term}: ${t.meaning}`)].join("\n"), [lesson]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setQ("");
    setBusy(true);
    let answer: string;
    try {
      const res = await authedFetch("/api/voice/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, mode: "question", title, material, current: "", history: log.slice(-3) }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) throw new Error();
      answer = data.answer;
    } catch {
      const hit = findBestBlock(question, material.split("\n").map((text) => ({ text })));
      answer = hit ? `The AI is busy, so here is the closest part of the lesson: ${hit.text}` : "Sorry, I couldn't find that in the lesson.";
    }
    setLog((l) => [...l, { q: question, a: answer }]);
    setBusy(false);
  }

  return (
    <section aria-labelledby="ask-h" className={`${card} space-y-4`}>
      <h3 id="ask-h" className="text-2xl font-bold text-ink">Ask a question</h3>
      <p className="text-lg text-body">Type any question about this lesson. The answer comes back as text.</p>
      {log.length > 0 && (
        <ul className="space-y-4" aria-live="polite">
          {log.map((m, i) => (
            <li key={i} className="space-y-2">
              <p className="ml-auto w-fit max-w-[90%] rounded-2xl bg-brand-deep px-4 py-3 text-lg text-white"><span className="sr-only">You asked: </span>{m.q}</p>
              <p className="max-w-[90%] rounded-2xl bg-tint-purple px-4 py-3 text-xl leading-relaxed text-ink"><span className="sr-only">Answer: </span>{m.a}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="ask-q" className="mb-1 block text-sm font-semibold text-brand-deep">Your question</label>
          <input id="ask-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What is chlorophyll?" className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-lg outline-none focus:border-brand" />
        </div>
        <button type="submit" disabled={busy || !q.trim()} className={`${btn} bg-brand text-white disabled:opacity-50`}><Send className="size-5" aria-hidden /> {busy ? "Thinking..." : "Ask"}</button>
      </form>
    </section>
  );
}

function Quiz({ lesson }: { lesson: LessonContent }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = lesson.quiz[i];
  if (!q) return null;
  const answered = picked !== null;
  const right = picked === q.correctAnswer;

  function next() {
    if (i === lesson.quiz.length - 1) return setDone(true);
    setI(i + 1);
    setPicked(null);
  }

  return (
    <section aria-labelledby="qz-h" className={`${card} space-y-5`}>
      <h3 id="qz-h" className="text-2xl font-bold text-ink">Practice questions</h3>
      {done ? (
        <div className="space-y-4">
          <p className="text-4xl font-extrabold text-brand-deep">{score} out of {lesson.quiz.length}</p>
          <p className="text-xl text-ink">{score === lesson.quiz.length ? "You got them all. Great work!" : "Good effort. Read the steps again and try once more."}</p>
          <button type="button" onClick={() => { setI(0); setPicked(null); setScore(0); setDone(false); }} className={`${btn} bg-brand-deep text-white`}>Try again</button>
        </div>
      ) : (
        <>
          <p className="text-base font-semibold text-body">Question {i + 1} of {lesson.quiz.length}</p>
          <p className="text-2xl font-bold leading-snug text-ink">{q.question}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {q.options.map((o) => {
              const isRight = answered && o === q.correctAnswer;
              const isWrong = answered && o === picked && !right;
              return (
                <li key={o}>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => { setPicked(o); if (o === q.correctAnswer) setScore((s) => s + 1); }}
                    className={`flex min-h-16 w-full items-center gap-3 rounded-2xl p-4 text-left text-xl font-semibold text-ink ${isRight ? "bg-tint-green ring-4 ring-emerald-700" : isWrong ? "bg-tint-pink ring-4 ring-rose-700" : "bg-white card-border hover:bg-brand-soft"}`}
                  >
                    {isRight && <span aria-hidden>✓</span>}{isWrong && <span aria-hidden>✗</span>}
                    {o}
                    {isRight && <span className="ml-auto text-base">Right answer</span>}
                    {isWrong && <span className="ml-auto text-base">Your answer</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div aria-live="polite">
            {answered && (
              <div className={`rounded-2xl p-5 text-xl text-ink ring-2 ${right ? "bg-tint-green ring-emerald-700" : "bg-tint-yellow ring-amber-600"}`}>
                <p className="font-bold">{right ? "That's right!" : "Not quite."}</p>
                <p className="mt-1">{q.explanation}</p>
              </div>
            )}
          </div>
          {answered && <button type="button" onClick={next} className={`${btn} bg-brand text-white`}>{i === lesson.quiz.length - 1 ? "See my score" : "Next question"}</button>}
        </>
      )}
    </section>
  );
}
