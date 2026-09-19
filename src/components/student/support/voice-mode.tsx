"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { isEcho } from "@/lib/voice/commands";
import { recognitionSupported } from "@/lib/voice/recognition";
import { NO_VOICE_MS, openListeningWindow, type EndReason, type Session } from "@/lib/voice/session";
import { useStudent } from "../student-provider";

type Line = { who: "you" | "ilumo"; text: string };
type Hooks = {
  /** The microphone is about to open (e.g. pause the reading). */
  onOpen?: () => void;
  /** It closed because nobody spoke. Return true if you handled it (e.g. resumed reading). */
  onNoVoice?: () => boolean;
  /** Someone spoke and it was understood; the handler now takes over. */
  onHeard?: () => void;
};

export type Voice = ReturnType<typeof useVoiceMode>;

/**
 * Talking with ILUMO, one turn at a time: ILUMO speaks, then the microphone opens for a moment,
 * takes what you say, and closes. It closes on its own after 3 seconds if it hears no real voice,
 * and words that arrive without a real voice (background noise, a TV) are ignored.
 * The space bar opens the microphone at any time.
 */
export function useVoiceMode() {
  const { speakOne, stopQueue } = useStudent();
  const [supported] = useState(() => recognitionSupported());
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [hearing, setHearing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [log, setLog] = useState<Line[]>([]);

  const sessionRef = useRef<Session | null>(null);
  const opening = useRef(false);
  const handlerRef = useRef<((text: string) => void | Promise<void>) | null>(null);
  const hooksRef = useRef<Hooks>({});
  const echoRef = useRef<string | null>(null);
  const pendingGreeting = useRef<string | null>(null);

  const push = useCallback((line: Line) => setLog((l) => [...l.slice(-7), line]), []);

  /** Open one listening window now. */
  const talk = useCallback(async () => {
    if (!supported || sessionRef.current || opening.current) return;
    opening.current = true;
    setNotice(null);
    hooksRef.current.onOpen?.();
    setListening(true);
    try {
      sessionRef.current = await openListeningWindow({
        onFrame: (f) => { setLevel(f.level); setHearing(f.voice); },
        onText: (text) => {
          if (isEcho(text, echoRef.current)) return; // ILUMO's own voice coming back in
          push({ who: "you", text });
          hooksRef.current.onHeard?.();
          void handlerRef.current?.(text);
        },
        onEnd: (reason: EndReason) => {
          sessionRef.current = null;
          setListening(false);
          setLevel(0);
          setHearing(false);
          if (reason === "silence") {
            if (!hooksRef.current.onNoVoice?.()) {
              const msg = "I didn't hear anything, so the microphone is off. Press the space bar when you want to talk.";
              setNotice(msg);
              push({ who: "ilumo", text: msg });
              echoRef.current = msg;
              speakOne("voice", msg);
            }
          } else if (reason === "denied") {
            setNotice("The microphone is blocked. Allow it in your browser's address bar, then press the space bar.");
          } else if (reason === "network") {
            setNotice("Voice recognition needs an internet connection. You can still use the buttons.");
          } else if (reason === "unavailable") {
            setNotice("This browser can't listen to voice. Try Chrome, Edge or Safari.");
          }
        },
      });
    } finally {
      opening.current = false;
    }
  }, [supported, push, speakOne]);

  const stopListening = useCallback(() => {
    sessionRef.current?.close();
  }, []);

  /**
   * Say something. Unless `listen` is false, the microphone opens as soon as ILUMO finishes, so
   * the person can answer without touching anything.
   */
  const say = useCallback(
    (text: string, onEnd?: () => void, spoken?: string, listen = true) => {
      push({ who: "ilumo", text });
      echoRef.current = spoken ?? text;
      speakOne("voice", spoken ?? text, () => {
        onEnd?.();
        if (listen) void talk();
      });
    },
    [push, speakOne, talk],
  );

  /** The first thing said on arrival. If the browser won't speak yet, wait for a key press. */
  const greet = useCallback(
    (text: string) => {
      push({ who: "ilumo", text });
      echoRef.current = text;
      speakOne(
        "voice",
        text,
        () => void talk(),
        () => {
          pendingGreeting.current = text;
          setBlocked(true);
        },
      );
    },
    [push, speakOne, talk],
  );

  // Space bar (when nothing else is focused) or Alt+V opens the microphone; the very first key
  // press also unblocks a greeting the browser wouldn't speak on its own.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pendingGreeting.current) {
        const text = pendingGreeting.current;
        pendingGreeting.current = null;
        setBlocked(false);
        speakOne("voice", text, () => void talk());
        e.preventDefault();
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      const onControl = !!t && /^(BUTTON|A|SUMMARY)$/.test(t.tagName);
      const spaceKey = e.code === "Space" && !typing && !onControl;
      const altV = e.altKey && e.code === "KeyV";
      if ((spaceKey || altV) && !e.repeat) {
        e.preventDefault();
        void talk();
      }
    };
    const onPointer = () => {
      if (!pendingGreeting.current) return;
      const text = pendingGreeting.current;
      pendingGreeting.current = null;
      setBlocked(false);
      speakOne("voice", text, () => void talk());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [talk, speakOne]);

  // Leaving the page turns everything off.
  useEffect(
    () => () => {
      sessionRef.current?.close();
    },
    [],
  );

  const setHandler = useCallback((fn: ((text: string) => void | Promise<void>) | null) => {
    handlerRef.current = fn;
  }, []);
  const setHooks = useCallback((h: Hooks) => {
    hooksRef.current = h;
  }, []);
  /** The text currently being read out, so the microphone can ignore its own echo. */
  const setEcho = useCallback((text: string | null) => {
    echoRef.current = text;
  }, []);
  const silence = useCallback(() => stopQueue(), [stopQueue]);

  return { supported, listening, level, hearing, notice, blocked, log, talk, stopListening, say, greet, setHandler, setHooks, setEcho, silence };
}

const EXAMPLES = [
  ["“Repeat” or “say that again”", "reads the current part again"],
  ["“I don't understand” or “explain that”", "explains it in simpler words"],
  ["“Faster”, “slower”, “normal speed”", "changes how fast I read"],
  ["“Pause”, “continue”, “stop”", "controls reading"],
  ["“Next”, “go back”, “from the beginning”", "moves around"],
  ["“Read the summary”, “describe the image”", "jumps to that part"],
  ["“What does chlorophyll mean?”", "any question about the material"],
  ["“Download braille”, “print braille”", "gets braille ready"],
];

export function VoiceBar({ voice }: { voice: Voice }) {
  const last = voice.log[voice.log.length - 1];
  return (
    <section aria-labelledby="voice-h" className="space-y-4 rounded-3xl bg-tint-purple p-5 card-border sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="voice-h" className="text-2xl font-bold text-ink">Talk to ILUMO</h2>
          <p className="text-lg text-body" aria-live="polite">
            {!voice.supported
              ? "Voice needs Chrome, Edge or Safari. The buttons below work everywhere."
              : voice.listening
                ? voice.hearing ? "I can hear you." : `Listening. Speak now. The microphone turns off by itself after ${NO_VOICE_MS / 1000} seconds of quiet.`
                : "The microphone is off. Press the space bar, or the button, to talk."}
          </p>
        </div>
        {voice.supported && (
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stopListening() : voice.talk())}
            aria-keyshortcuts="Space"
            aria-pressed={voice.listening}
            className={`inline-flex min-h-14 items-center gap-3 rounded-full px-8 text-lg font-bold shadow-md ${voice.listening ? "bg-brand-deep text-white" : "bg-brand text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]"}`}
          >
            {voice.listening ? <Mic className="size-6" aria-hidden /> : <MicOff className="size-6" aria-hidden />}
            {voice.listening ? "Listening. Stop" : "Talk to ILUMO (space bar)"}
          </button>
        )}
      </div>

      {voice.blocked && (
        <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-lg font-bold text-ink ring-1 ring-black/10">
          Press any key or tap anywhere to hear ILUMO and start talking.
        </p>
      )}
      {voice.listening && (
        <div role="meter" aria-label="Your voice level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={voice.level} className="h-6 overflow-hidden rounded-full bg-white ring-1 ring-brand-deep/15">
          <div className={`h-full rounded-full ${voice.hearing ? "bg-emerald-600" : "bg-brand/40"}`} style={{ width: `${Math.max(3, voice.level)}%` }} />
        </div>
      )}
      {voice.notice && <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-lg font-semibold text-ink ring-1 ring-black/10">{voice.notice}</p>}

      {voice.log.length > 0 && (
        <div>
          <h3 className="sr-only">Conversation</h3>
          {last && <p className="sr-only" aria-live="polite">{last.who === "you" ? `You said: ${last.text}` : `ILUMO: ${last.text}`}</p>}
          <ul aria-hidden className="max-h-48 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 card-border">
            {voice.log.map((l, i) => (
              <li key={i} className="text-lg text-ink">
                <span className="font-bold text-brand">{l.who === "you" ? "You: " : "ILUMO: "}</span>
                {l.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="rounded-2xl bg-white p-4 card-border">
        <summary className="min-h-11 cursor-pointer text-lg font-semibold text-brand-deep">What can I say?</summary>
        <ul className="mt-3 space-y-2 text-lg text-ink">
          {EXAMPLES.map(([say, does]) => (
            <li key={say}><strong>{say}</strong> <span className="text-body">{does}.</span></li>
          ))}
        </ul>
        <p className="mt-3 text-base text-body">Press the space bar (or Alt+V) any time to talk. ILUMO also listens after it asks you something.</p>
      </details>
    </section>
  );
}
