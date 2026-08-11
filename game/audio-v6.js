import { state } from "./core-v6.js?v=32.3";

function ensureAudioContext() {
  if (state.audioContext) return state.audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  state.audioContext = new AudioContextClass();
  if (state.audioContext.state === "suspended") state.audioContext.resume().catch(() => {});
  return state.audioContext;
}

function tone(frequency, duration, type = "sine", volume = 0.04, delay = 0) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function unlockAudio() { ensureAudioContext(); }
export function playKickSound() {
  tone(96, 0.11, "triangle", 0.08);
  tone(58, 0.08, "sine", 0.05, 0.012);
}
export function playResultSound(outcome) {
  if (outcome === "GOAL") {
    tone(392, 0.18, "square", 0.035);
    tone(523, 0.22, "square", 0.03, 0.12);
  } else if (outcome === "POST" || outcome === "BAR") {
    tone(880, 0.14, "triangle", 0.045);
  } else if (outcome === "SAVE") {
    tone(160, 0.18, "sawtooth", 0.025);
  } else {
    tone(110, 0.16, "sine", 0.03);
  }
}
