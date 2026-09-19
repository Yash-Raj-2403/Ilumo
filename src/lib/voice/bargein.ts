// Notices when the person starts talking while ILUMO is speaking, so reading can stop straight away.
// Speakers can leak ILUMO's own voice into the microphone, so the loudness needed is learned from
// how loud ILUMO itself sounds: a person speaking close to the microphone is clearly louder than that.

const FRAME_MS = 50;
const SETTLE_MS = 600; // ignore the first moments while the microphone settles
const NEEDED_FRAMES = 7; // about a third of a second of real speech

export type BargeIn = { stop: () => void };

export async function startBargeIn(onSpeech: () => void): Promise<BargeIn> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } as MediaTrackConstraints,
  });
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.2;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const time = new Float32Array(analyser.fftSize);
  const spectrum = new Float32Array(analyser.frequencyBinCount);
  const binHz = ctx.sampleRate / analyser.fftSize;
  const lo = Math.floor(300 / binHz);
  const hi = Math.ceil(3400 / binHz);
  const top = Math.ceil(8000 / binHz);
  const floorBin = Math.floor(60 / binHz);

  const started = Date.now();
  let base = 0.005; // the loudest ILUMO (and the room) gets on its own, fading slowly
  let frames = 0;
  let done = false;
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(time);
    let sum = 0;
    for (const v of time) sum += v * v;
    const rms = Math.sqrt(sum / time.length);
    analyser.getFloatFrequencyData(spectrum);
    let band = 0;
    let total = 0;
    for (let i = floorBin; i < top; i++) {
      const p = 10 ** (spectrum[i] / 10);
      total += p;
      if (i >= lo && i <= hi) band += p;
    }
    const speechLike = total > 0 && band / total >= 0.5;
    const loud = rms > Math.max(0.03, base * 1.8);
    if (Date.now() - started < SETTLE_MS) {
      base = Math.max(base, rms);
      return;
    }
    if (speechLike && loud) frames++;
    else {
      frames = Math.max(0, frames - 1);
      base = Math.max(base * 0.995, rms); // only quieter sounds move the baseline
    }
    if (frames >= NEEDED_FRAMES && !done) {
      done = true;
      onSpeech();
    }
  }, FRAME_MS);

  return {
    stop() {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
