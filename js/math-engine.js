/**
 * PrimeFactor.app — Mathematical Engine
 * Browser-Native Implementation of Pollard's Rho Algorithm, Miller-Rabin Primality,
 * Composite Number Generator, and Flexible Expression String Parser.
 */

// Greatest Common Divisor using Euclidean Algorithm
export function gcd(a, b) {
  a = BigInt(a);
  b = BigInt(b);
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return Number(a < 0n ? -a : a);
}

// Modular exponentiation: (base^exp) % mod
export function modPow(base, exp, mod) {
  base = BigInt(base);
  exp = BigInt(exp);
  mod = BigInt(mod);
  let res = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp /= 2n;
  }
  return Number(res);
}

// Deterministic Miller-Rabin primality test for n <= 3.3e14
export function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  if (n < 25) return true;

  // Small prime pre-check
  const smallPrimes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  for (const p of smallPrimes) {
    if (n === p) return true;
    if (n % p === 0) return false;
  }

  // Miller-Rabin test with deterministic bases
  let d = BigInt(n - 1);
  let s = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }

  const bases = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
  for (const a of bases) {
    if (n <= a) break;
    let x = BigInt(modPow(a, d, n));
    if (x === 1n || x === BigInt(n - 1)) continue;

    let composite = true;
    for (let r = 1; r < s; r++) {
      x = (x * x) % BigInt(n);
      if (x === BigInt(n - 1)) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

// Pollard's Rho Algorithm with Brent's Cycle Optimization
export function pollardRho(n) {
  if (n % 2 === 0) return 2;
  if (n % 3 === 0) return 3;

  const N = BigInt(n);
  let c = 1n;
  
  while (true) {
    let x = 2n;
    let y = 2n;
    let d = 1n;
    let power = 1n;
    let lam = 1n;

    while (d === 1n) {
      if (power === lam) {
        x = y;
        power *= 2n;
        lam = 0n;
      }
      y = (y * y + c) % N;
      lam++;

      const diff = x > y ? x - y : y - x;
      d = BigInt(gcd(Number(diff), n));

      if (d === N) {
        // Retry with a different polynomial constant c
        c += 2n;
        break;
      }
    }

    if (d > 1n && d < N) {
      return Number(d);
    }
  }
}

// Complete factorization of n into sorted array of prime factors
export function factorize(n) {
  n = Math.floor(Math.abs(Number(n)));
  if (n <= 1) return [];
  
  const factors = [];
  
  // Extract all 2s
  while (n % 2 === 0) {
    factors.push(2);
    n /= 2;
  }
  // Extract all 3s
  while (n % 3 === 0) {
    factors.push(3);
    n /= 3;
  }

  // Trial division up to 97 for speed
  const smallPrimes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  for (const p of smallPrimes) {
    if (n <= 1) break;
    while (n % p === 0) {
      factors.push(p);
      n /= p;
    }
  }

  // Recursive Pollard's Rho decomposition for remaining composite parts
  function decompose(target) {
    if (target <= 1) return;
    if (isPrime(target)) {
      factors.push(target);
      return;
    }
    const divisor = pollardRho(target);
    decompose(divisor);
    decompose(target / divisor);
  }

  if (n > 1) {
    decompose(n);
  }

  factors.sort((a, b) => a - b);
  return factors;
}

// Convert factor list into compact exponential form: [{prime: 2, exp: 3}, {prime: 5, exp: 1}]
export function toExponentialForm(factors) {
  const counts = new Map();
  for (const f of factors) {
    counts.set(f, (counts.get(f) || 0) + 1);
  }
  const result = [];
  for (const [prime, exp] of counts.entries()) {
    result.push({ prime, exp });
  }
  result.sort((a, b) => a.prime - b.prime);
  return result;
}

// Format exponential array into math string: "2³ × 3² × 5" or "2^3 * 3^2 * 5"
export function formatExponentialString(expArr, useSuperscript = true) {
  const supMap = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  
  return expArr.map(item => {
    if (item.exp === 1) return `${item.prime}`;
    if (!useSuperscript) return `${item.prime}^${item.exp}`;
    const sup = String(item.exp).split('').map(d => supMap[d] || d).join('');
    return `${item.prime}${sup}`;
  }).join(' × ');
}

/**
 * Deceptive Symmetry Pass
 * Identifies visually neat or palindromic numbers that carry dense, large hidden prime factor
 * components with no single-digit divisors (such as 10,001 which evaluates exclusively to 73 × 137).
 * These must be actively retained in the question pool.
 *
 * @param {number} n Candidate integer
 * @returns {boolean} True if deceptive symmetric candidate
 */
export function isDeceptiveSymmetricCandidate(n) {
  const s = String(n);
  // Must be at least 3 digits and palindromic
  const isPalindromic = s.length >= 3 && s === s.split('').reverse().join('');
  if (!isPalindromic) return false;

  // Must have no single-digit divisors (2, 3, 5, 7)
  if (n % 2 === 0 || n % 3 === 0 || n % 5 === 0 || n % 7 === 0) {
    return false;
  }

  return true;
}

/**
 * High-Bound Honey Spot Suppression Gate
 * Runs within < 1ms inside client native memory threads.
 *
 * @param {number} candidate Candidate composite number
 * @param {number} maxBound Maximum bound parameter for active division
 * @returns {boolean} True if candidate is suppressed (rejected)
 */
export function isHoneySpotSuppressed(candidate, maxBound) {
  // Tier-Based Gating Activation: Dormant for lower divisions (Bounds <= 1000, Tiers 1-3)
  if (maxBound <= 1000) {
    return false;
  }

  // Deceptive Symmetry Pass: Visually neat or palindromic numbers with no single-digit divisors
  // must be actively retained in the question pool
  if (isDeceptiveSymmetricCandidate(candidate)) {
    return false;
  }

  // 1. The Consecutive Trailing Zero Trap:
  // Reject any number containing more than exactly one trailing zero digit
  // (e.g., 10,000, 20,000, and 35,000 are blocked; while 24,150 or 15,260 are permitted)
  let temp = candidate;
  let trailingZeros = 0;
  while (temp > 0 && temp % 10 === 0) {
    trailingZeros++;
    temp = Math.floor(temp / 10);
  }
  if (trailingZeros > 1) {
    return true; // Suppressed: Point-farming trailing zero honey spot
  }

  // 2. The Small-Base Perfect Power Trap:
  // Compute if candidate is a perfect power of any base integer less than 10 (b in [2, 9])
  // (e.g., 2^14 = 16,384 must be stripped as it collapses to a single repeating reflex input sequence)
  for (let b = 2; b < 10; b++) {
    let powerVal = b * b;
    while (powerVal <= candidate) {
      if (powerVal === candidate) {
        return true; // Suppressed: Small-base repeating reflex power
      }
      powerVal *= b;
    }
  }

  return false;
}

// Composite Rule: Generator must NEVER pick a prime number as a question!
// High-Bound Honey Spot Suppression Gate: Active for elite divisions (Bounds >= 2,000, Tiers 5-8)
export function rollCompositeNumber(min, max) {
  min = Math.max(4, Math.floor(min));
  max = Math.max(min + 1, Math.floor(max));

  const isHighBoundGated = max >= 2000;
  let attempts = 0;
  while (attempts < 3000) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isPrime(candidate)) {
      // High-Bound Honey Spot Suppression Gate
      if (isHighBoundGated && isHoneySpotSuppressed(candidate, max)) {
        attempts++;
        continue;
      }
      return candidate;
    }
    attempts++;
  }

  // Fallback: search iteratively for first composite if range is very narrow
  for (let c = min; c <= max; c++) {
    if (!isPrime(c)) {
      if (!isHighBoundGated || !isHoneySpotSuppressed(c, max)) {
        return c;
      }
    }
  }
  return min % 2 === 0 ? min : min + 1;
}

/**
 * Failsafe Input Sanitizer
 * Automatically strips syntax mistakes, duplicate spaces, or accidental trailing multiplier symbols
 * (e.g. '2*2*3*' -> '2*2*3', '2 *  3' -> '2*3', '2 * 2 * 3 *' -> '2*2*3', '2, 3,' -> '2*3')
 */
export function sanitizeFactorInput(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return '';
  let s = inputStr.trim();
  if (s.length === 0) return '';

  // 1. Convert common multiplier alternatives, commas, semicolons to '*'
  s = s.replace(/[×Xx·;,]/g, '*');

  // 2. Normalize exponent notations ('**' or '^') and strip inner whitespace
  s = s.replace(/\s*(\*\*|\^)\s*/g, '^');

  // 3. Normalize spaces around '*'
  s = s.replace(/\s*\*\s*/g, '*');

  // 4. Transform leftover whitespace between numbers into '*'
  s = s.replace(/\s+/g, '*');

  // 5. Deduplicate multiple consecutive '*'
  s = s.replace(/\*+/g, '*');

  // 6. Strip accidental leading and trailing multipliers or exponents
  s = s.replace(/^[\s*^]+|[\s*^]+$/g, '');

  return s;
}

/**
 * Flexible String Parsing Engine
 * Instantly normalizes, parses, and evaluates user inputs formatted as:
 * 2*2*3, 2,2,3, 2^2*3, 2**2*3, 2 × 2 × 3, 2 2 3, 2.2.3, etc.
 */
export function parseAndValidateFactorInput(inputStr, targetNumber) {
  if (!inputStr || typeof inputStr !== 'string') {
    return {
      isValid: false,
      userFactors: [],
      error: 'Please enter a valid factorization expression.'
    };
  }

  const cleaned = sanitizeFactorInput(inputStr);
  if (cleaned.length === 0) {
    return {
      isValid: false,
      userFactors: [],
      error: 'Input cannot be blank.',
      reason: 'Input cannot be blank.'
    };
  }

  // Split by multiplication operator '*'
  const tokens = cleaned.split('*').map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return {
      isValid: false,
      userFactors: [],
      error: 'Could not parse mathematical factors.',
      reason: 'Could not parse mathematical factors.'
    };
  }

  const userExpandedFactors = [];

  for (const token of tokens) {
    // Check for power notation: base^exp or base**exp
    let baseStr = token;
    let expStr = '1';

    if (token.includes('**')) {
      const parts = token.split('**');
      baseStr = parts[0].trim();
      expStr = parts[1].trim();
    } else if (token.includes('^')) {
      const parts = token.split('^');
      baseStr = parts[0].trim();
      expStr = parts[1].trim();
    }

    const base = Number(baseStr);
    const exp = Number(expStr);

    if (isNaN(base) || !Number.isInteger(base) || base <= 1) {
      const msg = `Invalid factor '${baseStr}'. Prime factors must be integers >= 2.`;
      return {
        isValid: false,
        userFactors: [],
        error: msg,
        reason: msg
      };
    }

    if (isNaN(exp) || !Number.isInteger(exp) || exp < 1 || exp > 50) {
      const msg = `Invalid exponent in '${token}'. Must be a positive integer.`;
      return {
        isValid: false,
        userFactors: [],
        error: msg,
        reason: msg
      };
    }

    // STRICT CHECK: The factor MUST be prime!
    if (!isPrime(base)) {
      const msg = `Number ${base} is composite, not prime! You must factor it completely into prime components.`;
      return {
        isValid: false,
        userFactors: [],
        error: msg,
        reason: msg
      };
    }

    for (let i = 0; i < exp; i++) {
      userExpandedFactors.push(base);
    }
  }

  userExpandedFactors.sort((a, b) => a - b);

  // Compute product of user factors
  let product = 1n;
  for (const f of userExpandedFactors) {
    product *= BigInt(f);
  }

  const targetBig = BigInt(targetNumber);
  if (product !== targetBig) {
    const msg = `Product equals ${product.toString()}, but target is ${targetNumber}.`;
    return {
      isValid: false,
      userFactors: userExpandedFactors,
      error: msg,
      reason: msg
    };
  }

  // Compare factors with true prime decomposition
  const trueFactors = factorize(targetNumber);
  if (userExpandedFactors.length !== trueFactors.length) {
    const msg = 'Decomposition does not match true prime factors.';
    return {
      isValid: false,
      userFactors: userExpandedFactors,
      error: msg,
      reason: msg
    };
  }

  for (let i = 0; i < trueFactors.length; i++) {
    if (userExpandedFactors[i] !== trueFactors[i]) {
      const msg = 'Decomposition does not match true prime factors.';
      return {
        isValid: false,
        userFactors: userExpandedFactors,
        error: msg,
        reason: msg
      };
    }
  }

  return {
    isValid: true,
    userFactors: userExpandedFactors,
    error: null
  };
}

/**
 * Conceptual Mathematical Hint Generator
 * Generates hyper-theoretical, cryptic number theory statements scaled dynamically by competitor ELO.
 * Strictly adheres to 15-20 words max, 1-2 punchy sentences, and firewall lockouts.
 *
 * @param {number} targetNumber Target composite number
 * @param {number|null} userElo Competitor ELO rating
 * @param {boolean|null} isRated Match participation mode (rated vs unrated practice)
 * @returns {string} Mathematical hint or firewall rejection string
 */
export function generateConceptualHint(targetNumber, userElo = null, isRated = null) {
  const factors = factorize(targetNumber);
  const smallestPrime = factors[0];
  const eloSource = (userElo !== null && userElo !== undefined)
    ? Number(userElo)
    : Number(localStorage.getItem('primefactor_elo') || 500);
  const currentElo = isNaN(eloSource) ? 500 : eloSource;

  // Resolve rated mode (explicit boolean argument, or inspect session state, default true)
  let rated = true;
  if (typeof isRated === 'boolean') {
    rated = isRated;
  } else {
    try {
      const stored = sessionStorage.getItem('primefactor_active_exam_params');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.participationMode === 'practice' || parsed.participationMode === 'unrated' || parsed.isForcedUnrated) {
          rated = false;
        }
      }
    } catch (_) {
      rated = true;
    }
  }

  // 7. ELO ≥ 3000 (Prime Singularity - Hard Absolute Suppression):
  // Hard-lock regardless of mode returning critical fault string
  if (currentElo >= 3000) {
    return '❌ CRITICAL FAULT: Full-bandwidth unassisted integer decomposition required. Cognitive singularity has suppressed all heuristics.';
  }

  // RATED CONTEST GATEKEEPER (ELO ≥ 1400):
  // If the match is a "Rated Contest" and competitor ELO is ≥ 1400, strictly locked out.
  // Advanced competitors can ONLY view advanced hints in "Unrated Practice" mode (Safe-Zone Exception).
  if (rated && currentElo >= 1400) {
    return '❌ FIREWALL DEACTIVATED (ELO PROHIBITED)';
  }

  // 6. 2400 ≤ ELO < 3000 (Canonical Analyst Domain - Unrated Practice Only)
  if (currentElo >= 2400) {
    if (targetNumber % 2 !== 0 && targetNumber % 3 !== 0) {
      return "Apply Hensel's p-adic Lemma to lift local roots into high-order structures Z_p. Isolate the ramified ideal.";
    }
    return "Ramified prime ideal valuations govern local decomposition. Lift singular modular roots via Hensel's p-adic lemma in Z_p.";
  }

  // 5. 1800 ≤ ELO < 2400 (Eulerian Sentinel Bracket - Unrated Practice Only)
  if (currentElo >= 1800) {
    if (factors.length === 2 && targetNumber % 2 !== 0) {
      return "Universal Carmichael exponent λ(N) obeys the Selberg Trace Formula. Map factors via quadratic residue invariants.";
    }
    return "Dedekind Zeta functional poles dictate modular forms. Compute Carmichael exponent λ(N) via high-order Selberg trace invariants.";
  }

  // 4. 1400 ≤ ELO < 1800 (Logarithmic Vector Arena - Unrated Practice Only)
  if (currentElo >= 1400) {
    if (factors.length === 2) {
      return "Fermat Clue Blocker engaged. Totient identity satisfies φ(N) = (p-1)(q-1). Derive roots from the local quadratic ring.";
    }
    return "Standard Fermat difference blocked. Totient mapping φ(N) governs divisors; compute quadratic roots in the modular coordinate ring.";
  }

  // 3. 1200 ≤ ELO < 1400 (Modular Operator Fields)
  if (currentElo >= 1200) {
    if (targetNumber % 2 !== 0) {
      return "Integer maps onto a non-trivial algebraic norm. Apply continued fraction convergents p_k/q_k to split the composite.";
    }
    return "Algebraic norm satisfies Pell equation convergents. Resolve continued fraction quotients p_k/q_k to split composite factors.";
  }

  // 2. 900 ≤ ELO < 1200 (Radix Scholar Heuristics)
  if (currentElo >= 900) {
    if (targetNumber % 2 !== 0) {
      return "Modulo verification confirms the Legendre Symbol shifts for explicit prime bases. Audit the Jacobi residue.";
    }
    return "Even parity shifts quadratic character bounds. Evaluate Legendre symbol transitions across fundamental prime density limits.";
  }

  // 1. 700 ≤ ELO < 900 (Sieve Calibrator Floor)
  if (currentElo >= 700) {
    if (targetNumber % 2 !== 0) {
      return "The composite exhibits a primitive Dirichlet density mapping. Evaluate the lowest non-trivial residue class.";
    }
    return "Residue spectrum n ≡ 0 (mod 2) bounds arithmetic progressions. Audit the primary Dirichlet density bound.";
  }

  // Fallback for ELO < 700 (Classical basic checks - short, punchy)
  if (targetNumber % 2 === 0) {
    return "Target is an even integer. Extract prime factor 2 first.";
  }
  if (targetNumber % 5 === 0) {
    return "Terminal digit is 5. Target is divisible by prime factor 5.";
  }
  const digitSum = String(targetNumber).split('').reduce((acc, d) => acc + Number(d), 0);
  if (digitSum % 3 === 0) {
    return "Sum of digits is divisible by 3. Extract factor 3.";
  }
  return `Target has ${factors.length} prime factors. Lowest prime divisor is ${smallestPrime}.`;
}


