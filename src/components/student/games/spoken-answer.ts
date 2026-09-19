// Works out which choice a child meant from what the speech recogniser heard.
import type { Choice } from "./rounds";

const NUM: Record<string, string> = {
  zero: "0", one: "1", won: "1", two: "2", to: "2", too: "2", three: "3", four: "4", for: "4", five: "5", six: "6", seven: "7", eight: "8", ate: "8", nine: "9", ten: "10",
};
const ORDINAL: Record<string, number> = { first: 1, second: 2, third: 3 };
// How letter names usually come out when heard by a recogniser.
const LETTER: Record<string, string[]> = {
  a: ["a", "ay", "hey", "eh"], b: ["b", "bee", "be"], c: ["c", "see", "sea", "cee"], d: ["d", "dee", "de"], e: ["e", "ee"], f: ["f", "eff", "ef"], g: ["g", "gee", "jee"],
  h: ["h", "aitch", "age"], l: ["l", "el", "elle"], m: ["m", "em"], p: ["p", "pee", "pea"], r: ["r", "are", "ar"], s: ["s", "ess", "es"], t: ["t", "tea", "tee"], w: ["w", "double you", "double u"],
};

const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);

/** The choice the spoken text points to, or null if it is unclear or matches more than one. */
export function matchSpoken(text: string, choices: Choice[]): Choice | null {
  const heard = words(text);
  const digits = heard.map((w) => NUM[w] ?? w);
  const joined = heard.join(" ");
  const hits = new Set<number>();

  choices.forEach((c, i) => {
    const label = c.label.toLowerCase();
    const first = label.split(" ")[0];
    if (/^\d+$/.test(first)) {
      // a number: "six", "6" or "six coins"
      if (digits.includes(first) && !/choice|number|option/.test(joined)) hits.add(i);
    } else if (label.length === 1 && LETTER[label]) {
      // a letter: the letter itself, or the way its name is usually heard
      if (LETTER[label].some((a) => new RegExp(`(^| )${a}( |$)`).test(joined))) hits.add(i);
    } else if (new RegExp(`(^| )${label}( |$)`).test(joined)) {
      hits.add(i);
    }
  });

  // "choice two", "number 2", "the first one"
  if (hits.size === 0) {
    const asked = /choice|number|option|first|second|third/.test(joined) ? digits.find((d) => /^[1-9]$/.test(d)) ?? String(ORDINAL[heard.find((w) => w in ORDINAL) ?? ""] ?? "") : "";
    const n = Number(asked);
    if (n >= 1 && n <= choices.length) hits.add(n - 1);
  }
  return hits.size === 1 ? choices[[...hits][0]] : null;
}
