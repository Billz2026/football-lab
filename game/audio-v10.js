import { state } from "./core-v6.js?v=32.4";

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

function tone({ frequency, endFrequency = frequency, duration, type = "sine", volume = 0.04, delay = 0 }) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + Math.max(0, delay);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise({ duration = 0.18, volume = 0.035, delay = 0, frequency = 1600, q = 0.8 }) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = 1 - index / sampleCount;
    data[index] = (Math.random() * 2 - 1) * envelope;
  }
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  const start = audio.currentTime + Math.max(0, delay);
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, start);
  filter.Q.setValueAtTime(q, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function unlockAudio() {
  ensureAudioContext();
}

export function playImpactSound(outcome, delaySeconds = 0) {
  if (outcome === "GOAL") {
    noise({ duration: 0.22, volume: 0.045, delay: delaySeconds, frequency: 1900, q: 0.55 });
    tone({ frequency: 82, endFrequency: 55, duration: 0.13, type: "triangle", volume: 0.055, delay: delaySeconds });
  } else if (outcome === "SAVE") {
    noise({ duration: 0.13, volume: 0.05, delay: delaySeconds, frequency: 620, q: 0.7 });
    tone({ frequency: 130, endFrequency: 78, duration: 0.15, type: "triangle", volume: 0.055, delay: delaySeconds });
  } else if (outcome === "POST" || outcome === "BAR") {
    tone({ frequency: outcome === "BAR" ? 1180 : 980, endFrequency: 760, duration: 0.3, type: "sine", volume: 0.07, delay: delaySeconds });
    tone({ frequency: 1760, endFrequency: 1210, duration: 0.18, type: "triangle", volume: 0.035, delay: delaySeconds + 0.015 });
  } else if (outcome === "WALL") {
    noise({ duration: 0.12, volume: 0.05, delay: delaySeconds, frequency: 430, q: 0.6 });
    tone({ frequency: 105, endFrequency: 64, duration: 0.13, type: "sine", volume: 0.045, delay: delaySeconds });
  } else {
    tone({ frequency: 150, endFrequency: 92, duration: 0.2, type: "sine", volume: 0.025, delay: delaySeconds });
  }
}

export function playOutcomeSound(outcome, { topCorner = false } = {}) {
  if (outcome === "GOAL") {
    noise({ duration: 0.72, volume: topCorner ? 0.04 : 0.032, frequency: 950, q: 0.35 });
    tone({ frequency: 330, endFrequency: 392, duration: 0.22, type: "square", volume: 0.025 });
    tone({ frequency: 440, endFrequency: 523, duration: 0.28, type: "square", volume: 0.023, delay: 0.1 });
    tone({ frequency: 587, endFrequency: 659, duration: 0.34, type: "triangle", volume: 0.024, delay: 0.2 });
    if (topCorner) tone({ frequency: 784, endFrequency: 1046, duration: 0.38, type: "sine", volume: 0.025, delay: 0.24 });
  } else if (outcome === "SAVE") {
    tone({ frequency: 196, endFrequency: 130, duration: 0.22, type: "sawtooth", volume: 0.025 });
  } else if (outcome === "POST" || outcome === "BAR") {
    tone({ frequency: 392, endFrequency: 294, duration: 0.22, type: "triangle", volume: 0.028, delay: 0.12 });
  } else if (outcome === "WALL") {
    tone({ frequency: 145, endFrequency: 96, duration: 0.2, type: "triangle", volume: 0.025 });
  } else {
    tone({ frequency: 125, endFrequency: 82, duration: 0.24, type: "sine", volume: 0.024 });
  }
}

export function playStageSound() {
  tone({ frequency: 294, endFrequency: 330, duration: 0.16, type: "triangle", volume: 0.025 });
  tone({ frequency: 392, endFrequency: 440, duration: 0.2, type: "triangle", volume: 0.025, delay: 0.1 });
  tone({ frequency: 494, endFrequency: 587, duration: 0.28, type: "sine", volume: 0.025, delay: 0.2 });
}
