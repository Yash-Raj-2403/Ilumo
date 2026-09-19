// "Is that a real voice?" detector. The microphone is opened with the browser's own echo
// cancellation, noise suppression and (where supported) voice isolation, then we only call
// something a voice when it is loud enough compared with the room AND its energy sits in the
// range of human speech (about 300 to 3400 Hz). Hum, hiss, taps and far-away chatter don't count.

export type Frame = { level: number; voice: boolean };
export type Detector = { stop: () => void };

const FRAME_MS = 50;
const MIN_VOICE_MS = 150; // a voice has to last this long, so a click or cough is ignored

export async function startDetector(onFrame: (f: Frame) => void): Promise<Detector> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Newer Chrome can isolate the speaker's voice; browsers without it ignore this.
      voiceIsolation: true,
    } as MediaTrackConstraints,
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

  let noise = 0.01; // what "quiet" looks like in this room, learned as we go
  let voiceMs = 0;
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(time);
    let sum = 0;
    for (const v of time) sum += v * v;
    const rms = Math.sqrt(sum / time.length);

    analyser.getFloatFrequencyData(spectrum);
    let band = 0;
    let total = 0;
    for (let i = floorBin; i < top; i++) {
      const p = 10 ** (spectrum[i] / 10); // dB to power
      total += p;
      if (i >= lo && i <= hi) band += p;
    }
    const speechLike = total > 0 && band / total >= 0.55;
    const loudEnough = rms > Math.max(0.012, noise * 2.5);

    if (speechLike && loudEnough) voiceMs += FRAME_MS;
    else {
      voiceMs = Math.max(0, voiceMs - FRAME_MS * 2);
      noise = noise * 0.95 + rms * 0.05;
    }
    onFrame({ level: Math.min(100, Math.round(rms * 300)), voice: voiceMs >= MIN_VOICE_MS });
  }, FRAME_MS);

  return {
    stop() {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
