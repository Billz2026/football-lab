import { state } from "./core-v6.js?v=32.4";

const BUILD = "54.0.0";
const SETTINGS_KEY = "footballLabSettingsV22";

function soundEnabled() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").sound !== false;
  } catch {
    return true;
  }
}

function ensureAudioContext() {
  if (!soundEnabled()) return null;
  if (state.audioContext) {
    if (state.audioContext.state === "suspended") state.audioContext.resume().catch(() => {});
    return state.audioContext;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  state.audioContext = new AudioContextClass();
  if (state.audioContext.state === "suspended") state.audioContext.resume().catch(() => {});
  return state.audioContext;
}

function outputChain(audio, volume, start, duration, pan = 0) {
  const gain = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  const panner = typeof audio.createStereoPanner === "function" ? audio.createStereoPanner() : null;

  gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  compressor.threshold.value = -16;
  compressor.knee.value = 10;
  compressor.ratio.value = 4.5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.09;

  if (panner) {
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), start);
    gain.connect(panner).connect(compressor).connect(audio.destination);
  } else {
    gain.connect(compressor).connect(audio.destination);
  }
  return gain;
}

function tone({ frequency, endFrequency = frequency, duration, type = "sine", volume = 0.04, delay = 0, pan = 0 }) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const start = audio.currentTime + Math.max(0, delay);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  oscillator.connect(outputChain(audio, volume, start, duration, pan));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);
}

function noise({ duration = 0.08, volume = 0.04, delay = 0, frequency = 1200, q = 0.7, pan = 0, type = "bandpass" }) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / sampleCount;
    const envelope = Math.pow(1 - t, 1.7);
    data[index] = (Math.random() * 2 - 1) * envelope;
  }

  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const start = audio.currentTime + Math.max(0, delay);
  source.buffer = buffer;
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, start);
  filter.Q.setValueAtTime(q, start);
  source.connect(filter).connect(outputChain(audio, volume, start, duration, pan));
  source.start(start);
  source.stop(start + duration + 0.025);
}

export function playStrikeSound({
  power = 0.5,
  contactQuality = 1,
  curve = 0,
  ballId = "standard"
} = {}) {
  const p = Math.max(0, Math.min(1, Number(power) || 0));
  const q = Math.max(0.06, Math.min(1, Number(contactQuality) || 0.06));
  const bend = Math.max(-1, Math.min(1, Number(curve) || 0));
  const isKnuckle = ballId === "knuckle";
  const isPower = ballId === "power";
  const isControl = ballId === "control";
  const mishit = q < 0.45;

  const bodyVolume = 0.034 + p * 0.034 + q * 0.016;
  const crackVolume = 0.02 + q * 0.037 + p * 0.012;
  const pan = Math.max(-0.16, Math.min(0.16, bend * 0.08));

  tone({
    frequency: mishit ? 104 : isPower ? 132 : 122,
    endFrequency: mishit ? 58 : 72,
    duration: mishit ? 0.115 : 0.095,
    type: "triangle",
    volume: bodyVolume * (isControl ? 0.88 : 1),
    pan
  });

  noise({
    duration: mishit ? 0.075 : 0.055,
    volume: crackVolume * (isKnuckle ? 1.12 : 1),
    frequency: mishit ? 620 : isKnuckle ? 1780 : 1320 + q * 420,
    q: mishit ? 0.48 : 0.72,
    pan
  });

  if (q >= 0.94) {
    noise({
      duration: 0.032,
      volume: 0.021 + p * 0.012,
      delay: 0.004,
      frequency: isKnuckle ? 2450 : 2120,
      q: 1.05,
      pan
    });
  }

  if (p >= 0.82 && !mishit) {
    tone({
      frequency: 74,
      endFrequency: 48,
      duration: 0.13,
      type: "sine",
      volume: 0.018 + p * 0.014,
      delay: 0.006,
      pan
    });
  }
}

window.__footballLabStrikeAudioV54 = Object.freeze({
  build: BUILD,
  sharedAudioContext: true,
  respectsSoundSetting: true,
  contactQualityReactive: true,
  powerReactive: true,
  specialistBallReactive: true
});
