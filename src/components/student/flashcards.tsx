"use client";

import { useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import type { LessonContent } from "@/lib/lesson-types";
import { buildFlashcards, type Flashcard } from "@/lib/flashcards";

/** A card with a front and a back. Select it (click, Enter or Space) to flip it over. */
export function FlipCard({
  front, back, frontLabel, backLabel, flipped, tint = "bg-white", heightClass = "min-h-64", children,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  frontLabel: string;
  backLabel: string;
  flipped: boolean;
  tint?: string;
  heightClass?: string;
  /** Extra controls on the front face (e.g. an answer box) that must stay usable. */
  children?: React.ReactNode;
}) {
  const face = `absolute inset-0 flex flex-col justify-center gap-3 rounded-3xl p-6 text-center [backface-visibility:hidden] motion-reduce:[backface-visibility:visible]`;
  return (
    <div className="[perspective:1200px]">
      <div
        className={`relative ${heightClass} transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
      >
        <div inert={flipped} className={`${face} ${tint} card-border motion-reduce:transition-opacity ${flipped ? "motion-reduce:opacity-0 motion-reduce:pointer-events-none" : ""}`}>
          <p className="text-sm font-bold uppercase tracking-wide text-brand">{frontLabel}</p>
          <div className="text-2xl font-bold leading-snug text-ink">{front}</div>
          {children}
          {!children && <p className="text-base font-semibold text-body"><RotateCw className="mr-1 inline size-4" aria-hidden />Select the card to flip it</p>}
        </div>
        <div inert={!flipped} className={`${face} bg-brand-deep text-white [transform:rotateY(180deg)] motion-reduce:[transform:none] ${flipped ? "" : "motion-reduce:opacity-0 motion-reduce:pointer-events-none"}`}>
          <p className="text-sm font-bold uppercase tracking-wide text-white/75">{backLabel}</p>
          <div className="text-xl font-semibold leading-relaxed">{back}</div>
        </div>
      </div>
    </div>
  );
}

/** Three study cards from the lesson. Select any card to flip it and read the other side. */
export function Flashcards({ lesson }: { lesson: LessonContent }) {
  const cards = useMemo<Flashcard[]>(() => buildFlashcards(lesson), [lesson]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const toggle = (i: number) => setFlipped((f) => { const n = [...f]; n[i] = !n[i]; return n; });
  const tints = ["bg-tint-yellow", "bg-tint-blue", "bg-tint-pink"];

  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="fc-h" className="space-y-4 rounded-3xl bg-white p-6 card-border sm:p-8">
      <div>
        <h2 id="fc-h" className="text-2xl font-bold text-ink">Flashcards</h2>
        <p className="text-lg text-body">Tap a card to flip it and see the other side.</p>
      </div>
      <ul className="grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => {
          const on = !!flipped[i];
          return (
            <li key={c.front} className="relative">
              <FlipCard front={c.front} back={c.back} frontLabel={`${c.label} · card ${i + 1} of ${cards.length}`} backLabel="The other side" flipped={on} tint={tints[i % tints.length]} />
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                className="absolute inset-0 z-10 rounded-3xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <span className="sr-only">
                  {on ? `Card ${i + 1}, back side: ${c.back}. Select to flip to the front.` : `Card ${i + 1}, front: ${c.front}. Select to flip and read the other side.`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
