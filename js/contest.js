/**
 * PrimeFactor.app — Dedicated Contest Hub Controller
 * Coordinates Sudden Death Lightning Roll 9-Segment Real-Time Physics Spin Wheel,
 * Algorithmic High-ELO Lockout Filter, Tactile Audio-Visual Chattering Ticks,
 * and Tournament Routing Gateways.
 */

import { initGlobalHeader, renderFooter, triggerFlash, initSettingsModal } from './header.js';
import { getLedger, getSettings, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';
import { getUserElo, setUserElo } from './elo-engine.js';

// 9 Standard Mathematical Tiers (Exactly 9 equal segments)
const STANDARD_TIERS = [
  {
    id: 1,
    tierNum: 1,
    title: 'Tier 1: 1 - 200',
    label: 'Tier 1 · Foundations',
    shortLabel: 'T1: Foundations',
    min: 1,
    max: 200,
    time: 180, // 3 min
    color: '#10B981', // Mint Emerald
    darkColor: '#064e3b',
    rangeStr: '1 — 200'
  },
  {
    id: 2,
    tierNum: 2,
    title: 'Tier 2: 201 - 500',
    label: 'Tier 2 · Intermediate',
    shortLabel: 'T2: Intermediate',
    min: 201,
    max: 500,
    time: 300, // 5 min
    color: '#0EA5E9', // Sky Cyan
    darkColor: '#0c4a6e',
    rangeStr: '201 — 500'
  },
  {
    id: 3,
    tierNum: 3,
    title: 'Tier 3: 501 - 1,000',
    label: 'Tier 3 · Olympiad Standard',
    shortLabel: 'T3: Olympiad',
    min: 501,
    max: 1000,
    time: 480, // 8 min
    color: '#2563EB', // Royal Blue
    darkColor: '#1e3a8a',
    rangeStr: '501 — 1,000'
  },
  {
    id: 4,
    tierNum: 4,
    title: 'Tier 4: 1,001 - 2,000',
    label: 'Tier 4 · Advanced',
    shortLabel: 'T4: Advanced',
    min: 1001,
    max: 2000,
    time: 720, // 12 min
    color: '#6366F1', // Indigo Neon
    darkColor: '#312e81',
    rangeStr: '1,001 — 2k'
  },
  {
    id: 5,
    tierNum: 5,
    title: 'Tier 5: 2,001 - 5,000',
    label: 'Tier 5 · Senior League',
    shortLabel: 'T5: Senior',
    min: 2001,
    max: 5000,
    time: 1080, // 18 min
    color: '#8B5CF6', // Purple Violet
    darkColor: '#4c1d95',
    rangeStr: '2,001 — 5k'
  },
  {
    id: 6,
    tierNum: 6,
    title: 'Tier 6: 5,001 - 10,000',
    label: 'Tier 6 · Invitational',
    shortLabel: 'T6: Invitational',
    min: 5001,
    max: 10000,
    time: 1500, // 25 min
    color: '#EC4899', // Crimson Rose
    darkColor: '#831843',
    rangeStr: '5,001 — 10k'
  },
  {
    id: 7,
    tierNum: 7,
    title: 'Tier 7: 10,001 - 20,000',
    label: 'Tier 7 · Grandmaster',
    shortLabel: 'T7: Grandmaster',
    min: 10001,
    max: 20000,
    time: 2100, // 35 min
    color: '#F59E0B', // Amber Gold
    darkColor: '#78350f',
    rangeStr: '10,001 — 20k'
  },
  {
    id: 8,
    tierNum: 8,
    title: 'Tier 8: 20,000+ (Elite)',
    label: 'Tier 8 · Elite Cap',
    shortLabel: 'T8: Elite Cap',
    min: 20001,
    max: 35000,
    time: 2700, // 45 min
    color: '#F97316', // Neon Orange
    darkColor: '#7c2d12',
    rangeStr: '20,001 — 35k'
  },
  {
    id: 9,
    tierNum: 9,
    title: 'Omega: 1 to Infinity',
    label: 'Tier 9 · Cosmic Manifold',
    shortLabel: 'Omega: Cosmic',
    min: 1,
    max: 50000,
    time: 3600, // 60 min
    color: '#D946EF', // Cosmic Fuchsia
    darkColor: '#701a75',
    rangeStr: '1 — 50,000'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initSettingsModal();
  initContestHub();
});

// Master Contest Hub Engine
function initContestHub() {
  const canvas = document.getElementById('wheel-canvas');
  const rollBtn = document.getElementById('roll-arena-btn');
  const pointerPin = document.getElementById('wheel-pointer');
  const bannerEl = document.getElementById('roll-status-banner');
  const bannerText = document.getElementById('roll-status-text');
  const bannerIcon = document.getElementById('roll-status-icon');
  const eloValEl = document.getElementById('competitor-elo-val');
  const eloSummaryEl = document.getElementById('elo-lockout-summary');
  const editEloBtn = document.getElementById('edit-elo-btn');

  if (!canvas || !rollBtn) return;

  const ctx = canvas.getContext('2d');
  const SEGMENTS_COUNT = 9;
  const STEP_RAD = (2 * Math.PI) / SEGMENTS_COUNT; // 40 degrees per segment

  let currentRotation = 0; // in radians
  let isSpinning = false;
  let lastPointedIndex = -1;
  let winningIndex = -1;
  let isBlinking = false;
  let blinkPhase = false;

  // Process Tiers with Official 12-Tier ELO-to-Range Banning Matrix
  let userElo = getUserElo();
  let tiersWithLockout = computeLockouts(userElo);

  function computeLockouts(elo) {
    return STANDARD_TIERS.map((tier) => {
      let isLocked = false;
      let minBannedElo = null;

      // 12-Tier ELO-to-Range Banning Matrix Application
      if (elo >= 3000) {
        // Tier 1 · 3000+ ELO [Prime Singularity]: MAX_BOUND <= 10000
        if (tier.max <= 10000) { isLocked = true; minBannedElo = 3000; }
      } else if (elo >= 2700) {
        // Tier 2 · 2700 - 2999 ELO [Riemann Transcendentalist]: MAX_BOUND <= 5000
        if (tier.max <= 5000) { isLocked = true; minBannedElo = 2700; }
      } else if (elo >= 2200) {
        // Tier 4 & 3 · 2200 - 2699 ELO [Gaussian Cryptographer / Canonical Analyst]: MAX_BOUND <= 2000
        if (tier.max <= 2000) { isLocked = true; minBannedElo = 2200; }
      } else if (elo >= 1800) {
        // Tier 6 & 5 · 1800 - 2199 ELO [Logarithmic Vector / Eulerian Sentinel]: MAX_BOUND <= 1000
        if (tier.max <= 1000) { isLocked = true; minBannedElo = 1800; }
      } else if (elo >= 1400) {
        // Tier 8 & 7 · 1400 - 1799 ELO [Modular Operator / Prime Strategist]: MAX_BOUND <= 500
        if (tier.max <= 500) { isLocked = true; minBannedElo = 1400; }
      } else if (elo >= 900) {
        // Tier 10 & 9 · 900 - 1399 ELO [Sieve Calibrator / Radix Scholar]: MAX_BOUND <= 200
        if (tier.max <= 200) { isLocked = true; minBannedElo = 900; }
      }
      // Tier 11 (500-899) & Tier 12 (0-499): All segments open.

      return { ...tier, isLocked, minBannedElo };
    });
  }

  function updateEloDisplay() {
    if (eloValEl) eloValEl.textContent = userElo;
    const unlockedCount = tiersWithLockout.filter(t => !t.isLocked).length;
    const lockedCount = SEGMENTS_COUNT - unlockedCount;

    if (eloSummaryEl) {
      if (lockedCount === 0) {
        eloSummaryEl.textContent = `All 9 Divisions Open`;
        eloSummaryEl.style.color = '#10B981';
      } else {
        eloSummaryEl.textContent = `${unlockedCount} / 9 Divisions Eligible (${lockedCount} Banned)`;
        eloSummaryEl.style.color = '#F59E0B';
      }
    }
  }

  // Adjust Rating interactive prompt
  if (editEloBtn) {
    editEloBtn.addEventListener('click', () => {
      playSound('click');
      const input = prompt(
        `Enter simulated Competitor ELO rating (0 - 4000):\n\nOfficial Banning Thresholds:\n• ELO ≥ 900: Locks MAX_BOUND ≤ 200\n• ELO ≥ 1400: Locks MAX_BOUND ≤ 500\n• ELO ≥ 1800: Locks MAX_BOUND ≤ 1,000\n• ELO ≥ 2200: Locks MAX_BOUND ≤ 2,000\n• ELO ≥ 2700: Locks MAX_BOUND ≤ 5,000\n• ELO ≥ 3000: Locks MAX_BOUND ≤ 10,000`,
        String(userElo)
      );
      if (input !== null) {
        const val = Number(input.trim());
        if (!isNaN(val) && val >= 0 && val <= 4000) {
          userElo = Math.round(val);
          setUserElo(userElo);
          tiersWithLockout = computeLockouts(userElo);
          updateEloDisplay();
          drawWheel(currentRotation);
          triggerFlash('warning');
          if (bannerText) {
            bannerText.textContent = `Rating updated to ${userElo} ELO. Dynamic wheel lockouts recalculated.`;
          }
        }
      }
    });
  }

  updateEloDisplay();

  /**
   * Determine which segment is directly under the 12 o'clock pointer pin.
   * 12 o'clock in standard polar coordinates is -PI/2 (or 3*PI/2).
   * A segment i is drawn centered around angle: i * STEP_RAD.
   */
  function getSegmentAtPointer(rotation) {
    const pointerAngle = -Math.PI / 2;
    // Normalize relative angle
    let rel = (pointerAngle - rotation) % (2 * Math.PI);
    if (rel < 0) rel += 2 * Math.PI;

    // Segment i occupies [i * STEP_RAD - STEP_RAD/2, i * STEP_RAD + STEP_RAD/2]
    let shifted = rel + STEP_RAD / 2;
    let idx = Math.floor(shifted / STEP_RAD) % SEGMENTS_COUNT;
    return idx;
  }

  /**
   * Render the 9-segment Spin Wheel on High-DPI Canvas
   */
  function drawWheel(rotation) {
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2 - 18;

    ctx.clearRect(0, 0, width, height);

    // Save context for wheel rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Draw 9 segments
    for (let i = 0; i < SEGMENTS_COUNT; i++) {
      const tier = tiersWithLockout[i];
      const startAngle = i * STEP_RAD - STEP_RAD / 2;
      const endAngle = startAngle + STEP_RAD;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Segment fill color
      if (tier.isLocked) {
        // High-ELO Lockout: Grayscale desaturated fill
        const grayShade = (i % 2 === 0) ? '#1E293B' : '#0F172A';
        ctx.fillStyle = grayShade;
      } else if (isBlinking && i === winningIndex && blinkPhase) {
        // High-intensity winning blink highlight
        ctx.fillStyle = '#FFFFFF';
      } else {
        // Active rated segment gradient
        const midAngle = (startAngle + endAngle) / 2;
        const gradX = Math.cos(midAngle) * radius;
        const gradY = Math.sin(midAngle) * radius;
        const grad = ctx.createLinearGradient(0, 0, gradX, gradY);
        grad.addColorStop(0, tier.darkColor || '#0f172a');
        grad.addColorStop(1, tier.color);
        ctx.fillStyle = grad;
      }
      ctx.fill();

      // Segment divider border
      ctx.lineWidth = 3;
      ctx.strokeStyle = tier.isLocked ? 'rgba(71, 85, 105, 0.4)' : 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      // Draw Sector Typography & Icons
      ctx.save();
      const midAngle = (startAngle + endAngle) / 2;
      ctx.rotate(midAngle);

      if (tier.isLocked) {
        // Locked Segment Typography & Padlock
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 15px monospace, sans-serif';
        ctx.fillText('🔒 LOCKED', radius - 35, -4);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`(ELO ≥ ${tier.minBannedElo})`, radius - 35, 14);

        // Small tier label near center
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`T${tier.tierNum}`, 80, 4);
      } else {
        // Unlocked Segment Typography
        ctx.textAlign = 'right';
        
        // Tier title / Name
        ctx.fillStyle = (isBlinking && i === winningIndex && blinkPhase) ? '#0F172A' : '#FFFFFF';
        ctx.font = 'bold 18px "Rajdhani", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText(tier.shortLabel, radius - 25, -6);

        // Range Bounds subtitle
        ctx.font = '700 13px "Times New Roman", serif';
        ctx.fillStyle = (isBlinking && i === winningIndex && blinkPhase) ? '#0284C7' : '#E2E8F0';
        ctx.fillText(tier.rangeStr, radius - 25, 14);

        // Division Number near inner core
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.font = '800 15px "Rajdhani", sans-serif';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`T${tier.tierNum}`, 82, 5);
      }

      ctx.restore();
    }

    // Outer wheel ring boundary
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38BDF8';
    ctx.shadowColor = '#0EA5E9';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Initial draw
  drawWheel(currentRotation);
  lastPointedIndex = getSegmentAtPointer(currentRotation);

  /**
   * Chattering audio-visual click trigger node.
   * Fires every single time a color segment passes under the 12 o'clock indicator pin.
   */
  function triggerPointerTick(segmentIndex) {
    playSound('wheelTick');

    if (pointerPin) {
      pointerPin.classList.remove('pin-flick');
      // Force DOM reflow to re-trigger transition
      void pointerPin.offsetWidth;
      pointerPin.classList.add('pin-flick');
      setTimeout(() => {
        if (pointerPin) pointerPin.classList.remove('pin-flick');
      }, 70);
    }

    const currentTier = tiersWithLockout[segmentIndex];
    if (bannerText && isSpinning) {
      if (currentTier.isLocked) {
        bannerText.innerHTML = `<span style="color: #94A3B8;">Rolling past: ${currentTier.label} (High-ELO Filtered)</span>`;
      } else {
        bannerText.innerHTML = `<span style="color: ${currentTier.color};">Scanning: <strong>${currentTier.label}</strong> (${currentTier.rangeStr})</span>`;
      }
    }
  }

  /**
   * The Real-Time Physics Spin Loop
   * Engages smooth physics-driven deceleration block.
   */
  function startRoll() {
    if (isSpinning) return;

    // Re-verify active ELO & lockouts
    userElo = getUserElo();
    tiersWithLockout = computeLockouts(userElo);
    updateEloDisplay();

    // Algorithmic Filter Layer: choose ONLY valid, unbanned rated targets
    const validTiers = tiersWithLockout.filter(t => !t.isLocked);
    if (validTiers.length === 0) {
      alert('All divisions are locked! Please adjust your ELO rating.');
      return;
    }

    isSpinning = true;
    rollBtn.disabled = true;
    rollBtn.style.pointerEvents = 'none';
    playSound('alert');

    // Randomly select one eligible target
    const chosenTier = validTiers[Math.floor(Math.random() * validTiers.length)];
    const chosenIndex = tiersWithLockout.findIndex(t => t.id === chosenTier.id);

    if (bannerEl) bannerEl.className = 'roll-status-banner';
    if (bannerIcon) bannerIcon.textContent = '⚡';
    if (bannerText) bannerText.textContent = `Sudden Death roll active. Decelerating into eligible tournament division...`;

    // Automated Mathematical Offset Calculation (< 1ms):
    // Force wheel rotation to land strictly on the selected authorized open division (`chosenIndex`).
    const jitter = (Math.random() - 0.5) * (STEP_RAD * 0.55);
    let targetOffset = -Math.PI / 2 - chosenIndex * STEP_RAD + jitter;

    // Guarantee 6 to 9 full spins
    const fullSpins = (6 + Math.floor(Math.random() * 3)) * (2 * Math.PI);
    
    // Normalize start angle
    const startAngle = currentRotation % (2 * Math.PI);
    let delta = (targetOffset - startAngle) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;

    const totalRotationTarget = currentRotation + fullSpins + delta;
    const duration = 4800; // 4.8 seconds deceleration
    const startTime = performance.now();

    function physicsStep(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Quartic Deceleration Physics curve
      const ease = 1 - Math.pow(1 - progress, 4);

      const interpolatedRotation = startAngle + (totalRotationTarget - startAngle) * ease;
      currentRotation = interpolatedRotation;

      drawWheel(currentRotation);

      // Check for segment traversal under pin
      const currentSegment = getSegmentAtPointer(currentRotation);
      if (currentSegment !== lastPointedIndex) {
        lastPointedIndex = currentSegment;
        triggerPointerTick(currentSegment);
      }

      if (progress < 1) {
        requestAnimationFrame(physicsStep);
      } else {
        // Spin finished!
        finalizeRoll(chosenIndex, chosenTier);
      }
    }

    requestAnimationFrame(physicsStep);
  }

  /**
   * Direct Rerouting Gateway
   */
  function finalizeRoll(chosenIndex, chosenTier) {
    isSpinning = false;
    winningIndex = chosenIndex;
    lastPointedIndex = chosenIndex;

    // Audio-visual confirmation triggers
    playSound('correct');
    playSound('fanfare');
    triggerFlash('success');

    if (bannerEl) bannerEl.className = 'roll-status-banner winner-glow';
    if (bannerIcon) bannerIcon.textContent = '🏆';
    if (bannerText) {
      bannerText.innerHTML = `TARGET LOCKED: <strong>${chosenTier.label} (${chosenTier.rangeStr})</strong>. Deploying pre-flight contract...`;
    }

    // 1-second blinking sequence
    isBlinking = true;
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      blinkPhase = !blinkPhase;
      drawWheel(currentRotation);
      blinkCount++;
      if (blinkCount >= 8) {
        clearInterval(blinkInterval);
      }
    }, 120);

    // Save target parameters to storage
    setActiveExamParams({
      min: chosenTier.min,
      max: chosenTier.max,
      title: chosenTier.title,
      timeLimit: chosenTier.time,
      rules: getSettings()
    });

    // Exactly 1 second (1000ms) delay before seamless reroute
    setTimeout(() => {
      const url = `./contract.html?min=${chosenTier.min}&max=${chosenTier.max}&title=${encodeURIComponent(chosenTier.title)}&time=${chosenTier.time}`;
      window.location.href = url;
    }, 1000);
  }

  // Bind activation trigger to the centered "ROLL ARENA" button & canvas click
  rollBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startRoll();
  });

  canvas.addEventListener('click', () => {
    if (!isSpinning) {
      startRoll();
    }
  });
}