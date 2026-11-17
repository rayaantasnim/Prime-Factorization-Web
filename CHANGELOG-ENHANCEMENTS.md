# Enhancement notes

New files: `css/pf-enhance.css` (loaded last on index.html + result.html), `js/pf-enhance.js`.

**Responsive** – KPI stats bar (4→2→1 cols), Prime Playground, release notice ("THE EVOLUTION IS UNLEASHED"),
4-card counter grid, Range Portal, Settings and result.html (ledger, chart, labelled latency table on phones).
**Visuals** – animated Randomizer (conic ring, orbs, rising primes, reel shine, roll/landed states), Range Portal
(per-tier colour, cursor spotlight, arrow motion), Settings (icon chips, animated switches, flowing hairline), Playground quick-picks.
**Speed** – removed render-blocking CSS `@import`s (Google Fonts, notifications, FAQ) from styles.css and linked them
non-blocking per page; GSAP/Three.js deferred; hero image sized (was full-resolution); intro curtain ~2.2s → ~1.3s;
content-visibility on below-fold sections; backdrop-blur dropped on phones; decorative loops pause off-screen.
**Bugs** – black-on-dark Randomizer label; Randomizer not keyboard-operable and stuck after browser Back; justified-text gaps and
zero padding (<600px) in the release notice; stray "∎" glyph; uneven 3+1 settings grid; result.html latency table missing
mobile labels, "undefined" cells, forced 480px chart, chips overflowing cards; Tier 8/Omega labels.

## Round 2
New: `css/pf-pages.css` (notifications, cognitive-matrix, profile-settings).
- **Navigation Topology overlay**: dark glass theme, sticky header, SVG close icon (rotates, turns red on hover), numbered chips,
  staggered entrance; closes with Esc / backdrop click; focus is managed and cards are keyboard-operable (js/home.js).
- **Stats bar**: below 600px each KPI becomes its own vertical card.
- **Cloud Profile & Settings**: 2×2 grid, single column below 640px.
- **Platform Authenticity**: 8 verified stack tiles (Vite 8, WebGL/Three.js, GSAP/Motion, Firestore Rules…) + guarantees strip.
- **Toast**: root cause of the off-centre phone toast was responsive-global.css (`left/right:.5rem` with the base `translateX(-50%)`);
  fixed, plus compact phone layout (2 newest visible, 36px close target, safe-area aware). Laptop look unchanged.
- **Notifications / Diagnostics Matrix**: restored gaps and widths (styles.css zeroed every `section` margin/padding under 600px),
  responsive grids, action buttons, filter tabs and progress controls.
- **Profile System Settings Portal**: grouped sections, aligned control column, animated card edge, mobile stack, fixed collapsed toggle switches.
