/**
 * PrimeFactor.app — tiny number-theory toolkit shared by the index.html visual layers.
 * Pure functions, no DOM, no dependencies. Everything is exact for integers below 2^53.
 */

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = (n) => String(n).replace(/\d/g, (d) => SUP[d]);

/** Prime factorisation as [[p, e], ...] (n >= 2). */
export function factorize(n) {
  const out = [];
  let m = Math.floor(n);
  if (m < 2) return out;
  for (let p = 2; p * p <= m; p += p === 2 ? 1 : 2) {
    if (m % p) continue;
    let e = 0;
    while (m % p === 0) { m /= p; e++; }
    out.push([p, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

export function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false;
  return true;
}

/** "2³ · 3² · 5" — canonical prime-power form used all over the product. */
export function factorText(n) {
  if (n < 2) return String(n);
  const f = factorize(n);
  if (f.length === 1 && f[0][1] === 1) return `${n} is prime`;
  return f.map(([p, e]) => (e > 1 ? `${p}${sup(e)}` : `${p}`)).join(' · ');
}

/** τ, σ, φ, ω, Ω and friends from one factorisation. */
export function arithmetic(n) {
  if (n < 2) return { n, factors: [], tau: 1, sigma: 1, phi: 1, omega: 0, Omega: 0, prime: false };
  const factors = factorize(n);
  let tau = 1, sigma = 1, phi = n, Omega = 0;
  for (const [p, e] of factors) {
    tau *= e + 1;
    sigma *= (Math.pow(p, e + 1) - 1) / (p - 1);
    phi = (phi / p) * (p - 1);
    Omega += e;
  }
  return { n, factors, tau, sigma, phi, omega: factors.length, Omega, prime: factors.length === 1 && factors[0][1] === 1 };
}

const PERFECT = new Set([6, 28, 496, 8128, 33550336]);

/** Little "did you know" badges for the inspector. */
export function badgesFor(n) {
  const a = arithmetic(n);
  const out = [];
  if (n === 1) return [{ t: 'Unit', k: 'dim' }];
  if (a.prime) {
    out.push({ t: 'Prime', k: 'prime' });
    if (n === 2) out.push({ t: 'Only even prime', k: 'gold' });
    else out.push({ t: n % 4 === 1 ? '≡ 1 (mod 4) · sum of two squares' : '≡ 3 (mod 4)', k: n % 4 === 1 ? 'gold' : 'cyan' });
    if (isPrime(n + 2) || isPrime(n - 2)) out.push({ t: 'Twin prime', k: 'violet' });
    if (isPrime((n - 1) / 2) && n > 3) out.push({ t: 'Safe prime', k: 'violet' });
    const m = Math.log2(n + 1);
    if (Number.isInteger(m)) out.push({ t: `Mersenne 2${sup(m)}−1`, k: 'rose' });
  } else {
    out.push({ t: 'Composite', k: 'dim' });
    if (a.Omega === 2 && a.omega === 2) out.push({ t: 'Semiprime', k: 'cyan' });
    if (a.Omega === 2 && a.omega === 1) out.push({ t: 'Prime square', k: 'cyan' });
    if (Number.isInteger(Math.sqrt(n))) out.push({ t: 'Perfect square', k: 'gold' });
    if (a.omega === a.Omega) out.push({ t: 'Squarefree', k: 'violet' });
  }
  if (PERFECT.has(n)) out.push({ t: 'Perfect number', k: 'rose' });
  return out;
}

// ---- prime counting π(n) via a lazily grown sieve ------------------------------------------
let sieve = null;
let sieveMax = 0;
let counts = null;
function ensureSieve(limit) {
  if (sieve && sieveMax >= limit) return;
  const max = Math.max(limit, 1024);
  sieve = new Uint8Array(max + 1);
  counts = new Uint32Array(max + 1);
  sieve[0] = sieve[1] = 1;
  for (let i = 2; i * i <= max; i++) if (!sieve[i]) for (let j = i * i; j <= max; j += i) sieve[j] = 1;
  let c = 0;
  for (let i = 0; i <= max; i++) { if (!sieve[i]) c++; counts[i] = c; }
  sieveMax = max;
}
export function primePi(n) {
  const m = Math.min(Math.floor(n), 2_000_000);
  ensureSieve(m);
  return counts[m];
}

// ---- Ulam spiral addressing (1 at the origin, 2 to its right, counter-clockwise, y up) ------
export function ulamN(x, y) {
  const k = Math.max(Math.abs(x), Math.abs(y));
  if (k === 0) return 1;
  const m = (2 * k + 1) ** 2;
  if (y === -k) return m - (k - x);
  if (x === -k) return m - 3 * k - y;
  if (y === k) return m - 5 * k - x;
  return m - 7 * k + y;
}

export function ulamPos(n) {
  if (n <= 1) return [0, 0];
  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  const m = (2 * k + 1) ** 2;
  if (n >= m - 2 * k) return [k - (m - n), -k];
  if (n >= m - 4 * k) return [-k, m - 3 * k - n];
  if (n >= m - 6 * k) return [m - 5 * k - n, k];
  return [k, n - m + 7 * k];
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
