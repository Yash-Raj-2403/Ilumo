// Question builders for each game. Every round has a spoken prompt, big pictures, and a few choices.
export type Choice = { label: string; ok: boolean; picture?: string; say?: string };
export type Round = {
  prompt: string;
  /** What gets read aloud when the round starts. */
  say: string;
  /** A big picture shown above the choices; `alt` is what a screen reader hears. */
  picture?: { text: string; alt: string };
  /** Small line under the picture, e.g. "3 + 2". */
  sub?: string;
  choices: Choice[];
  /** A kind nudge after a wrong pick. */
  hint: (wrong: Choice) => string;
  /** Said and shown after the right pick. */
  praise: string;
  /** Sound for listening games. */
  sound?: "beeps" | "ticks" | "car";
};

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = <T,>(xs: T[], n: number) => shuffle(xs).slice(0, n);
const CHEERS = ["Yes! Well done.", "That's right!", "Great job!", "You got it!", "Super!"];
const cheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)];
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const LETTERS = [
  { l: "A", w: "apple", e: "🍎" }, { l: "B", w: "bee", e: "🐝" }, { l: "C", w: "cat", e: "🐱" }, { l: "D", w: "dog", e: "🐶" },
  { l: "E", w: "elephant", e: "🐘" }, { l: "F", w: "fish", e: "🐟" }, { l: "G", w: "goat", e: "🐐" }, { l: "H", w: "hat", e: "🎩" },
  { l: "L", w: "lion", e: "🦁" }, { l: "M", w: "moon", e: "🌙" }, { l: "P", w: "pig", e: "🐷" }, { l: "R", w: "rabbit", e: "🐰" },
  { l: "S", w: "sun", e: "☀️" }, { l: "T", w: "tree", e: "🌳" }, { l: "W", w: "whale", e: "🐳" },
];

function letterMatch(): Round[] {
  return pick(LETTERS, 5).map((it) => {
    const others = pick(LETTERS.filter((x) => x.l !== it.l), 2).map((x) => x.l);
    return {
      prompt: `What letter does ${it.w} start with?`,
      say: `What letter does ${it.w} start with?`,
      picture: { text: it.e, alt: it.w },
      choices: shuffle([{ label: it.l, ok: true }, ...others.map((l) => ({ label: l, ok: false }))]),
      hint: () => `Say it slowly: ${it.w}. It starts with the sound of the letter ${it.l}.`,
      praise: `${cheer()} ${it.w} starts with ${it.l}.`,
    };
  });
}

const FRUITS = ["🍎", "🍌", "🍓", "🍇", "🍊"];
function fruitCount(): Round[] {
  return Array.from({ length: 5 }, () => {
    const a = 1 + Math.floor(Math.random() * 5);
    const b = 1 + Math.floor(Math.random() * 4);
    const sum = a + b;
    const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const wrong = pick([sum - 2, sum - 1, sum + 1, sum + 2].filter((n) => n >= 1 && n <= 10), 2);
    return {
      prompt: `How many ${f} altogether?`,
      say: `${COUNT_WORDS[a]} fruit and ${COUNT_WORDS[b]} more fruit. How many altogether?`,
      picture: { text: `${f.repeat(a)}  +  ${f.repeat(b)}`, alt: `${a} fruit plus ${b} fruit` },
      sub: `${a} + ${b}`,
      choices: shuffle([{ label: String(sum), ok: true }, ...wrong.map((n) => ({ label: String(n), ok: false }))]),
      hint: () => `Count them all together, one at a time: ${Array.from({ length: sum }, (_, i) => COUNT_WORDS[i + 1]).join(", ")}.`,
      praise: `${cheer()} ${a} and ${b} make ${sum}.`,
    };
  });
}

const MATTER = [
  { e: "🧊", w: "an ice cube", k: "Solid" }, { e: "🪨", w: "a rock", k: "Solid" }, { e: "🧱", w: "a brick", k: "Solid" },
  { e: "🥛", w: "milk", k: "Liquid" }, { e: "🍯", w: "honey", k: "Liquid" }, { e: "🧃", w: "juice", k: "Liquid" },
  { e: "🎈", w: "the air inside a balloon", k: "Gas" }, { e: "🌬️", w: "wind", k: "Gas" },
];
const MATTER_HINT: Record<string, string> = {
  Solid: "A solid keeps its own shape. You can hold it in your hand.",
  Liquid: "A liquid pours. It takes the shape of the cup it is in.",
  Gas: "A gas spreads out to fill the space it is in. Most gases we cannot see.",
};
function matterSort(): Round[] {
  return pick(MATTER, 5).map((it) => ({
    prompt: `Is ${it.w} a solid, a liquid or a gas?`,
    say: `Is ${it.w} a solid, a liquid or a gas?`,
    picture: { text: it.e, alt: it.w },
    choices: ["Solid", "Liquid", "Gas"].map((k) => ({ label: k, ok: k === it.k })),
    hint: (wrong) => `Not quite. ${MATTER_HINT[wrong.label]} Try another.`,
    praise: `${cheer()} ${it.w} is a ${it.k.toLowerCase()}. ${MATTER_HINT[it.k]}`,
  }));
}

const SHOP = [
  { e: "🍎", w: "an apple", p: 3 }, { e: "🍪", w: "a cookie", p: 2 }, { e: "🎈", w: "a balloon", p: 4 },
  { e: "🍦", w: "an ice cream", p: 5 }, { e: "🖍️", w: "a crayon", p: 1 }, { e: "📖", w: "a book", p: 6 },
];
const coins = (n: number) => `${n} ${n === 1 ? "coin" : "coins"}`;
function coinShop(): Round[] {
  return pick(SHOP, 5).map((it) => {
    const wrong = pick([it.p - 2, it.p - 1, it.p + 1, it.p + 2].filter((n) => n >= 1 && n <= 8), 2);
    return {
      prompt: `${it.w[0].toUpperCase()}${it.w.slice(1)} costs ${coins(it.p)}. Which pile pays exactly?`,
      say: `${it.w[0].toUpperCase()}${it.w.slice(1)} costs ${coins(it.p)}. Which pile of coins pays exactly?`,
      picture: { text: it.e, alt: it.w },
      sub: `Price: ${coins(it.p)}`,
      choices: shuffle([it.p, ...wrong]).map((n) => ({ label: coins(n), ok: n === it.p, picture: "🪙".repeat(n) })),
      hint: (w) => `That pile is ${w.label}, but the price is ${coins(it.p)}. Count the coins one by one.`,
      praise: `${cheer()} ${coins(it.p)} pays for ${it.w}.`,
    };
  });
}

const SOUNDS = [
  { s: "beeps" as const, ok: "Cross", caption: "Fast beep, beep, beep", why: "Fast beeps mean the walk signal is on. It is safe to cross with a grown-up." },
  { s: "ticks" as const, ok: "Wait", caption: "Slow tick... tick", why: "Slow ticks mean wait. The walk signal is not on." },
  { s: "car" as const, ok: "Wait", caption: "A car engine rumbling", why: "A car is coming. Always wait until the road is quiet." },
];
function streetSmart(): Round[] {
  const order = shuffle([SOUNDS[0], SOUNDS[1], SOUNDS[2], SOUNDS[0], SOUNDS[1]]);
  return order.map((it) => ({
    prompt: "Listen. Is it safe to cross?",
    say: "Press Play sound and listen. Is it safe to cross?",
    picture: { text: "🚦", alt: "A street crossing signal" },
    sound: it.s,
    sub: it.caption,
    choices: ["Cross", "Wait"].map((k) => ({ label: k, ok: k === it.ok })),
    hint: () => `Listen again. ${it.why}`,
    praise: `${cheer()} ${it.why}`,
  }));
}

export const BUILDERS: Record<string, () => Round[]> = {
  "letter-match": letterMatch,
  "fruit-count": fruitCount,
  "matter-sort": matterSort,
  "coin-shop": coinShop,
  "street-smart": streetSmart,
};
