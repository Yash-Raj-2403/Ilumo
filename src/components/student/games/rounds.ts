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
  sound?: "beeps" | "ticks" | "car" | "left" | "right";
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


const RHYMES = [
  { w: "cat", e: "🐱", r: "hat" }, { w: "dog", e: "🐶", r: "log" }, { w: "sun", e: "☀️", r: "run" }, { w: "bee", e: "🐝", r: "tree" },
  { w: "star", e: "⭐", r: "car" }, { w: "cake", e: "🎂", r: "lake" }, { w: "moon", e: "🌙", r: "spoon" }, { w: "boat", e: "⛵", r: "coat" },
];
function rhymeTime(): Round[] {
  return pick(RHYMES, 5).map((it) => {
    const others = pick(RHYMES.filter((x) => x.w !== it.w).flatMap((x) => [x.w, x.r]).filter((w) => w !== it.r), 2);
    return {
      prompt: `Which word rhymes with ${it.w}?`,
      say: `Which word rhymes with ${it.w}?`,
      picture: { text: it.e, alt: it.w },
      choices: shuffle([{ label: it.r, ok: true }, ...others.map((label) => ({ label, ok: false }))]),
      hint: (w) => `Say them out loud: ${it.w}, ${w.label}. Do they end with the same sound? Try another.`,
      praise: `${cheer()} ${it.w} and ${it.r} rhyme.`,
    };
  });
}

const VOWEL_WORDS = [
  { w: "cat", e: "🐱", v: "a" }, { w: "dog", e: "🐶", v: "o" }, { w: "sun", e: "☀️", v: "u" }, { w: "pig", e: "🐷", v: "i" },
  { w: "bed", e: "🛏️", v: "e" }, { w: "bus", e: "🚌", v: "u" }, { w: "hen", e: "🐔", v: "e" }, { w: "pin", e: "📌", v: "i" },
];
function missingLetter(): Round[] {
  return pick(VOWEL_WORDS, 5).map((it) => {
    const gap = `${it.w[0]} _ ${it.w[2]}`;
    const others = pick(["a", "e", "i", "o", "u"].filter((v) => v !== it.v), 2);
    return {
      prompt: "Which letter is missing?",
      say: `Which letter is missing? ${it.w[0]}, blank, ${it.w[2]}.`,
      picture: { text: it.e, alt: `A picture of a ${it.w}` },
      sub: gap,
      choices: shuffle([it.v, ...others]).map((v) => ({ label: v.toUpperCase(), ok: v === it.v })),
      hint: () => `Say the word slowly: ${it.w}. The middle sound is the vowel ${it.v.toUpperCase()}.`,
      praise: `${cheer()} ${it.w[0]}, ${it.v}, ${it.w[2]} spells ${it.w}.`,
    };
  });
}

function takeAway(): Round[] {
  return Array.from({ length: 5 }, () => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * (a - 1));
    const left = a - b;
    const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const wrong = pick([left - 2, left - 1, left + 1, left + 2].filter((n) => n >= 0 && n <= 10), 2);
    return {
      prompt: `${a} take away ${b}. How many are left?`,
      say: `${COUNT_WORDS[a]} take away ${COUNT_WORDS[b]}. How many are left?`,
      picture: { text: f.repeat(a), alt: `${a} fruit` },
      sub: `${a} − ${b}`,
      choices: shuffle([{ label: String(left), ok: true }, ...wrong.map((n) => ({ label: String(n), ok: false }))]),
      hint: () => `Start with ${COUNT_WORDS[a]}. Put ${COUNT_WORDS[b]} away. Now count what is left.`,
      praise: `${cheer()} ${a} take away ${b} leaves ${left}.`,
    };
  });
}

const SHAPES = [
  { e: "🔴", n: "Circle", h: "A circle is round and has no corners." }, { e: "🟦", n: "Square", h: "A square has four sides that are the same." },
  { e: "🔺", n: "Triangle", h: "A triangle has three corners." }, { e: "⭐", n: "Star", h: "A star has five points." },
  { e: "❤️", n: "Heart", h: "A heart has two round bumps at the top and a point at the bottom." }, { e: "🔷", n: "Diamond", h: "A diamond has four sides and stands on a corner." },
];
function shapeFinder(): Round[] {
  return pick(SHAPES, 5).map((it) => ({
    prompt: "What shape is this?",
    say: "What shape is this?",
    picture: { text: it.e, alt: `A ${it.n.toLowerCase()}` },
    choices: shuffle([{ label: it.n, ok: true }, ...pick(SHAPES.filter((x) => x.n !== it.n), 2).map((x) => ({ label: x.n, ok: false }))]),
    hint: (w) => `Not ${w.label}. Look at the corners and the sides. Try another.`,
    praise: `${cheer()} It is a ${it.n.toLowerCase()}. ${it.h}`,
  }));
}

const HOMES = [
  { e: "🐟", w: "a fish", h: "Water" }, { e: "🐦", w: "a bird", h: "Nest" }, { e: "🐄", w: "a cow", h: "Farm" },
  { e: "🐝", w: "a bee", h: "Hive" }, { e: "🐻", w: "a bear", h: "Forest" },
];
function animalHomes(): Round[] {
  return pick(HOMES, 5).map((it) => ({
    prompt: `Where does ${it.w} live?`,
    say: `Where does ${it.w} live?`,
    picture: { text: it.e, alt: it.w.replace(/^a /, "") },
    choices: shuffle([{ label: it.h, ok: true }, ...pick(HOMES.filter((x) => x.h !== it.h), 2).map((x) => ({ label: x.h, ok: false }))]),
    hint: (w) => `${w.label} is home to a different animal. Think about where ${it.w} finds food and shelter.`,
    praise: `${cheer()} ${it.w[0].toUpperCase()}${it.w.slice(1)} lives in ${/^[aeiou]/i.test(it.h) ? "an" : "a"} ${it.h.toLowerCase()}.`,
  }));
}

const SENSES = [
  { e: "🌸", q: "smell a flower", a: "Nose", pic: "👃" }, { e: "🔔", q: "hear a bell", a: "Ears", pic: "👂" },
  { e: "🌈", q: "see a rainbow", a: "Eyes", pic: "👀" }, { e: "🍦", q: "taste an ice cream", a: "Tongue", pic: "👅" },
  { e: "🧸", q: "feel something soft", a: "Hands", pic: "✋" },
];
function fiveSenses(): Round[] {
  return pick(SENSES, 5).map((it) => ({
    prompt: `What do we use to ${it.q}?`,
    say: `What do we use to ${it.q}?`,
    picture: { text: it.e, alt: it.q },
    choices: shuffle([it, ...pick(SENSES.filter((x) => x.a !== it.a), 2)]).map((x) => ({ label: x.a, ok: x.a === it.a, picture: x.pic })),
    hint: () => `Think about how we ${it.q}. Try another.`,
    praise: `${cheer()} We use our ${it.a.toLowerCase()} to ${it.q}.`,
  }));
}

const ROUTINE = [
  { e: "🍽️", q: "Before we eat, what do we do?", a: "Wash our hands", w: ["Kick a ball", "Turn off the light"], why: "Washing hands takes germs away." },
  { e: "🌙", q: "It is night time. What do we do?", a: "Go to sleep", w: ["Eat breakfast", "Go to school"], why: "Sleep helps our body rest." },
  { e: "🌧️", q: "It is raining. What can we take?", a: "An umbrella", w: ["A kite", "Sunglasses"], why: "An umbrella keeps us dry." },
  { e: "🪥", q: "In the morning we clean our teeth with what?", a: "A toothbrush", w: ["A spoon", "A shoe"], why: "A toothbrush keeps our teeth clean." },
  { e: "☀️", q: "It is very hot. What should we drink?", a: "Water", w: ["Soap", "Sand"], why: "Water keeps us cool and healthy." },
  { e: "⚽", q: "We played in the mud. What do we do next?", a: "Take a bath", w: ["Go to sleep at once", "Put on a hat"], why: "A bath gets us clean." },
];
function dailyRoutine(): Round[] {
  return pick(ROUTINE, 5).map((it) => ({
    prompt: it.q,
    say: it.q,
    picture: { text: it.e, alt: it.q },
    choices: shuffle([{ label: it.a, ok: true }, ...it.w.map((label) => ({ label, ok: false }))]),
    hint: () => "Think about what helps us most. Try another.",
    praise: `${cheer()} ${it.why}`,
  }));
}

const FACES = [
  { e: "😊", n: "Happy" }, { e: "😢", n: "Sad" }, { e: "😠", n: "Angry" }, { e: "😨", n: "Scared" }, { e: "😴", n: "Sleepy" }, { e: "😲", n: "Surprised" },
];
function feelingFaces(): Round[] {
  return pick(FACES, 5).map((it) => ({
    prompt: "How does this face feel?",
    say: "How does this face feel?",
    picture: { text: it.e, alt: `A ${it.n.toLowerCase()} face` },
    choices: shuffle([{ label: it.n, ok: true }, ...pick(FACES.filter((x) => x.n !== it.n), 2).map((x) => ({ label: x.n, ok: false }))]),
    hint: () => "Look at the eyes and the mouth. What do they tell you?",
    praise: `${cheer()} This face looks ${it.n.toLowerCase()}. All feelings are okay.`,
  }));
}

function soundFinder(): Round[] {
  return Array.from({ length: 5 }, () => {
    const side: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
    return {
      prompt: "Listen. Which side is the sound on?",
      say: "Press Play sound and listen. Which side is the sound on?",
      picture: { text: "🎧", alt: "Headphones" },
      sound: side,
      choices: ["Left", "Right"].map((k) => ({ label: k, ok: k.toLowerCase() === side })),
      hint: () => `Listen again. Turn your head a little, and hear which ear it is louder in.`,
      praise: `${cheer()} The sound was on the ${side}.`,
    };
  });
}

const SAFETY = [
  { e: "🍳", q: "Touching a hot stove", safe: false, why: "A hot stove can burn you. Ask a grown-up for help." },
  { e: "🚴", q: "Wearing a helmet on a bike", safe: true, why: "A helmet protects your head." },
  { e: "🚸", q: "Holding a grown-up's hand to cross the road", safe: true, why: "A grown-up helps you cross safely." },
  { e: "🔪", q: "Playing with a sharp knife", safe: false, why: "Sharp things can cut you. Leave them for grown-ups." },
  { e: "🧼", q: "Washing your hands with soap", safe: true, why: "Soap washes germs away." },
  { e: "🏃", q: "Running into the road after a ball", safe: false, why: "Cars may be coming. Ask a grown-up to help." },
  { e: "🚫", q: "Going away with someone you do not know", safe: false, why: "Stay with your grown-up and tell them right away." },
];
function safeOrNot(): Round[] {
  return pick(SAFETY, 5).map((it) => ({
    prompt: `${it.q}. Is it safe?`,
    say: `${it.q}. Is it safe?`,
    picture: { text: it.e, alt: it.q },
    choices: [{ label: "Safe", ok: it.safe }, { label: "Not safe", ok: !it.safe }],
    hint: () => `Think again. ${it.why}`,
    praise: `${cheer()} ${it.why}`,
  }));
}

export const BUILDERS: Record<string, () => Round[]> = {
  "letter-match": letterMatch,
  "fruit-count": fruitCount,
  "matter-sort": matterSort,
  "coin-shop": coinShop,
  "street-smart": streetSmart,
  "rhyme-time": rhymeTime,
  "missing-letter": missingLetter,
  "take-away": takeAway,
  "shape-finder": shapeFinder,
  "animal-homes": animalHomes,
  "five-senses": fiveSenses,
  "daily-routine": dailyRoutine,
  "feeling-faces": feelingFaces,
  "sound-finder": soundFinder,
  "safe-or-not": safeOrNot,
};
