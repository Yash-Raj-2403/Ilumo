import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, SiteShell } from "@/components/landing/site-shell";
import { CATEGORIES, categoryHref } from "@/lib/categories";

export const metadata: Metadata = { title: "About — ILUMO", description: "ILUMO adapts learning material to the way each person learns." };

const STEPS = [
  { n: 1, title: "Tell us what helps", text: "Choose the kinds of support that fit you, or your child. ILUMO then shows only what is useful." },
  { n: 2, title: "Bring any material", text: "Upload a PDF, a photo of a page, a recording or plain text." },
  { n: 3, title: "ILUMO adapts it", text: "AI turns it into short steps, captions, descriptions, flashcards or braille, depending on the need." },
  { n: 4, title: "Learn, and follow progress", text: "Students learn at their own pace. Parents can see what their child is learning." },
];

export default function About() {
  return (
    <SiteShell>
      <PageHeader eyebrow="ABOUT ILUMO" title="See the ability, not the barrier">
        ILUMO is an inclusive learning platform. It takes the same lesson and shapes it around the person learning it, instead of asking the person to fit the lesson.
      </PageHeader>

      <div className="mx-auto max-w-5xl space-y-16 px-4 pb-20 sm:px-6">
        <section aria-labelledby="why" className="rounded-3xl bg-white p-8 ring-1 ring-brand-deep/10 sm:p-10">
          <h2 id="why" className="text-3xl font-bold text-ink">Why we built it</h2>
          <p className="mt-3 text-xl leading-relaxed text-body">
            Most learning material is made for one kind of learner: someone who can see the page, hear the video, hold the mouse and read at speed. That leaves many people out. Blind students need descriptions and braille. Deaf students need captions. Autistic and ADHD students need calm, predictable, small steps. Non-speaking students need a way to answer without talking. Students with motor disabilities need big buttons and more time. Students with dyslexia need a different way to read.
          </p>
          <p className="mt-4 text-xl leading-relaxed text-body">ILUMO brings all of these into one place, so that the material can change and the learner does not have to.</p>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="text-3xl font-bold text-ink">How it works</h2>
          <ol className="mt-6 grid gap-5 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-deep text-xl font-extrabold text-white">{s.n}</span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-lg text-body">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="who">
          <h2 id="who" className="text-3xl font-bold text-ink">Who it is for</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={categoryHref(c)} className={`flex h-full flex-col gap-1 rounded-3xl ${c.card} p-5 ring-1 ring-brand-deep/10 transition motion-safe:hover:-translate-y-1 hover:shadow-lg`}>
                  <span className="text-lg font-bold text-ink">{c.title}</span>
                  <span className="text-body">{c.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="promise" className="rounded-3xl bg-tint-purple p-8 ring-1 ring-brand-deep/10 sm:p-10">
          <h2 id="promise" className="text-3xl font-bold text-ink">Our promises</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-ink">
            <li>We never present made-up numbers as real ones.</li>
            <li>We keep passwords and API keys out of your browser and out of our code.</li>
            <li>We treat accessibility as the starting point, not an extra.</li>
            <li>AI helps, but it can make mistakes. Important material should be checked by a person.</li>
          </ul>
        </section>

        <p className="text-center">
          <Link href="/signup" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
            Get started <ArrowRight className="size-5" aria-hidden />
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
