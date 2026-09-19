// The daily streak: play at least one game a day to keep it going. Missing a day just starts a new streak.
import { GAMES } from "./catalog";

export type Streak = { /** The last day a game was finished, as YYYY-MM-DD in the child's own time zone. */ last: string; count: number; /** Game ids finished on `last`. */ done: string[] };
export const EMPTY_STREAK: Streak = { last: "", count: 0, done: [] };

const DAY_MS = 86_400_000;
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayNumber = (key: string) => Math.round(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / DAY_MS);

/** Today's featured game: the same for everyone on the same day, and a new one tomorrow. */
export const todaysGame = (today = dayKey()) => GAMES[dayNumber(today) % GAMES.length];

/** Streak length that is still alive today (played today or yesterday). */
export function liveStreak(s: Streak, today = dayKey()): number {
  if (!s.last) return 0;
  const gap = dayNumber(today) - dayNumber(s.last);
  return gap === 0 || gap === 1 ? s.count : 0;
}

export const playedToday = (s: Streak, gameId: string, today = dayKey()) => s.last === today && s.done.includes(gameId);

/** The streak after finishing a game. */
export function recordPlay(s: Streak, gameId: string, today = dayKey()): Streak {
  if (s.last === today) return s.done.includes(gameId) ? s : { ...s, done: [...s.done, gameId] };
  const gap = s.last ? dayNumber(today) - dayNumber(s.last) : Infinity;
  return { last: today, count: gap === 1 ? s.count + 1 : 1, done: [gameId] };
}
