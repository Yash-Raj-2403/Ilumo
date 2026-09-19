"use client";

import sampleLesson from "@/data/mockPhotosynthesisLesson.json";
import { lessonsFor, type CategorySlug } from "@/lib/categories";
import type { Lesson } from "@/lib/lesson-types";
import { useStudent } from "../student-provider";

export const SAMPLE_LESSON: Lesson = {
  ...(sampleLesson as unknown as Lesson),
  id: "sample",
  createdAt: "",
  source: "mock",
  visual: { kind: "sample" },
};

/** The sample lesson plus this person's own lessons adapted for one kind of support. */
export function LessonPicker({ slug, onPick, heading = "Choose a lesson" }: { slug: CategorySlug; onPick: (l: Lesson) => void; heading?: string }) {
  const { lessons } = useStudent();
  const mine = lessonsFor(lessons, slug);
  const card = "flex w-full flex-col items-start gap-2 rounded-3xl bg-white p-6 text-left card-border hover:bg-brand-soft";
  return (
    <section aria-label={heading} className="space-y-4">
      <h3 className="text-2xl font-bold text-ink">{heading}</h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <button type="button" data-scan onClick={() => onPick(SAMPLE_LESSON)} className={card}>
            <span className="text-xl font-bold text-ink">Photosynthesis</span>
            <span className="text-body">Sample lesson</span>
          </button>
        </li>
        {mine.map((l) => (
          <li key={l.id}>
            <button type="button" data-scan onClick={() => onPick(l)} className={card}>
              <span className="text-xl font-bold text-ink">{l.title}</span>
              <span className="line-clamp-2 text-body">{l.summary}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-body">
        Want your own material? Add it under <a href="/student/new" className="font-semibold text-brand underline underline-offset-4">New Material</a> and choose this kind of support.
      </p>
    </section>
  );
}
