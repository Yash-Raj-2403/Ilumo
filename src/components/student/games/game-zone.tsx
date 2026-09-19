"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GAMES, GAME_TABS, type GameCategory } from "./catalog";
import { Stars } from "./game-player";
import { ExploreShelf } from "../explore-shelf";
import { useStudent } from "../student-provider";

type Tab = GameCategory | "learn";
const TABS: { id: Tab; label: string; emoji: string }[] = [...GAME_TABS, { id: "learn", label: "Learn", emoji: "🌈" }];

/** The Game Zone for ages 5 to 10: pick a group, then pick a game. */
export function GameZone() {
  const { settings } = useStudent();
  const [tab, setTab] = useState<Tab>("language");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  function onKey(e: React.KeyboardEvent, i: number) {
    const to = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(TABS[to].id);
    refs.current[to]?.focus();
  }

  const games = GAMES.filter((g) => g.category === tab);
  const total = GAMES.reduce((n, g) => n + (settings.gameStars[g.id] ?? 0), 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-3 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">GAME ZONE · AGES 5 TO 10</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Play and learn with us! <span aria-hidden>🎮</span></h1>
        <p className="mt-2 max-w-prose text-xl text-body">Short games with pictures, sounds and kind hints. No timers, and you can try again.</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-tint-yellow px-4 py-2 text-lg font-bold text-ink card-border">
          <span aria-hidden>⭐</span> {total} {total === 1 ? "star" : "stars"} collected
        </p>
      </header>

      {!settings.explore && (
        <p className="rounded-2xl bg-tint-yellow p-4 text-lg text-ink ring-1 ring-brand-deep/10">
          The Game Zone is switched off for this account.{" "}
          <Link href="/student/settings#explore" className="font-semibold text-brand underline underline-offset-4">Turn it on in Settings</Link>
        </p>
      )}

      <div role="tablist" aria-label="Game groups" className="flex flex-wrap gap-3">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="games-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`inline-flex min-h-14 items-center gap-2 rounded-full px-6 text-lg font-bold ring-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand ${
              tab === t.id ? "bg-brand-soft text-brand-deep ring-brand" : "bg-white text-ink ring-ink/30 hover:bg-brand-soft"
            }`}
          >
            <span aria-hidden className="text-2xl">{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <div id="games-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "learn" ? (
          <ExploreShelf embedded />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {games.map((g) => {
              const s = settings.gameStars[g.id] ?? 0;
              return (
                <li key={g.id}>
                  <Link href={`/student/games/${g.id}`} className="flex h-full flex-col overflow-hidden rounded-3xl bg-white text-ink card-border hover:shadow-lg focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand">
                    <span className={`flex h-40 items-center justify-end px-8 ${g.card}`}>
                      <span aria-hidden className="text-7xl">{g.emoji}</span>
                    </span>
                    <span className="flex flex-1 flex-col gap-1 p-6">
                      <span className="text-3xl font-bold">{g.title}</span>
                      <span className="text-xl text-body">{g.blurb}</span>
                      <span className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-brand">{s > 0 ? "Play again" : "Play"}</span>
                        {s > 0 && <Stars n={s} size="size-6" />}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
