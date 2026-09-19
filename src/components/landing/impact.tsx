"use client";

import Link from "next/link";
import { Accessibility, BookOpen, Ear, Eye, Heart, MessageCircle, Puzzle, type LucideIcon } from "lucide-react";
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

export function Impact() {
  const mine = useMySupports();
  const categories = mine === undefined ? [] : mine ? CATEGORIES.filter((c) => mine.includes(c.slug)) : CATEGORIES;
  return (
    <section id="impact" aria-labelledby="impact-heading" className="scroll-mt-24 bg-gradient-to-b from-[#f1eeff] to-[#e9e5fd] py-14">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 id="impact-heading" className="font-hand text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            A more inclusive tomorrow
            <br />
            starts with better learning today.
            <Heart className="ml-2 inline size-5 fill-rose-500 text-rose-500" aria-hidden />
          </h2>
          <p className="mt-3 text-base text-body">Different abilities. Brighter futures.</p>
          <Link href="/impact" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">See our impact in numbers</Link>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => {
            const Icon = ICONS[c.slug];
            const chip = `inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-ink ${c.card} ring-1 ring-brand-deep/10`;
            return (
              <li key={c.slug}>
                {c.ready ? (
                  <Link href={categoryHref(c)} className={`${chip} transition motion-safe:hover:-translate-y-0.5 hover:shadow-md`}>
                    <Icon className="size-4" aria-hidden /> {c.short}
                  </Link>
                ) : (
                  <span className={chip}>
                    <Icon className="size-4" aria-hidden /> {c.short}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
