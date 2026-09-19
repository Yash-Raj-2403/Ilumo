"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, TriangleAlert } from "lucide-react";

// Nothing in this area ever relies on a sound. Anything that would normally beep or chime
// (captions ready, a loud noise, an error) shows up as a banner instead.

type Kind = "info" | "success" | "warning";
type Notify = (text: string, kind?: Kind) => void;

const Ctx = createContext<Notify>(() => {});
export const useNotify = () => useContext(Ctx);

export function VisualAlertsProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ text: string; kind: Kind; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback<Notify>((text, kind = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, kind, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const Icon = toast?.kind === "success" ? CheckCircle2 : toast?.kind === "warning" ? TriangleAlert : Bell;
  return (
    <Ctx.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center px-4">
        {toast && (
          <div key={toast.id} role="status" className={`pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl px-5 py-4 text-lg font-bold shadow-2xl ring-2 ${toast.kind === "warning" ? "bg-tint-yellow text-ink ring-amber-600" : toast.kind === "success" ? "bg-tint-green text-ink ring-emerald-700" : "bg-white text-ink ring-brand"}`}>
            <Icon className="size-6 shrink-0" aria-hidden /> {toast.text}
            <button type="button" onClick={() => setToast(null)} className="ml-2 min-h-11 rounded-full px-3 text-base font-semibold underline">Dismiss</button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
