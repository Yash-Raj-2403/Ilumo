"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility, X } from "lucide-react";
import { AccessibilityControls } from "./accessibility-controls";

/** Floating button that opens the accessibility panel. */
export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="a11y-panel"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand-deep text-white shadow-[0_10px_30px_rgba(37,29,107,0.35)] md:bottom-6 md:right-6"
      >
        <Accessibility className="size-7" aria-hidden />
        <span className="sr-only">Accessibility tools</span>
      </button>

      {open && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label="Accessibility tools"
          className="fixed inset-x-3 bottom-40 z-40 max-h-[70vh] overflow-y-auto rounded-3xl bg-canvas p-5 shadow-2xl card-border sm:inset-x-auto sm:right-6 sm:w-96 md:bottom-24"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Accessibility</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="inline-flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand-deep"
            >
              <X className="size-5" aria-hidden />
              <span className="sr-only">Close accessibility tools</span>
            </button>
          </div>
          <AccessibilityControls />
        </div>
      )}
    </>
  );
}
