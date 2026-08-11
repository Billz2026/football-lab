import { state } from "./core-v6.js?v=31";

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
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
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
  oscillator.stop(start + duration + 0.03);
}

function noise({ duration = 0.18, volume = 0.035, delay = 0, frequency = 1600, q = 0.8, pan = 0, type = "bandpass" }) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.pow(1 - index / sampleCount, 1.35);
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
  source.stop(start + duration + 0.03);
}

function crowd({ duration = 0.9, volume = 0.025, delay = 0, rise = true } = {}) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / sampleCount;
    const envelope = rise ? Math.sin(Math.min(1, t * 1.45) * Math.PI * 0.5) * (1 - t * 0.55) : 1 - t * 0.7;
    data[index] = (Math.random() * 2 - 1) * envelope;
  }
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const start = audio.currentTime + Math.max(0, delay);
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(760, start);
  filter.Q.setValueAtTime(0.38, start);
  source.connect(filter).connect(outputChain(audio, volume, start, duration));
  source.start(start);
  source.stop(start + duration + 0.03);
}

export function unlockAudio() {
  ensureAudioContext();
}

export function playImpactSound(outcome, delaySeconds = 0) {
  if (outcome === "GOAL") {
    noise({ duration: 0.24, volume: 0.052, delay: delaySeconds, frequency: 2100, q: 0.48 });
    noise({ duration: 0.11, volume: 0.035, delay: delaySeconds + 0.018, frequency: 460, q: 0.7 });
    tone({ frequency: 86, endFrequency: 51, duration: 0.14, type: "triangle", volume: 0.06, delay: delaySeconds });
  } else if (outcome === "SAVE") {
    noise({ duration: 0.14, volume: 0.06, delay: delaySeconds, frequency: 580, q: 0.62, pan: 0.12 });
    tone({ frequency: 138, endFrequency: 72, duration: 0.16, type: "triangle", volume: 0.058, delay: delaySeconds });
  } else if (outcome === "POST" || outcome === "BAR") {
    tone({ frequency: outcome === "BAR" ? 1260 : 1040, endFrequency: 710, duration: 0.38, type: "sine", volume: 0.075, delay: delaySeconds });
    tone({ frequency: 1820, endFrequency: 1160, duration: 0.19, type: "triangle", volume: 0.04, delay: delaySeconds + 0.012 });
  } else if (outcome === "WALL") {
    noise({ duration: 0.14, volume: 0.056, delay: delaySeconds, frequency: 410, q: 0.55 });
    tone({ frequency: 112, endFrequency: 58, duration: 0.14, type: "sine", volume: 0.052, delay: delaySeconds });
  } else {
    tone({ frequency: 148, endFrequency: 79, duration: 0.22, type: "sine", volume: 0.028, delay: delaySeconds });
  }
}

export function playOutcomeSound(outcome, { topCorner = false, saveType = null } = {}) {
  if (outcome === "GOAL") {
    crowd({ duration: topCorner ? 1.45 : 1.05, volume: topCorner ? 0.055 : 0.04 });
    tone({ frequency: 330, endFrequency: 392, duration: 0.22, type: "square", volume: 0.025 });
    tone({ frequency: 440, endFrequency: 523, duration: 0.28, type: "square", volume: 0.023, delay: 0.1 });
    tone({ frequency: 587, endFrequency: 659, duration: 0.34, type: "triangle", volume: 0.024, delay: 0.2 });
    if (topCorner) tone({ frequency: 784, endFrequency: 1046, duration: 0.42, type: "sine", volume: 0.03, delay: 0.24 });
  } else if (outcome === "SAVE") {
    crowd({ duration: 0.62, volume: 0.02, rise: false });
    tone({ frequency: saveType === "CATCH" ? 184 : 205, endFrequency: 118, duration: 0.24, type: "sawtooth", volume: 0.027 });
  } else if (outcome === "POST" || outcome === "BAR") {
    crowd({ duration: 0.7, volume: 0.026, rise: false });
    tone({ frequency: 392, endFrequency: 277, duration: 0.24, type: "triangle", volume: 0.03, delay: 0.12 });
  } else if (outcome === "WALL") {
    crowd({ duration: 0.46, volume: 0.014, rise: false });
    tone({ frequency: 145, endFrequency: 90, duration: 0.22, type: "triangle", volume: 0.026 });
  } else {
    crowd({ duration: 0.46, volume: 0.012, rise: false });
    tone({ frequency: 125, endFrequency: 76, duration: 0.26, type: "sine", volume: 0.025 });
  }
}

export function playStageSound({ chapterComplete = false } = {}) {
  crowd({ duration: chapterComplete ? 1.2 : 0.72, volume: chapterComplete ? 0.04 : 0.018 });
  tone({ frequency: 294, endFrequency: 330, duration: 0.16, type: "triangle", volume: 0.025 });
  tone({ frequency: 392, endFrequency: 440, duration: 0.2, type: "triangle", volume: 0.025, delay: 0.1 });
  tone({ frequency: 494, endFrequency: chapterComplete ? 698 : 587, duration: 0.3, type: "sine", volume: 0.028, delay: 0.2 });
}

window.__footballLabAudioV32 = Object.freeze({ layered: true, crowdReactive: true, stereoImpact: true });
