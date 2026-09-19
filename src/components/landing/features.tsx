"use client";

import Link from "next/link";
import { Accessibility, ArrowRight, BookOpen, Ear, Eye, MessageCircle, Puzzle, type LucideIcon } from "lucide-react";
import { CATEGORIES, categoryHref, type CategorySlug } from "@/lib/categories";
import { useMySupports } from "@/lib/supabase/use-supports";

const ICONS: Record<CategorySlug, LucideIcon> = {
  autism: Puzzle,
  "blind-low-vision": Eye,
  "deaf-hoh": Ear,
  speech: MessageCircle,
  motor: Accessibility,
  learning: BookOpen,
};

export function Features() {
  // Signed-in people only see the support categories in their own profile.
  const mine = useMySupports();
  const categories = mine === undefined ? [] : mine ? CATEGORIES.filter((c) => mine.includes(c.slug)) : CATEGORIES;
  return (
    <section aria-labelledby="features-heading" className="relative bg-white/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">
            OUR FEATURES
          </p>
          <h2 id="features-heading" className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Learning Made Accessible for Everyone
          </h2>
          <p className="mt-3 text-lg text-body">Multiple support systems. One inclusive platform.</p>
        </div>

        <ul id="features" className="mt-12 grid scroll-mt-28 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = ICONS[c.slug];
            return (
              <li key={c.slug}>
                <article
                  className={`group flex h-full flex-col rounded-3xl ${c.card} p-7 transition duration-300 hover:shadow-[0_24px_50px_rgba(60,40,120,0.14)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.02]`}
                >
                  <span className={`grid size-16 place-items-center rounded-full ${c.badge}`}>
                    <Icon className="size-8" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-ink">{c.title}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-body">{c.summary}</p>
                  {c.ready ? (
                    <Link
                      href={categoryHref(c)}
                      aria-label={`Try ${c.title}`}
                      className="mt-6 grid size-11 place-items-center rounded-full bg-white text-brand-deep shadow-md transition group-hover:shadow-lg"
                    >
                      <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
                    </Link>
                  ) : (
                    <p className="mt-6 inline-block w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-deep shadow-md">
                      Coming soon
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
