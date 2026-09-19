"use client";

const COLORS = ["#ff6b6b", "#ffb434", "#4dd0a5", "#5b8def", "#b072f2", "#ff8ac3"];

/** A short burst of confetti. Pass a new `burst` number to fire it again. It is decoration only: hidden from screen readers and off under reduced motion. */
export function Confetti({ burst, count = 26 }: { burst: number; count?: number }) {
  // Spread the pieces with a fixed formula, so every burst is different but nothing depends on chance while rendering.
  const rnd = (i: number, k: number) => { const x = Math.sin((burst * 97 + i * 13 + k * 7) * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const pieces = burst === 0 ? [] : Array.from({ length: count }, (_, i) => ({ i, left: 8 + rnd(i, 1) * 84, dx: Math.round((rnd(i, 2) - 0.5) * 160), rot: Math.round((rnd(i, 3) - 0.5) * 900), delay: rnd(i, 4) * 0.15, color: COLORS[i % COLORS.length] }));
  if (pieces.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" key={burst}>
      {pieces.map((p) => (
        <span key={p.i} className="confetti" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg` }} />
      ))}
    </div>
  );
}
