"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { useNotify } from "./visual-alerts";

// Watches the microphone for sudden loud sounds (a knock, someone calling, an alarm) and shows a
// clear on-screen alert. It never records or sends anything: it only measures how loud it is.

const FLOOR = [0.14, 0.1, 0.07, 0.045, 0.03]; // quietest level that can ever trigger, by sensitivity 1..5
const RATIO = [4, 3, 2.3, 1.8, 1.5]; // how much louder than the room's usual level

export function SoundAlerts() {
  const notify = useNotify();
  const [on, setOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [sensitivity, setSensitivity] = useState(3);
  const [flash, setFlash] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [alertAt, setAlertAt] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const opts = useRef({ sensitivity, flash, vibrate });
  useEffect(() => { opts.current = { sensitivity, flash, vibrate }; }, [sensitivity, flash, vibrate]);

  const raise = useCallback(() => {
    setAlertAt(Date.now());
    if (opts.current.vibrate) navigator.vibrate?.([250, 120, 250]);
  }, []);
  useEffect(() => {
    if (alertAt === null) return;
    const t = setTimeout(() => setAlertAt(null), 4000);
    return () => clearTimeout(t);
  }, [alertAt]);

  const stop = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    setOn(false);
    setLevel(0);
  }, []);
  useEffect(() => () => cleanup.current?.(), []);

  async function start() {
    setProblem(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let baseline = 0.01;
      let lastAlert = 0;
      const timer = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(100, Math.round(rms * 400)));
        const s = opts.current.sensitivity - 1;
        const loud = rms > Math.max(FLOOR[s], baseline * RATIO[s]);
        const now = Date.now();
        if (loud && now - lastAlert > 4000) {
          lastAlert = now;
          raise();
        } else if (!loud) {
          baseline = baseline * 0.97 + rms * 0.03; // learn what "normal" sounds like in this room
        }
      }, 100);
      cleanup.current = () => {
        clearInterval(timer);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      setOn(true);
      notify("Sound alerts are on.", "success");
    } catch {
      const msg = "We couldn't use the microphone. Allow it in your browser's address bar and try again.";
      setProblem(msg);
      notify(msg, "warning");
    }
  }

  const label = level > 55 ? "Loud" : level > 20 ? "Some sound" : "Quiet";
  const btn = "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft";

  return (
    <section aria-labelledby="sa-h" className="space-y-6">
      <div>
        <h2 id="sa-h" className="text-3xl font-bold text-ink">Sound alerts</h2>
        <p className="mt-2 max-w-2xl text-lg text-body">
          ILUMO listens for sudden loud sounds around you, like a knock, someone calling or an alarm, and shows you a big message on screen. Nothing is recorded.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {on ? (
          <button type="button" onClick={() => { stop(); notify("Sound alerts are off."); }} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-rose-700 px-8 text-lg font-bold text-white">
            <Bell className="size-6" aria-hidden /> Turn sound alerts off
          </button>
        ) : (
          <button type="button" onClick={start} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-brand px-8 text-lg font-bold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
            <BellRing className="size-6" aria-hidden /> Turn sound alerts on
          </button>
        )}
        <button type="button" onClick={raise} className={btn}>Test the alert</button>
      </div>
      {problem && <p role="alert" className="rounded-2xl bg-tint-pink p-4 text-lg font-semibold text-ink ring-1 ring-black/20">⚠ {problem}</p>}

      <div className="rounded-3xl bg-white p-6 card-border">
        <h3 className="text-xl font-bold text-ink">Sound level</h3>
        <div role="meter" aria-label="Sound level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} aria-valuetext={on ? label : "Off"} className="mt-3 h-8 overflow-hidden rounded-full bg-brand-soft ring-1 ring-brand-deep/15">
          <div className={`h-full rounded-full ${level > 55 ? "bg-rose-600" : level > 20 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${on ? Math.max(3, level) : 0}%` }} />
        </div>
        <p className="mt-2 text-lg font-bold text-ink">{on ? label : "Off"}</p>
      </div>

      <div className="space-y-5 rounded-3xl bg-white p-6 card-border">
        <div>
          <label htmlFor="sens" className="text-xl font-bold text-ink">How easily should it alert? <span className="text-brand">{["Only very loud", "Loud", "Medium", "Easily", "Very easily"][sensitivity - 1]}</span></label>
          <input id="sens" type="range" min={1} max={5} step={1} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="mt-3 block h-11 w-full accent-[var(--color-brand)]" />
          <div className="flex justify-between text-sm text-body"><span>Only very loud sounds</span><span>Even small sounds</span></div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-lg font-semibold text-ink">
          <input type="checkbox" checked={flash} onChange={(e) => setFlash(e.target.checked)} className="size-6 accent-[var(--color-brand)]" />
          Show a full-screen message (one gentle pulse, never flashing)
        </label>
        <label className="flex min-h-11 items-center gap-3 text-lg font-semibold text-ink">
          <input type="checkbox" checked={vibrate} onChange={(e) => setVibrate(e.target.checked)} className="size-6 accent-[var(--color-brand)]" />
          Vibrate my phone
        </label>
      </div>
      <p className="text-base text-body">Keep this page open. Your browser must be allowed to use the microphone, and alerts only work while the page is showing.</p>

      {alertAt !== null && (
        <div role="alert" className={`fixed z-[70] ${flash ? "inset-0 grid place-items-center bg-amber-400/90 motion-safe:animate-[pulse_1.2s_ease-out_1]" : "inset-x-0 top-24 flex justify-center px-4"}`}>
          <div className={`flex items-center gap-4 rounded-3xl bg-black px-8 py-6 text-3xl font-extrabold text-yellow-300 shadow-2xl sm:text-5xl ${flash ? "" : "text-2xl"}`}>
            <BellRing className="size-10 shrink-0 sm:size-14" aria-hidden /> Loud sound nearby
            <button type="button" onClick={() => setAlertAt(null)} className="ml-4 min-h-12 rounded-full bg-yellow-300 px-5 text-lg font-bold text-black">Dismiss</button>
          </div>
        </div>
      )}
    </section>
  );
}
