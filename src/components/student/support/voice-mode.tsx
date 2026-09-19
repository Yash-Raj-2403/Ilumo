"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCw } from "lucide-react";
import { isEcho } from "@/lib/voice/commands";
import { recognitionSupported } from "@/lib/voice/recognition";
import { startBargeIn, type BargeIn } from "@/lib/voice/bargein";
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
  const { speakOne, stopQueue, speech } = useStudent();
  const [supported] = useState(() => recognitionSupported());
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [hearing, setHearing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [log, setLog] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  // Talking over ILUMO stops it. Kept in the browser so the choice sticks between visits.
  const [bargeIn, setBargeInState] = useState(() => {
    try { return localStorage.getItem("ilumo:bargein") !== "0"; } catch { return true; }
  });

  const sessionRef = useRef<Session | null>(null);
  const opening = useRef(false);
  const handlerRef = useRef<((text: string) => void | Promise<void>) | null>(null);
  const hooksRef = useRef<Hooks>({});
  const echoRef = useRef<string | null>(null);
  const recentSpoken = useRef<string[]>([]);
  /** Remember what ILUMO just said (the last few things), so its own voice coming back into the microphone is ignored. */
  const remember = useCallback((text: string | null) => {
    if (!text) { recentSpoken.current = []; echoRef.current = null; return; }
    recentSpoken.current = [...recentSpoken.current.filter((t) => t !== text), text].slice(-4);
    echoRef.current = recentSpoken.current.join(" ");
  }, []);
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
        onInterim: setInterim,
        onText: (text) => {
          setInterim("");
          if (isEcho(text, echoRef.current)) return; // ILUMO's own voice coming back in
          push({ who: "you", text });
          hooksRef.current.onHeard?.();
          void handlerRef.current?.(text);
        },
        onEnd: (reason: EndReason) => {
          sessionRef.current = null;
          setListening(false);
          setInterim("");
          setLevel(0);
          setHearing(false);
          if (reason === "silence") {
            if (!hooksRef.current.onNoVoice?.()) {
              const msg = "I didn't hear anything, so the microphone is off. Press the space bar when you want to talk.";
              setNotice(msg);
              push({ who: "ilumo", text: msg });
              remember(msg);
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
  }, [supported, push, speakOne, remember]);

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
      remember(spoken ?? text);
      speakOne("voice", spoken ?? text, () => {
        onEnd?.();
        // A short pause first, so the tail of ILUMO's voice has faded before the microphone opens.
        if (listen) setTimeout(() => void talk(), 500);
      });
    },
    [push, speakOne, talk, remember],
  );

  /** The first thing said on arrival. If the browser won't speak yet, wait for a key press. */
  const greet = useCallback(
    (text: string) => {
      push({ who: "ilumo", text });
      remember(text);
      speakOne(
        "voice",
        text,
        () => setTimeout(() => void talk(), 500),
        () => {
          pendingGreeting.current = text;
          setBlocked(true);
        },
      );
    },
    [push, speakOne, talk, remember],
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

  // While ILUMO is speaking, watch for the person starting to talk. When they do, ILUMO goes quiet
  // and the microphone opens, so they can say what they need without touching anything.
  const speaking = speech.status === "playing";
  useEffect(() => {
    if (!supported || !bargeIn || !speaking || listening) return;
    let cancelled = false;
    let watcher: BargeIn | null = null;
    startBargeIn(() => {
      watcher?.stop();
      watcher = null;
      if (!cancelled) void talk();
    })
      .then((w) => {
        if (cancelled) w.stop();
        else watcher = w;
      })
      .catch(() => { /* no microphone: the space bar still works */ });
    return () => {
      cancelled = true;
      watcher?.stop();
    };
  }, [supported, bargeIn, speaking, listening, talk]);

  const setBargeIn = useCallback((on: boolean) => {
    setBargeInState(on);
    try { localStorage.setItem("ilumo:bargein", on ? "1" : "0"); } catch { /* storage blocked */ }
  }, []);

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
  const setEcho = useCallback((text: string | null) => remember(text), [remember]);
  const silence = useCallback(() => stopQueue(), [stopQueue]);

  /** Say the last thing ILUMO said again, then listen for an answer. */
  const repeatLast = useCallback(() => {
    const last = [...log].reverse().find((l) => l.who === "ilumo");
    if (!last) return;
    sessionRef.current?.close();
    remember(last.text);
    speakOne("voice", last.text, () => setTimeout(() => void talk(), 500));
  }, [log, speakOne, talk, remember]);

  /** Do a command without speaking it (the tap-a-command buttons). */
  const run = useCallback(
    (text: string) => {
      sessionRef.current?.close();
      push({ who: "you", text });
      hooksRef.current.onHeard?.();
      void handlerRef.current?.(text);
    },
    [push],
  );

  return { supported, listening, level, hearing, interim, bargeIn, setBargeIn, notice, blocked, log, talk, stopListening, say, greet, setHandler, setHooks, setEcho, silence, repeatLast, run };
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

const QUICK = [
  ["Repeat", "repeat"],
  ["Explain that", "explain that"],
  ["Slower", "slower"],
  ["Faster", "faster"],
  ["Pause", "pause"],
  ["Continue", "continue"],
  ["Next part", "next"],
  ["Go back", "go back"],
];

/** Talking with ILUMO. One big button, clear states, and what was heard shown in large text. */
export function VoiceBar({ voice, commands = true }: { voice: Voice; /** Show the tap-a-command buttons (only useful while reading). */ commands?: boolean }) {
  const lastIlumo = [...voice.log].reverse().find((l) => l.who === "ilumo");
  const lastYou = [...voice.log].reverse().find((l) => l.who === "you");
  const last = voice.log[voice.log.length - 1];
  const state = voice.listening ? (voice.hearing ? "hearing" : "listening") : "off";
  return (
    <section aria-labelledby="voice-h" className="space-y-5 rounded-3xl bg-tint-purple p-5 card-border sm:p-7">
      <div>
        <h2 id="voice-h" className="text-3xl font-bold text-ink">Talk to ILUMO <span aria-hidden>🎙️</span></h2>
        <p className="mt-1 text-xl text-body" aria-live="polite">
          {!voice.supported
            ? "Voice needs Chrome, Edge or Safari. The buttons below work everywhere."
            : state === "hearing"
              ? "I can hear you."
              : state === "listening"
                ? `Listening. Say it now. The microphone turns off by itself after ${NO_VOICE_MS / 1000} seconds of quiet.`
                : "Press the big button, or the space bar, and say what you want."}
        </p>
      </div>

      {voice.supported && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stopListening() : voice.talk())}
            aria-keyshortcuts="Space"
            aria-pressed={voice.listening}
            className={`inline-flex min-h-20 items-center gap-3 rounded-full px-10 text-2xl font-bold ${state === "off" ? "bg-[#c2410c] text-white" : "bg-tint-pink text-ink ring-4 ring-[#c2410c]"}`}
          >
            {voice.listening ? <Mic className="size-8" aria-hidden /> : <MicOff className="size-8" aria-hidden />}
            {state === "off" ? "Speak (space bar)" : state === "hearing" ? "Processing speech..." : "Listening... say it now"}
          </button>
          <button
            type="button"
            onClick={voice.repeatLast}
            disabled={!lastIlumo}
            className="inline-flex min-h-20 items-center gap-3 rounded-full bg-white px-8 text-2xl font-bold text-brand-deep card-border disabled:opacity-50"
          >
            <RotateCw className="size-7" aria-hidden /> Repeat what ILUMO said
          </button>
        </div>
      )}

      {voice.blocked && (
        <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-xl font-bold text-ink ring-1 ring-black/10">
          Press any key or tap anywhere to hear ILUMO and start talking.
        </p>
      )}
      {voice.listening && (
        <div role="meter" aria-label="Your voice level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={voice.level} className="h-6 overflow-hidden rounded-full bg-white ring-1 ring-brand-deep/15">
          <div className={`h-full rounded-full ${voice.hearing ? "bg-emerald-600" : "bg-brand/40"}`} style={{ width: `${Math.max(3, voice.level)}%` }} />
        </div>
      )}
      {voice.notice && <p role="alert" className="rounded-2xl bg-tint-yellow p-4 text-xl font-semibold text-ink ring-1 ring-black/10">{voice.notice}</p>}

      {last && <p className="sr-only" aria-live="polite">{last.who === "you" ? `You said: ${last.text}` : `ILUMO: ${last.text}`}</p>}
      <div aria-hidden className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 card-border">
          <p className="text-lg font-bold text-brand">ILUMO said:</p>
          <p className="mt-1 text-2xl leading-snug text-ink">{lastIlumo?.text ?? "Hello! Press Speak to start."}</p>
        </div>
        <div className="rounded-3xl bg-brand-soft p-5 card-border">
          <p className="text-lg font-bold text-brand-deep">You said:</p>
          <p className="mt-1 text-2xl leading-snug text-ink">
            {voice.listening && voice.interim ? <span className="italic">{voice.interim}...</span> : (lastYou?.text ?? "Nothing yet.")}
          </p>
        </div>
      </div>

      {voice.supported && (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg font-semibold text-ink">
          <input type="checkbox" checked={voice.bargeIn} onChange={(e) => voice.setBargeIn(e.target.checked)} className="size-6 accent-[var(--color-brand)]" />
          Stop reading when I start speaking
        </label>
      )}

      {commands && <div>
        <h3 className="mb-2 text-xl font-bold text-ink">Or tap a command</h3>
        <ul className="flex flex-wrap gap-2">
          {QUICK.map(([label, say]) => (
            <li key={label}>
              <button type="button" onClick={() => voice.run(say)} className="min-h-12 rounded-full bg-white px-5 text-lg font-semibold text-brand-deep card-border hover:bg-brand-soft">
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>}

      <details className="rounded-2xl bg-white p-4 card-border">
        <summary className="min-h-11 cursor-pointer text-xl font-semibold text-brand-deep">What can I say?</summary>
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
