# PrimeFactor.app

<div align="center">

  <h1> PrimeFactor.app </h1>
  <p><strong>Olympiad Prime Factorization Speed Laboratory</strong></p>

  <p>
    An elite, client-side speed laboratory engineered for competitive mathematicians and Olympiad contenders to master high-velocity prime factorization and number theory heuristics.
  </p>

  <p>
    <a href="#key-features"><strong>Explore Features</strong></a> •
    <a href="#technical-architecture"><strong>Architecture</strong></a> •
    <a href="#number-theory-heuristics"><strong>Heuristics</strong></a> •
    <a href="#scoring--verdict-matrix"><strong>Scoring Protocol</strong></a>
  </p>

  <p>
    <code>Author: Rayaan Tasnim</code> • 
    <code>Architecture: Serverless / Vanilla ESM</code> • 
    <code>License: MIT</code>
  </p>

</div>

---

## 🔬 Project Overview

**PrimeFactor.app** is a zero-latency, serverless training facility built for Olympiad mathematicians (IMO, USAMO, Putnam). Standard math drills focus on basic arithmetic; **PrimeFactor.app** trains subconscious pattern recognition, modular arithmetic shortcuts, and structural prime decomposition under strict temporal constraints.

Engineered with zero external framework overhead, the application executes high-precision deterministic primality tests and integer factorization directly within the browser thread, pairing visual feedback with micro-tactile audio cues.

---

## ⚡ Technical Architecture

The core engine relies strictly on native web standards and client-side computational number theory algorithms to maintain 60 FPS performance and immediate evaluation.

| Component | Technical Implementation | Purpose / Specification |
| :--- | :--- | :--- |
| **Runtime Architecture** | Vanilla Browser ESM (ES2022+) | Zero bundler overhead, instant static delivery, native module imports. |
| **Primality Engine** | Miller-Rabin Primality Test | Deterministic evaluation using base-a witness sets for guaranteed speed. |
| **Factorization Core** | Pollard's Rho + Brent's Cycle | Sub-millisecond decomposition of composite numbers up to target bounds. |
| **Telemetry & Storage** | Native `localStorage` API | Persists user telemetry, personal ledgers, and local configurations locally. |
| **UI & Audio Engine** | GSAP 3.x + Web Audio API | High-performance dynamic animations coupled with synthesized micro-tones. |

---

## 🗺️ Application Topology & Core Nodes

### 1. Hero Gateway
The primary landing zone establishing visual focus, active tier status, session metrics, and instant drill access.

### 2. Instant Randomizer
A deterministic number generation node that pulls composite integers directly based on active range configurations, instantly preparing the factorization canvas.

### 3. Local Settings Node
Allows athletes to configure temporal limits, active tier ranges, UI sound synthesis thresholds, and custom key bindings using native `<kbd>` inputs.

### 4. Personal Ledger
A local telemetry tracker storing time-to-solve logs, error frequency across specific prime factors, historical speed curves, and personal best runs.

### 5. Prime Playground
An unstructured sandbox mode designed to analyze arbitrary large integers, run step-by-step Pollard's Rho visual breakdowns, and explore custom factor trees.

---

## 🧠 Olympiad Number Theory Heuristics

To excel in high-tier factorization, the platform encourages applying rapid computational shortcuts before falling back to manual decomposition:

*   **Parity & Modulo Isolation ($n \pmod m$):** 
    *   Direct check for $2$ ($n \equiv 0 \pmod 2$) and $5$ ($n \equiv 0, 5 \pmod{10}$).
    *   Alternative base isolation for $3$ and $9$ via digital root reduction.
*   **Digital Root Reduction:**
    *   An integer $n$ is divisible by $3$ (or $9$) if and only if the sum of its digits $\sum d_i \equiv 0 \pmod 3$ (or $\pmod 9$).
*   **Difference of Squares Decomposition:**
    *   If $n$ is odd and close to a perfect square, rewrite as $n = a^2 - b^2 = (a-b)(a+b)$. Useful for odd composites with close factor pairs.
*   **Divisibility by 11:**
    *   Alternating sum of digits $\sum (-1)^i d_i \equiv 0 \pmod{11}$.

---

## 📊 Scoring Protocol & Ranks

### The Exam Contract
Sessions operate under **Strict Exam Rules**:
*   Every correct factorization awards base points scaled by the target integer's magnitude.
*   Speed multipliers decay continuously per millisecond elapsed.
*   Submitting an incorrect factor sequence immediately breaks active streaks and triggers a penalty deduction.

### The 4 Ranks of Verdict

| Rank | Designation | Performance Threshold | Description |
| :---: | :--- | :--- | :--- |
| 🪨 | **Novice / Factorer** | $> 10.0\text{s}$ per target | Reliance on manual trial division. |
| ⚡ | **Adept Competitor** | $3.0\text{s} - 10.0\text{s}$ per target | Firm grasp of single-digit prime heuristics. |
| 🔥 | **Grandmaster** | $1.0\text{s} - 3.0\text{s}$ per target | Rapid application of difference of squares and modulo rules. |
| 💎 | **Olympiad Prime** | $< 1.0\text{s}$ per target | Sub-second intuition; immediate pattern matching. |

---

## 🎯 10-Tier Range Selection Matrix

Athletes can scale challenge severity using the 10-tier numerical range system:

| Tier | Range Bound | Focus Domain |
| :---: | :--- | :--- |
| **Tier 1** | $1 - 100$ | Fundamental primes and basic multiplication tables. |
| **Tier 2** | $101 - 500$ | Two-digit prime recognition and basic parity checks. |
| **Tier 3** | $501 - 1,000$ | Three-digit composite isolation. |
| **Tier 4** | $1,001 - 2,500$ | Divisibility tests for $7, 11, 13$. |
| **Tier 5** | $2,501 - 5,000$ | Difference of squares patterns ($a^2 - b^2$). |
| **Tier 6** | $5,001 - 10,000$ | Four-digit isolation and non-obvious prime factors. |
| **Tier 7** | $10,001 - 25,000$ | Advanced modular arithmetic shortcuts. |
| **Tier 8** | $25,001 - 50,000$ | High-density multi-factor decomposition. |
| **Tier 9** | $50,001 - 100,000$ | Near-prime composites (semi-primes). |
| **Tier 10** | $100,000+$ | Unrestricted Olympiad speed trials. |

---

## 🚀 Deployment & Local Setup

Because **PrimeFactor.app** is built using native Vanilla Browser ESM, no dynamic backend server, build pipeline, or heavy Node.js dependencies are required.

### Local Development
1. Clone the repository:
   ```bash
   git clone [https://github.com/username/primefactor-app.git](https://github.com/username/primefactor-app.git)