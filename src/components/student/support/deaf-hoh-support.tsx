"use client";

import { useRef, useState } from "react";
import { CaptionedMedia } from "./deaf-captioned-media";
import { DeafLesson } from "./deaf-lesson";
import { LiveCaptions } from "./deaf-live-captions";
import { SoundAlerts } from "./deaf-sound-alerts";
import { VisualAlertsProvider } from "./visual-alerts";

// Deaf & hard of hearing support. Everything here works without sound: captions for recordings,
// live captions, sign-language help, text-only lessons and questions, and visual sound alerts.

const TABS = [
  { id: "captions", label: "Captions for recordings" },
  { id: "live", label: "Live captions" },
  { id: "lessons", label: "Lessons" },
  { id: "alerts", label: "Sound alerts" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function DeafHohSupport() {
  const [tab, setTab] = useState<TabId>("captions");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between tabs, as screen-reader and keyboard users expect.
  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End" || dir) {
      e.preventDefault();
      const n = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + dir + TABS.length) % TABS.length;
      setTab(TABS[n].id);
      refs.current[TABS[n].id]?.focus();
    }
  }

  return (
    <VisualAlertsProvider>
      <div className="space-y-8">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-ink">Deaf &amp; Hard of Hearing Support</h1>
          <p className="mt-3 text-xl leading-relaxed text-body">
            Everything here works without sound. Read captions, follow lessons in pictures and short sentences, find signs, and get on-screen alerts instead of beeps.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
            {["Captions", "Live captions", "Sign-language help", "Visual instructions", "Text questions", "Visual alerts"].map((f) => (
              <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
            ))}
          </ul>
        </header>

        <div role="tablist" aria-label="Deaf and hard of hearing tools" className="flex flex-wrap gap-2">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-12 rounded-full px-6 text-lg font-bold ${tab === t.id ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border hover:bg-brand-soft"}`}
            >
              {tab === t.id && <span aria-hidden className="mr-1">✓</span>}{t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="outline-none">
          {tab === "captions" && <CaptionedMedia />}
          {tab === "live" && <LiveCaptions />}
          {tab === "lessons" && <DeafLesson />}
          {tab === "alerts" && <SoundAlerts />}
        </div>
      </div>
    </VisualAlertsProvider>
  );
}
