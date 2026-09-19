"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Star, Volume2 } from "lucide-react";
import { recognitionSupported } from "@/lib/voice/recognition";
import { openListeningWindow, type Session } from "@/lib/voice/session";
import { stopSpeech } from "@/lib/speech";
import { matchSpoken } from "./spoken-answer";
import { Confetti } from "./confetti";
import { liveStreak, recordPlay } from "./streak";
import { findGame } from "./catalog";
import { BUILDERS, type Choice } from "./rounds";
import { playGameSound, playWin } from "./sounds";
import { useStudent } from "../student-provider";

const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

function Stars({ n, size = "size-9", pop = false }: { n: number; size?: string; pop?: boolean }) {
  return (
    <span role="img" aria-label={`${n} out of 3 stars`} className="inline-flex gap-1">
      {[1, 2, 3].map((i) => (
        <Star key={i} aria-hidden style={pop ? { animationDelay: `${i * 0.25}s` } : undefined} className={`${size} ${pop ? "star-pop" : ""} ${i <= n ? "fill-[#ffb434] text-[#e39a10]" : "text-body/40"}`} />
      ))}
    </span>
  );
}
export { Stars };

/** One game: read the rules, answer five questions, collect stars. */
export function GamePlayer({ id }: { id: string }) {
  const game = findGame(id);
  const build = BUILDERS[id];
  const { speakOne, settings, updateSettings, supports } = useStudent();
  const [attempt, setAttempt] = useState(0);
  const rounds = useMemo(() => (build ? build() : []), [build, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [note, setNote] = useState("");
  const [caption, setCaption] = useState("");
  const [burst, setBurst] = useState(0);
  const [mic, setMic] = useState<"off" | "listening" | "hearing">("off");
  const [said, setSaid] = useState<string | null>(null);
  const [micNote, setMicNote] = useState("");
  const [voiceOk, setVoiceOk] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const chooseRef = useRef<(c: Choice) => void>(() => {});
  const listenRef = useRef<() => void>(() => {});
  const headRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Spoken help is on for everyone, except when the only support chosen is deaf and hard of hearing.
  const speaks = !(supports.length === 1 && supports[0] === "deaf-hoh");
  const say = useCallback((t: string, onEnd?: () => void) => { if (speaks) speakOne("game", t, onEnd); else onEnd?.(); }, [speaks, speakOne]);
  useEffect(() => setVoiceOk(recognitionSupported()), []); // eslint-disable-line react-hooks/set-state-in-effect
  // People who use blind or low vision support are asked the question and then listened to, hands-free.
  const autoListen = voiceOk && supports.includes("blind-low-vision");

  const round = rounds[idx];

  const closeMic = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setMic("off");
  }, []);
  useEffect(() => closeMic, [closeMic]);

  // The microphone listens for a few seconds, then turns itself off if nobody speaks.
  const answerByVoice = useCallback(async () => {
    if (!round || solved || sessionRef.current) return;
    stopSpeech();
    setSaid(null);
    setMicNote("");
    setMic("listening");
    sessionRef.current = await openListeningWindow({
      onFrame: (f) => { if (f.voice) setMic("hearing"); },
      onText: (text) => {
        setSaid(text);
        const c = matchSpoken(text, round.choices);
        if (c) chooseRef.current(c);
        else {
          const m = `I heard "${text}". I'm not sure which answer that is. Try again, or press a button.`;
          setMicNote(m);
          say(m);
        }
      },
      onEnd: (reason) => {
        sessionRef.current = null;
        setMic("off");
        if (reason === "silence") setMicNote("I didn't hear anything. Press Speak to try again.");
        else if (reason === "denied") setMicNote("The microphone is turned off. You can still press the buttons.");
        else if (reason === "network" || reason === "unavailable") setMicNote("Voice answers aren't working right now. You can still press the buttons.");
      },
    });
  }, [round, solved, say]);

  // Read a new question and, for blind and low vision support, listen straight after.
  const ask = useCallback((text: string) => say(text, autoListen ? () => void answerByVoice() : undefined), [say, autoListen, answerByVoice]);

  const listen = useCallback(() => {
    if (!round?.sound) return;
    playGameSound(round.sound);
    setCaption(round.sub ?? "");
  }, [round]);

  function begin() {
    setStage("play");
    setSaid(null);
    setMicNote("");
    setIdx(0);
    setMistakes(0);
    setWrong(new Set());
    setSolved(false);
    setNote("");
    setCaption("");
  }

  function choose(c: Choice) {
    if (solved || wrong.has(c.label)) return;
    if (c.ok) {
      setSolved(true);
      setNote(round.praise);
      playWin();
      setBurst((b) => b + 1);
      say(round.praise);
      setTimeout(() => nextRef.current?.focus(), 50);
    } else {
      const m = round.hint(c);
      setWrong((w) => new Set(w).add(c.label));
      setMistakes((n) => n + 1);
      setNote(m);
      say(m, autoListen ? () => listenRef.current() : undefined);
    }
  }
  useEffect(() => {
    chooseRef.current = choose;
    listenRef.current = () => void answerByVoice();
  });

  // A new question: read it out (then listen, for blind and low vision support); sound games play their sound.
  useEffect(() => {
    if (stage !== "play" || !round) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (round.sound) {
      say(round.say);
      t = setTimeout(() => { playGameSound(round.sound!); setCaption(round.sub ?? ""); }, 900);
    } else ask(round.say);
    return () => clearTimeout(t);
  }, [stage, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (idx + 1 >= rounds.length) {
      const s = starsFor(mistakes);
      updateSettings({
        gameStars: (settings.gameStars[id] ?? 0) < s ? { ...settings.gameStars, [id]: s } : settings.gameStars,
        gameStreak: recordPlay(settings.gameStreak, id),
      });
      setBurst((b) => b + 1);
      setStage("done");
      setNote("");
      return;
    }
    setIdx(idx + 1);
    setWrong(new Set());
    setSolved(false);
    setNote("");
    setCaption("");
    setSaid(null);
    setMicNote("");
    setTimeout(() => headRef.current?.focus(), 50);
  }

  // Number keys pick a choice, so a keyboard or switch is enough to play.
  useEffect(() => {
    if (stage !== "play" || !round) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= round.choices.length) choose(round.choices[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!game || !build)
    return (
      <div className="rounded-3xl bg-white p-8 card-border">
        <h1 className="text-3xl font-bold text-ink">We couldn&apos;t find that game.</h1>
        <Link href="/student/games" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-brand-deep px-6 font-semibold text-white">Back to the Game Zone</Link>
      </div>
    );

  const back = (
    <Link href="/student/games" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft">
      <ArrowLeft className="size-5" aria-hidden /> Game Zone
    </Link>
  );
  const big = "min-h-16 rounded-full px-8 text-xl font-bold";

  if (stage === "intro")
    return (
      <div className="space-y-6">
        {back}
        <section className={`rounded-3xl ${game.card} p-8 card-border`}>
          <span aria-hidden className="text-7xl">{game.emoji}</span>
          <h1 className="mt-3 text-4xl font-bold text-ink">{game.title}</h1>
          <p className="mt-3 max-w-prose text-2xl leading-snug text-ink">{game.how}</p>
          <p className="mt-3 text-lg text-ink/80">Five questions. There is no timer. If you pick a wrong answer, you get a hint and can try again.</p>
          {(settings.gameStars[id] ?? 0) > 0 && <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-ink">Your best: <Stars n={settings.gameStars[id]} size="size-7" /></p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={begin} className={`${big} bg-brand-deep text-white`}>Start</button>
            {speaks && <button type="button" onClick={() => say(game.how)} className="inline-flex min-h-16 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border"><Volume2 className="size-5" aria-hidden />Hear the rules</button>}
          </div>
        </section>
      </div>
    );

  if (stage === "done") {
    const s = starsFor(mistakes);
    return (
      <div className="space-y-6">
        {back}
        <section role="status" className="relative overflow-hidden rounded-3xl bg-tint-yellow p-8 text-center card-border">
          <Confetti burst={burst} count={s === 3 ? 60 : 30} />
          <h1 className="text-4xl font-bold text-ink">All done! <span aria-hidden>🎉</span></h1>
          <p className="mt-4 flex justify-center"><Stars n={s} size="size-14" pop /></p>
          {liveStreak(settings.gameStreak) > 0 && (
            <p className="mt-3 text-2xl font-bold text-ink"><span aria-hidden>🔥 </span>{liveStreak(settings.gameStreak)} {liveStreak(settings.gameStreak) === 1 ? "day" : "days"} in a row!</p>
          )}
          <p className="mt-3 text-2xl text-ink">
            {s === 3 ? "Perfect! No mistakes." : s === 2 ? "Well done! Just a couple of tries." : "Good practice! Every try helps you learn."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => { setAttempt((a) => a + 1); setStage("intro"); }} className={`${big} bg-brand-deep text-white`}>Play again</button>
            <Link href="/student/games" className={`inline-flex items-center ${big} bg-white text-brand-deep card-border`}>More games</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <p className="text-lg font-bold text-ink" aria-live="polite">Question {idx + 1} of {rounds.length}</p>
      </div>
      <section className="relative space-y-6 overflow-hidden rounded-3xl bg-white p-6 card-border sm:p-8" aria-labelledby="g-q">
        <Confetti burst={burst} />
        <h1 id="g-q" ref={headRef} tabIndex={-1} className="text-3xl font-bold leading-snug text-ink outline-none sm:text-4xl">{round.prompt}</h1>
        {round.picture && (
          <div className={`rounded-3xl ${game.card} p-6 text-center`}>
            <p role="img" aria-label={round.picture.alt} className="text-7xl leading-tight sm:text-8xl">{round.picture.text}</p>
            {round.sub && !round.sound && <p className="mt-2 text-3xl font-bold text-ink">{round.sub}</p>}
            {round.sound && caption && <p className="mt-2 text-2xl font-bold text-ink"><span aria-hidden>🔊 </span>{caption}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {round.sound && (
            <button type="button" onClick={listen} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand-deep px-6 text-lg font-bold text-white">
              <Volume2 className="size-5" aria-hidden /> Play sound
            </button>
          )}
          {speaks && (
            <button type="button" onClick={() => ask(round.say)} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-brand-deep card-border">
              <Volume2 className="size-5" aria-hidden /> Hear the question
            </button>
          )}
          {voiceOk && !solved && (
            <button
              type="button"
              onClick={() => (mic === "off" ? void answerByVoice() : closeMic())}
              aria-pressed={mic !== "off"}
              className={`inline-flex min-h-14 items-center gap-2 rounded-full px-6 text-lg font-bold ${mic === "off" ? "bg-[#c2410c] text-white" : "bg-tint-pink text-ink ring-2 ring-[#c2410c]"}`}
            >
              <Mic className="size-5" aria-hidden />
              {mic === "off" ? "Speak your answer" : mic === "hearing" ? "Processing speech..." : "Listening... say it now"}
            </button>
          )}
        </div>
        <div role="status" aria-live="polite" className={said || micNote ? "space-y-2" : "sr-only"}>
          {said && (
            <p className="rounded-2xl bg-brand-soft p-4 text-center text-xl text-ink">
              <span className="block text-lg font-bold">You said:</span>{said}
            </p>
          )}
          {micNote && <p className="rounded-2xl bg-tint-yellow p-3 text-lg font-semibold text-ink">{micNote}</p>}
        </div>
        <ul className="grid gap-4 sm:grid-cols-3" aria-label="Choices. Press 1, 2 or 3 to pick.">
          {round.choices.map((c, i) => {
            const isWrong = wrong.has(c.label);
            const isRight = solved && c.ok;
            return (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => choose(c)}
                  disabled={solved && !c.ok}
                  aria-disabled={isWrong}
                  className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-3xl p-4 text-3xl font-bold text-ink ring-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand ${
                    isRight ? "bg-tint-green ring-[#1b7a3a]" : isWrong ? "wobble bg-tint-pink opacity-70 ring-black/30" : "bg-white ring-brand-deep/30 hover:bg-brand-soft"
                  }`}
                >
                  <span className="sr-only">Choice {i + 1}: </span>
                  {c.picture && <span aria-hidden className="text-4xl leading-tight">{c.picture}</span>}
                  <span>{c.label}</span>
                  {isRight && <span className="text-base">✔ Right</span>}
                  {isWrong && <span className="text-base">Try another</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-live="polite" className="min-h-14">
          {note && <p className={`rounded-2xl p-4 text-xl font-semibold text-ink ring-1 ring-black/15 ${solved ? "bg-tint-green" : "bg-tint-yellow"}`}>{note}</p>}
        </div>
        {solved && (
          <button ref={nextRef} type="button" onClick={next} className={`${big} bg-brand-deep text-white`}>
            {idx + 1 >= rounds.length ? "Finish" : "Next"}
          </button>
        )}
      </section>
    </div>
  );
}
