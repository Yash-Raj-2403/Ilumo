// Thin wrapper over the browser's SpeechSynthesis (no external voice API needed).

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speakText(text: string, opts: { rate?: number; onEnd?: () => void; onError?: () => void; onBoundary?: (charIndex: number) => void } = {}) {
  if (!speechSupported()) return opts.onError?.();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 1;
  u.lang = document.documentElement.lang || "en";
  u.onend = () => opts.onEnd?.();
  u.onboundary = (e) => { if (e.name === "word") opts.onBoundary?.(e.charIndex); };
  u.onerror = (e) => {
    // "canceled"/"interrupted" fire when we call stop() ourselves.
    if (e.error !== "canceled" && e.error !== "interrupted") opts.onError?.();
  };
  window.speechSynthesis.speak(u);
}

export const pauseSpeech = () => speechSupported() && window.speechSynthesis.pause();
export const resumeSpeech = () => speechSupported() && window.speechSynthesis.resume();
export const stopSpeech = () => speechSupported() && window.speechSynthesis.cancel();
