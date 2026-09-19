import { listen, type Listener } from "./recognition";
import { startDetector, type Detector, type Frame } from "./vad";

// One "listening window": the microphone opens, waits for a real voice, takes one phrase, and
// closes. If nobody speaks within NO_VOICE_MS it closes by itself.

export const NO_VOICE_MS = 3000;
const AFTER_VOICE_MS = 7000; // give up if someone started to speak but no words came out
const MAX_MS = 20_000;

export type EndReason = "text" | "silence" | "denied" | "network" | "unavailable" | "closed";
export type Session = { close: () => void };

export async function openListeningWindow(opts: {
  onFrame: (f: Frame) => void;
  onText: (text: string) => void;
  onEnd: (reason: EndReason) => void;
}): Promise<Session> {
  let ended = false;
  let voiceSeen = false;
  let lastVoiceAt = 0;
  const openedAt = Date.now();
  let detector: Detector | null = null;
  let recognizer: Listener | null = null;

  const end = (reason: EndReason) => {
    if (ended) return;
    ended = true;
    clearInterval(watch);
    detector?.stop();
    recognizer?.stop();
    opts.onEnd(reason);
  };

  const watch = setInterval(() => {
    const now = Date.now();
    if (!voiceSeen && now - openedAt >= NO_VOICE_MS) end("silence"); // nobody spoke: mic off
    else if (voiceSeen && now - lastVoiceAt >= AFTER_VOICE_MS) end("silence");
    else if (now - openedAt >= MAX_MS) end("silence");
  }, 100);

  try {
    detector = await startDetector((f) => {
      if (f.voice) {
        voiceSeen = true;
        lastVoiceAt = Date.now();
      }
      opts.onFrame(f);
    });
  } catch {
    end("denied");
    return { close() {} };
  }
  if (ended) {
    detector.stop();
    return { close() {} };
  }

  recognizer = listen({
    onHeard: (text) => {
      // Words that arrive without a real voice ever being heard (background TV, far-away chat)
      // are ignored.
      if (!voiceSeen) return;
      opts.onText(text);
      end("text");
    },
    onError: (kind) => end(kind === "denied" ? "denied" : kind === "network" ? "network" : "unavailable"),
  });
  return { close: () => end("closed") };
}
