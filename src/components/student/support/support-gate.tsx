"use client";

import Link from "next/link";
import { findCategory, type CategorySlug } from "@/lib/categories";
import { useStudent } from "../student-provider";

/** Only lets someone into a support area that is part of their own profile. */
export function SupportGate({ slug, children }: { slug: CategorySlug; children: React.ReactNode }) {
  const { supports } = useStudent();
  if (supports.includes(slug)) return <>{children}</>;
  const cat = findCategory(slug);
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-4xl font-bold tracking-tight text-ink">{cat?.title}</h1>
      <p className="text-xl leading-relaxed text-body">
        This support isn&apos;t part of your profile, so it&apos;s hidden to keep things simple. If you&apos;d like it, you can add it in Settings.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/settings#support" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">Update my support</Link>
        <Link href="/student" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-brand-deep card-border">Back to dashboard</Link>
      </div>
    </div>
  );
}
