// Thin wrapper over the browser's speech recognition (Chrome, Edge and Safari have it).

type Alt = { transcript: string };
type Result = { isFinal: boolean; 0: Alt };
type ResultEvent = { resultIndex: number; results: ArrayLike<Result> };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type Ctor = new () => Recognition;

const ctor = (): Ctor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const recognitionSupported = () => ctor() !== null;

export type Listener = {
  stop: () => void;
};

/**
 * Listen continuously and call `onHeard` with each finished phrase.
 * The browser ends a session after a pause, so it is restarted until `stop()` is called.
 */
export function listen(opts: {
  onHeard: (text: string) => void;
  onError: (kind: "denied" | "network" | "unavailable") => void;
  onState?: (listening: boolean) => void;
}): Listener {
  const Ctor = ctor();
  if (!Ctor) {
    opts.onError("unavailable");
    return { stop() {} };
  }
  let wanted = true;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = navigator.language || "en-US";

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        const text = r[0].transcript.trim();
        if (text) opts.onHeard(text);
      }
    }
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      wanted = false;
      opts.onError("denied");
    } else if (e.error === "network") {
      wanted = false;
      opts.onError("network");
    } // "no-speech" and "aborted" are normal: just carry on
  };
  rec.onend = () => {
    opts.onState?.(false);
    if (wanted) setTimeout(() => wanted && start(), 250);
  };
  function start() {
    try {
      rec.start();
      opts.onState?.(true);
    } catch {
      /* already started */
    }
  }
  start();
  return {
    stop() {
      wanted = false;
      try {
        rec.abort();
      } catch {
        /* not running */
      }
      opts.onState?.(false);
    },
  };
}
