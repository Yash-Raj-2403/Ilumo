"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Focus, Volume2 } from "lucide-react";
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { ReadAloudControls } from "./accessibility-controls";
import { PhotosynthesisDiagram } from "./photosynthesis-diagram";
import { Quiz } from "./quiz";
import { useStudent, type ReadItem } from "./student-provider";

export function LessonViewer({ id }: { id: string }) {
  const s = useStudent();
  const { ready, getLesson } = s;
  const [remote, setRemote] = useState<Lesson | null | undefined>(undefined);
  const [view, setView] = useState<"learn" | "quiz" | "results">("learn");

  // Find the lesson: browser storage first, then the server's session copy.
  const local = ready ? getLesson(id) : undefined;
  useEffect(() => {
    if (!ready || local) return;
    let cancelled = false;
    authedFetch(`/api/lessons/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setRemote(d?.lesson ?? null))
      .catch(() => !cancelled && setRemote(null));
    return () => {
      cancelled = true;
    };
  }, [ready, local, id]);

  const lesson = local ?? remote;
  if (lesson === undefined) return <p role="status" className="text-lg text-body">Loading your lesson...</p>;
  if (lesson === null)
    return (
      <div className="rounded-3xl bg-white p-8 card-border">
        <h1 className="text-3xl font-bold text-ink">We couldn&apos;t find that lesson.</h1>
        <p className="mt-2 text-body">It may have been made on another device.</p>
        <Link href="/student/new" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand-deep px-6 font-semibold text-white">
          Choose Another Material
        </Link>
      </div>
    );

  const saved = s.progress[lesson.id]?.quiz;

  if (view === "quiz")
    return (
      <Quiz
        lesson={lesson}
        onDone={(answers, feedback) => {
          s.saveQuizResult(lesson.id, answers, feedback);
          setView("results");
          window.scrollTo({ top: 0 });
        }}
      />
    );
  if (view === "results" && saved)
    return <Results lesson={lesson} feedback={saved.feedback} onRetake={() => setView("quiz")} onReview={() => setView("learn")} />;

  return <Learn lesson={lesson} hasResults={!!saved} onQuiz={() => setView("quiz")} onResults={() => setView("results")} />;
}

function Learn({ lesson, hasResults, onQuiz, onResults }: { lesson: Lesson; hasResults: boolean; onQuiz: () => void; onResults: () => void }) {
  const { settings, updateSettings, stepTextSize, speech, speakOne, playQueue, registerReadables, markSectionRead } = useStudent();
  const focus = settings.focusMode;

  const items = useMemo<ReadItem[]>(
    () => [
      { id: "summary", text: `Quick summary. ${lesson.summary}` },
      ...lesson.sections.map((sec, i) => ({ id: `section-${i}`, text: `${sec.heading}. ${sec.content}` })),
      { id: "keypoints", text: `Key points. ${lesson.keyPoints.join(" ")}` },
      ...lesson.visualDescriptions.map((v, i) => ({ id: `visual-${i}`, text: `Image description. ${v.title}. ${v.description}` })),
    ],
    [lesson],
  );
  useEffect(() => {
    registerReadables(items);
    return () => registerReadables(null);
  }, [items, registerReadables]);

  // A section counts as read once most of it has been on screen.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) markSectionRead(lesson.id, Number((e.target as HTMLElement).dataset.index));
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll("[data-index]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [lesson.id, markSectionRead]);

  const hl = (id: string) => (speech.currentId === id ? " reading-highlight" : "");
  const card = "rounded-3xl bg-white p-6 sm:p-8 card-border";
  const tool = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold";
  const toolOff = `${tool} bg-white text-brand-deep card-border`;
  const toolOn = `${tool} bg-brand-deep text-white`;
  const hasVisual = lesson.visual || lesson.visualDescriptions.length > 0;

  return (
    <article className={`space-y-10 ${focus ? "text-[1.15em]" : ""}`}>
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">{lesson.title}</h1>
        <p className="mt-2 text-xl text-body">Your learning material, adapted for you.</p>
        {lesson.source === "mock" && (
          <p className="mt-2 text-sm font-semibold text-body">Sample lesson</p>
        )}
      </header>

      <div role="toolbar" aria-label="Lesson tools" className="flex flex-wrap items-center gap-2 rounded-3xl bg-tint-purple p-3 card-border">
        <ReadAloudControls compact />
        <button type="button" onClick={() => stepTextSize(-1)} className={toolOff}><span aria-hidden>A−</span><span className="sr-only">Smaller text</span></button>
        <button type="button" onClick={() => stepTextSize(1)} className={toolOff}><span aria-hidden>A+</span><span className="sr-only">Larger text</span></button>
        <button type="button" aria-pressed={settings.describeImages} onClick={() => updateSettings({ describeImages: !settings.describeImages })} className={settings.describeImages ? toolOn : toolOff}>
          <Eye className="size-4" aria-hidden /> Describe Images
        </button>
        <button type="button" aria-pressed={focus} onClick={() => updateSettings({ focusMode: !focus })} className={focus ? toolOn : toolOff}>
          <Focus className="size-4" aria-hidden /> Focus Mode
        </button>
      </div>

      <section aria-labelledby="l-summary" className={`${card} bg-tint-yellow${hl("summary")}`}>
        <h2 id="l-summary" className="text-2xl font-bold text-ink">Quick Summary</h2>
        <p className="mt-2 text-xl leading-relaxed text-ink">{lesson.summary}</p>
      </section>

      <section aria-labelledby="l-learn" className="space-y-5">
        <h2 id="l-learn" className="text-3xl font-bold text-ink">Learn</h2>
        {lesson.sections.map((sec, i) => (
          <section key={i} data-index={i} aria-labelledby={`sec-${i}`} className={`${card}${hl(`section-${i}`)}`}>
            <h3 id={`sec-${i}`} className="text-2xl font-bold text-ink">{sec.heading}</h3>
            <p className="mt-3 max-w-prose text-xl leading-[1.75] text-ink">{sec.content}</p>
          </section>
        ))}
      </section>

      <section aria-labelledby="l-key" className={hl("keypoints") ? "reading-highlight rounded-3xl" : ""}>
        <h2 id="l-key" className="mb-4 text-3xl font-bold text-ink">Key Points</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {lesson.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-tint-green p-4 text-lg font-semibold text-ink ring-1 ring-black/15">
              <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-deep text-sm text-white">{i + 1}</span>
              {k}
            </li>
          ))}
        </ul>
      </section>

      {lesson.importantTerms.length > 0 && (
        <section aria-labelledby="l-terms">
          <h2 id="l-terms" className="mb-4 text-3xl font-bold text-ink">Important Terms</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {lesson.importantTerms.map((t) => (
              <div key={t.term} className="rounded-2xl bg-white p-5 card-border">
                <dt className="text-xl font-bold text-brand-deep">{t.term}</dt>
                <dd className="mt-1 text-lg text-ink">{t.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {hasVisual && (
        <section aria-labelledby="l-visual" className="space-y-5">
          <h2 id="l-visual" className="text-3xl font-bold text-ink">Visual Information</h2>
          {lesson.visual?.kind === "sample" && <figure><PhotosynthesisDiagram /></figure>}
          {lesson.visual?.kind === "image" && (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lesson.visual.dataUrl} alt={lesson.visualDescriptions[0]?.title ?? lesson.visual.alt} className="max-h-[28rem] w-full rounded-2xl bg-white object-contain card-border" />
            </figure>
          )}
          {lesson.visualDescriptions.map((v, i) => (
            <Description key={i} v={v} defaultOpen={settings.describeImages} className={hl(`visual-${i}`)} onHear={() => speakOne(`visual-${i}`, `${v.title}. ${v.description}`)} />
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3 border-t-2 border-brand-deep/10 pt-8">
        <button type="button" onClick={onQuiz} className="min-h-14 rounded-full bg-brand-deep px-8 text-lg font-semibold text-white">
          {hasResults ? "Retake the Quiz" : "Take the Quiz"}
        </button>
        {hasResults && (
          <button type="button" onClick={onResults} className="min-h-14 rounded-full bg-white px-8 text-lg font-semibold text-brand-deep card-border">
            See My Results
          </button>
        )}
        <button type="button" onClick={() => playQueue(items)} className="min-h-14 rounded-full px-6 text-lg font-semibold text-brand underline underline-offset-4">
          Listen to the whole lesson
        </button>
      </div>
    </article>
  );
}

function Description({ v, defaultOpen, className, onHear }: { v: { title: string; description: string }; defaultOpen: boolean; className: string; onHear: () => void }) {
  const [open, setOpen] = useState(false);
  const shown = defaultOpen || open;
  return (
    <div className={`rounded-3xl bg-tint-blue p-6 card-border${className}`}>
      <h3 className="text-xl font-bold text-ink">Image Description: {v.title}</h3>
      {shown ? (
        <p className="mt-2 max-w-prose text-xl leading-[1.75] text-ink">{v.description}</p>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 min-h-11 font-semibold text-brand underline underline-offset-4">
          Show description
        </button>
      )}
      <button type="button" onClick={onHear} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft">
        <Volume2 className="size-4" aria-hidden /> Hear Description
      </button>
    </div>
  );
}

function Results({ lesson, feedback, onRetake, onReview }: { lesson: Lesson; feedback: QuizFeedback; onRetake: () => void; onReview: () => void }) {
  const list = (title: string, xs: string[]) =>
    xs.length > 0 && (
      <div className="rounded-2xl bg-white p-5 card-border">
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-ink">
          {xs.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
    );
  return (
    <section aria-labelledby="res-title" className="space-y-6">
      <h1 id="res-title" className="text-4xl font-bold text-ink">Your results for {lesson.title}</h1>
      <p className="text-5xl font-bold text-brand-deep">
        {feedback.score} <span className="text-2xl text-body">out of {feedback.total}</span>
      </p>
      <p className="rounded-3xl bg-tint-purple p-6 text-xl leading-relaxed text-ink card-border">{feedback.feedback}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {list("What you did well", feedback.strengths)}
        {list("Worth another look", feedback.needsPractice)}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/progress" className="inline-flex min-h-14 items-center rounded-full bg-brand-deep px-8 text-lg font-semibold text-white">View Progress</Link>
        <button type="button" onClick={onReview} className="min-h-14 rounded-full bg-white px-8 text-lg font-semibold text-brand-deep card-border">Review the lesson</button>
        <button type="button" onClick={onRetake} className="min-h-14 rounded-full bg-white px-8 text-lg font-semibold text-brand-deep card-border">Retake the quiz</button>
        <Link href="/student" className="inline-flex min-h-14 items-center rounded-full px-6 text-lg font-semibold text-brand underline underline-offset-4">Continue Learning</Link>
      </div>
    </section>
  );
}
