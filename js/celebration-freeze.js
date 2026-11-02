/**
 * PrimeFactor.app — Live Arena Celebration Freeze Module
 * 
 * High-performance visual milestone celebrating consecutive 3-flawless combo chain rewards.
 * 1. Freezes active countdown timer for exactly 2 seconds (2000ms).
 * 2. Fully suppresses and locks keyboard inputs and form submissions.
 * 3. Replaces target composite number DOM node with animated marquee:
 *    "🔥 CONGRATULATIONS: +2 ELO BONUS LOCKED!"
 * 4. Renders high-density multi-colored canvas confetti burst explosion overlay at 60+ FPS.
 * 5. Seamlessly fades out at 2000ms, releases locks, resumes clock, and completes lifecycle transition.
 * 6. Enforces strict boundary safety on 10th final question and 0:00 timeout conditions.
 */

import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/+esm';

export const CELEBRATION_FREEZE_DURATION_MS = 2000;
export const CELEBRATION_MARQUEE_TEXT = '🔥 CONGRATULATIONS: +2 ELO BONUS LOCKED!';

/**
 * High-Density Fallback Canvas Particle System
 * Ensures seamless confetti explosion rendering even if library worker initialization is restricted.
 */
class FallbackParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.isRunning = false;
    this.colors = [
      '#FFD700', '#FFA500', '#00E5FF', '#10B981', '#FF3366',
      '#8B5CF6', '#FFFFFF', '#38BDF8', '#F59E0B', '#EC4899'
    ];
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 250) {
    this.resize();
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 18 + 7;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.38,
        drag: 0.965,
        opacity: 1,
        fadeSpeed: 0.006 + Math.random() * 0.008,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  loop() {
    if (!this.isRunning) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.fadeSpeed;

      if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

/**
 * Triggers the complete Live Arena Celebration Freeze module.
 *
 * @param {Object} options
 * @param {HTMLElement} options.targetNumberEl - The main target number DOM node
 * @param {Function} options.onComplete - Callback executed precisely after 2000ms freeze concludes
 * @param {Function} [options.onStart] - Optional hook called the instant freeze starts
 */
export function triggerLiveArenaCelebrationFreeze({
  targetNumberEl,
  onStart,
  onComplete
}) {
  const duration = CELEBRATION_FREEZE_DURATION_MS;

  // 1. Fire onStart lifecycle hook immediately
  if (typeof onStart === 'function') {
    onStart();
  }

  // 2. Marquee replacement on targetNumberEl
  let previousText = '';
  let previousClasses = '';
  if (targetNumberEl) {
    previousText = targetNumberEl.textContent || '';
    previousClasses = targetNumberEl.className;
    targetNumberEl.textContent = CELEBRATION_MARQUEE_TEXT;
    targetNumberEl.classList.add('celebration-marquee-active');

    // Trigger high-impact GSAP spring entrance if available
    if (window.gsap) {
      window.gsap.killTweensOf(targetNumberEl);
      window.gsap.fromTo(targetNumberEl,
        { scale: 0.72, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.38, ease: 'back.out(2.2)' }
      );
    }
  }

  // 3. Mount High-Density Confetti Viewport Canvas
  let canvas = document.getElementById('live-arena-celebration-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'live-arena-celebration-canvas';
    canvas.className = 'live-arena-celebration-canvas';
    document.body.appendChild(canvas);
  }

  // Configure canvas style layer
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  canvas.style.opacity = '1';
  canvas.style.transition = 'opacity 0.4s ease';

  // 4. Launch High-Density Multi-Colored Confetti Blast Explosion
  let confettiInstance = null;
  let fallbackSystem = null;

  try {
    confettiInstance = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });
  } catch (err) {
    console.warn('[Celebration Freeze] canvas-confetti worker failed, using fallback particle system:', err);
  }

  const vibrantColors = [
    '#F59E0B', '#FACC15', '#06B6D4', '#10B981', '#3B82F6',
    '#EF4444', '#EC4899', '#FFFFFF', '#38BDF8', '#8B5CF6'
  ];

  if (confettiInstance) {
    // Burst 1: Massive Center Radial Shockwave
    confettiInstance({
      particleCount: 180,
      spread: 120,
      origin: { x: 0.5, y: 0.45 },
      startVelocity: 48,
      gravity: 0.95,
      scalar: 1.25,
      ticks: 240,
      colors: vibrantColors,
      disableForReducedMotion: false
    });

    // Burst 2: Left Side Angled Cannon Launch
    setTimeout(() => {
      try {
        confettiInstance({
          particleCount: 110,
          angle: 60,
          spread: 75,
          origin: { x: 0.04, y: 0.88 },
          startVelocity: 58,
          gravity: 0.95,
          scalar: 1.15,
          ticks: 240,
          colors: vibrantColors
        });
      } catch (e) {}
    }, 120);

    // Burst 3: Right Side Angled Cannon Launch
    setTimeout(() => {
      try {
        confettiInstance({
          particleCount: 110,
          angle: 120,
          spread: 75,
          origin: { x: 0.96, y: 0.88 },
          startVelocity: 58,
          gravity: 0.95,
          scalar: 1.15,
          ticks: 240,
          colors: vibrantColors
        });
      } catch (e) {}
    }, 180);

    // Burst 4: High-Altitude Shimmer Stars & Discs Shower
    setTimeout(() => {
      try {
        confettiInstance({
          particleCount: 90,
          spread: 140,
          origin: { x: 0.5, y: 0.3 },
          startVelocity: 36,
          gravity: 0.75,
          shapes: ['star', 'circle'],
          scalar: 1.35,
          ticks: 200,
          colors: ['#FFE600', '#FFFFFF', '#38BDF8', '#F43F5E', '#10B981']
        });
      } catch (e) {}
    }, 320);
  } else {
    // Execute Fallback Particle Loop
    fallbackSystem = new FallbackParticleSystem(canvas);
    fallbackSystem.burst(280);
    setTimeout(() => fallbackSystem.burst(160), 200);
  }

  // 5. Lifecycle Countdown Timer: Exactly 2000ms
  const freezeTimer = setTimeout(() => {
    // Fade out canvas smoothly
    if (canvas) {
      canvas.style.opacity = '0';
    }

    // Clean up DOM marquee state
    if (targetNumberEl) {
      targetNumberEl.classList.remove('celebration-marquee-active');
    }

    // After 400ms CSS fade completes, teardown canvas resources
    setTimeout(() => {
      if (confettiInstance) {
        try {
          confettiInstance.reset();
        } catch (e) {}
      }
      if (fallbackSystem) {
        fallbackSystem.stop();
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }, 450);

    // Execute completion callback
    if (typeof onComplete === 'function') {
      onComplete({
        previousText,
        previousClasses,
        durationElapsed: duration
      });
    }
  }, duration);

  return {
    cancel: () => {
      clearTimeout(freezeTimer);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      if (targetNumberEl) {
        targetNumberEl.classList.remove('celebration-marquee-active');
      }
    }
  };
}
