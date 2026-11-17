/**
 * PrimeFactor.app — Hero & scroll motion system
 *
 *  WebGL / Three.js : full-screen prime-sieve shader field + stratified deep-field and orbital
 *                     space particles with optical point-spread precision.
 *                     Falls back to a raw-WebGL renderer for the shader field when Three.js
 *                     (CDN) is unavailable, and to the static hero image when WebGL is.
 *  GSAP             : hero intro timeline, ScrollTrigger parallax + section reveals.
 *  Motion (Framer)  : see js/pf-motion.js
 *
 * Every layer is optional and degrades independently; with prefers-reduced-motion the page
 * renders one static frame and plays no animation.
 */

import {
  FIELD_VERTEX,
  FIELD_FRAGMENT,
  POINTS_VERTEX,
  POINTS_FRAGMENT,
} from "./hero-shaders.js";

const root = document.documentElement;
const reduceMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { mode: "none", gsap: false, motion: false };
window.__heroFx = state; // introspection for debugging / tests

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ============================================================================================
// 1. WEBGL HERO BACKGROUND
// ============================================================================================
function initHeroGL(heroEl) {
  const wrap = heroEl.querySelector(".section-bg-image-wrap");
  if (!wrap) return null;

  let canvas = null;
  const mountCanvas = () => {
    if (canvas) canvas.remove();
    canvas = document.createElement("canvas");
    canvas.id = "hero-webgl";
    canvas.setAttribute("aria-hidden", "true");
    wrap.insertBefore(canvas, wrap.querySelector(".section-bg-overlay"));
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      fail("context lost");
    });
  };
  mountCanvas();

  const input = { mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, pulse: 0, scroll: 0 };
  // copy-block rectangle (uv space) the shader keeps calm; refreshed on resize / layout shifts
  const textBox = [0.5, 0.5, 0.4, 0.35];
  const measureText = () => {
    // union of the actual copy blocks (not the full-width container) so the sides keep their texture
    const parts = [
      ".hero-badge-meta",
      ".hero-title",
      ".hero-subtitle",
      ".hero-actions",
      ".mini-challenge-card",
    ]
      .map((sel) => heroEl.querySelector(sel))
      .filter(Boolean);
    if (!parts.length) return;
    const hr = heroEl.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    let l = Infinity,
      t = Infinity,
      r = -Infinity,
      b = -Infinity;
    parts.forEach((el) => {
      const c = el.getBoundingClientRect();
      if (!c.width || !c.height) return;
      l = Math.min(l, c.left);
      t = Math.min(t, c.top);
      r = Math.max(r, c.right);
      b = Math.max(b, c.bottom);
    });
    if (!isFinite(l)) return;
    textBox[0] = ((l + r) / 2 - hr.left) / hr.width;
    textBox[1] = 1 - ((t + b) / 2 - hr.top) / hr.height;
    textBox[2] = clamp((r - l) / 2 / hr.width, 0.05, 0.6);
    textBox[3] = clamp((b - t) / 2 / hr.height, 0.05, 0.6);
  };
  let running = false;
  let visible = true;
  let raf = 0;
  let renderFrame = null;
  let resize = null;
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let slowFrames = 0;
  let io = null;
  let ro = null;
  let resizeTimer = 0;
  let disposeGL = null;
  const t0 = performance.now();

  const onMove = (e) => {
    const r = heroEl.getBoundingClientRect();
    input.tx = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
    input.ty = clamp(1 - (e.clientY - r.top) / Math.max(1, r.height), 0, 1);
  };
  const onDown = () => {
    input.pulse = 1;
  };
  heroEl.addEventListener("pointermove", onMove, { passive: true });
  heroEl.addEventListener("pointerdown", onDown, { passive: true });

  function fail(why) {
    console.debug("[hero-fx] WebGL disabled:", why);
    teardown();
    if (canvas) canvas.remove();
    state.mode = "none";
    root.classList.remove("hero-fx-on");
    return null;
  }

  // ---- renderer A: Three.js (prime-sieve field + precision stratified space particles) ---
  function buildThree() {
    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uPulse: { value: 0 },
      uText: { value: new THREE.Vector4(0.5, 0.5, 0.4, 0.35) },
    };

    // background: full-screen quad running the sieve shader
    const bgScene = new THREE.Scene();
    const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: FIELD_VERTEX,
      fragmentShader: FIELD_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    quad.frustumCulled = false;
    bgScene.add(quad);

    // foreground: dual-layer space particles (deep pinpoint starfield + orbital prime-dust)
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    cam.position.z = 6;
    const group = new THREE.Group();
    scene.add(group);

    const makePoints = (geometry, size, opacity) => {
      const n = geometry.attributes.position.count;
      const seed = new Float32Array(n);
      const tier = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        seed[i] = Math.random();
        // Skew magnitude distribution: many fine dust motes, fewer crisp luminous stars
        tier[i] = Math.pow(Math.random(), 2.1);
      }
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      geometry.setAttribute("aTier", new THREE.BufferAttribute(tier, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: uniforms.uTime,
          uSize: { value: size },
          uOpacity: { value: opacity },
          uPixelRatio: { value: dpr },
          uText: uniforms.uText,
        },
        vertexShader: POINTS_VERTEX,
        fragmentShader: POINTS_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geometry, mat);
    };

    // Layer 1: Deep pinpoint starfield across the cosmic backdrop
    const STAR_COUNT = 540;
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 6.5 + Math.random() * 8.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.35;
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.85;
      starPos[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 2.5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const farStars = makePoints(starGeo, 2.15, 0.72);
    group.add(farStars);

    // Layer 2: Mid-field orbital space particles (precision prime-dust)
    const DUST_COUNT = 420;
    const dustPos = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      const r = 3.2 + Math.random() * 5.4;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.25;
      dustPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.78;
      dustPos[i * 3 + 2] = r * Math.cos(ph) * 0.75 - 2.2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = makePoints(dustGeo, 3.05, 0.62);
    group.add(dust);

    resize = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w * dpr, h * dpr);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      const wide = w / h > 1.15;
      farStars.material.uniforms.uOpacity.value = wide ? 0.72 : 0.56;
      dust.material.uniforms.uOpacity.value = wide ? 0.62 : 0.45;
      measureText();
      uniforms.uText.value.set(textBox[0], textBox[1], textBox[2], textBox[3]);
      [farStars, dust].forEach((p) => {
        p.material.uniforms.uPixelRatio.value = dpr;
      });
    };

    renderFrame = (time) => {
      uniforms.uTime.value = time;
      uniforms.uMouse.value.set(input.mx, input.my);
      uniforms.uScroll.value = input.scroll;
      uniforms.uPulse.value = input.pulse;

      // Autonomous tranquil cosmic drift (no cursor-controlled 3D object)
      farStars.rotation.y = time * 0.008;
      farStars.rotation.z = time * 0.003;
      dust.rotation.y = time * 0.018;
      dust.rotation.x = Math.sin(time * 0.08) * 0.05;
      group.position.y = input.scroll * 0.95;
      const showParticles = input.scroll < 0.98;
      farStars.visible = showParticles;
      dust.visible = showParticles;

      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.render(scene, cam);
    };

    const dispose = () => {
      [starGeo, dustGeo, quad.geometry].forEach((g) => g.dispose());
      [bgMat, farStars.material, dust.material].forEach((m) => m.dispose());
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch (e) {
        /* noop */
      }
    };
    return dispose;
  }

  // ---- renderer B: raw WebGL (shader field only) ------------------------------------------
  function buildRaw() {
    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      }) || canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL unavailable");
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(sh) || "shader error");
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(
      prog,
      compile(gl.VERTEX_SHADER, "attribute vec3 position;\n" + FIELD_VERTEX),
    ); // Three injects this declaration itself
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FIELD_FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(prog) || "link error");
    gl.useProgram(prog);

    // one oversized triangle covers the viewport
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"),
      uTime = u("uTime"),
      uMouse = u("uMouse"),
      uScroll = u("uScroll"),
      uPulse = u("uPulse"),
      uText = u("uText");

    resize = () => {
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      measureText();
      gl.uniform4f(uText, textBox[0], textBox[1], textBox[2], textBox[3]);
    };
    renderFrame = (time) => {
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, input.mx, input.my);
      gl.uniform1f(uScroll, input.scroll);
      gl.uniform1f(uPulse, input.pulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    return () => {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }

  const tryBuild = (fn, mode) => {
    try {
      disposeGL = fn();
      state.mode = mode;
      return true;
    } catch (err) {
      console.debug(`[hero-fx] ${mode} renderer failed:`, err);
      return false;
    }
  };
  let ok = false;
  if (window.THREE && window.THREE.WebGLRenderer)
    ok = tryBuild(buildThree, "three");
  if (!ok) {
    mountCanvas(); // a context type/state can't be reused after a failed attempt
    ok = tryBuild(buildRaw, "webgl");
  }
  if (!ok) return fail("no usable WebGL renderer");

  root.classList.add("hero-fx-on");
  resize();

  function loop(now) {
    raf = 0;
    if (!running) return;
    const time = (now - t0) / 1000;
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000);
    loop.last = now;

    input.mx += (input.tx - input.mx) * 0.08;
    input.my += (input.ty - input.my) * 0.08;
    input.pulse *= 0.94;

    // adaptive quality: after ~45 slow frames drop the pixel ratio once
    if (dt > 0.034 && dpr > 1) {
      if (++slowFrames > 45) {
        dpr = 1;
        slowFrames = 0;
        resize();
      }
    } else if (slowFrames > 0) slowFrames--;

    renderFrame(time, dt);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    loop.last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function teardown() {
    stop();
    heroEl.removeEventListener("pointermove", onMove);
    heroEl.removeEventListener("pointerdown", onDown);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    if (io) io.disconnect();
    if (ro) ro.disconnect();
    if (disposeGL) {
      try {
        disposeGL();
      } catch (e) {
        /* noop */
      }
      disposeGL = null;
    }
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (!running) renderFrame((performance.now() - t0) / 1000, 0);
    }, 120);
  }
  function onVis() {
    if (document.hidden) stop();
    else start();
  }
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  if ("ResizeObserver" in window) {
    ro = new ResizeObserver(onResize);
    ro.observe(heroEl);
  }
  setTimeout(onResize, 900); // after webfonts settle

  io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            visible ? start() : stop();
          },
          { threshold: 0 },
        )
      : null;
  if (io) io.observe(heroEl);

  if (reduceMotion) {
    input.mx = input.tx = 0.62;
    input.my = input.ty = 0.55;
    renderFrame(4.0, 0);
  } else {
    start();
  }

  return {
    setScroll(v) {
      input.scroll = clamp(v, 0, 1);
      if (!running) renderFrame((performance.now() - t0) / 1000, 0);
    },
    teardown,
  };
}

// ============================================================================================
// 2. GSAP — hero intro, parallax, section reveals, magnetic buttons
// ============================================================================================
function wrapWords(el) {
  // Splits the plain text nodes of `el` into inline-block word spans (keeps <br>/child tags).
  const words = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(" "));
        return;
      }
      const s = document.createElement("span");
      s.className = "fx-word";
      s.textContent = part;
      frag.appendChild(s);
      words.push(s);
    });
    node.replaceWith(frag);
  });
  return words;
}

function initGsap(heroEl, gl) {
  const gsap = window.gsap;
  if (!gsap) return false;
  const ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);
  if (window.ScrollToPlugin) gsap.registerPlugin(window.ScrollToPlugin);
  state.gsap = true;

  const q = (s) => heroEl.querySelector(s);
  const badge = q(".hero-badge-meta");
  const title = q(".hero-title");
  const highlight = q(".hero-title .highlight");
  const sub = q(".hero-subtitle");
  const actions = q(".hero-actions");
  const mini = q(".mini-challenge-card");
  const cue = q(".hero-scroll-cue");
  const words = title ? wrapWords(title) : [];

  if (!reduceMotion) {
    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () =>
        gsap.set(
          [
            badge,
            ...words,
            highlight,
            sub,
            ...(actions ? [...actions.children] : []),
            mini,
            cue,
          ].filter(Boolean),
          { clearProps: "transform,opacity,visibility,filter,clipPath" },
        ),
    });
    root.classList.remove("fx-pending");
    if (badge)
      tl.fromTo(
        badge,
        { autoAlpha: 0, y: 18, filter: "blur(8px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8 },
        0.1,
      );
    if (words.length)
      tl.fromTo(
        words,
        {
          autoAlpha: 0,
          yPercent: 60,
          rotateX: -70,
          transformOrigin: "50% 100%",
        },
        { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 1, stagger: 0.09 },
        0.2,
      );
    if (highlight)
      tl.fromTo(
        highlight,
        { autoAlpha: 0, clipPath: "inset(0 100% 0 0)", y: 12 },
        {
          autoAlpha: 1,
          clipPath: "inset(0 0% 0 0)",
          y: 0,
          duration: 1.1,
          ease: "power3.inOut",
        },
        0.55,
      );
    if (sub)
      tl.fromTo(
        sub,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.9 },
        0.85,
      );
    if (actions)
      tl.fromTo(
        actions.children,
        { autoAlpha: 0, y: 26, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.6)",
        },
        1.0,
      );
    if (mini)
      tl.fromTo(
        mini,
        { autoAlpha: 0, y: 50 },
        { autoAlpha: 1, y: 0, duration: 1 },
        1.2,
      );
    if (cue)
      tl.fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.7);
  } else {
    root.classList.remove("fx-pending");
  }

  if (ST && !reduceMotion) {
    // hero: content drifts up & fades while the WebGL scene receives scroll progress
    ST.create({
      trigger: heroEl,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => gl && gl.setScroll(self.progress),
    });
    const content = q(".hero-content");
    if (content) {
      gsap.to(content, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }
  return true;
}

// ---- magnetic hover (CSS-variable driven so it composes with GSAP/Motion transforms) --------
function initMagnetic(heroEl) {
  if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
  heroEl
    .querySelectorAll(".hero-btn-primary, .hero-btn-secondary")
    .forEach((btn) => {
      let tx = 0,
        ty = 0,
        cx = 0,
        cy = 0,
        id = 0;
      const tick = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        btn.style.setProperty("--mx", cx.toFixed(2) + "px");
        btn.style.setProperty("--my", cy.toFixed(2) + "px");
        id =
          Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05
            ? requestAnimationFrame(tick)
            : 0;
      };
      const kick = () => {
        if (!id) id = requestAnimationFrame(tick);
      };
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.34;
        kick();
      });
      btn.addEventListener("pointerleave", () => {
        tx = 0;
        ty = 0;
        kick();
      });
    });
}

// 3. MOTION (Framer Motion) now lives in js/pf-motion.js (loaded by js/index-fx.js).

// ============================================================================================
// BOOT
// ============================================================================================
function boot() {
  const hero = document.getElementById("sec-hero");
  let gl = null;
  if (hero) {
    try {
      gl = initHeroGL(hero);
    } catch (e) {
      console.debug("[hero-fx] GL init failed:", e);
    }
    const gate = window.__pfIntroGate || Promise.resolve();
    gate.then(() => {
      try {
        initGsap(hero, gl);
      } catch (e) {
        console.debug("[hero-fx] GSAP init failed:", e);
      }
      if (!state.gsap) root.classList.remove("fx-pending");
    });
    initMagnetic(hero);
  } else {
    root.classList.remove("fx-pending");
  }
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();

// Safety net: never leave the hero hidden if anything above stalls.
setTimeout(() => root.classList.remove("fx-pending"), 5200);
