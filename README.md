<div align="center">

# 🔱 PrimeFactor.app — Olympiad Edge Prime Factorization Speed Laboratory

### An ultra-velocity, serverless mathematical training arena engineered for elite Math Olympiad competitors and camp selection prep.

[![Architecture](https://img.shields.io/badge/Architecture-Serverless%20Vanilla%20JS-blueviolet?style=flat-square&logo=javascript)](https://shields.io)
[![Initial ELO](https://img.shields.io/badge/Initial%20ELO-500%20Composite%20Apprentice-ff69b4?style=flat-square&logo=speedtest)](https://shields.io)
[![Security](https://img.shields.io/badge/Security-HMAC--SHA256%20Anti--Tamper-red?style=flat-square&logo=1password)](https://shields.io)
[![UI Theme](https://img.shields.io/badge/UI%20Theme-Olympiad%20Glassmorphism-purple?style=flat-square)](https://shields.io)

---

</div>

## 📡 Core Architectural Facilities

The platform integrates 15 enterprise-grade client-side runtime modules designed for low-latency feedback and tamper-resistant skill tracking:

### 01. Dynamic Onboarding Gate
* **Identity Caching**: Safeguards initial user profile caching via browser local storage validation routines.
* **Baseline Allocation**: Hard-codes new user profiles directly to a `500 ELO` (Composite Apprentice) rating floor instead of standard legacy 1000 ELO assumptions.
* **Initialization Flow**: Instantiates player cryptographic tokens and lifetime stat registers on first interactive launch.

### 02. Core Factorization Lab
* **Execution Arena**: High-velocity game loop capable of processing composite integers ranging from simple two-digit values up to multi-digit bounds.
* **Constraint Tracking**: Tracks exact keypress sequences, active input latencies, and prime decomposition correctness in real time.
* **Sub-millisecond State Engine**: Evaluates prime factors instantly using deterministic trial division and pre-computed prime lookup arrays.

### 03. Omnipresent ELO-to-Range Ceiling Firewall
* **Anti-Farming Protection**: Monitors active competitive ELO ratings against selected lower/upper numerical bounds.
* **Dynamic Gatekeeping**: Automatically forces match sessions into "Unrated Practice Mode" if a high-ranking player attempts to farm rating points on trivial ranges.
* **Automated Penalty Engine**: Prevents rating inflation across all 12 platform competitive brackets.

### 04. Custom Parametric Setup Architecture
* **Configurable Bounds**: Allows competitors to customize personalized lower and upper range parameters anywhere between 4 and 100,000.
* **Timer Granularity**: Fine-tunes time limits down to discrete second increments or unlocks un-timed analysis.
* **Lifeline Control**: Toggles optional 3-strike countdown systems for high-stakes elimination simulations.

### 05. Spin Wheel Audio-Physics Module
* **Decentralized Sudden-Death**: Implements a Canvas-based radial selector for random arena parameter assignments.
* **Acoustic Feedback Engine**: Emits realistic mechanical ticking audio synthesized via the Web Audio API with realistic deceleration frequency drops.
* **Sub-Millisecond Deflections**: Calculates randomized angular drop deflections to guarantee non-deterministic wheel landings regardless of initial frame rates.

### 06. Pre-Flight Multi-Axis Contract Gate
* **Contract Evaluation**: Cross-evaluates player ELO tiers, lifetime accuracy ratings, and target numerical bounds prior to match start.
* **Target Calculation**: Dynamically computes required target time thresholds, maximum allowed attempts, and dynamic score chase goals.
* **Binding Session State**: Encapsulates match constraints inside an immutable session contract payload.

### 07. Exam Arena Hidden Velocity Tracker
* **Cognitive Load Reduction**: Suppresses disruptive visual timer countdowns during live factorization tasks.
* **Background Pacing**: Runs a continuous precision timer thread (`performance.now()`) in the background.
* **Overhead Capsule Rendering**: Renders real-time dynamic chasing target status indicators onto the top capsule bar text node without exposing exact elapsed milliseconds.

### 08. Post-Match Verification Ledger Grid
* **Glass-Morphic Analytics Panel**: Displays a structured session report directly beneath the match result summary ring.
* **Itemized Factor Audit**: Maps factor inputs alongside interactive read-only checkbox states (`[✔️]` for exact prime hits, `[❌]` for non-prime or invalid factors).
* **Scalar Scoring**: Computes a fractional 10-point scalar score derived from response latency, penalty occurrences, and range difficulty multipliers.

### 09. The 100 Olympiad Medals Vault
* **Milestone Tracking**: Comprehensive honors library recording 100 numeric bounds achievements, streak milestones, and accuracy metrics.
* **Vector Icon Integration**: Utilizes crisp vector iconography scaled dynamically across target devices.
* **Persistence Layer**: Tracks unlocked achievements securely inside the signed local client data store.

### 10. The 100 Tactical Insignia Badges
* **Precision Badging**: Grants specialized insignia for exceptional operational efficiency (e.g., sub-second factorizations, zero-lifeline runs, and consecutive speed runs).
* **Rhythm Cadence Monitoring**: Analyzes input inter-keystroke intervals (IKIs) to detect steady state calculation cadences.
* **Resource Multipliers**: Awards extra prestige indicators when completing complex factorizations without using factor hints or strike buffers.

### 11. Fade-to-Inspire Visual Engine
* **Visual Lock State**: Applies a 25% opacity grayscale CSS filter and pointer-events overlay to unearned honors and medals.
* **Interactive Motivation**: Intercepts click events on locked achievements to trigger a localized 3-second motivational legacy callout toast.
* **Clean Reset Loop**: Automatically fades out overlay callouts using CSS transition timers without triggering layout shifts.

### 12. Recent Table Ledger Analytics Matrix
* **Session Telemetry**: Cleans out legacy hardcoded static tables to render accurate, dynamic session records for the last 10 matches.
* **Recovery Metrics**: Tracks first-try prime factorizations vs. second-chance strike recoveries separately.
* **Rating Vectors**: Highlights real ELO deltas using distinct glowing green/red net rating indicators.

### 13. Career Memory Accumulation Aggregates
* **Persistent Stat Tracking**: Aggregates continuous performance data across multiple local sessions.
* **Core Metrics**: Maintains persistent counters for Active Win Streaks, Lifetime Peak Streaks, Total Prime Factors Identified, and Cumulative Solved Integers.
* **Data Integrity Checks**: Validates aggregate values against session history signatures on platform startup.

### 14. Profile Identity Customization Settings
* **Competitor Metadata**: Provides input fields to store Real Name, City, Country, and Institutional Affiliation.
* **Training Missions**: Selects active focus missions from an 11-option drop-down menu (e.g., "Mersenne Search Speed", "Fermat Factorization Focus", "Olympiad Sprint").
* **Local Persistence**: Caches profile parameters locally while binding identity keys to local ELO ratings.

### 15. The Cryptographic 3-Strike Security Hammer
* **HMAC State Verification**: Signs all local storage rating payloads using client-side HMAC-SHA256 signature hashes.
* **Console Mutation Detection**: Monitors storage events and internal memory state changes for unauthorized manual edits.
* **Security Hammer Execution**: Instantly clears state registers, clears DOM content, and places an immutable ban key inside local storage if state tampering is detected.

---

## 🛠️ Local Development Environment Setup

Follow these steps to clone, run, and develop the platform locally using <kbd>Bun</kbd>, <kbd>Vite</kbd>, and <kbd>TypeScript</kbd>:

```bash
# 1. Clone the Math Olympiad Speed Laboratory source directory
git clone [https://github.com/PrimeFactor/Prime-Factorization-Web.git](https://github.com/PrimeFactor/Prime-Factorization-Web.git)

# 2. Enter the project root directory context path
cd Prime-Factorization-Web

# 3. Synchronize zero-dependency packages using Bun engine
bun install

# 4. Deploy the local client-side developer runtime environment server
bun run dev