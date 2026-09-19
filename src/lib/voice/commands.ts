// Turns what a student says into an action. Simple, common commands are matched locally so they
// work instantly (and offline); anything else is treated as a question for the AI tutor.

export const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export type Intent =
  | { type: "help" }
  | { type: "stop" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" }
  | { type: "repeat"; slower?: boolean }
  | { type: "next" }
  | { type: "previous" }
  | { type: "faster"; steps: number }
  | { type: "slower"; steps: number }
  | { type: "speed"; rate: number }
  | { type: "summary" }
  | { type: "image" }
  | { type: "where" }
  | { type: "braille"; action: "download" | "print" | "copy" }
  | { type: "large-print" }
  | { type: "exit" }
  | { type: "explain"; text: string }
  | { type: "ask"; text: string };

const normalize = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

const has = (t: string, re: RegExp) => re.test(t);

export function parseCommand(raw: string): Intent {
  const t = normalize(raw);
  if (!t) return { type: "ask", text: raw };

  // Braille and print requests first: they mention words ("read", "print") used elsewhere.
  if (has(t, /\bbraille\b|\bbrf\b|\bembos/)) {
    if (has(t, /\bprint|\bembos/)) return { type: "braille", action: "print" };
    if (has(t, /\bcopy\b/)) return { type: "braille", action: "copy" };
    return { type: "braille", action: "download" };
  }
  if (has(t, /\b(large|big|bigger) (print|text)\b|\bprint (this|it|the (text|page|document))\b/)) return { type: "large-print" };

  if (has(t, /\b(what can (i|you)|help|commands|options|how do (i|you)|instructions)\b/) && !has(t, /help me (understand|with (this|the))/))
    return { type: "help" };

  // Speed
  const num = /speed\s*(?:to|at)?\s*(\d(?:\.\d+)?)/.exec(raw.toLowerCase());
  if (num) return { type: "speed", rate: Math.min(2, Math.max(0.75, Number(num[1]))) };
  if (has(t, /\b(very|super|really|extremely|fastest|max)\b.*\b(fast|quick)|\bfastest\b|\bmaximum speed\b/)) return { type: "speed", rate: 2 };
  if (has(t, /\b(very|super|really|extremely)\b.*\bslow|\bslowest\b|\bminimum speed\b/)) return { type: "speed", rate: 0.75 };
  if (has(t, /\b(normal|regular|default|usual|standard) (speed|pace)\b|\bspeed normal\b|\bnormal\b$/)) return { type: "speed", rate: 1 };
  if (has(t, /\b(much|a lot|way|far) (faster|quicker)\b/)) return { type: "faster", steps: 2 };
  if (has(t, /\b(much|a lot|way|far) slower\b/)) return { type: "slower", steps: 2 };
  if (has(t, /\b(speed (it )?up|faster|quicker|hurry( up)?|too slow|go fast(er)?)\b/)) return { type: "faster", steps: 1 };
  if (has(t, /\b(slow (it )?down|slower|too fast|not so fast|go slow(er)?)\b/)) return { type: "slower", steps: 1 };

  // "Explain" must be checked before "repeat" so "explain that again" explains.
  if (has(t, /\b(explain|simplif|clarify|break (it|this|that) down|in (simple|simpler|plain) (words|terms|language)|easier|simpler)\b/) ||
      has(t, /\b(i )?(don't|do not|didn't|did not|can't|cannot|couldn't) (really )?(understand|get|follow)\b/) ||
      has(t, /\b(i'm|i am|im) (confused|lost)\b|\bconfus|\bnot (clear|sure what)\b|\bwhat does (that|this|it) mean\b|\bmeaning of\b/))
    return { type: "explain", text: raw };

  if (has(t, /\b(repeat|say (that|it|this) again|again please|once more|one more time|read (that|it|this) again|come again|pardon|sorry what|what did you say|(didn't|did not|couldn't|could not|missed|miss) (quite |really )?(catch|hear|get) (that|it|what))\b/) || t === "again" || t === "what")
    return { type: "repeat", slower: has(t, /\bslow/) };

  // Where things are
  if (has(t, /\b(from the (beginning|start|top)|start over|restart|read (it )?(all|everything|from)|begin again)\b/)) return { type: "restart" };
  // Navigation and info
  if (has(t, /\b(summary|summari[sz]e|overview|gist|main (points|ideas))\b/)) return { type: "summary" };
  if (has(t, /\b(describe|image|picture|diagram|figure|photo|chart|illustration)\b/)) return { type: "image" };
  if (has(t, /\b(where am i|what part|which part|how much (is )?left|how long)\b/)) return { type: "where" };
  if (has(t, /\b(choose something else|another (lesson|document|file)|new (document|file|lesson)|exit|go home|close (this|it))\b/)) return { type: "exit" };

  // Transport
  if (has(t, /\b(stop|be quiet|quiet|silence|shut up|enough|cancel)\b/)) return { type: "stop" };
  if (has(t, /\b(pause|wait|hold on|hang on|one (sec|second|moment|minute))\b/)) return { type: "pause" };
  if (has(t, /\b(resume|continue|carry on|keep (going|reading)|go on|proceed|go ahead|play|start reading|read (it|on|to me)|read)\b/)) return { type: "resume" };
  if (has(t, /\b(next|skip|move on|forward|go ahead to)\b/)) return { type: "next" };
  if (has(t, /\b(previous|go back|back up|last (part|one|section)|before that|rewind|back)\b/)) return { type: "previous" };

  return { type: "ask", text: raw };
}

/** One step faster/slower along the available speeds, clamped at both ends. */
export function stepRate(current: number, steps: number): number {
  let i = RATES.findIndex((r) => r >= current - 0.001);
  if (i < 0) i = RATES.length - 1;
  return RATES[Math.max(0, Math.min(RATES.length - 1, i + steps))];
}

export const rateWords = (r: number) =>
  r === 1 ? "normal speed" : r < 1 ? `slow, ${r} times` : r === 2 ? "very fast, 2 times" : `fast, ${r} times`;

// ---- helpers used while listening ------------------------------------------------------------

const STOP = new Set("a an the is are was were be to of in on at for and or but it this that these those what why how does do did you me my i tell about with as by from can could would should please".split(" "));
const words = (s: string) => normalize(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));

/** The block whose text best matches a question: the offline fallback when the AI is unavailable. */
export function findBestBlock<T extends { text: string }>(question: string, blocks: T[]): T | null {
  const q = new Set(words(question));
  if (q.size === 0) return null;
  let best: T | null = null;
  let bestScore = 0;
  for (const b of blocks) {
    const bw = new Set(words(b.text));
    let score = 0;
    q.forEach((w) => bw.has(w) && score++);
    if (score > bestScore) { best = b; bestScore = score; }
  }
  return bestScore > 0 ? best : null;
}

/**
 * True when what the microphone heard is really the computer's own voice coming back in
 * (long, and mostly made of words from the text being read out).
 */
export function isEcho(heard: string, spoken: string | null | undefined): boolean {
  if (!spoken) return false;
  const h = words(heard);
  if (h.length < 3) return false; // short commands like "faster" are never treated as echo
  const s = new Set(words(spoken));
  const hits = h.filter((w) => s.has(w)).length;
  return hits / h.length >= 0.7;
}
