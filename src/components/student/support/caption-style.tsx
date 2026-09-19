"use client";

import { useStudent } from "../student-provider";

// Caption size and colours are remembered per person (saved with their other settings).
type Size = "m" | "l" | "xl" | "xxl";
type Theme = "dark" | "light" | "yellow";

const SIZES: { id: Size; label: string; cls: string }[] = [
  { id: "m", label: "Medium", cls: "text-xl" },
  { id: "l", label: "Large", cls: "text-2xl sm:text-3xl" },
  { id: "xl", label: "Extra large", cls: "text-3xl sm:text-4xl" },
  { id: "xxl", label: "Huge", cls: "text-4xl sm:text-6xl" },
];
const THEMES: { id: Theme; label: string; cls: string }[] = [
  { id: "dark", label: "White on black", cls: "bg-black text-white" },
  { id: "light", label: "Black on white", cls: "bg-white text-black ring-2 ring-black" },
  { id: "yellow", label: "Yellow on black", cls: "bg-black text-yellow-300" },
];

/** Tailwind classes for a caption box in the person's chosen size and colours. */
export function useCaptionClasses() {
  const { settings } = useStudent();
  const size = SIZES.find((s) => s.id === settings.captions.size) ?? SIZES[1];
  const theme = THEMES.find((t) => t.id === settings.captions.theme) ?? THEMES[0];
  return `${size.cls} ${theme.cls} font-semibold leading-snug`;
}

export function CaptionStyleControls() {
  const { settings, updateSettings } = useStudent();
  const set = (patch: Partial<typeof settings.captions>) => updateSettings({ captions: { ...settings.captions, ...patch } });
  const chip = (on: boolean) =>
    `inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`;
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-body">Caption size</legend>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <label key={s.id} className={chip(settings.captions.size === s.id)}>
              <input type="radio" name="cap-size" className="sr-only" checked={settings.captions.size === s.id} onChange={() => set({ size: s.id })} />
              {settings.captions.size === s.id && <span aria-hidden className="mr-1">✓</span>}
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-body">Caption colours</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <label key={t.id} className={chip(settings.captions.theme === t.id)}>
              <input type="radio" name="cap-theme" className="sr-only" checked={settings.captions.theme === t.id} onChange={() => set({ theme: t.id })} />
              {settings.captions.theme === t.id && <span aria-hidden className="mr-1">✓</span>}
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
