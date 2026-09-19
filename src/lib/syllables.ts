// A small phonics helper: split a word into syllables and spot common letter teams.
// English spelling is irregular, so this is a teaching aid, not a dictionary.

const VOWELS = "aeiouy";
const isVowel = (c: string) => VOWELS.includes(c);

/** Letter teams that make one sound. */
export const TEAMS: { team: string; sound: string }[] = [
  { team: "tch", sound: "ch" }, { team: "ph", sound: "f" }, { team: "th", sound: "th" }, { team: "sh", sound: "sh" },
  { team: "ch", sound: "ch" }, { team: "wh", sound: "w" }, { team: "ck", sound: "k" }, { team: "ng", sound: "ng" },
  { team: "qu", sound: "kw" }, { team: "kn", sound: "n" }, { team: "wr", sound: "r" }, { team: "gh", sound: "f/silent" },
];

/** Split into syllables with simple, well-known rules. */
export function syllables(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w ? [w] : [];

  // Find vowel groups; each group is roughly one syllable. A final silent "e" doesn't count.
  const chars = [...w];
  const groups: { start: number; end: number }[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (isVowel(chars[i])) {
      const start = i;
      while (i + 1 < chars.length && isVowel(chars[i + 1])) i++;
      groups.push({ start, end: i });
    }
  }
  const last = groups[groups.length - 1];
  if (groups.length > 1 && last.start === chars.length - 1 && chars[last.start] === "e" && !isVowel(chars[last.start - 1] ?? "a") && !/[^aeiouy]le$/.test(w)) groups.pop();
  // A plural or past-tense "e" that isn't sounded (leaves, named) doesn't start a new syllable.
  const tail = groups[groups.length - 1];
  if (groups.length > 1 && tail.start === chars.length - 2 && chars[tail.start] === "e" && /[ds]$/.test(w) && !isVowel(chars[tail.start - 1] ?? "a") && !/(?:[sxz]|ch|sh)es$/.test(w) && !/[td]ed$/.test(w)) groups.pop();
  if (groups.length <= 1) return [w];

  // Put each break inside the consonants between two vowel groups.
  const cuts: number[] = [];
  for (let g = 0; g < groups.length - 1; g++) {
    const from = groups[g].end + 1;
    const to = groups[g + 1].start; // consonants are w[from..to-1]
    const between = to - from;
    if (between <= 0) { cuts.push(to); continue; }
    if (between === 1) { cuts.push(from); continue; } // V-CV: ba-by
    // With 2+ consonants keep letter teams together (ph, th, sh...) and split the rest: VC-CV.
    const cons = w.slice(from, to);
    const team = TEAMS.find((t) => cons.endsWith(t.team) && cons.length === t.team.length);
    cuts.push(team ? (["ck", "ng", "tch", "ch", "sh"].includes(team.team) ? to : from) : from + 1);
  }
  const parts: string[] = [];
  let prev = 0;
  for (const c of cuts) { parts.push(w.slice(prev, c)); prev = c; }
  parts.push(w.slice(prev));
  return parts.filter(Boolean);
}

export type Piece = { text: string; kind: "vowel" | "team" | "consonant"; sound?: string };

/** Break a word into pieces so vowels and letter teams can be coloured differently. */
export function pieces(word: string): Piece[] {
  const w = word.toLowerCase();
  const out: Piece[] = [];
  for (let i = 0; i < w.length; ) {
    const team = TEAMS.find((t) => w.startsWith(t.team, i));
    if (team) { out.push({ text: team.team, kind: "team", sound: team.sound }); i += team.team.length; continue; }
    out.push({ text: w[i], kind: isVowel(w[i]) ? "vowel" : "consonant" });
    i++;
  }
  return out;
}
