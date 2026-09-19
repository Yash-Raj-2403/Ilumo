"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { isEcho } from "@/lib/voice/commands";
import { listen, recognitionSupported, type Listener } from "@/lib/voice/recognition";
import { useStudent } from "../student-provider";

const PREF = "ilumo:voice";
type Line = { who: "you" | "ilumo"; text: string };

export type Voice = ReturnType<typeof useVoiceMode>;

/**
 * Two-way voice for the blind & low vision page: the microphone listens, whatever is heard goes to
 * `handlerRef.current`, and `say()` answers out loud. Everything said is also kept as text.
 */
export function useVoiceMode() {
  const { speakOne, stopQueue } = useStudent();
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [log, setLog] = useState<Line[]>([]);
  const listenerRef = useRef<Listener | null>(null);
  const handlerRef = useRef<((text: string) => void | Promise<void>) | null>(null);
  const echoRef = useRef<string | null>(null);

  const push = useCallback((line: Line) => setLog((l) => [...l.slice(-7), line]), []);

  const say = useCallback(
    (text: string, onEnd?: () => void, spoken?: string) => {
      push({ who: "ilumo", text });
      echoRef.current = spoken ?? text;
      speakOne("voice", spoken ?? text, onEnd);
    },
    [push, speakOne],
  );

  const stop = useCallback(() => {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setOn(false);
    setListening(false);
    try { localStorage.setItem(PREF, "0"); } catch { /* storage blocked */ }
  }, []);

  const start = useCallback(
    (quiet = false) => {
      if (listenerRef.current) return;
      setNotice(null);
      listenerRef.current = listen({
        onHeard: (text) => {
          if (isEcho(text, echoRef.current)) return; // our own voice coming back in
          push({ who: "you", text });
          handlerRef.current?.(text);
        },
        onState: setListening,
        onError: (kind) => {
          listenerRef.current = null;
          setOn(false);
          setNotice(
            kind === "denied"
              ? quiet ? "Press “Turn on voice mode” and allow the microphone to talk to ILUMO." : "The microphone is blocked. Allow it in your browser's address bar, then turn voice mode on again."
              : kind === "network"
                ? "Voice recognition needs an internet connection. You can still use the buttons."
                : "This browser can't listen to voice. Try Chrome, Edge or Safari. You can still use the buttons.",
          );
        },
      });
      setOn(true);
      try { localStorage.setItem(PREF, "1"); } catch { /* storage blocked */ }
    },
    [push],
  );

  // Once someone has used voice mode, bring it back on their next visit (if the browser allows).
  /* eslint-disable react-hooks/set-state-in-effect -- one-time capability check on arrival */
  useEffect(() => {
    const ok = recognitionSupported();
    setSupported(ok);
    if (!ok) return;
    try {
      if (localStorage.getItem(PREF) === "1") start(true);
    } catch { /* storage blocked */ }
    return () => {
      listenerRef.current?.stop();
      listenerRef.current = null;
    };
  }, [start]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = useCallback(() => {
    if (on) {
      stopQueue();
      stop();
    } else start();
  }, [on, start, stop, stopQueue]);

  /** What to do with each thing the student says (set by whichever screen is showing). */
  const setHandler = useCallback((fn: ((text: string) => void | Promise<void>) | null) => {
    handlerRef.current = fn;
  }, []);
  /** The text currently being read out, so the microphone can ignore its own echo. */
  const setEcho = useCallback((text: string | null) => {
    echoRef.current = text;
  }, []);

  return { supported, on, listening, notice, log, toggle, say, setHandler, setEcho };
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
              : voice.on
                ? voice.listening ? "Listening. Say “help” to hear what I can do." : "Voice mode is on. Getting the microphone ready..."
                : "Turn on voice mode and control everything by speaking."}
          </p>
        </div>
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            aria-pressed={voice.on}
            className={`inline-flex min-h-14 items-center gap-3 rounded-full px-8 text-lg font-bold shadow-md ${voice.on ? "bg-brand-deep text-white" : "bg-brand text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]"}`}
          >
            {voice.on ? <Mic className="size-6" aria-hidden /> : <MicOff className="size-6" aria-hidden />}
            {voice.on ? "Voice mode is on. Turn off" : "Turn on voice mode"}
          </button>
        )}
      </div>

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
      </details>
    </section>
  );
}
