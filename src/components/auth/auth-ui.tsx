"use client";

import { forwardRef, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";

export const LOGO_COLORS = ["#207dc0", "#ffb434", "#fd806c", "#58b98e", "#8577d4"];

/** Question text that types in word by word. Screen readers get the plain sentence. */
export function AnimatedQuestion({ text, className = "" }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1 className={`text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <motion.span
            key={i}
            className="mr-[0.28em] inline-block"
            initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: reduced ? 0 : 0.06 * i, ease: "easeOut" }}
          >
            {w}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

export function Hint({ children, delay = 0.35 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.p
      className="mt-3 text-lg text-body"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : delay, duration: 0.4 }}
    >
      {children}
    </motion.p>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  /** Bump to replay the shake animation on repeated failed submits. */
  shakeKey?: number;
  trailing?: React.ReactNode;
};

/** Text input with a label, animated focus underline, and an announced error. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, shakeKey = 0, trailing, className = "", ...props },
  ref,
) {
  const id = useId();
  const errId = `${id}-err`;
  const reduced = useReducedMotion();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-brand-deep">
        {label}
      </label>
      <motion.div
        key={shakeKey}
        animate={error && !reduced ? { x: [0, -8, 8, -6, 6, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="group relative"
      >
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={`w-full rounded-2xl border-2 bg-white px-5 py-4 text-xl text-ink shadow-sm outline-none transition placeholder:text-body/50 focus:border-brand focus:shadow-[0_0_0_4px_rgba(91,77,245,0.15)] ${
            error ? "border-rose-600" : "border-brand-deep/15 hover:border-brand-deep/30"
          } ${trailing ? "pr-14" : ""} ${className}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </motion.div>
      <div aria-live="assertive" id={errId}>
        {error && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-start gap-2 text-base font-semibold text-rose-700"
          >
            <span aria-hidden>⚠</span> {error}
          </motion.p>
        )}
      </div>
    </div>
  );
});

export function PrimaryButton({
  children,
  loading,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      disabled={loading || props.disabled}
      className={`group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(91,77,245,0.35)] transition-colors hover:bg-[#4a3de0] disabled:opacity-60 ${className}`}
      {...(props as object)}
    >
      {children}
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
      )}
    </motion.button>
  );
}
