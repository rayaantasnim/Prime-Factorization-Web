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
