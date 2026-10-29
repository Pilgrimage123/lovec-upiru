const loadedAssets = new Map();
const missingAssets = new Set();
let manifestData = {};

// Hand-crafted Neprakta-style grotesque cartoon SVG generator for missing PNG fallbacks
function generateNepraktaSvgDataUri(key, entry = {}) {
  const label = entry.label || key.split('.').pop();
  const category = key.split('.')[0];

  if (category === 'hero' || category === 'enemy' || category === 'boss') {
    const svg = renderCharacterSvg(key, label);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (category === 'terrain') {
    const svg = renderTerrainSvg(key, label);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const svg = renderIconSvg(key, label);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderCharacterSvg(key, label) {
  const palettes = {
    'hero.idle': { coat: '#3f6212', cape: '#65a30d', skin: '#fde68a', nose: '#e11d48', hat: '#365314', prop: '✝️' },
    'enemy.praktikant': { coat: '#4c1d95', cape: '#7e22ce', skin: '#e2e8f0', nose: '#be123c', hat: '#1e1b4b', prop: '🦷' },
    'enemy.urednik': { coat: '#7f1d1d', cape: '#991b1b', skin: '#cbd5e1', nose: '#dc2626', hat: '#450a0a', prop: '💮' },
    'enemy.drab': { coat: '#78350f', cape: '#b45309', skin: '#fed7aa', nose: '#ea580c', hat: '#451a03', prop: '🔪' },
    'enemy.vratny_stit': { coat: '#1e3a8a', cape: '#1d4ed8', skin: '#cbd5e1', nose: '#e11d48', hat: '#172554', prop: '🛡️' },
    'enemy.netopyr': { coat: '#311042', cape: '#581c87', skin: '#d8b4fe', nose: '#f43f5e', hat: '#1e1b4b', prop: '🦇' },
    'enemy.ucetni_buffer': { coat: '#581c87', cape: '#9333ea', skin: '#f1f5f9', nose: '#e11d48', hat: '#3b0764', prop: '📜' },
    'boss.arcikniaze_sosak': { coat: '#881337', cape: '#be123c', skin: '#e2e8f0', nose: '#f43f5e', hat: '#4c0519', prop: '👑' },
    'boss.hrabenka_dagmar': { coat: '#4c0519', cape: '#9f1239', skin: '#f8fafc', nose: '#e11d48', hat: '#1e1b4b', prop: '🌹' },
    'boss.drakula_generalni_reditel': { coat: '#111827', cape: '#991b1b', skin: '#e2e8f0', nose: '#dc2626', hat: '#030712', prop: '💼' }
  };

  const p = palettes[key] || palettes['enemy.praktikant'];
  const isBat = key === 'enemy.netopyr';

  if (isBat) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="230" rx="52" ry="12" fill="rgba(0,0,0,0.25)"/>
      <path d="M20 110 Q70 50 115 110 Q75 135 20 110 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="6"/>
      <path d="M236 110 Q186 50 141 110 Q181 135 236 110 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="6"/>
      <ellipse cx="128" cy="118" rx="36" ry="32" fill="${p.coat}" stroke="#1a110b" stroke-width="6"/>
      <circle cx="118" cy="110" r="10" fill="#fff" stroke="#1a110b" stroke-width="4"/>
      <circle cx="142" cy="110" r="10" fill="#fff" stroke="#1a110b" stroke-width="4"/>
      <circle cx="121" cy="110" r="4" fill="#1a110b"/>
      <circle cx="145" cy="110" r="4" fill="#1a110b"/>
      <ellipse cx="152" cy="122" rx="14" ry="10" fill="${p.nose}" stroke="#1a110b" stroke-width="4"/>
      <polygon points="122,136 127,150 132,136" fill="#fff" stroke="#1a110b" stroke-width="3"/>
      <polygon points="136,136 141,150 146,136" fill="#fff" stroke="#1a110b" stroke-width="3"/>
      <rect x="28" y="198" width="200" height="28" rx="8" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="217" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <ellipse cx="128" cy="238" rx="68" ry="12" fill="rgba(0,0,0,0.28)"/>
    <!-- Cape / Coat in Neprakta ink style -->
    <path d="M58 225 L75 122 L180 122 L198 225 Z" fill="${p.coat}" stroke="#1a110b" stroke-width="6" stroke-linejoin="round"/>
    <path d="M48 135 Q85 110 128 128 Q170 110 205 140 L188 215 L64 215 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="5" stroke-linejoin="round"/>
    <!-- Grotesque head facing right -->
    <circle cx="128" cy="88" r="40" fill="${p.skin}" stroke="#1a110b" stroke-width="6"/>
    <!-- Bulging eyes -->
    <circle cx="122" cy="78" r="12" fill="#ffffff" stroke="#1a110b" stroke-width="4"/>
    <circle cx="148" cy="78" r="12" fill="#ffffff" stroke="#1a110b" stroke-width="4"/>
    <circle cx="126" cy="78" r="5" fill="#1a110b"/>
    <circle cx="152" cy="78" r="5" fill="#1a110b"/>
    <!-- Big Neprakta bulbous nose pointing right -->
    <ellipse cx="168" cy="92" rx="18" ry="13" fill="${p.nose}" stroke="#1a110b" stroke-width="5"/>
    <!-- Vampire fangs / grin -->
    <path d="M115 110 Q138 122 158 108" fill="none" stroke="#1a110b" stroke-width="5" stroke-linecap="round"/>
    <polygon points="126,112 131,127 136,112" fill="#ffffff" stroke="#1a110b" stroke-width="3"/>
    <polygon points="142,111 147,126 152,110" fill="#ffffff" stroke="#1a110b" stroke-width="3"/>
    <!-- Hat / Collar -->
    <path d="M76 58 L180 58 L162 28 L94 28 Z" fill="${p.hat}" stroke="#1a110b" stroke-width="5" stroke-linejoin="round"/>
    <!-- Shield or weapon badge -->
    <circle cx="188" cy="162" r="24" fill="#f4e7c5" stroke="#1a110b" stroke-width="5"/>
    <text x="188" y="171" font-size="24" text-anchor="middle">${p.prop}</text>
    <!-- Nameplate -->
    <rect x="18" y="210" width="220" height="28" rx="7" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
    <text x="128" y="229" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
  </svg>`;
}

function renderTerrainSvg(key, label) {
  if (key === 'terrain.barrel') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="236" rx="64" ry="12" fill="rgba(0,0,0,0.3)"/>
      <rect x="64" y="72" width="128" height="156" rx="34" fill="#92400e" stroke="#1a110b" stroke-width="6"/>
      <rect x="62" y="102" width="132" height="16" fill="#52525b" stroke="#1a110b" stroke-width="4"/>
      <rect x="62" y="176" width="132" height="16" fill="#52525b" stroke="#1a110b" stroke-width="4"/>
      <path d="M84 72 Q128 50 172 72" fill="#84cc16" stroke="#1a110b" stroke-width="5"/>
      <rect x="34" y="206" width="188" height="26" rx="6" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="224" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128" width="256" height="128">
    <rect x="8" y="8" width="240" height="112" rx="12" fill="#d6c7a1" stroke="#1a110b" stroke-width="5"/>
    <text x="128" y="72" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
  </svg>`;
}

function renderIconSvg(key, label) {
  const emojiMap = {
    'tile.oak_stake': '🪵',
    'tile.garlic_belch': '🧄',
    'tile.holy_syringe': '💦',
    'tile.belly_vault': '🤸',
    'tile.rosary_slap': '📿',
    'tile.funeral_hook': '🪝',
    'tile.manhole_shield': '🛡️',
    'tile.sacristy_bell': '🔔',
    'tile.wood_axe': '🪓',
    'tile.plank_stomp': '🥾',
    'tile.funeral_shroud': '👻',
    'tile.silver_crucifix_beam': '✝️',
    'intent.step': '👣',
    'intent.strike': '⚔️',
    'intent.shoot': '🎯',
    'intent.windup': '💢',
    'intent.shield': '🛡️',
    'intent.heal': '💉',
    'intent.summon': '🦇',
    'intent.turn': '🔄',
    'map.battle': '⚔️',
    'map.elite': '💀',
    'map.pub': '🍺',
    'map.workshop': '⚒️',
    'map.event': '❓',
    'map.treasure': '💎',
    'map.boss': '👑'
  };
  const glyph = emojiMap[key] || '⚜️';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect x="6" y="6" width="116" height="116" rx="18" fill="#f4e7c5" stroke="#2c1d11" stroke-width="6"/>
    <circle cx="64" cy="54" r="32" fill="#e6d2a3" stroke="#2c1d11" stroke-width="3"/>
    <text x="64" y="66" font-size="36" text-anchor="middle">${glyph}</text>
    <text x="64" y="108" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#2c1d11" text-anchor="middle">${label.slice(0, 14)}</text>
  </svg>`;
}

export async function initAssets(onProgress = () => {}) {
  try {
    let resp = await fetch('/assets/manifest.json').catch(() => null);
    if (!resp || !resp.ok) {
      resp = await fetch('assets/manifest.json').catch(() => null);
    }
    if (resp && resp.ok) {
      manifestData = await resp.json();
    }
  } catch {
    manifestData = {};
  }

  const keys = Object.keys(manifestData);
  const preloadKeys = keys.filter((k) => manifestData[k].preload);
  let loadedCount = 0;

  // Register lazy fallback entries first so any synchronous lookup works immediately
  for (const key of keys) {
    const entry = manifestData[key];
    loadedAssets.set(key, {
      key,
      src: generateNepraktaSvgDataUri(key, entry),
      isFallback: true,
      meta: entry
    });
  }

  // Preload primary character & enemy sprites with progress callback
  await Promise.all(
    preloadKeys.map(async (key) => {
      await loadSingleAsset(key);
      loadedCount += 1;
      onProgress(loadedCount, preloadKeys.length, key);
    })
  );

  // Lazy-load the rest in background without blocking start
  setTimeout(async () => {
    const restKeys = keys.filter((k) => !manifestData[k].preload);
    await Promise.all(restKeys.map((k) => loadSingleAsset(k)));
    if (missingAssets.size > 0) {
      console.info(
        `[Lovec Upírů - Asset Pipeline] Chybějící externí PNG soubory nahrazeny Neprakta SVG fallbackem (${missingAssets.size}):\n` +
          Array.from(missingAssets).join(', ')
      );
    }
  }, 50);
}

function loadSingleAsset(key) {
  const entry = manifestData[key];
  if (!entry || !entry.src) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loadedAssets.set(key, {
        key,
        src: entry.src,
        isFallback: false,
        meta: entry
      });
      resolve(true);
    };
    img.onerror = () => {
      missingAssets.add(`${key} (${entry.src})`);
      loadedAssets.set(key, {
        key,
        src: generateNepraktaSvgDataUri(key, entry),
        isFallback: true,
        meta: entry
      });
      resolve(false);
    };
    img.src = entry.src;
  });
}

export function getAssetUrl(key, fallbackLabel = '') {
  if (loadedAssets.has(key)) {
    return loadedAssets.get(key).src;
  }
  const fallbackUri = generateNepraktaSvgDataUri(key, { label: fallbackLabel || key });
  loadedAssets.set(key, { key, src: fallbackUri, isFallback: true });
  return fallbackUri;
}

export function isAssetFallback(key) {
  return loadedAssets.get(key)?.isFallback ?? true;
}
