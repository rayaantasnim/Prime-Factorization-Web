<p align="center">
  <img src="https://images.pexels.com/photos/36747234/pexels-photo-36747234.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="PrimeFactor.app Hero Module Banner" width="100%" />
</p>

<h1 align="center">∏ PrimeFactor.app</h1>
 
<p align="center">
  <b>Enterprise-Grade Math Olympiad Speed Laboratory & Integer Decomposition Cloud Arena</b><br/>
  <sub>Engineered by Olympiad Edge • Authorized by Rayaan Tasnim • Version 3.4 (Obsidian Aurora)</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase_Auth-OAuth_2.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Cloud_Firestore-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Cloud Firestore" />
  <img src="https://img.shields.io/badge/Google_GenAI-SDK-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google GenAI SDK" />
  <img src="https://img.shields.io/badge/GSAP_%26_Framer-Motion-88CE02?style=for-the-badge&logo=greensock&logoColor=white" alt="GSAP & Framer Motion" />
  <img src="https://img.shields.io/badge/Status-Version_3.4_Live-success?style=for-the-badge" alt="Version 3.4 Live" />
  <a href="https://rayaantasnim.github.io/Prime-Factorization-Web/">
    <img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-informational?style=for-the-badge&logo=github" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <b>[<a href="#-core-mission--overview">Overview</a>]</b> • 
  <b>[<a href="#-architecture--cloud-security-grid">Architecture</a>]</b> • 
  <b>[<a href="#-advanced-features--interactive-ecosystem">Features</a>]</b> • 
  <b>[<a href="#-number-theory-training-arena-edu-shortcuts">Math Shortcuts</a>]</b> • 
  <b>[<a href="#-in-arena-rules-elo-framework--security">ELO & Rules</a>]</b> • 
  <b>[<a href="#-the-15-core-platform-facilities-matrix">15 Facilities</a>]</b> • 
  <b>[<a href="#-development-environment--github-pages-deployment">Setup</a>]</b>
</p>

---

## 🌌 Core Mission & Overview

**PrimeFactor.app** (Version 3.4 — Obsidian Aurora) is an ultra-fast, cloud-synchronized computational playground and high-throughput competitive arena engineered specifically for competitive mathematicians, Math Olympiad contenders, and quantitative speed-solvers. The platform executes sub-second prime factorization verifications under intense competitive pressure, backed by **Firebase Authentication (Google OAuth 2.0)** and a real-time **Cloud Firestore** persistence layer.

By uniting low-latency client-side algorithmic execution with an interactive hero gateway and strict server-enforced cloud synchronization, PrimeFactor.app bridges raw number-theoretic intuition with verified global competition. Whether warming up in the interactive 5-second hero challenge or climbing the rated ladder across devices, PrimeFactor.app acts as an elite training facility for global mathematics competitors.

---

## 🏗️ Architecture & Cloud Security Grid

PrimeFactor.app utilizes a cloud-backed hybrid architecture. Heavy computational routines—such as deterministic primality tests and cycle-finding factorizations—are offloaded directly to non-blocking browser **Web Worker** threads, while user identities, competitive ELO ratings, and match ledgers are persisted and verified in real time via **Firebase Auth** and **Cloud Firestore**.

<p align="center">
  <img src="https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Mathematical Performance Layer" width="100%" />
</p>

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Browser Client (React 18)               │
                  └────────────────────────────┬────────────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
  ┌─────────────────────────┐                                    ┌─────────────────────────┐
  │ Web Worker Math Engine  │                                    │  UI & Interactive Hero  │
  ├─────────────────────────┤                                    ├─────────────────────────┤
  │ - Miller-Rabin (Det.)   │                                    │ - Tailwind CSS          │
  │ - Pollard's Rho         │                                    │ - Framer Motion         │
  │ - Brent's Cycle Finding │                                    │ - GSAP + ScrollToPlugin │
  │ - Zero-UI-Blocking      │                                    │ - 5s Live Mini-Arena    │
  └────────────┬────────────┘                                    └────────────┬────────────┘
               │                                                              │
               └───────────────────────────────┬──────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │        Firebase Cloud, Security & AI Integration        │
                  ├─────────────────────────────────────────────────────────┤
                  │ - Firebase Authentication (Google OAuth 2.0)            │
                  │ - Cloud Firestore Real-Time Persistence & Ledger Sync   │
                  │ - Server-Enforced firestore.rules (Anti-Tamper Shield)  │
                  │ - @google/genai SDK (Adaptive Challenge Generation)     │
                  └─────────────────────────────────────────────────────────┘
```

---

## ⚡ Advanced Features & Interactive Ecosystem

### 🚀 Interactive 5-Second Hero Mini-Challenge (`index.html`)
The landing viewport features a live, playable **5-second factorization sandbox** paired with a real-time Cloud Ledger preview. Prospective competitors can test their mental decomposition speed against high-frequency millisecond timers with instant validation before stepping into the main arena.

### 🔐 Zero-Guest Strict Cloud Ledger
* **Guest vs. Competitor Protocol**: Unauthenticated visitors can practice freely in unrated mode, whereas competitors signing in via **Google OAuth 2.0** initialize at a verified **500 ELO baseline**.
* **Real-Time Cross-Device Sync**: Automatically synchronizes ELO ratings, win streaks, range milestone medals, and complete match logs across desktop and mobile devices via Cloud Firestore.

### ⚙️ Sub-Millisecond Algorithmic Core
* **Deterministic Miller-Rabin Primality Testing**: Eliminates probabilistic ambiguity across all supported integer ranges.
* **Pollard's Rho & Brent's Cycle Detection**: Optimized non-blocking Web Worker routines capable of decomposing large composites into prime factors within milliseconds.

### 🤖 AI-Powered Challenge Synthesizer (`@google/genai`)
* Interfaces natively with Google's GenAI SDK to generate adaptive, contextual mathematical challenge problems and instant strategy breakdowns tailored to competitor performance.

### 🏆 Gamified Progression & Dual-Vault Achievements
* **12-Tier Olympiad ELO Ladder**: Ascend from *Composite Apprentice* (500 ELO) through 12 distinct competitive divisions up to *Prime Grandmaster*.
* **Dual-Vault Medals & Insignias**: Unlock **100 Range Milestone Medals** and **100 Tactical Cognitive Insignias**.
* **Fade-to-Inspire UI Protocol**: Unearned operational achievements and high-tier ranges are locked behind a **25% opacity grayscale filter**, restoring full color saturation dynamically upon meeting mathematical benchmarks.

### 🎵 Immersive Audio-Physics & UX
* **Sudden Death Spin Wheel**: Integrated with procedural **Web Audio API** ticking physics for high-tension random category selection.
* **5-Second Visual Scratchpad Overlay**: Provides a low-latency digital canvas to pause time and sketch manual factor trees mid-round.
* **Post-Match 10.0 Verification Ledger**: Evaluates score efficiency, accuracy rate, lifeline economy, and solve time consumption on a fractional **10.0** scale.

---

## 🧠 Number Theory Training Arena (Edu Shortcuts)

Top-tier Math Olympiad competitors do not rely on brute-force trial division during speed rounds. PrimeFactor.app incorporates 3 foundational cognitive tactics designed to mentally factorize large composites in under 200ms.

### Strategy 01: Parity & Modulo 5 Isolation
For any base-10 integer $N$, parity and trailing base properties allow instant decadic stripping:
1. **Decadic Stripping**: If $N \equiv 0 \pmod{10}$, strip all trailing zeros by pulling factor pairs $(2 \times 5)^k$.
2. **Even Parity**: While $N \equiv 0 \pmod 2$, continuously extract $2$ until $N$ becomes odd.
3. **Modulo 5**: If the terminal digit of $N$ is $5$, then $N \equiv 0 \pmod 5$. Continuously extract $5$ until $N \not\equiv 0 \pmod 5$.

Removing factors of $2$ and $5$ rapidly reduces the residual quotient $N'$ to an odd integer ending in $1, 3, 7,$ or $9$, vastly narrowing the search space.

### Strategy 02: Digit Sum & Modulo 9 Heuristics
Using digital roots ("Casting Out Nines"), modular congruences allow instant detection of factors $3$ and $9$:
$$S(N) = \sum_{k=0}^{m} d_k \quad \text{where} \quad N = \sum_{k=0}^{m} d_k 10^k$$
* **Rule for 3**: $N \equiv S(N) \pmod 3$. If $S(N) \in \{3, 6, 9\}$, extract $3$.
* **Rule for 9**: $N \equiv S(N) \pmod 9$. If $S(N) = 9$, extract $9 = 3^2$ immediately.

Executing digit sum checks before setting up any trial divisions eliminates powers of $3$ within milliseconds.

### Strategy 03: Fermat's Difference of Squares
When an odd composite $N$ lacks small prime factors, it can frequently be expressed as the difference of two squares:
$$N = a^2 - b^2 = (a - b)(a + b)$$
Where $a = \lceil\sqrt{N}\rceil + k$ for $k \in \{0, 1, 2, \dots\}$.

#### Benchmark Case Study: $N = 899$
1. Calculate $\lceil\sqrt{899}\rceil = 30$.
2. Test $a = 30$:
   $$b^2 = a^2 - N = 30^2 - 899 = 900 - 899 = 1 = 1^2$$
3. Since $b = 1$ is an integer square, apply the algebraic identity:
   $$899 = (30 - 1)(30 + 1) = 29 \times 31$$

Both $29$ and $31$ are prime; the integer is fully factorized in two mental steps.

---

## 🛡️ In-Arena Rules, ELO Framework & Security

<p align="center">
  <img src="https://images.pexels.com/photos/207529/pexels-photo-207529.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Cloud Security Shield Architecture" width="100%" />
</p>

<details>
<summary><b>🔽 Dropdown 1: Dynamic ELO Formula, Volatility (K), Velocity (V), High-Tier Dampener & Asymmetric Range Firewall</b></summary>

<br />

### Rating Initialization & Core Formulas
* **Zero-Guest Strict Baseline**: Guests practice in unrated mode; all authenticated Google OAuth 2.0 candidate profiles initialize strictly at a verified **500 ELO floor baseline (Composite Apprentice)**.
* **Rating Delta Equation**:
  $$\Delta R = K \times (\text{Net Accuracy\%} - E) \times V$$
  Where $E$ represents expected performance based on question difficulty versus current player ELO.

* **Volatility Index ($K$)**:
  $$K = 32 \times (1 + \log_{10}(\text{Streak} + 1))$$
  Sustained correct streaks amplify $K$, allowing fast upward mobility for skilled candidates.

* **Velocity Index ($V$)**:
  Scales dynamically up to **$3.5\times$** for verified sub-second answers.

### High-Tier Dampeners & Inactivity Penalties
* **High-Tier Dampener**: For users with ratings $R_{\text{user}} \ge 1800$, positive ELO gains are dampened by a multiplier of $\frac{1800}{R_{\text{user}}}$. Negative ELO losses remain **100% exposed** to prevent rating inflation.
* **Inactivity Decay**: Profiles inactive for more than 14 consecutive days incur an automatic penalty of **-10 ELO per week**.

### Asymmetric Range Firewall
To prevent high-tier players from farming ELO on trivial integer ranges:
* If $R_{\text{user}} \ge 1500$ and the candidate selects difficulty bounds below their rank threshold, the session automatically enters **Unrated Practice Mode** ($\Delta R = 0$).

</details>

<details>
<summary><b>🔽 Dropdown 2: In-Game Scoring Matrix, Tactical Lifelines Table & 3-Strike Disqualification</b></summary>

<br />

### Base Point Allocations (Out of 100 Base Score)
* **Pure 1st-Attempt Clear**: **+10 pts**
* **Hint / Overtime 2nd-Chance Clear**: **+5 pts**
* **Standard Error / Skip**: **-5 pts** (and adds 1 strike count)

### Tactical Asset Lifelines
Candidates may invoke tactical lifelines at a direct point/ELO cost:

| Tactical Lifeline Asset | Direct Point Cost | Additional Condition / Constraint |
| :--- | :---: | :--- |
| **Pause Clock** | -2 pts | Maximum 2 per session |
| **Regenerate Question** | -2 pts | Maximum 1 per session |
| **Extend Clock (+30s)** | -3 pts | Dampens session ELO gains by **2%** |
| **Eliminate Noise** | -4 pts | Removes invalid keypads/inputs |
| **Launch 5s Scratchpad** | -5 pts | Pauses time for 5 seconds for visual math work |
| **Voluntarily Exit** | -5 pts | Forfeits active session match |

### Disqualification Thresholds
* **3-Strike Rule**: Amassing 3 errors or skips within a single match triggers immediate session disqualification and a flat **-10 point deduction**.

</details>

<details>
<summary><b>🔽 Dropdown 3: Hardware Focus Anti-Cheat (Page Visibility API) & Server-Enforced Firestore Security Rules</b></summary>

<br />

### Hardware Focus Laws (Page Visibility API)
* **Window Visibility Tracking**: Switching tabs, minimizing the browser window, or moving application focus out of the active arena screen is captured immediately via the **Page Visibility API**, triggering an instant warning strike and a **-5 point deduction**.
* **Request External Access Bypass**: Players may click *"Request External Access Bypass"* to purchase a strict **10-second exemption window** at the cost of a **-5 point tactical fee**.

### Cloud Security & Anti-Tamper Shield
PrimeFactor.app protects competitive integrity by pairing **Google OAuth 2.0** authentication with server-enforced **Cloud Firestore Security Rules** (`request.auth.uid == userId`), eliminating unauthorized writes and client-side score manipulation:

```
[ Match Completion / Profile Mutation Requested ]
                    │
                    ▼
          ┌───────────────────┐
          │ Google OAuth 2.0  │
          │ & UID == userId?  │
          └─────────┬─────────┘
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ Allowed: Commit to Cloud ] [ Denied: PERMISSION_DENIED ]
```

1. **Google OAuth 2.0 Identity Gate**: Unauthenticated guests operate strictly in ephemeral practice mode; only verified Google accounts can initialize a 500 ELO ledger, record match histories, or claim medals.
2. **Server-Enforced Ownership (`request.auth.uid == userId`)**: Firestore Security Rules validate every incoming read/write operation at the database boundary so users can only mutate their own `users/{userId}` document.
3. **Page Visibility Focus Enforcement**: Any loss of viewport focus during live ranked play is intercepted by the hardware focus monitor and penalized before match results are committed to the cloud.

</details>

<details id="-the-15-core-platform-facilities-matrix">
<summary><b>🔽 Dropdown 4: The 15 Core Platform Facilities Matrix (Upgraded <code>services.html</code> Hub)</b></summary>

<br />

PrimeFactor.app integrates 15 tightly-coupled facilities across `services.html` and the core arena, providing real-time feedback, cross-device cloud persistence, and post-match analytical scoring:

| # | Facility Name | System Description |
| :-: | :--- | :--- |
| **01** | **Deterministic Prime Engine** | Executes Miller-Rabin and Pollard's Rho factorization sub-routines on non-blocking Web Worker threads. |
| **02** | **Dynamic ELO Calculator** | Computes real-time rating updates from a verified 500 ELO baseline using velocity, difficulty, and streak multipliers. |
| **03** | **Page Visibility Focus Monitor** | Tracks browser focus and tab visibility events via Page Visibility API to detect window blur and penalize tab switching. |
| **04** | **Cloud Security & Anti-Tamper Shield** | Server-enforced Firestore Security Rules (`request.auth.uid == userId`) blocking client-side score tampering. |
| **05** | **Fade-to-Inspire UI Matrix** | Locks unearned range achievements and dual-vault badges behind a **25% opacity grayscale filter** until unlocked. |
| **06** | **Post-Match Verification Ledger** | Generates a 4-category performance report (Score, Accuracy, Lifelines, Time) rated out of **10.0**. |
| **07** | **Tactical Lifeline Dispatcher** | Manages point deductions, ELO dampeners, and per-session usage limits for in-game assistance assets. |
| **08** | **Adaptive Clock System** | Tracks millisecond solve times, enforces countdown bounds, and manages overtime penalties. |
| **09** | **GenAI Problem Synthesizer** | Interfaces with `@google/genai` to construct custom contextual challenge problems and strategy breakdowns. |
| **10** | **Scratchpad Overlay Engine** | Renders a lightweight, low-latency visual canvas for rapid mental factorization work. |
| **11** | **Streak & Volatility Vector** | Tracks consecutive correct solves to scale the dynamic volatility index ($K$) and score multipliers. |
| **12** | **12-Tier Rank Progression Index** | Maps player ELO across 12 competitive divisions from Composite Apprentice (500 ELO) to Prime Grandmaster. |
| **13** | **Cloud Onboarding Gate** | Manages the Zero-Guest entry flow, transitioning visitors from the 5s hero mini-challenge into authenticated play. |
| **14** | **Cloud Identity Portal** | Authenticates competitors via Firebase Auth (Google OAuth 2.0) and manages active session identity state. |
| **15** | **Cumulative Cloud Arrays** | Real-time Cloud Firestore collections synchronizing ratings, dual-vault medals, streaks, and match logs across devices. |

</details>

---

## 🛠️ Development Environment & GitHub Pages Deployment

<p align="left">
  <img src="https://img.shields.io/badge/Step_1-Clone_%26_Install-181717?style=for-the-badge&logo=github" alt="Step 1" />
</p>

Clone the repository and install all TypeScript, React, Vite, Firebase, and Google GenAI dependencies:

```bash
# Clone the official repository
git clone https://github.com/rayaantasnim/Prime-Factorization-Web.git

# Navigate into the project directory
cd Prime-Factorization-Web

# Install all dependencies (including firebase and @google/genai)
npm install
npm install firebase
```

<p align="left">
  <img src="https://img.shields.io/badge/Step_2-Firebase_%26_Env_Setup-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Step 2" />
</p>

Configure your Firebase project credentials in `src/firebase.ts` and create a `.env` file in the root directory for your API keys:

```env
# Google GenAI SDK Key
VITE_GENAI_API_KEY=your_google_genai_api_key_here

# Firebase Configuration (consumed by src/firebase.ts)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

1. In the **Firebase Console**, enable **Google** under **Authentication → Sign-in method**.
2. Add `localhost` and your GitHub Pages domain (`rayaantasnim.github.io`) to **Authentication → Settings → Authorized domains**.
3. Deploy your `firestore.rules` file (`request.auth.uid == userId`) using the Firebase CLI:

```bash
# Install Firebase CLI globally if needed
npm install -g firebase-tools

# Authenticate and link your Firebase project
firebase login
firebase use --add

# Deploy server-enforced Cloud Firestore security rules
firebase deploy --only firestore:rules
```

<p align="left">
  <img src="https://img.shields.io/badge/Step_3-Local_Dev_%26_Production_Preview-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Step 3" />
</p>

Launch the local Vite development server or compile and test the exact GitHub Pages production bundle locally:

```bash
# Start local Vite development server with HMR (http://localhost:5173)
npm run dev

# Build the production bundle for GitHub Pages
npm run build

# Preview and test the production build locally
npm run preview
```

---

<p align="center">
  <sub>© Olympiad Edge. Authorized by Rayaan Tasnim. All rights reserved.</sub>
</p>
---

## 🔐 Security & Motion Notes (v3.3.1)

**Firebase / Firestore**
- `firestore.rules` now validates profile shape, makes `uid`/`email`/`createdAt` immutable, forces a pristine 500-ELO baseline on create, and bounds every progression field per write (ELO ±250, `total_matches` +1, counters monotonic, ≤50 logs). Deploy with `firebase deploy --only firestore:rules`.
- Rules cannot prove a match was played honestly. For fully authoritative ratings, settle matches in a Cloud Function and deny client writes to progression fields.
- `js/firebase.js`: transactional, idempotent (`matchId`) match commits; allow-listed `updateUserProfile`; penalty-only `applyEloPenalty`; deduplicated profile bootstrap; graceful popup-cancel / popup-blocked (redirect) handling; session data cleared on sign-out.
- Restrict the Firebase API key by HTTP referrer and enable App Check (set `VITE_RECAPTCHA_SITE_KEY`). Config can be overridden with `VITE_FIREBASE_*` (see `.env.example`).

**Hero & motion** (`js/hero-fx.js`, `js/hero-shaders.js`, `css/hero-fx.css`)
- WebGL prime-sieve shader + Three.js (2,3) torus-knot constellation (raw-WebGL fallback if Three.js fails to load, static image if WebGL is unavailable).
- GSAP + ScrollTrigger: intro timeline, parallax, heading reveals. Motion (Framer Motion engine): scroll progress, in-view springs, hover/press.
- Respects `prefers-reduced-motion`; pauses off-screen / in background tabs; adaptive pixel ratio.

## 🎨 Design language v3.4 — "Obsidian Aurora"
- `css/ux-core.css` + `js/ux-core.js` load last on **every** page: one dark canvas with a slow CSS aurora, a single glass-surface recipe, unified header/controls/focus states, calmer card hovers, and cross-page transitions (View Transitions API with a fade fallback).
- UX patterns: scroll-progress bar, back-to-top, scroll reveals, toasts (`UX.toast(msg, 'success'|'error')`), and a command palette (Ctrl/Cmd+K or `/`) to jump to any module. The timed exam page gets the theme only (no reveals, palette or shortcuts).
- Hero: the shader measures the copy block and keeps the lattice calm behind it; the 3D knot sits at the edge, dimmed, with a text scrim for guaranteed contrast.
- Bugs fixed on the way: `profile.js` undefined `lastResult`/`ledger`, header gear double-offset, invisible text on light-era buttons/banners, `edu.html` horizontal scroll on phones.

## 🐞 Bug-fix log (v3.4.1)
- **Invisible checkboxes / washed-out content (home → Cloud Profile & Settings, and 9 other home sections, exam arena):** each section's absolutely-positioned dark backdrop layer painted over any sibling that wasn't itself positioned. Fixed globally in `css/ux-core.css` (siblings lifted above the backdrop).
- **Signed-in users treated as guests on the result page** (match never saved, "ELO Not Saved" banner): `result.js` rendered before Firebase restored the session. It now waits for auth.
- `profile.js`: `compute64BitBackupHash` / `ENGINE_HMAC_SECRET` were never defined (diagnostics export threw, every import failed) — implemented; `lastResult` / `ledger` undefined references fixed.
- `notification-engine.js`: `timestamp.split is not a function` crash for non-string timestamps.
- Three malformed SVG icon paths (file icon on `edu.html`, gear icon on `profile.html` / `result.html`).
- Earlier: triple-counted matches, auth race, header XSS, simulated-ELO persisting, header gear offset, `edu.html` horizontal scroll.

## v3.5 — Aurora Pro upgrade
- **Readability**: `js/readability-guard.js` + `css/aurora-pro.css` lift navy/slate text to WCAG AA on dark surfaces (palette unchanged).
- **Ranges**: spring-physics 3D cards with cursor glow (`js/ranges-3d.js`, `css/ranges-3d.css`), bento stats, 60/40 spotlight hero.
- **Responsive**: `css/contract-media-query.css`, extended `css/result-media-query.css`, global safety net in `aurora-pro.css`.
- **Firebase speed**: persistent multi-tab Firestore cache, lazy auth popup resolver, instant cached-session header, parallel profile fetch, single-transaction match commit, preconnect hints, `firestore.indexes.json` (deploy with `firebase deploy --only firestore:indexes`).
