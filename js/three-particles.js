/**
 * PrimeFactor.app — Three.js Geometric Particle Mesh
 * Interactive 3D particle lattice that clusters into prime constellation nodes upon cursor proximity.
 */

export function initHeroParticles(canvasId = 'three-hero-canvas') {
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
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
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

    // Particle sprite appearance: deep slate with subtle cyan tint
    const pMaterial = new THREE.PointsMaterial({
      color: 0x0284C7,
      size: 4.5,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending
    });

    particlesMesh = new THREE.Points(geometry, pMaterial);
    scene.add(particlesMesh);

    // Dynamic geometric connecting lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x94A3B8,
      transparent: true,
      opacity: 0.18
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
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
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
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      particlesMesh.rotation.y = elapsedTime * 0.08 + mouse.x * 0.002;
      particlesMesh.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1 - mouse.y * 0.002;
      linesMesh.rotation.copy(particlesMesh.rotation);

      const posAttr = particlesMesh.geometry.attributes.position;
      let lineVertexIndex = 0;

      // Update positions with cluster repulsion/attraction
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        let px = basePositions[i3];
        let py = basePositions[i3 + 1];
        let pz = basePositions[i3 + 2];

        // Prime harmonic oscillation
        const harmonic = (i % 2 === 0 ? 1 : -1) * Math.sin(elapsedTime * 1.5 + i) * 3;
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
