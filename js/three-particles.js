/**
 * PrimeFactor.app (V3.0) — Three.js Cosmic Cursor-Controlled Particle Mesh & Thermodynamic Engine
 *
 * Mathematical Foundations:
 * 1. 3D Spherical Fibonacci Lattice: Uniformly distributed constellation sphere generated via
 *    the golden section spiral on S^2 (golden ratio phi = (1 + sqrt(5)) / 2).
 * 2. Orbital Gravity Well Matrix: Dynamic state transition shifting from passive cosmic
 *    multiaxial drift to a high-intensity gravitational vortex locked onto the cursor.
 * 3. Strict 3D Proximity Displacement: Real-time inverse-distance Newtonian pull coupled
 *    with tangential Keplerian orbital velocity vectors, decaying exponentially back to base
 *    lattice coordinates upon disengagement.
 * 4. Thermodynamic State Integrity: 0.5s exponential smoothing curve dynamically governing
 *    3.0x velocity surges ('Brilliant' / 'Great Move' in #0EA5E9 cyber-cyan) down to 0.2x frozen
 *    crawls ('Inaccuracy' / 'Blunder' / 'Integrity Fail' in #94A3B8 frosted slate).
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
  particleSize: 4.5,
  targetParticleSize: 4.5,
  color: { r: 2 / 255, g: 132 / 255, b: 199 / 255 }, // default #0284C7
  targetColor: { r: 2 / 255, g: 132 / 255, b: 199 / 255 },
  lineColor: { r: 148 / 255, g: 163 / 255, b: 184 / 255 }, // #94A3B8
  targetLineColor: { r: 148 / 255, g: 163 / 255, b: 184 / 255 },
  activeClassification: 'Normal'
};

/**
 * Explicit state interface between exam move evaluation loop and Three.js canvas.
 * - 'Brilliant' / 'Great Move' / 'Prime Singularity':
 *   3.0x kinetic acceleration, orbital surge, vivid neon cyber-cyan (#0EA5E9), amplified node size
 * - 'Inaccuracy' / 'Blunder' / 'Integrity Fail':
 *   0.2x cold deceleration, metallic frosted slate (#94A3B8), 0.25 opacity, dormant node scale
 * Eased continuously over a 0.5-second exponential smoothing curve.
 *
 * @param {string|object} classification - Chess move evaluation classification
 * @returns {object} The thermodynamicState reference
 */
export function updateThermodynamicState(classification) {
  if (!classification) return thermodynamicState;
  const name = typeof classification === 'string'
    ? classification
    : (classification.categoryName || classification.tier || '');

  thermodynamicState.activeClassification = name;

  const upper = name.toUpperCase();
  if (
    upper === 'BRILLIANT' ||
    upper === 'GREAT MOVE' ||
    upper === 'GREAT_MOVE' ||
    upper === 'PRIME SINGULARITY' ||
    upper === 'SINGULARITY'
  ) {
    // High-Intensity Kinetic Thermodynamic Surge (3.0x Surge)
    thermodynamicState.targetSpeedMultiplier = 3.0;
    thermodynamicState.targetSpinVelocity = 0.24; // 3.0x angular orbital drift
    thermodynamicState.targetParticleSize = 6.0;   // Amplified cosmic energy nodes
    // Vivid neon cyber-cyan tint (#0EA5E9) with 0.95 opacity bloom
    thermodynamicState.targetColor = { r: 14 / 255, g: 165 / 255, b: 233 / 255 };
    thermodynamicState.targetOpacity = 0.95;
    // Radiant sky-cyan constellation lines (#38BDF8)
    thermodynamicState.targetLineColor = { r: 56 / 255, g: 189 / 255, b: 248 / 255 };
    thermodynamicState.targetLineOpacity = 0.45;
  } else if (
    upper === 'INACCURACY' ||
    upper === 'BLUNDER' ||
    upper === 'MISTAKE' ||
    upper.includes('BLUNDER') ||
    upper.includes('INTEGRITY')
  ) {
    // Thermodynamic Rule of Cold Deceleration (0.2x Crawl)
    thermodynamicState.targetSpeedMultiplier = 0.2; // Frozen 0.2x idle velocity
    thermodynamicState.targetSpinVelocity = 0.016;  // Slumped angular drift
    thermodynamicState.targetParticleSize = 3.0;    // Contracted dormant speckles
    // Metallic frosted slate gray (#94A3B8) with faint 0.25 visibility
    thermodynamicState.targetColor = { r: 148 / 255, g: 163 / 255, b: 184 / 255 };
    thermodynamicState.targetOpacity = 0.25;
    // Subdued slate lines (#64748B)
    thermodynamicState.targetLineColor = { r: 100 / 255, g: 116 / 255, b: 139 / 255 };
    thermodynamicState.targetLineOpacity = 0.08;
  } else {
    // Normalized baseline / optimal moves (1.0x Equilibrium)
    thermodynamicState.targetSpeedMultiplier = 1.0;
    thermodynamicState.targetSpinVelocity = 0.08;
    thermodynamicState.targetParticleSize = 4.5;
    // Saturated cobalt sapphire (#0284C7)
    thermodynamicState.targetColor = { r: 2 / 255, g: 132 / 255, b: 199 / 255 };
    thermodynamicState.targetOpacity = 0.75;
    // Ambient constellation slate (#94A3B8)
    thermodynamicState.targetLineColor = { r: 148 / 255, g: 163 / 255, b: 184 / 255 };
    thermodynamicState.targetLineOpacity = 0.18;
  }

  return thermodynamicState;
}

/**
 * Procedural Circular Cosmic Sprite Generator
 * Generates an anti-aliased luminous radial gradient disc texture without external image dependencies.
 *
 * @param {object} THREE - The Three.js library instance
 * @returns {THREE.CanvasTexture|null}
 */
function createCosmicParticleTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Initializes the 3D Cosmic Fibonacci Particle Mesh with Cursor-Controlled Gravity Well.
 *
 * @param {string} canvasId - DOM ID of the target HTML5 canvas element
 * @returns {function|undefined} Teardown disposal callback
 */
export function initHeroParticles(canvasId = 'three-hero-canvas') {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;

  // Pre-allocated math memory outside the render loop (Zero Garbage Collection)
  const _mouseNDC = new THREE.Vector2(0, 0);
  const _targetCursor3D = new THREE.Vector3(0, 0, 0);
  const _smoothCursor3D = new THREE.Vector3(0, 0, 0);
  const _dispVector = new THREE.Vector3(0, 0, 0);
  const _tangentVector = new THREE.Vector3(0, 0, 0);

  let renderer, scene, camera;
  let particlesMesh, linesMesh;
  let particleTexture = null;

  // Mathematical Topology Configuration: 3D Spherical Fibonacci Lattice
  const PARTICLE_COUNT = 320;
  const SPHERE_RADIUS = 84.0;
  const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.3999632 rad

  // Buffers for positional geometry and kinetic physics
  const baseCoords = new Float32Array(PARTICLE_COUNT * 3);     // Pure Fibonacci anchors
  const currentCoords = new Float32Array(PARTICLE_COUNT * 3);  // Dynamic simulation positions
  const harmonicPhases = new Float32Array(PARTICLE_COUNT);     // Discrete oscillation frequencies

  // 1. MATHEMATICALLY BOUND FIBONACCI LATTICE INITIALIZATION
  // Distribute PARTICLE_COUNT points uniformly across the sphere S^2 using the Fibonacci spiral
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Canonical coordinate mapping: y in [-1 + 1/N, 1 - 1/N]
    const yNorm = 1.0 - ((2.0 * i + 1.0) / PARTICLE_COUNT);
    const radiusAtY = Math.sqrt(Math.max(0.0, 1.0 - yNorm * yNorm));
    const theta = i * GOLDEN_ANGLE;

    const x = SPHERE_RADIUS * radiusAtY * Math.cos(theta);
    const y = SPHERE_RADIUS * yNorm;
    const z = SPHERE_RADIUS * radiusAtY * Math.sin(theta);

    baseCoords[i3] = x;
    baseCoords[i3 + 1] = y;
    baseCoords[i3 + 2] = z;

    currentCoords[i3] = x;
    currentCoords[i3 + 1] = y;
    currentCoords[i3 + 2] = z;

    // Deterministic prime-harmonic phase factor for organic micro-undulation
    harmonicPhases[i] = (i * 0.6180339887) % (Math.PI * 2);
  }

  // Precompute Constellation Lattice Edges (Delaunay-style spherical nearest neighbors)
  // Connects each point to nearby lattice neighbors within proximity threshold (26.0 units)
  const edgeList = [];
  const MAX_CONNECT_DIST_SQ = 26.0 * 26.0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const xi = baseCoords[i3];
    const yi = baseCoords[i3 + 1];
    const zi = baseCoords[i3 + 2];

    let connectionsCount = 0;
    // Check subsequent points to avoid duplicate undirected edges
    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const j3 = j * 3;
      const dx = xi - baseCoords[j3];
      const dy = yi - baseCoords[j3 + 1];
      const dz = zi - baseCoords[j3 + 2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < MAX_CONNECT_DIST_SQ) {
        edgeList.push(i, j);
        connectionsCount++;
        if (connectionsCount >= 4) break; // Limit valence to maintain crisp constellation geometry
      }
    }
  }

  const lineVertexCount = edgeList.length; // Total vertices for line segments
  const linePositions = new Float32Array(lineVertexCount * 3);

  // Interaction tracking state
  const mouse = {
    ndcX: 0,
    ndcY: 0,
    isInteracting: false,
    gravityWellMatrixIntensity: 0.0, // 0.0 = passive drift, 1.0 = full orbital gravity well
    lastMoveTimestamp: 0
  };

  try {
    // 2. WEBGL RENDERER INITIALIZATION
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    // Cap devicePixelRatio at 2.0 to conserve GPU cycles on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const initWidth = canvas.clientWidth || window.innerWidth;
    const initHeight = canvas.clientHeight || window.innerHeight;
    renderer.setSize(initWidth, initHeight);

    scene = new THREE.Scene();

    // Perspective camera positioned to view the entire cosmic constellation
    camera = new THREE.PerspectiveCamera(52, initWidth / initHeight, 0.1, 1000);
    camera.position.set(0, 0, 185);

    // 3. PARTICLE POINTS MESH
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(currentCoords, 3));

    particleTexture = createCosmicParticleTexture(THREE);

    const pointsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(thermodynamicState.color.r, thermodynamicState.color.g, thermodynamicState.color.b),
      size: thermodynamicState.particleSize,
      map: particleTexture,
      transparent: true,
      opacity: thermodynamicState.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particlesMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(particlesMesh);

    // 4. CONSTELLATION LINE SEGMENTS MESH
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(thermodynamicState.lineColor.r, thermodynamicState.lineColor.g, thermodynamicState.lineColor.b),
      transparent: true,
      opacity: thermodynamicState.lineOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(linesMesh);

    // 5. INTERACTION LISTENERS (Pointer, Touch, Window Bounds)
    const updatePointerCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      const normX = ((clientX - rect.left) / w) * 2 - 1;
      const normY = -(((clientY - rect.top) / h) * 2 - 1);

      mouse.ndcX = Math.max(-1.2, Math.min(1.2, normX));
      mouse.ndcY = Math.max(-1.2, Math.min(1.2, normY));
      mouse.isInteracting = true;
      mouse.lastMoveTimestamp = performance.now();
    };

    const onPointerMove = (e) => {
      updatePointerCoords(e.clientX, e.clientY);
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerLeave = () => {
      mouse.isInteracting = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('touchend', onPointerLeave, { passive: true });

    // Throttled resize handler with devicePixelRatio caps
    let resizeTimeout = null;
    const onResize = () => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        if (!canvas || !renderer || !camera) return;
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (w === 0 || h === 0) return;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
      }, 100);
    };

    window.addEventListener('resize', onResize);

    // 6. ANIMATION LOOP & KINETIC DISPLACEMENT SIMULATION
    let animFrameId = null;
    const clock = new THREE.Clock();

    // Rotational orientation accumulators
    let currentRotX = 0;
    let currentRotY = 0;
    let currentRotZ = 0;

    const renderTick = () => {
      animFrameId = requestAnimationFrame(renderTick);

      const dt = Math.min(clock.getDelta(), 0.08); // Bound delta to prevent tunneling during tab switch
      const elapsedTime = clock.getElapsedTime();

      // Clean 0.5-second exponential easing curve factor: 1 - exp(-dt / 0.5)
      const easeCurve = 1.0 - Math.exp(-dt / 0.5);

      // Smooth thermodynamic telemetry state interpolation
      thermodynamicState.speedMultiplier +=
        (thermodynamicState.targetSpeedMultiplier - thermodynamicState.speedMultiplier) * easeCurve;
      thermodynamicState.spinVelocity +=
        (thermodynamicState.targetSpinVelocity - thermodynamicState.spinVelocity) * easeCurve;
      thermodynamicState.opacity +=
        (thermodynamicState.targetOpacity - thermodynamicState.opacity) * easeCurve;
      thermodynamicState.lineOpacity +=
        (thermodynamicState.targetLineOpacity - thermodynamicState.lineOpacity) * easeCurve;
      thermodynamicState.particleSize +=
        (thermodynamicState.targetParticleSize - thermodynamicState.particleSize) * easeCurve;

      // Interpolate particle points material
      pointsMaterial.color.r += (thermodynamicState.targetColor.r - pointsMaterial.color.r) * easeCurve;
      pointsMaterial.color.g += (thermodynamicState.targetColor.g - pointsMaterial.color.g) * easeCurve;
      pointsMaterial.color.b += (thermodynamicState.targetColor.b - pointsMaterial.color.b) * easeCurve;
      pointsMaterial.opacity = thermodynamicState.opacity;
      pointsMaterial.size = thermodynamicState.particleSize;

      // Interpolate constellation lines material
      linesMaterial.color.r += (thermodynamicState.targetLineColor.r - linesMaterial.color.r) * easeCurve;
      linesMaterial.color.g += (thermodynamicState.targetLineColor.g - linesMaterial.color.g) * easeCurve;
      linesMaterial.color.b += (thermodynamicState.targetLineColor.b - linesMaterial.color.b) * easeCurve;
      linesMaterial.opacity = thermodynamicState.lineOpacity;

      const spd = thermodynamicState.speedMultiplier;

      // Check if cursor has become stationary for > 2.5 seconds
      const now = performance.now();
      const isCursorStale = now - mouse.lastMoveTimestamp > 2500;
      const targetIntensity = (mouse.isInteracting && !isCursorStale) ? 1.0 : 0.0;
      // Smoothly transition between passive drift and active orbital gravity well matrix
      mouse.gravityWellMatrixIntensity += (targetIntensity - mouse.gravityWellMatrixIntensity) * (1.0 - Math.exp(-dt / 0.35));

      // 7. ORBITAL GRAVITY WELL MATRIX: 3D UNPROJECTION & ORIENTATION
      // Unproject normalized device coordinates to the sphere's focal plane (Z = 0)
      const vFovRad = (camera.fov * Math.PI) / 360.0;
      const halfPlaneHeight = Math.tan(vFovRad) * camera.position.z;
      const halfPlaneWidth = halfPlaneHeight * camera.aspect;

      _targetCursor3D.set(
        mouse.ndcX * halfPlaneWidth * 0.85,
        mouse.ndcY * halfPlaneHeight * 0.85,
        Math.sin(elapsedTime * 1.2) * 15.0 * mouse.gravityWellMatrixIntensity
      );

      // Smooth cursor coordinate tracking
      const cursorLerpFactor = 1.0 - Math.exp(-dt * 10.0);
      _smoothCursor3D.lerp(_targetCursor3D, cursorLerpFactor);

      // Global Multiaxial Constellation Rotation:
      // Passive constant angular rotation seamlessly blends into cursor-focused gyroscope matrix
      const passiveYawSpeed = thermodynamicState.spinVelocity * 0.6;
      currentRotY += dt * passiveYawSpeed;
      currentRotX = Math.sin(elapsedTime * 0.25 * spd) * 0.12 - (mouse.ndcY * 0.35 * mouse.gravityWellMatrixIntensity);
      currentRotZ = Math.cos(elapsedTime * 0.18 * spd) * 0.08 + (mouse.ndcX * 0.25 * mouse.gravityWellMatrixIntensity);

      particlesMesh.rotation.set(currentRotX, currentRotY, currentRotZ);
      linesMesh.rotation.set(currentRotX, currentRotY, currentRotZ);

      // Inverse transform matrix: transform world cursor into particle mesh local space
      // so calculations are strictly geometrically accurate within the Fibonacci coordinate system
      particlesMesh.updateMatrixWorld();
      const invMatrix = particlesMesh.matrixWorld.clone().invert();
      const localCursor = _smoothCursor3D.clone().applyMatrix4(invMatrix);

      // 8. STRICT 3D PROXIMITY DISPLACEMENT & KEPLERIAN ORBITAL ACCELERATION
      const posArray = particlesMesh.geometry.attributes.position.array;
      const PROXIMITY_RADIUS = 76.0;
      const PROXIMITY_RADIUS_SQ = PROXIMITY_RADIUS * PROXIMITY_RADIUS;
      const returnDecayLambda = 4.2 * Math.max(0.2, spd);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const bx = baseCoords[i3];
        const by = baseCoords[i3 + 1];
        const bz = baseCoords[i3 + 2];

        // Micro-harmonic cosmic undulation on the baseline Fibonacci coordinates
        const phase = harmonicPhases[i];
        const harmonic = Math.sin(elapsedTime * 1.8 * spd + phase) * (1.8 * Math.min(spd, 2.2));
        const anchorX = bx + (bx / SPHERE_RADIUS) * harmonic;
        const anchorY = by + (by / SPHERE_RADIUS) * harmonic;
        const anchorZ = bz + (bz / SPHERE_RADIUS) * harmonic;

        let targetPosX = anchorX;
        let targetPosY = anchorY;
        let targetPosZ = anchorZ;

        // Proximity calculation relative to the localized 3D cursor
        const dx = localCursor.x - posArray[i3];
        const dy = localCursor.y - posArray[i3 + 1];
        const dz = localCursor.z - posArray[i3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < PROXIMITY_RADIUS_SQ && mouse.gravityWellMatrixIntensity > 0.01) {
          const dist = Math.sqrt(distSq);
          // Normalized proximity gradient factor in [0, 1]
          const proximityNorm = 1.0 - (dist / PROXIMITY_RADIUS);
          // Kinetic weighting amplified by thermodynamic surge
          const kineticWeight = proximityNorm * proximityNorm * mouse.gravityWellMatrixIntensity * spd;

          // A. Radial Gravitational Pull toward cursor center
          const invDist = 1.0 / (dist + 0.001);
          const pullForce = kineticWeight * 26.0;
          const pullX = dx * invDist * pullForce;
          const pullY = dy * invDist * pullForce;
          const pullZ = dz * invDist * pullForce;

          // B. Tangential Keplerian Orbital Vortex
          // Tangent vector perpendicular to displacement in the XY-shear plane
          const vortexDirection = (i % 2 === 0 ? 1 : -1);
          const orbitForce = kineticWeight * 32.0 * vortexDirection;
          const orbitX = -dy * invDist * orbitForce;
          const orbitY = dx * invDist * orbitForce;
          const orbitZ = Math.sin(phase + elapsedTime * 3.0 * spd) * (kineticWeight * 14.0);

          targetPosX = anchorX + pullX + orbitX;
          targetPosY = anchorY + pullY + orbitY;
          targetPosZ = anchorZ + pullZ + orbitZ;
        }

        // Exponential decay easing curve back to baseline coordinates:
        // x(t + dt) = target + (current - target) * exp(-lambda * dt)
        const decayCurve = Math.exp(-returnDecayLambda * dt);
        posArray[i3] = targetPosX + (posArray[i3] - targetPosX) * decayCurve;
        posArray[i3 + 1] = targetPosY + (posArray[i3 + 1] - targetPosY) * decayCurve;
        posArray[i3 + 2] = targetPosZ + (posArray[i3 + 2] - targetPosZ) * decayCurve;
      }

      particlesMesh.geometry.attributes.position.needsUpdate = true;

      // 9. DYNAMIC CONSTELLATION LINE RECONSTRUCTION
      // Update line segments between precomputed Fibonacci lattice neighbors
      let lineIndex = 0;
      for (let k = 0; k < lineVertexCount; k += 2) {
        const idxA = edgeList[k] * 3;
        const idxB = edgeList[k + 1] * 3;

        linePositions[lineIndex++] = posArray[idxA];
        linePositions[lineIndex++] = posArray[idxA + 1];
        linePositions[lineIndex++] = posArray[idxA + 2];

        linePositions[lineIndex++] = posArray[idxB];
        linePositions[lineIndex++] = posArray[idxB + 1];
        linePositions[lineIndex++] = posArray[idxB + 2];
      }

      linesMesh.geometry.attributes.position.needsUpdate = true;

      // Render updated frame
      renderer.render(scene, camera);
    };

    // Begin animation loop
    renderTick();

    // Return teardown disposal function
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchend', onPointerLeave);
      window.removeEventListener('resize', onResize);

      if (particleTexture) particleTexture.dispose();
      if (pointsGeometry) pointsGeometry.dispose();
      if (pointsMaterial) pointsMaterial.dispose();
      if (linesGeometry) linesGeometry.dispose();
      if (linesMaterial) linesMaterial.dispose();
      if (renderer) renderer.dispose();
    };
  } catch (err) {
    console.debug('Three.js Cosmic Fibonacci Particle Mesh initialization skipped:', err);
  }
}

// Global window attachment for real-time exam telemetry debugging and validation
if (typeof window !== 'undefined') {
  window.ParticleThermodynamicEngine = {
    thermodynamicState,
    updateThermodynamicState,
    initHeroParticles
  };
}
