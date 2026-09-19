import Link from "next/link";
import { notFound } from "next/navigation";
import { BlindLowVisionSupport } from "@/components/student/support/blind-low-vision-support";
import { AutismSupport } from "@/components/student/support/autism-support";
import { SupportGate } from "@/components/student/support/support-gate";
import { findCategory, type CategorySlug } from "@/lib/categories";

// One page per accessibility category. The layout (student navigation) is shared;
// only the content below changes.
const EXPERIENCES: Partial<Record<CategorySlug, () => React.ReactNode>> = {
  autism: () => <AutismSupport />,
  "blind-low-vision": () => <BlindLowVisionSupport />,
};

export default async function SupportPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();
  const Experience = EXPERIENCES[cat.slug];
  if (!cat.ready || !Experience) {
    return (
      <SupportGate slug={cat.slug}>
      <div className="max-w-2xl space-y-5">
        <h1 className="text-4xl font-bold tracking-tight text-ink">{cat.title}</h1>
        <p className="text-xl text-body">This support experience is coming soon. It will include:</p>
        <ul className="list-disc space-y-1 pl-6 text-lg text-ink">
          {cat.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <Link href="/student" className="inline-flex min-h-12 items-center rounded-full bg-brand-deep px-6 font-semibold text-white">Back to dashboard</Link>
      </div>
      </SupportGate>
    );
  }
  return <SupportGate slug={cat.slug}>{Experience()}</SupportGate>;
}
