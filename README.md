<p align="center">
  <img src="https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="PrimeFactor.app Hero Module Banner" width="100%" />
</p>

# ∏ PrimeFactor.app

### Modern Math Olympiad Speed Laboratory & Integer Decomposition Arena

**Engineering:** Olympiad Edge  
**Authorization:** Authorized by Rayaan Tasnim  
**Repository Version:** Commit `2eabd11` Stack

---

## 🌌 Core Mission & Overview

**PrimeFactor.app** is an ultra-fast, serverless playground and high-throughput computational arena engineered specifically for competitive mathematicians, Math Olympiad contenders, and quantitative speed-solvers. The platform is designed to execute sub-second prime factorization verifications under intense competitive pressure. 

By combining low-latency client-side algorithmic execution with low-friction visual motion layers, PrimeFactor.app bridges the gap between raw number-theoretic intuition and real-time speed competition. Whether isolating prime factors on 64-bit composites or stress-testing mental integer decomposition heuristics, PrimeFactor.app acts as an elite training facility for global mathematics competitors.

---

## 🚀 Core Hybrid Technical Architecture (Commit `2eabd11` Stack)

PrimeFactor.app utilizes a hybrid client-heavy architecture. Heavy computational routines—such as primality tests and cycle-finding factorizations—are offloaded directly to browser thread loops, while user interface state, smooth motion animations, and local storage state trees are managed via modern reactive and bundled web technologies.

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
  │   Algorithmic Engine    │                                    │  UI & Animation Layer   │
  ├─────────────────────────┤                                    ├─────────────────────────┤
  │ - Miller-Rabin (Det.)   │                                    │ - Tailwind CSS          │
  │ - Pollard's Rho         │                                    │ - Framer Motion         │
  │ - Brent's Cycle Finding │                                    │ - GSAP + ScrollToPlugin │
  │ - Web Worker Threads    │                                    │ - Lucide React Icons    │
  └────────────┬────────────┘                                    └────────────┬────────────┘
               │                                                              │
               └───────────────────────────────┬──────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              Security & AI Integration Layer            │
                  ├─────────────────────────────────────────────────────────┤
                  │ - Client-Side HMAC-SHA256 LocalStorage Integrity        │
                  │ - @google/genai SDK (Adaptive Challenge Generation)     │
                  │ - Express / tsx Server Utilities & esbuild Bundling     │
                  └─────────────────────────────────────────────────────────┘
```

### 1. Frontend Matrix & Framework
* **React & React DOM**: Core UI declarative rendering, state management, and component lifecycle control.
* **Vite**: High-speed build engine and HMR (Hot Module Replacement) development server.
* **Type-Safe TypeScript (`.ts`, `.tsx`)**: Strict type systems enforcing absolute interface reliability across complex mathematical data structures, score models, and engine events.

### 2. Styling, Layout & Motion Design
* **Tailwind CSS**: Utility-first styling framework integrated via Autoprefixer and Vite Tailwind plugins for rapid, responsive UI composition.
* **Typography & Icons**: Deep Google Fonts web integration coupled with Lucide React vector icons.
* **Motion Infrastructure**: **Framer Motion** for dynamic layout transitions and component animations alongside **GSAP** (featuring `ScrollToPlugin`) for smooth scrolling and complex visual timelines.

### 3. Algorithmic Execution & AI Contexts
* **Deterministic Miller-Rabin Primality Checks**: Guarantees fast, exact primality testing without probabilistic ambiguity for all supported integer ranges.
* **Pollard's Rho & Brent's Cycle Detection**: Highly optimized local browser thread routines capable of decomposing non-trivial composite integers into prime factors within milliseconds.
* **Google GenAI SDK (`@google/genai`)**: Native client-side integration with Google's GenAI API to deliver adaptive, contextual mathematical commentary, problem generation, and strategy breakdowns.

### 4. Tooling, Local Environments, & Servers
* **Browser LocalStorage**: Client-side storage engine for persisting session histories, user settings, and rating matrices.
* **HMAC-SHA256 Verification**: Security layer calculating signature hashes over LocalStorage state payloads to detect local anti-cheat tampering.
* **Express & Node Tooling**: Lightweight Node.js backends configured with `dotenv`, `esbuild` bundlers, and `tsx` execution wrappers for offline CLI utility execution and administrative scripting.

---

## 🧠 Number Theory Training Arena (Edu Shortcuts)

Top-tier Math Olympiad competitors do not rely on brute-force trial division during speed rounds. PrimeFactor.app incorporates 3 foundational cognitive tactics designed to mentally factorize large composites in under 200ms.

### Strategy 01: Parity & Modulo 5 Isolation
For any base-10 integer $N$, parity and trailing base properties allow instant decadic stripping:
1. **Decadic Stripping**: If $N \equiv 0 \pmod{10}$, strip all trailing zeros by pulling factor pairs $(2 \times 5)^k$.
2. **Even Parity**: While $N \equiv 0 \pmod 2$, continuously extract $2$ until $N$ becomes odd.
3. **Modulo 5**: If the terminal digit of $N$ is $5$, then $N \equiv 0 \pmod 5$. Continuously extract $5$ until $N \not\equiv 0 \pmod 5$.

Removing factors of 2 and 5 rapidly reduces the residual quotient $N'$ to an odd integer ending in 1, 3, 7, or 9, vastly narrowing the search space.

### Strategy 02: Digit Sum & Modulo 9 Heuristics
Using digital roots ("Casting Out Nines"), modular congruences allow instant detection of factors $3$ and $9$:
$$S(N) = \sum_{k=0}^{m} d_k \quad \text{where} \quad N = \sum_{k=0}^{m} d_k 10^k$$
* **Rule for 3**: $N \equiv S(N) \pmod 3$. If $S(N) \in \{3, 6, 9\}$, extract $3$.
* **Rule for 9**: $N \equiv S(N) \pmod 9$. If $S(N) = 9$, extract $9 = 3^2$ immediately.

Executing digit sum checks before setting up any trial divisions eliminates powers of 3 within milliseconds.

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

## 🛡️ In-Arena Systems, Rules & Security

<p align="center">
  <img src="https://images.pexels.com/photos/207529/pexels-photo-207529.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Cryptographic Firewall Architecture" width="100%" />
</p>

<details>
<summary><b>🔽 Dropdown 1: The Dynamic ELO Framework & Asymmetric Firewall</b></summary>

<br />

### Rating Initialization & Core Formulas
* **Baseline Rating**: All new candidate profile matrices initialize strictly at a **500 ELO floor baseline (Composite Apprentice)**.
* **Rating Delta Equation**:
  $$\Delta R = K \times (\text{Net Accuracy\%} - E) \times V$$
  Where $E$ represents expected performance based on question difficulty versus current player ELO.

* **Volatility Index ($K$)**:
  $$K = 32 \times (1 + \log_{10}(\text{Streak} + 1))$$
  Sustained correct streaks amplify $K$, allowing fast upward mobility for skilled candidates.

* **Velocity Index ($V$)**:
  Scales dynamically up to **3.5×** for verified sub-second answers.

### High-Tier Dampeners & Inactivity Penalties
* **High-Tier Dampener**: For users with ratings $R_{\text{user}} \ge 1800$, positive ELO gains are dampened by a multiplier of $\frac{1800}{R_{\text{user}}}$. Negative ELO losses remain **100% exposed** to prevent rating inflation.
* **Inactivity Decay**: Profiles inactive for more than 14 consecutive days incur an automatic penalty of **-10 ELO per week**.

### Asymmetric Range Firewall
To prevent high-tier players from farming ELO on trivial integer ranges:
* If $R_{\text{user}} \ge 1500$ and the candidate selects difficulty bounds below their rank threshold, the session automatically enters **Unrated Practice Mode** ($\Delta R = 0$).

</details>

<details>
<summary><b>🔽 Dropdown 2: Live In-Game Scoring & Penalty Mechanics</b></summary>

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
<summary><b>🔽 Dropdown 3: Hardware Focus Anti-Cheat & Cryptographic Hammer</b></summary>

<br />

### Hardware Focus Laws
* **Window Visibility Tracking**: Switching tabs, minimizing the browser window, or moving application focus out of the active arena screen triggers an immediate warning strike and a **-5 point deduction**.
* **Request External Access Bypass**: Players may click "Request External Access Bypass" to purchase a strict **10-second exemption window** at the cost of a **-5 point tactical fee**.

### The 3-Strike Cryptographic Hammer
PrimeFactor.app computes client-side HMAC-SHA256 signatures over state keys in `LocalStorage`. External modification of scores, ELO values, or strike counters triggers automated escalation sequences:

```
[ LocalStorage State Modification Detected ]
                    │
                    ▼
          ┌───────────────────┐
          │  HMAC Mismatch?   │
          └─────────┬─────────┘
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ Pass: Continue ]     [ Fail: Increment Hammer Strike ]
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   ┌───────────┐           ┌───────────┐           ┌───────────┐
   │ Strike 1  │           │ Strike 2  │           │ Strike 3  │
   ├───────────┤           ├───────────┤           ├───────────┤
   │ -100 ELO  │           │ Rating    │           │ Browser   │
   │ Deduction │           │ Liquidated│           │ Flagged   │
   │           │           │ to 0 ELO  │           │ BANNED    │
   └───────────┘           └───────────┘           └───────────┘
```

1. **Strike 1**: Immediate **-100 ELO** rating deduction.
2. **Strike 2**: Account rating **liquidated to 0 ELO**.
3. **Strike 3**: The browser client context is flagged as `PERMANENTLY_BANNED`, locking arena access.

</details>

---

## ⚙️ Platform Ecosystem & The 15 Core Architectural Facilities

PrimeFactor.app integrates 15 tightly-coupled facilities providing real-time feedback, persistent achievement tracking, and post-match analytical scoring.

| # | Facility Name | System Description |
| :-: | :--- | :--- |
| **01** | **Deterministic Prime Engine** | Executes Miller-Rabin and Pollard's Rho factorization sub-routines. |
| **02** | **Dynamic ELO Calculator** | Handles real-time rating updates based on velocity, difficulty, and streak multipliers. |
| **03** | **Anti-Cheat Hardware Monitor** | Monitors Page Visibility API events to detect window blur and focus loss. |
| **04** | **Cryptographic HMAC Auditor** | Computes SHA-256 state signatures to protect client-side LocalStorage values. |
| **05** | **Fade-to-Inspire UI Matrix** | Locks unearned range achievements behind a **25% opacity grayscale filter**. |
| **06** | **Post-Match Verification Ledger** | Generates a 4-category report (Score, Accuracy, Lifelines, Time) out of **10.0**. |
| **07** | **Tactical Lifeline Dispatcher** | Manages point deductions and usage limits for in-game assistance assets. |
| **08** | **Adaptive Clock System** | Tracks precise millisecond solve times and manages timeout penalties. |
| **09** | **GenAI Problem Synthesizer** | Interfaces with `@google/genai` to construct custom contextual challenge problems. |
| **10** | **Scratchpad Overlay Engine** | Renders a lightweight, low-latency visual canvas for quick mental calculations. |
| **11** | **Streak & Volatility Vector** | Tracks consecutive correct solves to calculate score boost multipliers. |
| **12** | **Rank Progression Index** | Maps player ELO to competitive tiers (Composite Apprentice to Prime Grandmaster). |
| **13** | **Interactive Sound Engine** | Audio feedback triggers mapped to user actions and game state events. |
| **14** | **Offline CLI Utility Tool** | Utility layer powered by `tsx` and `esbuild` for administrative operations. |
| **15** | **Local Storage Persistence** | Synchronizes app states, user preferences, and cryptographic hashes locally. |

### Fade-to-Inspire UI Protocol
Unearned operational achievements, high-tier integer ranges, and advanced mastery badges are visually dampened using a **25% opacity grayscale filter**. Upon meeting the required mathematical benchmarks or ELO thresholds, the CSS filter transition smoothly restores full color saturation.

### Post-Match Verification Ledger
At the conclusion of each match, the platform compiles a verification ledger evaluating performance across four primary categories:
* **Score Efficiency**
* **Net Accuracy Rate**
* **Lifeline Economy**
* **Solve Time Consumption**

Each category is rated on a **10.0 fractional scale**, providing competitors with clear data points to optimize their speed strategy.

---

## 🛠️ Development & Environment Deployment

Follow these commands to clone, configure, run, and build the PrimeFactor.app repository locally.

### 1. Repository Setup & Installation
Clone the repository and install dependencies:

```bash
# Clone the official repository
git clone https://github.com/olympiad-edge/primefactor-app.git

# Navigate to project directory
cd primefactor-app

# Install all TypeScript, React, Vite, and Node dependencies
npm install
```

### 2. Launching Local Development Server
Start the local Vite development server with Hot Module Replacement (HMR):

```bash
# Start Vite development context
npm run dev
```

By default, the application runs at `http://localhost:5173`.

### 3. Environment Configuration
Create a `.env` file in the root directory for API integrations:

```env
VITE_GENAI_API_KEY=your_google_genai_api_key_here
VITE_HMAC_SECRET_KEY=your_client_side_hmac_secret
```

### 4. Production Build & Internal Verification
To bundle assets for production using Vite and `esbuild`, and run internal verification tools via `tsx`:

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Execute offline verification CLI via tsx
npx tsx scripts/verify-engine.ts
```

---

<p align="center">
  <sub>© Olympiad Edge. Authorized by Rayaan Tasnim. All rights reserved.</sub>
</p>
