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

// Composite Rule: Generator must NEVER pick a prime number as a question!
export function rollCompositeNumber(min, max) {
  min = Math.max(4, Math.floor(min));
  max = Math.max(min + 1, Math.floor(max));

  let attempts = 0;
  while (attempts < 2000) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isPrime(candidate)) {
      return candidate;
    }
    attempts++;
  }

  // Fallback: search iteratively for first composite if range is very narrow
  for (let c = min; c <= max; c++) {
    if (!isPrime(c)) return c;
  }
  return min % 2 === 0 ? min : min + 1;
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

  let cleaned = inputStr.trim();
  if (cleaned.length === 0) {
    return {
      isValid: false,
      userFactors: [],
      error: 'Input cannot be blank.',
      reason: 'Input cannot be blank.'
    };
  }

  // 1. Normalize exponent notations: convert '**' to '^' and strip whitespace around exponent operators:
  // e.g. '2 ^ 3' -> '2^3', '2 ** 3' -> '2^3'
  cleaned = cleaned.replace(/\s*(\*\*|\^)\s*/g, '^');

  // 2. Normalize multiplication variations, punctuation, and separators:
  // '×', 'X', 'x', '·', ',', ';'
  cleaned = cleaned.replace(/[×Xx·;,]/g, '*');

  // 3. Normalize whitespace around existing multiplication operators:
  // '2 * 3' -> '2*3'
  cleaned = cleaned.replace(/\s*\*\s*/g, '*');

  // 4. Input Engine Expansion - Space Separation Multiplier:
  // Automatically convert individual numerical values separated by blank spaces
  // (e.g. '2 2 3' or '2  2  3' with multiple space indices) into multiplication factors '*'
  cleaned = cleaned.replace(/\s+/g, '*');

  // 5. Clean leading/trailing or duplicate multiplication operators:
  cleaned = cleaned.replace(/^\*+|\*+$/g, '').replace(/\*+/g, '*');

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
 * Generates insightful number theory hints without revealing the full answer.
 */
export function generateConceptualHint(targetNumber) {
  const factors = factorize(targetNumber);
  const smallestPrime = factors[0];
  const distinctPrimes = [...new Set(factors)];

  // Strategy 1: Even number
  if (targetNumber % 2 === 0) {
    let powerOfTwo = 0;
    let temp = targetNumber;
    while (temp % 2 === 0) {
      powerOfTwo++;
      temp /= 2;
    }
    if (powerOfTwo > 1) {
      return `Target is a multiple of ${Math.pow(2, powerOfTwo)} (2^${powerOfTwo}). Extract powers of 2 first.`;
    }
    return `Target is an even integer (ends in ${targetNumber % 10}), meaning 2 is its smallest prime factor.`;
  }

  // Strategy 2: Ends in 5
  if (targetNumber % 5 === 0) {
    return `Target ends in ${targetNumber % 10}, revealing that 5 is a prime divisor. Divide by 5 to isolate the remaining factors.`;
  }

  // Strategy 3: Sum of digits rule (divisible by 3 or 9)
  const digitSum = String(targetNumber).split('').reduce((acc, d) => acc + Number(d), 0);
  if (digitSum % 9 === 0) {
    return `The sum of digits is ${digitSum} (divisible by 9), meaning target contains at least 3² = 9.`;
  }
  if (digitSum % 3 === 0) {
    return `The sum of digits is ${digitSum} (divisible by 3), guaranteeing 3 as a prime divisor.`;
  }

  // Strategy 4: Difference of squares check: n ~ a^2 - b^2
  const root = Math.ceil(Math.sqrt(targetNumber));
  for (let a = root; a <= root + 15; a++) {
    const b2 = a * a - targetNumber;
    const b = Math.round(Math.sqrt(b2));
    if (b * b === b2 && b > 0) {
      return `Algebraic clue: Target equals ${a}² - ${b}² = (${a}-${b})(${a}+${b}). Investigate ${a - b} and ${a + b}.`;
    }
  }

  // Strategy 5: Smallest prime divisor
  return `Olympiad clue: The smallest prime factor dividing this number is ${smallestPrime}. Target decomposes into ${factors.length} total prime factors.`;
}
