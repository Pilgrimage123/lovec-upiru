export function hashSeed(seedInput) {
  const str = String(seedInput ?? 'VENCA-1899');
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function createRng(seedInput = 'VENCA-1899') {
  const seedFn = hashSeed(seedInput);
  let state = seedFn() || 1;

  function nextFloat() {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min, maxInclusive) {
    return Math.floor(nextFloat() * (maxInclusive - min + 1)) + min;
  }

  function pick(array) {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(nextFloat() * array.length)];
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(nextFloat() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getState() {
    return state >>> 0;
  }

  function setState(newState) {
    state = (newState >>> 0) || 1;
  }

  return {
    seed: String(seedInput),
    nextFloat,
    nextInt,
    pick,
    shuffle,
    getState,
    setState
  };
}
