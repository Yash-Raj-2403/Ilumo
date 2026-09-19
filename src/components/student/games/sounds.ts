// Small sounds made in the browser, so the listening games need no audio files.
let ctx: AudioContext | null = null;

function context() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, at: number, freq: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** Play one of the game sounds. Returns how long it lasts, in seconds. */
export function playGameSound(kind: "beeps" | "ticks" | "car"): number {
  const c = context();
  if (!c) return 0;
  const t = c.currentTime + 0.05;
  if (kind === "beeps") {
    for (let i = 0; i < 6; i++) tone(c, t + i * 0.22, 1000, 0.1, "sine", 0.35);
    navigator.vibrate?.([100, 120, 100, 120, 100, 120, 100]);
    return 1.4;
  }
  if (kind === "ticks") {
    for (let i = 0; i < 2; i++) tone(c, t + i * 0.9, 320, 0.18, "square", 0.25);
    navigator.vibrate?.([250, 500, 250]);
    return 1.5;
  }
  tone(c, t, 85, 1.6, "sawtooth", 0.4);
  tone(c, t + 0.1, 110, 1.5, "sawtooth", 0.2);
  navigator.vibrate?.([600, 200, 600]);
  return 1.7;
}

/** A short happy sound for a right answer. */
export function playWin() {
  const c = context();
  if (!c) return;
  const t = c.currentTime + 0.02;
  tone(c, t, 660, 0.12, "sine", 0.25);
  tone(c, t + 0.12, 880, 0.2, "sine", 0.25);
}
