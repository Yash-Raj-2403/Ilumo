// Thin wrapper over the browser's SpeechSynthesis (no external voice API needed).

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Split text into pieces of at most `max` characters, at sentence ends where possible.
 * Browsers cut off long utterances after about fifteen seconds, so long text is spoken piece by piece.
 */
export function chunkText(text: string, max = 200): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  const re = /[^.!?…\n]+[.!?…]*\s*/g;
  let m: RegExpExecArray | null;
  let cur = "";
  let curStart = 0;
  const flush = () => { if (cur.trim()) out.push({ text: cur, start: curStart }); cur = ""; };
  while ((m = re.exec(text))) {
    let piece = m[0];
    let at = m.index;
    // A very long sentence is cut at commas or spaces.
    while (piece.length > max) {
      let cut = piece.lastIndexOf(", ", max);
      if (cut < max * 0.4) cut = piece.lastIndexOf(" ", max);
      if (cut < 1) cut = max;
      const head = piece.slice(0, cut + 1);
      if (cur && (cur + head).length > max) flush();
      if (!cur) curStart = at;
      cur += head;
      flush();
      piece = piece.slice(cut + 1);
      at += cut + 1;
    }
    if (cur && (cur + piece).length > max) flush();
    if (!cur) curStart = at;
    cur += piece;
  }
  flush();
  return out.length ? out : [{ text, start: 0 }];
}

export function speakText(text: string, opts: { rate?: number; onEnd?: () => void; onError?: () => void; onBoundary?: (charIndex: number) => void } = {}) {
  if (!speechSupported()) return opts.onError?.();
  const pieces = chunkText(text);
  let failed = false;
  pieces.forEach((piece, i) => {
    const u = new SpeechSynthesisUtterance(piece.text);
    u.rate = opts.rate ?? 1;
    u.lang = document.documentElement.lang || "en";
    if (i === pieces.length - 1) u.onend = () => { if (!failed) opts.onEnd?.(); };
    u.onboundary = (e) => { if (e.name === "word") opts.onBoundary?.(piece.start + e.charIndex); };
    u.onerror = (e) => {
      // "canceled"/"interrupted" fire when we call stop() ourselves.
      if (e.error !== "canceled" && e.error !== "interrupted" && !failed) {
        failed = true;
        opts.onError?.();
      }
    };
    window.speechSynthesis.speak(u);
  });
}

export const pauseSpeech = () => speechSupported() && window.speechSynthesis.pause();
export const resumeSpeech = () => speechSupported() && window.speechSynthesis.resume();
export const stopSpeech = () => speechSupported() && window.speechSynthesis.cancel();
