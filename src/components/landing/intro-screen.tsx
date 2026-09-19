"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { MaskContainer } from "@/components/ui/svg-mask-effect";
import { EncryptedText } from "@/components/ui/encrypted-text";

const MESSAGE = "Every mind learns in a unique way.";
// Hard ceiling: the intro starts leaving after EXIT_MS no matter what.
const EXIT_MS = 2500;
const REDUCED_EXIT_MS = 1100;

const rise = (delay: number, duration = 0.55) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: "easeOut" as const },
});

// Hydration-safe prefers-reduced-motion (server snapshot is always false).
const QUERY = "(prefers-reduced-motion: reduce)";
function useReduced() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function IntroScreen() {
  const [visible, setVisible] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [decode, setDecode] = useState(false);
  const [viewport, setViewport] = useState(1600);

  const reduced = useReduced();
  const finish = () => setVisible(false);

  // Start the sequence and guarantee it ends.
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setViewport(Math.max(window.innerWidth, window.innerHeight));
        setRevealed(true);
      }, reduced ? 0 : 200),
      setTimeout(() => setDecode(true), 1100),
      setTimeout(finish, reduced ? REDUCED_EXIT_MS : EXIT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  // Keep the page behind inert and unscrollable while the intro is up.
  useEffect(() => {
    if (!visible) return;
    const root = document.getElementById("app-root");
    root?.setAttribute("inert", "");
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => {
      root?.removeAttribute("inert");
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [visible]);

  const d = (t: number) => (reduced ? 0 : t);
  const r = (t: number) => rise(d(t), reduced ? 0.01 : 0.55);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="ilumo-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to ILUMO"
          className="fixed inset-0 z-[200] overflow-hidden bg-canvas"
          exit={{ opacity: 0, scale: reduced ? 1 : 1.03 }}
          transition={{ duration: reduced ? 0.2 : 0.5, ease: "easeInOut" }}
        >
          <MaskContainer
            autoReveal
            revealed={revealed}
            revealSize={viewport * 2.8}
            revealDuration={reduced ? 0.01 : 1.1}
            className="h-full"
            maskClassName="bg-gradient-to-br from-[#ece8fb] via-[#fdeef3] to-[#fff4d6]"
            revealText={
              <div aria-hidden className="absolute inset-0 -z-0 bg-[radial-gradient(45%_40%_at_20%_25%,#ece8fb,transparent),radial-gradient(40%_40%_at_80%_75%,#fde8ee,transparent),radial-gradient(30%_30%_at_80%_20%,#e2eefe,transparent)]" />
            }
          >
            <div className="flex flex-col items-center px-6">
              <motion.span {...r(0.35)} aria-hidden className="text-[#f5b542]">
                <Sparkles className="size-7" />
              </motion.span>
              <motion.p {...r(0.5)} className="mt-3 text-xl font-medium text-body sm:text-2xl">
                Welcome to
              </motion.p>
              <motion.h1
                {...r(0.7)}
                className="text-[4.5rem] font-extrabold leading-none tracking-tight text-brand-deep sm:text-[7rem]"
              >
                ILUMO
              </motion.h1>
              <motion.p {...r(0.9)} className="mt-2 text-lg font-semibold text-brand sm:text-2xl">
                See the Ability
              </motion.p>
              <div className="mt-8 flex min-h-[4.5rem] max-w-[20rem] items-start justify-center text-balance text-xl font-medium sm:min-h-[3.5rem] sm:max-w-xl sm:text-2xl">
                {reduced ? (
                  <p className="text-ink">{MESSAGE}</p>
                ) : (
                  decode && (
                    <EncryptedText
                      text={MESSAGE}
                      revealDelayMs={24}
                      flipDelayMs={60}
                      encryptedClassName="text-brand/40"
                      revealedClassName="text-ink"
                    />
                  )
                )}
              </div>
            </div>
          </MaskContainer>

          <button
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 z-30 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-brand-deep shadow-md backdrop-blur hover:bg-white"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
