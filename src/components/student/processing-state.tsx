"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Reading your content",
  "Extracting important information",
  "Understanding images and diagrams",
  "Creating accessible descriptions",
  "Simplifying difficult concepts",
  "Preparing your personalized lesson",
];
const STEP_MS = 1400;

export function ProcessingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center card-border sm:p-10" role="status" aria-live="polite">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-brand-soft">
        <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
      </div>
      <h1 className="text-3xl font-bold text-ink">ILUMO is understanding your material...</h1>
      <p className="sr-only">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      <ol className="mt-8 space-y-3 text-left" aria-hidden>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-lg transition-opacity duration-500 ${
                active ? "bg-brand-soft font-semibold text-ink" : done ? "text-ink" : "text-body opacity-50"
              }`}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-brand-deep text-white" : "ring-2 ring-brand-deep/40"}`}>
                {done && <Check className="size-4" />}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
