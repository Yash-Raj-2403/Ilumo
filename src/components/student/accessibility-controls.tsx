"use client";

import { Pause, Play, Square } from "lucide-react";
import { useStudent, type TextSize } from "./student-provider";

const SIZES: { id: TextSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
  { id: "xl", label: "Extra Large" },
];

export function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 card-border">
      <div>
        <p id={`sw-${label}`} className="font-semibold text-ink">{label}</p>
        {hint && <p className="text-sm text-body">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`sw-${label}`}
        onClick={() => onChange(!checked)}
        className={`min-h-11 min-w-[4.5rem] rounded-full px-4 text-sm font-bold ${
          checked ? "bg-brand-deep text-white" : "bg-brand-soft text-brand-deep ring-2 ring-inset ring-brand-deep/30"
        }`}
      >
        {checked ? "On" : "Off"}
      </button>
    </div>
  );
}

export function ReadAloudControls({ compact = false }: { compact?: boolean }) {
  const { speech, speechAvailable, playQueue, pauseQueue, resumeQueue, stopQueue } = useStudent();
  if (!speechAvailable) {
    return <p className="text-sm text-body">Read aloud isn&apos;t supported in this browser.</p>;
  }
  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-40";
  return (
    <div role="group" aria-label="Read aloud" className="flex flex-wrap gap-2">
      {speech.status === "playing" ? (
        <button type="button" onClick={pauseQueue} className={`${btn} bg-brand-deep text-white`}>
          <Pause className="size-4" aria-hidden /> Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={speech.status === "paused" ? resumeQueue : () => playQueue()}
          className={`${btn} bg-brand-deep text-white`}
        >
          <Play className="size-4" aria-hidden /> {speech.status === "paused" ? "Resume" : compact ? "Play" : "Play"}
        </button>
      )}
      <button
        type="button"
        onClick={stopQueue}
        disabled={speech.status === "idle"}
        className={`${btn} bg-white text-brand-deep card-border`}
      >
        <Square className="size-4" aria-hidden /> Stop
      </button>
    </div>
  );
}

export function AccessibilityControls() {
  const { settings, updateSettings } = useStudent();
  return (
    <div className="space-y-5">
      <section aria-labelledby="ac-read">
        <h3 id="ac-read" className="mb-2 font-semibold text-ink">Read Aloud</h3>
        <ReadAloudControls />
      </section>

      <fieldset>
        <legend className="mb-2 font-semibold text-ink">Text Size</legend>
        <div className="grid grid-cols-2 gap-2">
          {SIZES.map((s) => (
            <label
              key={s.id}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                settings.textSize === s.id
                  ? "bg-brand-deep text-white"
                  : "bg-white text-brand-deep card-border"
              }`}
            >
              <input
                type="radio"
                name="text-size"
                value={s.id}
                checked={settings.textSize === s.id}
                onChange={() => updateSettings({ textSize: s.id })}
                className="sr-only"
              />
              {settings.textSize === s.id && <span aria-hidden className="mr-1">✓</span>}
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Switch label="High Contrast" checked={settings.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
        <Switch
          label="Describe Images"
          hint="Always show image descriptions"
          checked={settings.describeImages}
          onChange={(v) => updateSettings({ describeImages: v })}
        />
        <Switch
          label="Focus Mode"
          hint="Hides navigation in lessons"
          checked={settings.focusMode}
          onChange={(v) => updateSettings({ focusMode: v })}
        />
        <Switch
          label="Keyboard Navigation"
          hint="Stronger focus outlines"
          checked={settings.keyboardHints}
          onChange={(v) => updateSettings({ keyboardHints: v })}
        />
      </div>
    </div>
  );
}
