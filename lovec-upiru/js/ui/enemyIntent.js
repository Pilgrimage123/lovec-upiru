import { ENEMY_TILES } from '../config/enemies.js';

export function getEnemyActionIconSvg(type) {
  switch (type) {
    case 'krok':
      // Footstep with motion arrow
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-krok" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="9" cy="14" rx="4" ry="7" transform="rotate(-15 9 14)" fill="#fef08a" fill-opacity="0.5"/>
          <path d="M14 8l5-5m0 0h-4m4 0v4"/>
        </svg>
      `;
    case 'úder':
      // Crossed blades / slashing cleaver
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-uder" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 17.5L3 6l3-3 11.5 11.5z" fill="#fca5a5" fill-opacity="0.4"/>
          <line x1="13" y1="19" x2="19" y2="13"/>
          <line x1="16" y1="16" x2="21" y2="21"/>
        </svg>
      `;
    case 'střela':
      // Target crosshair with arrow
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-strela" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8" fill="#fed7aa" fill-opacity="0.4"/>
          <circle cx="12" cy="12" r="3" fill="#ea580c"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
        </svg>
      `;
    case 'nápřah':
      // Flexed muscle / lightning surge
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-naprah" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#fbbf24" fill-opacity="0.5"/>
        </svg>
      `;
    case 'štít':
      // Heavy heraldic defense shield
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-stit" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#bfdbfe" fill-opacity="0.6"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
      `;
    case 'léčení':
      // Healing medical blood cross
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-leceni" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" fill="#bbf7d0" fill-opacity="0.5"/>
          <line x1="12" y1="7" x2="12" y2="17" stroke="#16a34a" stroke-width="3"/>
          <line x1="7" y1="12" x2="17" y2="12" stroke="#16a34a" stroke-width="3"/>
        </svg>
      `;
    case 'přivolání':
      // Vampire bat wings
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-privolani" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 11s4-4 10-1c6-3 10 1 10 1s-2 5-6 6c-2 0-3-2-4-2s-2 2-4 2c-4-1-6-6-6-6z" fill="#ddd6fe" fill-opacity="0.6"/>
        </svg>
      `;
    case 'otočení':
      // Sharp turning circular arrow
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg icon-otoceni" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 2v6h-6"/>
          <path d="M21.5 8A10 10 0 1 0 22 13"/>
        </svg>
      `;
    default:
      return `
        <svg viewBox="0 0 24 24" class="enemy-intent-svg" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      `;
  }
}

function getActionTileBadge(tileDef) {
  if (tileDef.type === 'krok') {
    return tileDef.retreatIfClose ? 'Ústup ⬅' : 'Krok ➔';
  }
  if (tileDef.type === 'otočení') {
    return 'Otočení 🔄';
  }
  if (tileDef.type === 'nápřah') {
    return 'Nápřah (+1)';
  }
  if (tileDef.type === 'štít') {
    return '+1 Štít';
  }
  if (tileDef.type === 'léčení') {
    return `Léčení +${tileDef.healAmount || 2}`;
  }
  if (tileDef.type === 'přivolání') {
    return 'Přivolání 🦇';
  }

  // Melee or Ranged attacks with damage
  const firstPat = tileDef.pattern?.[0];
  const dmg = firstPat?.dmg ?? 1;
  const isPush = firstPat?.effects?.some((e) => e.type === 'push');
  const isBleed = firstPat?.effects?.some((e) => e.type === 'bleed');

  let suffix = `${dmg} DMG`;
  if (isPush) suffix += ' (Push)';
  if (isBleed) suffix += ' (Krvácení)';

  if (tileDef.type === 'střela') {
    return `Střela ${suffix}`;
  }
  return `Úder ${suffix}`;
}

export function renderEnemyIntentStripHtml(enemy, initiativeRank) {
  if (!enemy || enemy.hp <= 0) return '';

  const isArmedRed = enemy.queueState === 'ARMED_RED';
  const actionQueue = enemy.actionQueue || [];
  const nextAction = enemy.nextAction;

  // Render movement or turn intent banner if enemy is positioning
  let positioningBadgeHtml = '';
  if (!isArmedRed && nextAction) {
    if (nextAction.type === 'step') {
      const isRight = nextAction.dir === 1;
      positioningBadgeHtml = `
        <div class="intent-positioning-banner intent-step-indicator" title="Příští tah: Popojde o 1 pole ${isRight ? 'vpravo ➔' : 'vlevo ◀'}">
          <span class="intent-action-arrow">${isRight ? '➔' : '◀'}</span>
          <span class="intent-action-text">${nextAction.reason === 'retreat' ? 'Ústup' : 'Krok'}</span>
        </div>
      `;
    } else if (nextAction.type === 'turn') {
      const isRight = nextAction.dir === 1;
      positioningBadgeHtml = `
        <div class="intent-positioning-banner intent-turn-indicator" title="Příští tah: Otočí se čelem ${isRight ? 'vpravo ▶' : 'vlevo ◀'}">
          <span class="intent-action-arrow">🔄</span>
          <span class="intent-action-text">Otočení</span>
        </div>
      `;
    }
  }

  // 3 Slots for the Intent Bar (left to right: Slot 1, Slot 2, Slot 3)
  const maxSlots = 3;
  const slotsHtml = [];

  for (let slotIdx = 0; slotIdx < maxSlots; slotIdx++) {
    const tileId = actionQueue[slotIdx];

    if (tileId) {
      const tileDef = ENEMY_TILES[tileId] || { name: tileId, type: 'úder' };
      const iconSvg = getEnemyActionIconSvg(tileDef.type);
      const badgeText = getActionTileBadge(tileDef);

      if (isArmedRed) {
        slotsHtml.push(`
          <div class="intent-slot intent-slot-armed-red animate-pulse-red"
               title="[ARMED #PŘIPRAVENO] Slot #${slotIdx + 1}: ${tileDef.name} (${badgeText}) - V příštím tahu vystřelí!">
            <div class="intent-slot-icon-box">${iconSvg}</div>
            <span class="intent-slot-name">${badgeText}</span>
          </div>
        `);
      } else {
        slotsHtml.push(`
          <div class="intent-slot intent-slot-queuing-gray"
               title="[QUEUING #ŠEDÁ] Slot #${slotIdx + 1}: ${tileDef.name} (${badgeText}) - Nepřítel ještě nabíjí kombo (nevystřelí)">
            <div class="intent-slot-icon-box">${iconSvg}</div>
            <span class="intent-slot-name">${badgeText}</span>
          </div>
        `);
      }
    } else if (!isArmedRed && nextAction?.type === 'queue_tile' && slotIdx === actionQueue.length) {
      // Ghost / planned tile being added next turn
      const incomingDef = ENEMY_TILES[nextAction.tileId] || { name: nextAction.tileId, type: 'úder' };
      const incomingIcon = getEnemyActionIconSvg(incomingDef.type);
      const incomingBadge = getActionTileBadge(incomingDef);
      slotsHtml.push(`
        <div class="intent-slot intent-slot-planning"
             title="Chystá se přidat do komba: ${incomingDef.name} (${incomingBadge})">
          <div class="intent-slot-icon-box">${incomingIcon}</div>
          <span class="intent-slot-name">${incomingBadge}</span>
        </div>
      `);
    } else {
      // Empty slot
      slotsHtml.push(`
        <div class="intent-slot intent-slot-empty" title="Prázdný slot komba #${slotIdx + 1}">
          <span class="intent-slot-empty-dot">·</span>
        </div>
      `);
    }
  }

  return `
    <div class="enemy-intent-column ${isArmedRed ? 'intent-col-armed-red' : 'intent-col-queuing'}"
         aria-label="Záměr nepřítele ${enemy.name}">
      <div class="enemy-intent-header">
        <span class="enemy-initiative-tag" title="Iniciativa pořadí tahu zleva doprava: #${initiativeRank}">
          #${initiativeRank}
        </span>
        ${
          isArmedRed
            ? `<span class="intent-armed-tag" title="ZÁMEK SMĚRU I AKCE: V příštím tahu odpálí frontu!">🚨 ARMED</span>`
            : `<span class="intent-queuing-tag">⚪ NABÍJÍ</span>`
        }
      </div>

      ${positioningBadgeHtml}

      <div class="intent-bar-horizontal">
        ${slotsHtml.join('')}
      </div>
    </div>
  `;
}

export function buildEnemyTooltipHtml(enemy, initiativeRank) {
  const isArmedRed = enemy.queueState === 'ARMED_RED';
  const actionQueue = enemy.actionQueue || [];
  const actionPool = enemy.actionPool || [];

  // Pool list html
  const poolHtml = actionPool
    .map((item) => {
      const def = ENEMY_TILES[item.tileId] || { name: item.tileId, type: 'úder', description: '' };
      const isReady = item.currentCooldown === 0;
      const isQueued = actionQueue.includes(item.tileId);

      // Damage / effect summary
      const pat = def.pattern?.[0];
      const dmg = pat?.dmg ?? (def.type === 'léčení' ? def.healAmount : 0);
      const effList = [];
      if (def.type === 'střela') effList.push(`Dosah ${def.projectileRange || 3}`);
      if (def.lungeForward) effList.push(`Výpad ${def.lungeForward}`);
      if (def.lifesteal) effList.push(`Vysátí ${def.lifesteal}`);
      for (const eff of pat?.effects || []) {
        if (eff.type === 'push') effList.push(`Push ${eff.distance || 1}`);
        if (eff.type === 'bleed') effList.push(`Krvácení`);
        if (eff.type === 'stun') effList.push(`Omráčení`);
        if (eff.type === 'confusion') effList.push(`Zmatení`);
      }

      const cdTag = isQueued
        ? `<span class="tt-tag tt-tag-queued">Ve frontě</span>`
        : isReady
        ? `<span class="tt-tag tt-tag-ready">Připraveno (0 CD)</span>`
        : `<span class="tt-tag tt-tag-cd">CD: ${item.currentCooldown}/${item.maxCooldown}</span>`;

      return `
        <div class="tt-pool-item">
          <div class="tt-pool-header">
            <strong>${def.name}</strong> (${def.type}) · ${dmg > 0 ? `${dmg} DMG` : 'Podpora'}
            ${cdTag}
          </div>
          ${effList.length > 0 ? `<div class="tt-pool-details">${effList.join(' · ')}</div>` : ''}
          <div class="tt-pool-desc">${def.description}</div>
        </div>
      `;
    })
    .join('');

  // Queue status string
  let stateDesc = '';
  if (isArmedRed) {
    stateDesc = `
      <div class="tt-status-box tt-status-armed">
        🚨 <strong>STAV: ARMED_RED (ZAMČENO K ODPALU)</strong><br/>
        Nepřítel se již nemůže otočit ani pohnout. V bezprostředně následujícím tahu provede celou frontu (${actionQueue.length} ${actionQueue.length === 1 ? 'destičku' : 'destičky'}) zleva doprava!
      </div>
    `;
  } else if (actionQueue.length > 0) {
    stateDesc = `
      <div class="tt-status-box tt-status-queuing">
        ⚪ <strong>STAV: QUEUING_GRAY (NABÍJÍ KOMBO)</strong><br/>
        Ve frontě má ${actionQueue.length}/${enemy.comboCapacity || 2} destiček. V nadcházejícím tahu ještě NEVYSTŘELÍ.
      </div>
    `;
  } else {
    stateDesc = `
      <div class="tt-status-box tt-status-empty">
        ⚪ <strong>STAV: EMPTY (POZICOVÁNÍ)</strong><br/>
        Fronta je prázdná. Chystá se na manévr nebo vložení první destičky.
      </div>
    `;
  }

  let nextActionDesc = '';
  if (enemy.nextAction) {
    if (enemy.nextAction.type === 'turn') {
      nextActionDesc = `Příští tah: Otočení směrem ${enemy.nextAction.dir === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`;
    } else if (enemy.nextAction.type === 'step') {
      nextActionDesc = `Příští tah: Krok o 1 pole ${enemy.nextAction.dir === 1 ? 'doprava ➔' : 'doleva ◀'}.`;
    } else if (enemy.nextAction.type === 'queue_tile') {
      const qTile = ENEMY_TILES[enemy.nextAction.tileId];
      nextActionDesc = `Příští tah: Vloží do fronty „${qTile?.name || enemy.nextAction.tileId}“.`;
    } else if (enemy.nextAction.type === 'execute_queue') {
      nextActionDesc = `Příští tah: GARANTOVANÝ ODPAL CELÉHO KOMBA!`;
    }
  }

  return `
    <div class="tt-title">
      ${enemy.name}
      <span class="tt-sub">(Iniciativa #${initiativeRank})</span>
    </div>
    <div class="tt-stat-row">
      ❤️ Zdraví: <strong>${enemy.hp}/${enemy.maxHp} HP</strong> · Směr: <strong>${enemy.facing === 1 ? 'Vpravo ▶' : 'Vlevo ◀'}</strong> · Archetyp: <strong>${enemy.archetype || 'základní'}</strong>
    </div>

    ${stateDesc}
    ${nextActionDesc ? `<div class="tt-next-intent-line"><strong>Záměr:</strong> ${nextActionDesc}</div>` : ''}

    <hr class="tt-divider" />
    <div class="tt-section-title">🎒 ZÁSOBA AKCÍ (ACTION POOL):</div>
    <div class="tt-pool-list">
      ${poolHtml}
    </div>

    ${enemy.flavor ? `<div class="tt-flavor">${enemy.flavor}</div>` : ''}
  `;
}
