/**
 * PrimeFactor.app — Web Audio API Sound Synthesizer
 * Zero External MP3 Dependencies. 100% Hermetic Synthesized Sound FX.
 */

import { getSettings } from './storage.js';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type) {
  const settings = getSettings();
  if (!settings.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'wheelTick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.02);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }

      case 'correct': {
        // Harmonic major third / fifth chime
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.09, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.28);
        });
        break;
      }

      case 'error': {
        // Low discord buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'alert': {
        // Attention ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'fanfare': {
        // Victory triad arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.12, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.45);
        });
        break;
      }
    }
  } catch (err) {
    console.debug('Audio error or blocked:', err);
  }
}

// ============================================================================
// THERMODYNAMIC AUDIO TENSION ENGINE
// ============================================================================

let tensionState = {
  active: false,
  allocatedSeconds: 180,
  timeRemaining: 180,
  primeFactors: [],
  userElo: 1200,
  currentIndex: 0,
  totalQuestions: 10,
  carrierOsc: null,
  droneOsc: null,
  lfoOsc: null,
  lfoDepth: null,
  ampGain: null,
  discordantOsc: null,
  discordantGain: null,
  masterGain: null,
  intervalId: null
};

/**
 * Updates dynamic telemetry inputs consumed by the 100ms audio tension loop.
 *
 * @param {Object} telemetry Telemetry update object
 * @param {number} [telemetry.timeRemaining] Active seconds left on clock
 * @param {number[]} [telemetry.primeFactors] Prime factors array of active problem
 * @param {number} [telemetry.userElo] Active competitor ELO rating
 * @param {number} [telemetry.currentIndex] Current question index (0 to 9)
 * @param {number} [telemetry.totalQuestions] Total number of questions in match
 */
export function updateExamTensionTelemetry(telemetry = {}) {
  if (telemetry.timeRemaining !== undefined) tensionState.timeRemaining = Number(telemetry.timeRemaining);
  if (telemetry.primeFactors !== undefined) tensionState.primeFactors = Array.isArray(telemetry.primeFactors) ? telemetry.primeFactors : [];
  if (telemetry.userElo !== undefined) tensionState.userElo = Number(telemetry.userElo);
  if (telemetry.currentIndex !== undefined) tensionState.currentIndex = Number(telemetry.currentIndex);
  if (telemetry.totalQuestions !== undefined) tensionState.totalQuestions = Number(telemetry.totalQuestions);
}

/**
 * Returns a snapshot of the active tension synthesizer state.
 */
export function getExamTensionState() {
  return { ...tensionState };
}

/**
 * Starts the Thermodynamic Audio Tension Engine.
 * 100% native Web Audio API synthesizer generating continuous real-time psychological tension.
 *
 * @param {number} allocatedSeconds Match duration limit in seconds
 */
export function startExamTensionAtmosphere(allocatedSeconds = 180) {
  const settings = getSettings();
  if (!settings.soundEnabled) return;

  try {
    stopExamTensionAtmosphere(); // Clean up any previous session

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    tensionState.allocatedSeconds = Math.max(1, Number(allocatedSeconds) || 180);
    tensionState.timeRemaining = tensionState.allocatedSeconds;
    tensionState.active = true;

    // 1. Master Volume Gain Node (Compounds across questions #1 to #10)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.035, now);
    masterGain.connect(ctx.destination);
    tensionState.masterGain = masterGain;

    // 2. Tremolo / LFO Amplitude Modulator Gain Node
    const ampGain = ctx.createGain();
    ampGain.gain.setValueAtTime(0.5, now);
    ampGain.connect(masterGain);
    tensionState.ampGain = ampGain;

    // 3. Asynchronous LFO Pulse-Rate Trigger (1 Hz to 12 Hz)
    const lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(1.0, now);

    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(0.35, now);
    lfoOsc.connect(lfoDepth);
    lfoDepth.connect(ampGain.gain);
    lfoOsc.start(now);
    tensionState.lfoOsc = lfoOsc;
    tensionState.lfoDepth = lfoDepth;

    // 4. Baseline Deep Sub-Bass Carrier Sine Wave (60 Hz baseline)
    const carrierOsc = ctx.createOscillator();
    carrierOsc.type = 'sine';
    carrierOsc.frequency.setValueAtTime(60, now);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.8, now);
    carrierOsc.connect(carrierGain);
    carrierGain.connect(ampGain);
    carrierOsc.start(now);
    tensionState.carrierOsc = carrierOsc;

    // 5. Asymmetric Triangle Wave Drone (Acoustic resonance & beating drone)
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(60.8, now); // Slight detune for acoustic phase tension

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.65, now);
    droneOsc.connect(droneGain);
    droneGain.connect(ampGain);
    droneOsc.start(now);
    tensionState.droneOsc = droneOsc;

    // 6. Discordant Offset Frequency Layer (Input B: Integer Complexity)
    const discordantOsc = ctx.createOscillator();
    discordantOsc.type = 'sawtooth';
    discordantOsc.frequency.setValueAtTime(60 * 1.414, now);

    const discordantGain = ctx.createGain();
    discordantGain.gain.setValueAtTime(0.0001, now); // Dormant initially
    discordantOsc.connect(discordantGain);
    discordantGain.connect(masterGain);
    discordantOsc.start(now);
    tensionState.discordantOsc = discordantOsc;
    tensionState.discordantGain = discordantGain;

    // 7. Active Internal Timing Loop: Mutate Fourier Frequencies every 100ms
    tensionState.intervalId = setInterval(() => {
      if (!tensionState.active || !audioCtx) return;
      const tickNow = audioCtx.currentTime;

      // Telemetry Input A: Time Decay (allocatedSeconds -> 0s)
      const elapsed = Math.max(0, tensionState.allocatedSeconds - tensionState.timeRemaining);
      let decayFraction = tensionState.allocatedSeconds > 0
        ? Math.min(1.0, Math.max(0.0, elapsed / tensionState.allocatedSeconds))
        : 0.0;

      // Telemetry Input C: ELO Bracket Scaling (>= 2000 ELO -> 1.5x escalation velocity)
      if (tensionState.userElo >= 2000) {
        decayFraction = Math.min(1.0, decayFraction * 1.5);
      }

      // Linear frequency escalation from 60 Hz to piercing 320 Hz siren pitch
      const baseFreq = 60 + (320 - 60) * decayFraction;
      carrierOsc.frequency.setTargetAtTime(baseFreq, tickNow, 0.08);
      droneOsc.frequency.setTargetAtTime(baseFreq * 1.015, tickNow, 0.08);

      // Accelerate LFO pulse rate from 1 Hz (1 beat/sec) to 12 Hz mechanical chatter
      const lfoRate = 1.0 + (12.0 - 1.0) * decayFraction;
      lfoOsc.frequency.setTargetAtTime(lfoRate, tickNow, 0.08);

      // Telemetry Input B: Integer Complexity (Unique prime factors beyond 2)
      const uniqueFactors = new Set(tensionState.primeFactors);
      const extraFactors = Math.max(0, uniqueFactors.size - 2);

      if (extraFactors > 0) {
        // Multiplier: 1.414 (tritone) for 1 extra, 1.618 (golden ratio) for 2+ extra
        const harmonicRatio = extraFactors >= 2 ? 1.618 : 1.414;
        const discordantFreq = baseFreq * harmonicRatio;
        discordantOsc.frequency.setTargetAtTime(discordantFreq, tickNow, 0.08);

        // Immediate psychological ominous harmony gain boost
        const discordTargetGain = Math.min(0.08, 0.025 * extraFactors);
        discordantGain.gain.setTargetAtTime(discordTargetGain, tickNow, 0.08);
      } else {
        discordantGain.gain.setTargetAtTime(0.0001, tickNow, 0.08);
      }

      // Question Multiplier Accumulation Rule:
      // Track currentIndex (0 to 9) and compound base volume amplitude dynamically.
      // Question #10 forcefully activates maximum cybernetic tension threshold (~0.16).
      const progressIndex = Math.max(0, Math.min(9, tensionState.currentIndex));
      const targetVolume = 0.035 * Math.pow(1.18, progressIndex);
      masterGain.gain.setTargetAtTime(targetVolume, tickNow, 0.08);

      // Compound LFO modulation depth with question index
      const progressRatio = progressIndex / Math.max(1, (tensionState.totalQuestions || 10) - 1);
      lfoDepth.gain.setTargetAtTime(0.35 + 0.25 * progressRatio, tickNow, 0.08);
    }, 100);

  } catch (err) {
    console.debug('Error in startExamTensionAtmosphere:', err);
  }
}

/**
 * Cleanly dismantles all oscillator nodes, clears intervals, and prevents audio thread leaks.
 */
export function stopExamTensionAtmosphere() {
  if (tensionState.intervalId) {
    clearInterval(tensionState.intervalId);
    tensionState.intervalId = null;
  }

  const now = audioCtx ? audioCtx.currentTime : 0;

  if (tensionState.masterGain && audioCtx) {
    try {
      tensionState.masterGain.gain.setTargetAtTime(0.0001, now, 0.03);
    } catch (e) {}
  }

  setTimeout(() => {
    try {
      if (tensionState.carrierOsc) {
        tensionState.carrierOsc.stop();
        tensionState.carrierOsc.disconnect();
      }
      if (tensionState.droneOsc) {
        tensionState.droneOsc.stop();
        tensionState.droneOsc.disconnect();
      }
      if (tensionState.lfoOsc) {
        tensionState.lfoOsc.stop();
        tensionState.lfoOsc.disconnect();
      }
      if (tensionState.discordantOsc) {
        tensionState.discordantOsc.stop();
        tensionState.discordantOsc.disconnect();
      }
      if (tensionState.ampGain) tensionState.ampGain.disconnect();
      if (tensionState.lfoDepth) tensionState.lfoDepth.disconnect();
      if (tensionState.discordantGain) tensionState.discordantGain.disconnect();
      if (tensionState.masterGain) tensionState.masterGain.disconnect();
    } catch (err) {
      console.debug('Dismantling tension nodes error:', err);
    }

    tensionState.carrierOsc = null;
    tensionState.droneOsc = null;
    tensionState.lfoOsc = null;
    tensionState.discordantOsc = null;
    tensionState.ampGain = null;
    tensionState.lfoDepth = null;
    tensionState.discordantGain = null;
    tensionState.masterGain = null;
    tensionState.active = false;
  }, 40);
}
