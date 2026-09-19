"use client";

import { useEffect, useState } from "react";
import { Eye, Volume2 } from "lucide-react";
import type { Lesson } from "@/lib/lesson-types";
import { describeImage } from "@/lib/describe-image";
import { PhotosynthesisDiagram } from "./photosynthesis-diagram";
import { useStudent } from "./student-provider";

/**
 * A lesson's picture or diagram with a working "Describe image" button. If the lesson already has
 * a description it is shown; if not (for example a photo uploaded without one), the AI writes it.
 */
export function LessonVisual({ lesson, autoDescribe = false, signal = 0, onDescribed }: { lesson: Lesson; autoDescribe?: boolean; /** Bump this number to describe (and read out) the picture right now. */ signal?: number; onDescribed?: (d: { title: string; description: string }) => void }) {
  const { speakOne } = useStudent();
  const [extra, setExtra] = useState<{ title: string; description: string } | null>(null);
  const [open, setOpen] = useState(autoDescribe);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const known = lesson.visualDescriptions[0] ?? extra;
  const image = lesson.visual?.kind === "image" ? lesson.visual : null;
  const hasPicture = !!lesson.visual;

  // With "Describe Images" on, a picture that has no description yet gets one straight away.
  useEffect(() => {
    if (autoDescribe && image && !known && !busy && !error && !extra) {
      void describe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function describe(): Promise<{ title: string; description: string } | null> {
    setError(null);
    setOpen(true);
    if (known) return known;
    if (!image) return null;
    setBusy(true);
    try {
      const d = await describeImage(image.dataUrl);
      setExtra(d);
      onDescribed?.(d);
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't describe that picture right now.");
    } finally {
      setBusy(false);
    }
    return null;
  }

  // The lesson's "Describe Images" button asks for the description to be shown and read out.
  useEffect(() => {
    if (signal === 0) return;
    void describe().then((d) => d && speakOne("visual-desc", `${d.title}. ${d.description}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  if (!hasPicture && lesson.visualDescriptions.length === 0) return null;

  return (
    <section aria-label="Picture" className="space-y-4">
      {lesson.visual?.kind === "sample" && <figure><PhotosynthesisDiagram /></figure>}
      {lesson.visual?.kind === "emoji" && (
        <ul className="flex flex-wrap gap-4" aria-label="Pictures">
          {lesson.visual.items.map((it) => (
            <li key={it.label} className="flex min-w-24 flex-col items-center gap-1 rounded-3xl bg-white p-4 card-border">
              <span aria-hidden className="text-6xl leading-none">{it.e}</span>
              <span className="text-lg font-bold text-ink">{it.label}</span>
            </li>
          ))}
        </ul>
      )}
      {image && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.dataUrl} alt={known?.title ?? image.alt} className="max-h-[26rem] w-full rounded-2xl bg-white object-contain card-border" />
        </figure>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => (open && known ? setOpen(false) : describe())}
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white disabled:opacity-60"
        >
          <Eye className="size-5" aria-hidden /> {busy ? "Describing..." : open && known ? "Hide description" : "Describe image"}
        </button>
        {open && known && (
          <button type="button" onClick={() => speakOne("visual-desc", `${known.title}. ${known.description}`)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-deep card-border">
            <Volume2 className="size-5" aria-hidden /> Hear description
          </button>
        )}
      </div>
      <div aria-live="polite">
        {open && known && (
          <div className="rounded-3xl bg-tint-blue p-5 card-border">
            <h3 className="text-xl font-bold text-ink">Image description: {known.title}</h3>
            <p className="mt-2 max-w-prose text-xl leading-[1.75] text-ink">{known.description}</p>
          </div>
        )}
        {open && !known && !busy && !error && <p className="rounded-2xl bg-tint-yellow p-4 text-lg text-ink">There is no description for this picture yet.</p>}
        {error && <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">⚠ {error}</p>}
      </div>
    </section>
  );
}
