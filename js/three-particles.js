/**
 * PrimeFactor.app — Three.js Geometric Particle Mesh & Thermodynamic Engine
 * Interactive 3D spherical Fibonacci particle lattice with real-time chess move
 * evaluation feedback (cyber-cyan acceleration vs. frosted gray cold deceleration).
 */

// Module-level thermodynamic state interface for real-time exam telemetry
export const thermodynamicState = {
  speedMultiplier: 1.0,
  targetSpeedMultiplier: 1.0,
  spinVelocity: 0.08,
  targetSpinVelocity: 0.08,
  opacity: 0.75,
  targetOpacity: 0.75,
  lineOpacity: 0.18,
  targetLineOpacity: 0.18,
  color: { r: 2 / 255, g: 132 / 255, b: 199 / 255 }, // default #0284C7
  targetColor: { r: 2 / 255, g: 132 / 255, b: 199 / 255 },
  lineColor: { r: 148 / 255, g: 163 / 255, b: 184 / 255 }, // #94A3B8
  targetLineColor: { r: 148 / 255, g: 163 / 255, b: 184 / 255 },
  activeClassification: 'Normal'
};

/**
 * Explicit state interface between exam move evaluation loop and Three.js canvas.
 * - 'Brilliant' / 'Great Move': 3.0x velocity acceleration, high-intensity spin, #0EA5E9 cyber-cyan, 0.95 opacity
 * - 'Inaccuracy' / 'Blunder': 0.2x cold deceleration, metallic frosted gray #94A3B8, 0.25 opacity
 * Eased over a clean 0.5-second smoothing curve.
 */
export function updateThermodynamicState(classification) {
  if (!classification) return thermodynamicState;
  const name = typeof classification === 'string' 
    ? classification 
    : (classification.categoryName || classification.tier || '');

  thermodynamicState.activeClassification = name;

  if (name === 'Brilliant' || name === 'Great Move' || name === 'BRILLIANT' || name === 'GREAT_MOVE') {
    // High-Intensity Kinetic Thermodynamic Surge
    thermodynamicState.targetSpeedMultiplier = 3.0;
    thermodynamicState.targetSpinVelocity = 0.24; // 3x angular velocity
    // Vivid neon cyber-cyan tint (#0EA5E9) with 0.95 opacity bloom
    thermodynamicState.targetColor = { r: 14 / 255, g: 165 / 255, b: 233 / 255 };
    thermodynamicState.targetOpacity = 0.95;
    thermodynamicState.targetLineColor = { r: 56 / 255, g: 189 / 255, b: 248 / 255 }; // #38BDF8
    thermodynamicState.targetLineOpacity = 0.45;
  } else if (name === 'Inaccuracy' || name === 'Blunder' || name === 'Mistake' || 
             name === 'INACCURACY' || name === 'BLUNDER_COMPUTATIONAL' || 
             name === 'BLUNDER_SKIPPED' || name === 'BLUNDER_INTEGRITY') {
    // Thermodynamic Rule of Cold Deceleration
    thermodynamicState.targetSpeedMultiplier = 0.2; // Crawling 0.2x idle velocity
    thermodynamicState.targetSpinVelocity = 0.016; // Slumped angular drift
    // Metallic frosted gray (#94A3B8) with faint 0.25 visibility
    thermodynamicState.targetColor = { r: 148 / 255, g: 163 / 255, b: 184 / 255 };
    thermodynamicState.targetOpacity = 0.25;
    thermodynamicState.targetLineColor = { r: 100 / 255, g: 116 / 255, b: 139 / 255 };
    thermodynamicState.targetLineOpacity = 0.08;
  } else {
    // Normalized baseline / optimal moves
    thermodynamicState.targetSpeedMultiplier = 1.0;
    thermodynamicState.targetSpinVelocity = 0.08;
    thermodynamicState.targetColor = { r: 2 / 255, g: 132 / 255, b: 199 / 255 };
    thermodynamicState.targetOpacity = 0.75;
    thermodynamicState.targetLineColor = { r: 148 / 255, g: 163 / 255, b: 184 / 255 };
    thermodynamicState.targetLineOpacity = 0.18;
  }

  return thermodynamicState;
}

export function initHeroParticles(canvasId = 'three-hero-canvas') {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;
  let renderer, scene, camera;
  let particlesMesh, linesMesh;
  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  const basePositions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false };

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight),
      0.1,
      1000
    );
    camera.position.z = 180;

    // Distribute particles in geometric spherical Fibonacci prime clusters
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < particleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const radius = 65 + (i % 7 === 0 ? 25 : (i % 3 === 0 ? -15 : 0));

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle sprite appearance: Dynamic thermodynamic points material
    const pMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(thermodynamicState.color.r, thermodynamicState.color.g, thermodynamicState.color.b),
      size: 4.5,
      transparent: true,
      opacity: thermodynamicState.opacity,
      blending: THREE.NormalBlending
    });

    particlesMesh = new THREE.Points(geometry, pMaterial);
    scene.add(particlesMesh);

    // Dynamic geometric connecting lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(thermodynamicState.lineColor.r, thermodynamicState.lineColor.g, thermodynamicState.lineColor.b),
      transparent: true,
      opacity: thermodynamicState.lineOpacity
    });
    const maxLineConnections = particleCount * 4;
    const linePositions = new Float32Array(maxLineConnections * 6);
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(linesMesh);

    // Mouse movement listener
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      const x = ((e.clientX - rect.left) / w) * 2 - 1;
      const y = -(((e.clientY - rect.top) / h) * 2 - 1);
      mouse.targetX = x * 100;
      mouse.targetY = y * 100;
      mouse.isHovering = true;
    };

    const onMouseLeave = () => {
      mouse.isHovering = false;
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);

    // Resize handler
    const onResize = () => {
      if (!canvas) return;
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop with 0.5-second easing curve transitions
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Clean 0.5-second exponential easing curve factor: 1 - exp(-dt / 0.5)
      const easeFactor = 1 - Math.exp(-dt / 0.5);

      // Interpolate thermodynamic parameters
      thermodynamicState.speedMultiplier += (thermodynamicState.targetSpeedMultiplier - thermodynamicState.speedMultiplier) * easeFactor;
      thermodynamicState.spinVelocity += (thermodynamicState.targetSpinVelocity - thermodynamicState.spinVelocity) * easeFactor;
      thermodynamicState.opacity += (thermodynamicState.targetOpacity - thermodynamicState.opacity) * easeFactor;
      thermodynamicState.lineOpacity += (thermodynamicState.targetLineOpacity - thermodynamicState.lineOpacity) * easeFactor;

      // Color lerp (Points)
      pMaterial.color.r += (thermodynamicState.targetColor.r - pMaterial.color.r) * easeFactor;
      pMaterial.color.g += (thermodynamicState.targetColor.g - pMaterial.color.g) * easeFactor;
      pMaterial.color.b += (thermodynamicState.targetColor.b - pMaterial.color.b) * easeFactor;
      pMaterial.opacity = thermodynamicState.opacity;

      // Color lerp (Lines)
      lineMaterial.color.r += (thermodynamicState.targetLineColor.r - lineMaterial.color.r) * easeFactor;
      lineMaterial.color.g += (thermodynamicState.targetLineColor.g - lineMaterial.color.g) * easeFactor;
      lineMaterial.color.b += (thermodynamicState.targetLineColor.b - lineMaterial.color.b) * easeFactor;
      lineMaterial.opacity = thermodynamicState.lineOpacity;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Apply dynamic angular velocity (3.0x accelerated high-intensity spin vs 0.2x cold crawl)
      particlesMesh.rotation.y += dt * thermodynamicState.spinVelocity * 10 + mouse.x * 0.0005;
      particlesMesh.rotation.x = Math.sin(elapsedTime * 0.05 * thermodynamicState.speedMultiplier) * 0.1 - mouse.y * 0.002;
      linesMesh.rotation.copy(particlesMesh.rotation);

      const posAttr = particlesMesh.geometry.attributes.position;
      let lineVertexIndex = 0;

      // Update positions with dynamic thermodynamic velocity multiplier
      const spd = thermodynamicState.speedMultiplier;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        let px = basePositions[i3];
        let py = basePositions[i3 + 1];
        let pz = basePositions[i3 + 2];

        // Prime harmonic oscillation dynamically powered by kinetic multiplier
        const harmonic = (i % 2 === 0 ? 1 : -1) * Math.sin(elapsedTime * 1.5 * spd + i) * (3 * Math.min(spd, 2.5));
        px += harmonic;
        py += harmonic * 0.5;

        // Proximity displacement
        if (mouse.isHovering) {
          const dx = px - mouse.x * 0.5;
          const dy = py - mouse.y * 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 55) {
            const force = (55 - dist) / 55;
            px += (dx / dist) * force * 24;
            py += (dy / dist) * force * 24;
          }
        }

        posAttr.array[i3] = px;
        posAttr.array[i3 + 1] = py;
        posAttr.array[i3 + 2] = pz;
      }
      posAttr.needsUpdate = true;

      // Connect nearest neighbors with thin mathematical lines
      for (let i = 0; i < particleCount; i += 2) {
        for (let j = i + 1; j < Math.min(i + 8, particleCount); j++) {
          const i3 = i * 3;
          const j3 = j * 3;
          const dx = posAttr.array[i3] - posAttr.array[j3];
          const dy = posAttr.array[i3 + 1] - posAttr.array[j3 + 1];
          const dz = posAttr.array[i3 + 2] - posAttr.array[j3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < 1400 && lineVertexIndex < maxLineConnections * 6 - 6) {
            linePositions[lineVertexIndex++] = posAttr.array[i3];
            linePositions[lineVertexIndex++] = posAttr.array[i3 + 1];
            linePositions[lineVertexIndex++] = posAttr.array[i3 + 2];

            linePositions[lineVertexIndex++] = posAttr.array[j3];
            linePositions[lineVertexIndex++] = posAttr.array[j3 + 1];
            linePositions[lineVertexIndex++] = posAttr.array[j3 + 2];
          }
        }
      }
      linesMesh.geometry.setDrawRange(0, lineVertexIndex / 3);
      linesMesh.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  } catch (err) {
    console.debug('Three.js initialization skipped or not supported:', err);
  }
}

if (typeof window !== 'undefined') {
  window.ParticleThermodynamicEngine = {
    thermodynamicState,
    updateThermodynamicState,
    initHeroParticles
  };
}
