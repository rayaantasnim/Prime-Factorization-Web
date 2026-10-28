/**
 * PrimeFactor.app — Dynamic Exam Arena Controller Module Reference
 * Exports Move Evaluation Engine, Thermodynamic Audio Tension Engine,
 * and High-Bound Honey Spot Suppression Gate for the Exam Arena.
 */

export * from './move-evaluator.js';
export {
  startExamTensionAtmosphere,
  stopExamTensionAtmosphere,
  updateExamTensionTelemetry,
  getExamTensionState,
  playSound
} from './audio.js';
export {
  rollCompositeNumber,
  isHoneySpotSuppressed,
  isDeceptiveSymmetricCandidate,
  factorize,
  parseAndValidateFactorInput
} from './math-engine.js';

// Browser global window attachment for seamless telemetry debugging & integration
if (typeof window !== 'undefined') {
  window.ExamArenaController = {
    ...(window.ExamArenaController || {}),
    version: '3.4.0'
  };
}
