// English Grade 1 (uncontracted) braille, plus BRF output for braille embossers.
// Contracted (Grade 2) braille is what most experienced readers use; it needs a
// full translation table (e.g. liblouis) and isn't attempted here.

const cell = (...dots: number[]) => String.fromCharCode(0x2800 + dots.reduce((n, d) => n + (1 << (d - 1)), 0));

const LETTERS: Record<string, string> = {
  a: cell(1), b: cell(1, 2), c: cell(1, 4), d: cell(1, 4, 5), e: cell(1, 5), f: cell(1, 2, 4), g: cell(1, 2, 4, 5),
  h: cell(1, 2, 5), i: cell(2, 4), j: cell(2, 4, 5), k: cell(1, 3), l: cell(1, 2, 3), m: cell(1, 3, 4), n: cell(1, 3, 4, 5),
  o: cell(1, 3, 5), p: cell(1, 2, 3, 4), q: cell(1, 2, 3, 4, 5), r: cell(1, 2, 3, 5), s: cell(2, 3, 4), t: cell(2, 3, 4, 5),
  u: cell(1, 3, 6), v: cell(1, 2, 3, 6), w: cell(2, 4, 5, 6), x: cell(1, 3, 4, 6), y: cell(1, 3, 4, 5, 6), z: cell(1, 3, 5, 6),
};
const DIGITS: Record<string, string> = Object.fromEntries("1234567890".split("").map((d, i) => [d, LETTERS["abcdefghij"[i]]]));
const CAPITAL = cell(6);
const NUMBER = cell(3, 4, 5, 6);

const PUNCT: Record<string, string> = {
  ".": cell(2, 5, 6), ",": cell(2), ";": cell(2, 3), ":": cell(2, 5), "!": cell(2, 3, 5), "?": cell(2, 3, 6),
  "'": cell(3), "’": cell(3), "‘": cell(3), "-": cell(3, 6), "–": cell(3, 6), "—": cell(3, 6) + cell(3, 6),
  "(": cell(5) + cell(1, 2, 6), ")": cell(5) + cell(3, 4, 5), "/": cell(4, 5, 6) + cell(3, 4),
  "*": cell(5) + cell(3, 5), "&": cell(4) + cell(1, 2, 3, 4, 6), "@": cell(4) + cell(1), "%": cell(4, 6) + cell(3, 5, 6),
  "$": cell(4) + cell(2, 3, 4), "£": cell(4) + cell(1, 2, 3), "€": cell(4) + cell(1, 5),
  "+": cell(5) + cell(2, 3, 5), "=": cell(5) + cell(2, 3, 5, 6), "…": cell(2, 5, 6).repeat(3),
};
const OPEN_QUOTE = cell(2, 3, 6);
const CLOSE_QUOTE = cell(3, 5, 6);

/** Unicode braille -> North American Braille ASCII (what .brf files contain). */
const ASCII = ' A1B\'K2L@CIF/MSP"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)=';

export const brailleToAscii = (b: string) =>
  [...b].map((ch) => (ch >= "⠀" && ch <= "⠿" ? ASCII[ch.charCodeAt(0) - 0x2800] : ch)).join("");

/** Translate plain text to Unicode braille. Paragraph breaks (newlines) are kept. */
export function toBraille(text: string): string {
  const src = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
  let out = "";
  let inNumber = false;
  let quoteOpen = false;
  let capsRun = false; // inside an ALL-CAPS word that already got its double capital sign
  const chars = [...src];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "\n") { out += "\n"; inNumber = false; continue; }
    if (/\s/.test(ch)) { out += " "; inNumber = false; continue; }
    if (/\d/.test(ch)) {
      if (!inNumber) out += NUMBER;
      out += DIGITS[ch];
      inNumber = true;
      continue;
    }
    if (inNumber && (ch === "." || ch === ",") && /\d/.test(chars[i + 1] ?? "")) {
      out += PUNCT[ch]; // decimal point / thousands separator stays inside the number
      continue;
    }
    inNumber = false;
    if (/[a-zA-Z]/.test(ch)) {
      if (ch === ch.toLowerCase()) capsRun = false;
      else if (!capsRun) {
        // 2+ capitals in a row: one double sign for the whole word, else one sign per capital.
        if (/[A-Z]/.test(chars[i + 1] ?? "")) { out += CAPITAL + CAPITAL; capsRun = true; }
        else out += CAPITAL;
      }
      out += LETTERS[ch.toLowerCase()];
      continue;
    }
    capsRun = false;
    if (ch === '"' || ch === "“" || ch === "”") {
      const opening: boolean = ch === "“" || (ch === '"' && !quoteOpen);
      out += opening ? OPEN_QUOTE : CLOSE_QUOTE;
      quoteOpen = opening;
      continue;
    }
    if (PUNCT[ch]) out += PUNCT[ch];
    // anything else (emoji, symbols with no simple Grade 1 form) is left out
  }
  return out;
}

export type Layout = { cols: number; rows: number };
export const DEFAULT_LAYOUT: Layout = { cols: 40, rows: 25 };

/** Wrap braille text into embosser pages (lines of `cols` cells, `rows` lines per page). */
export function paginate(braille: string, { cols, rows }: Layout): string[][] {
  const lines: string[] = [];
  for (const para of braille.split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    let line = "";
    for (let word of para.split(/ +/).filter(Boolean)) {
      while ([...word].length > cols) { // a word longer than a line is split
        if (line) { lines.push(line); line = ""; }
        lines.push([...word].slice(0, cols).join(""));
        word = [...word].slice(cols).join("");
      }
      const next = line ? `${line} ${word}` : word;
      if ([...next].length > cols) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
  }
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += rows) pages.push(lines.slice(i, i + rows));
  return pages.length ? pages : [[""]];
}

/** BRF: ASCII braille, CR+LF line ends, a form feed between pages. */
export const toBRF = (pages: string[][]) =>
  pages.map((p) => p.map(brailleToAscii).join("\r\n")).join("\r\n\f") + "\r\n";
