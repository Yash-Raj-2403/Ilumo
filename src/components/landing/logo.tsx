import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" aria-hidden className={className}>
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb547" />
          <stop offset="1" stopColor="#f0705f" />
        </linearGradient>
      </defs>
      <path d="M6 34a18 18 0 0 1 36 0z" fill="url(#sun)" />
      <g stroke="#ffb547" strokeWidth="3" strokeLinecap="round">
        <path d="M24 5v5M9 11l3.5 3.5M39 11l-3.5 3.5M2 24h5M41 24h5" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ILUMO — See the Ability, home"
      className={`flex items-center gap-2.5 ${className ?? ""}`}
    >
      <LogoMark className="h-9 w-10" />
      <span className="leading-none">
        <span className="block text-[26px] font-extrabold tracking-tight text-brand-deep">
          ILUMO
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-brand">
          See the Ability
        </span>
      </span>
    </Link>
  );
}
