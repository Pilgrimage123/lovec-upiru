import { BOARD_SIZE, ANIMATION_TIMINGS } from '../config/constants.js';
import { STATUSES } from '../config/statuses.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { STRINGS } from '../config/strings.cs.js';
import { getSortedEnemiesByInitiative } from '../engine/state.js';
import { computeBoardThreats, computePlayerQueuePreview } from '../engine/threat.js';
import { getAssetUrl } from './assets.js';
import { renderEnemyIntentStripHtml, buildEnemyTooltipHtml } from './enemyIntent.js';
import { renderCellThreatAndPreviewHtml } from './threatOverlay.js';
import { showTooltip, hideTooltip } from './tooltips.js';
import { SFX } from './audio.js';

export function sleep(ms, speedMultiplier = 1) {
  if (speedMultiplier === 0) return Promise.resolve();
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveMs = reducedMotion ? Math.min(80, ms) : Math.round(ms / (speedMultiplier || 1));
  return new Promise((resolve) => setTimeout(resolve, effectiveMs));
}

export function renderBattleBoard(container, state, uiState = {}, callbacks = {}) {
  if (!container || !state) return;

  const hoveredEnemyId = uiState.hoveredEnemyId || null;
  const hoveredTileId = uiState.hoveredTileId || null;

  const threats = computeBoardThreats(state, hoveredEnemyId);
  const queuePreview = computePlayerQueuePreview(state, hoveredTileId);
  const sortedEnemies = getSortedEnemiesByInitiative(state);
  const initiativeMap = new Map();
  sortedEnemies.forEach((e, i) => initiativeMap.set(e.id, i + 1));

  // Gate reinforcement indicators on cell 0 and cell 6
  const leftGateReinf = state.reinforcements.find((r) => !r.spawned && r.gateCell === 0);
  const rightGateReinf = state.reinforcements.find((r) => !r.spawned && r.gateCell === BOARD_SIZE - 1);

  // Build Hero Queue Bar (3 or 4 slots above the battlefield)
  const queueSlotsHtml = Array.from({ length: state.maxQueueSlots }, (_, slotIdx) => {
    const instanceId = state.queue[slotIdx];
    const tile = instanceId ? state.hand.find((t) => t.instanceId === instanceId) : null;
    const roleLabel =
      slotIdx === 0 ? '1. Otevírák' : slotIdx >= 2 ? `${slotIdx + 1}. Zakončovák` : `${slotIdx + 1}. Prostřední`;

    if (!tile) {
      return `
        <div class="queue-slot queue-slot-empty" data-slot-index="${slotIdx}">
          <span class="queue-slot-role">${roleLabel}</span>
          <span class="queue-slot-placeholder">Prázdný slot</span>
        </div>
      `;
    }

    const iconUrl = getAssetUrl(tile.icon, tile.name);
    return `
      <div class="queue-slot queue-slot-filled ${state.isQueuePrepared ? 'queue-slot-prepared' : ''}"
           draggable="true"
           data-slot-index="${slotIdx}"
           data-instance-id="${tile.instanceId}"
           title="Destička ve frontě komba. Přetažením myší změníš pořadí. Kliknutím na ✖ vrátíš do zásoby.">
        <div class="queue-slot-header">
          <span class="queue-slot-role">${roleLabel}</span>
          <div class="queue-reorder-arrows">
            ${slotIdx > 0 ? `<button type="button" class="btn-slot-move btn-slot-move-left" data-move-slot="${slotIdx}" data-move-dir="-1" title="Posunout doleva">◀</button>` : ''}
            ${slotIdx < state.queue.length - 1 ? `<button type="button" class="btn-slot-move btn-slot-move-right" data-move-slot="${slotIdx}" data-move-dir="1" title="Posunout doprava">▶</button>` : ''}
          </div>
          <button type="button" class="btn-slot-remove" data-remove-queue-slot="${slotIdx}" title="Vrátit destičku do zásoby (zdarma)">✖</button>
        </div>
        <div class="queue-slot-content">
          <img src="${iconUrl}" alt="${tile.name}" class="queue-slot-icon" referrerpolicy="no-referrer" />
          <span class="queue-slot-name">${tile.name}</span>
          <span class="drag-handle" title="Uchop myší a přetáhni">⠿</span>
        </div>
      </div>
    `;
  }).join('');

  // Build the 7 cells of the 1D arena
  const cellsHtml = Array.from({ length: BOARD_SIZE }, (_, cellIdx) => {
    const terrainObj = state.terrain[cellIdx] || { type: 'none' };
    const terrainDef = TERRAIN_TYPES[terrainObj.type] || TERRAIN_TYPES.none;
    const cellThreat = threats[cellIdx];
    const isThreatened = cellThreat && cellThreat.sources.length > 0;
    const isArmedRed = Boolean(cellThreat && cellThreat.isArmedRed);
    const isInspectReach = Boolean(cellThreat && cellThreat.isInspectReach);
    const isImminent = cellThreat && cellThreat.sources.some((s) => s.countdown <= 1);
    const isNextThreat = cellThreat && cellThreat.nextTileSources.length > 0;
    const isPlayerTargeted =
      queuePreview.targetedCells.some((h) => h.cell === cellIdx) ||
      queuePreview.hoveredCells.some((h) => h.cell === cellIdx);

    const entity =
      (state.hero.hp > 0 && state.hero.cell === cellIdx ? state.hero : null) ||
      state.enemies.find((e) => e.hp > 0 && e.cell === cellIdx) ||
      state.props.find((p) => p.hp > 0 && p.cell === cellIdx) ||
      null;

    const gateHtml = renderGateBannerHtml(cellIdx, leftGateReinf, rightGateReinf);
    const overlayHtml = renderCellThreatAndPreviewHtml(cellIdx, cellThreat, queuePreview, state);
    const entityHtml = entity
      ? renderEntityOnCellHtml(entity, initiativeMap.get(entity.id))
      : '';

    return `
      <div class="board-cell
                  terrain-${terrainObj.type}
                  ${isArmedRed ? 'cell-armed-red-targeted' : ''}
                  ${isInspectReach ? 'cell-inspect-range' : ''}
                  ${isThreatened ? 'cell-threatened' : ''}
                  ${isImminent ? 'cell-threatened-imminent' : ''}
                  ${isNextThreat ? 'cell-threatened-next' : ''}
                  ${isPlayerTargeted ? 'cell-player-targeted' : ''}"
           data-cell-index="${cellIdx}"
           data-terrain-type="${terrainObj.type}">
        <div class="cell-index-label">Pole ${cellIdx + 1}</div>
        ${gateHtml}
        <div class="cell-overlay-zone">
          ${overlayHtml}
        </div>
        <div class="cell-entity-stage" id="cell-stage-${cellIdx}">
          ${entityHtml}
        </div>
        <div class="cell-floor-stone">
          <span class="terrain-badge terrain-badge-${terrainObj.type}">
            ${getTerrainFloorLabel(terrainObj, terrainDef)}
          </span>
        </div>
      </div>
    `;
  }).join('');

  const tutorialHintHtml = state.isTutorial
    ? `<div class="tutorial-banner">
         <span class="tutorial-icon">🎓</span>
         <span>${STRINGS.tutorialHints[(state.turn - 1) % STRINGS.tutorialHints.length]}</span>
       </div>`
    : '';

  container.innerHTML = `
    ${tutorialHintHtml}
    <div class="hero-queue-panel ${state.isQueuePrepared ? 'queue-is-prepared' : ''}">
      <div class="hero-queue-label">
        <strong>⚡ Fronta komba Venci Česnekáče</strong>
        ${
          state.isQueuePrepared
            ? '<span class="queue-prepared-badge">🔥 PŘIPRAVENO K ODPALU!</span>'
            : '<span class="hero-queue-hint">(Destičky ve frontě · 1 tah vložení / 1 tah příprava)</span>'
        }
      </div>
      <div class="hero-queue-slots">
        ${queueSlotsHtml}
      </div>
    </div>

    <div class="battlefield-1d-stage" id="battlefield-stage">
      ${cellsHtml}
    </div>
  `;

  // Wire combo queue drag-and-drop reordering
  let draggedSlotIdx = null;

  container.querySelectorAll('.queue-slot').forEach((slotEl) => {
    const slotIdx = Number(slotEl.getAttribute('data-slot-index'));

    slotEl.addEventListener('dragstart', (e) => {
      if (!slotEl.classList.contains('queue-slot-filled')) {
        e.preventDefault();
        return;
      }
      draggedSlotIdx = slotIdx;
      e.dataTransfer.setData('text/plain', String(slotIdx));
      e.dataTransfer.effectAllowed = 'move';
      slotEl.classList.add('is-dragging');
    });

    slotEl.addEventListener('dragend', () => {
      draggedSlotIdx = null;
      slotEl.classList.remove('is-dragging');
      container.querySelectorAll('.queue-slot').forEach((s) => s.classList.remove('drag-over-target'));
    });

    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedSlotIdx !== null && draggedSlotIdx !== slotIdx && slotIdx < state.queue.length) {
        slotEl.classList.add('drag-over-target');
      }
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over-target');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over-target');
      const fromIdx = draggedSlotIdx !== null ? draggedSlotIdx : Number(e.dataTransfer.getData('text/plain'));
      if (
        Number.isInteger(fromIdx) &&
        fromIdx >= 0 &&
        fromIdx !== slotIdx &&
        slotIdx < state.queue.length
      ) {
        callbacks.onReorderQueue?.(fromIdx, slotIdx);
      }
    });
  });

  // Wire reorder arrow buttons (◀ / ▶)
  container.querySelectorAll('[data-move-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIdx = Number(btn.getAttribute('data-move-slot'));
      const dir = Number(btn.getAttribute('data-move-dir'));
      const targetIdx = currentIdx + dir;
      if (targetIdx >= 0 && targetIdx < state.queue.length) {
        callbacks.onReorderQueue?.(currentIdx, targetIdx);
      }
    });
  });

  // Wire queue removal clicks (✖)
  container.querySelectorAll('[data-remove-queue-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotIdx = Number(btn.getAttribute('data-remove-queue-slot'));
      callbacks.onRemoveQueueSlot?.(slotIdx);
    });
  });

  // Wire enemy hover for next-tile range preview + tooltip
  container.querySelectorAll('[data-enemy-id]').forEach((el) => {
    const enemyId = el.getAttribute('data-enemy-id');
    const enemy = state.enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    const rank = initiativeMap.get(enemy.id) || 1;

    el.addEventListener('mouseenter', (ev) => {
      callbacks.onHoverEnemy?.(enemyId);
      showTooltip(buildEnemyTooltipHtml(enemy, rank), ev.clientX, ev.clientY);
    });

    el.addEventListener('mouseleave', () => {
      callbacks.onHoverEnemy?.(null);
      hideTooltip();
    });
  });

  // Wire terrain tooltips on floor badges
  container.querySelectorAll('[data-terrain-type]').forEach((cellEl) => {
    const tType = cellEl.getAttribute('data-terrain-type');
    if (!tType || tType === 'none') return;
    const def = TERRAIN_TYPES[tType];
    if (!def) return;
    const floorEl = cellEl.querySelector('.cell-floor-stone');
    floorEl?.addEventListener('mouseenter', (ev) => {
      showTooltip(`<div class="tt-title">${def.name}</div><div class="tt-desc">${def.description}</div>`, ev.clientX, ev.clientY);
    });
    floorEl?.addEventListener('mouseleave', hideTooltip);
  });
}

function renderGateBannerHtml(cellIdx, leftReinf, rightReinf) {
  if (cellIdx === 0) {
    return `
      <div class="gate-pillar gate-left">
        <span class="gate-title">🚪 Levá brána</span>
        ${
          leftReinf
            ? `<span class="gate-reinf-warning">Posila za ${leftReinf.turnsRemaining} ${leftReinf.turnsRemaining === 1 ? 'tah' : 'tahy'}!</span>`
            : ''
        }
      </div>
    `;
  }
  if (cellIdx === BOARD_SIZE - 1) {
    return `
      <div class="gate-pillar gate-right">
        <span class="gate-title">🚪 Pravá brána</span>
        ${
          rightReinf
            ? `<span class="gate-reinf-warning">Posila za ${rightReinf.turnsRemaining} ${rightReinf.turnsRemaining === 1 ? 'tah' : 'tahy'}!</span>`
            : ''
        }
      </div>
    `;
  }
  return '';
}

function renderEntityOnCellHtml(entity, initiativeRank = 1) {
  const spriteUrl = getAssetUrl(entity.sprite, entity.name);
  const hpPercent = Math.max(0, Math.min(100, Math.round((entity.hp / entity.maxHp) * 100)));

  const statusesHtml = Object.entries(entity.statuses || {})
    .filter(([, val]) => val > 0)
    .map(([statusId, val]) => {
      const st = STATUSES[statusId];
      if (!st) return '';
      return `<span class="status-chip" title="${st.name}: ${st.description}">${st.badge}${val > 1 ? val : ''}</span>`;
    })
    .join('');

  const intentStripHtml =
    entity.entityType === 'enemy' ? renderEnemyIntentStripHtml(entity, initiativeRank) : '';

  const facingArrow =
    entity.entityType === 'prop'
      ? '🛢️'
      : entity.facing === 1
      ? '<span class="facing-indicator facing-right" title="Směr pohledu: Vpravo">▶</span>'
      : '<span class="facing-indicator facing-left" title="Směr pohledu: Vlevo">◀</span>';

  // CRITICAL RULE: transform: scaleX(facing) ONLY on .sprite-flip-wrapper!
  // HP bar, numbers, initiative, intent icons, and queue slots NEVER mirror!
  const scaleXVal = entity.entityType === 'prop' ? 1 : entity.facing === -1 ? -1 : 1;

  return `
    <div class="entity-container entity-${entity.entityType}"
         id="entity-dom-${entity.id}"
         ${entity.entityType === 'enemy' ? `data-enemy-id="${entity.id}"` : ''}>
      ${intentStripHtml}

      <div class="entity-hud-top">
        <div class="entity-name-row">
          ${entity.facing === -1 ? facingArrow : ''}
          <span class="entity-short-name">${entity.name}</span>
          ${entity.facing === 1 ? facingArrow : ''}
        </div>
        <div class="entity-hp-bar-outer" title="Zdraví: ${entity.hp}/${entity.maxHp} HP">
          <div class="entity-hp-bar-inner hp-${entity.entityType}" style="width: ${hpPercent}%"></div>
          <span class="entity-hp-text">${entity.hp}/${entity.maxHp}</span>
        </div>
        ${statusesHtml ? `<div class="entity-status-row">${statusesHtml}</div>` : ''}
      </div>

      <div class="sprite-flip-wrapper" style="transform: scaleX(${scaleXVal});">
        <img src="${spriteUrl}"
             alt="${entity.name}"
             class="entity-sprite-img ${entity.flying ? 'sprite-flying' : ''}"
             referrerpolicy="no-referrer" />
      </div>
    </div>
  `;
}

function getTerrainFloorLabel(terrainObj, terrainDef) {
  switch (terrainObj.type) {
    case 'plank_intact':
      return '🪵 Prkno (1/2)';
    case 'plank_cracked':
      return '⚠️ Prasklé prkno!';
    case 'pit':
      return '🕳️ PROPAST';
    case 'spikes':
      return '🗡️ KŮLY (2 DMG)';
    case 'garlic_cloud':
      return `🧄 Česnek (${terrainObj.duration || 1}t)`;
    default:
      return terrainDef.name;
  }
}

export async function playEngineEvents(container, events, animSpeed = 1) {
  if (!container || !events || events.length === 0) return;

  for (const ev of events) {
    switch (ev.type) {
      case 'move':
      case 'leap':
        SFX.step();
        triggerEntityClassAnim(container, ev.entityId, 'anim-lunge');
        await sleep(ANIMATION_TIMINGS.MOVE_MS, animSpeed);
        break;

      case 'swap':
        SFX.swap();
        triggerEntityClassAnim(container, ev.entityAId, 'anim-leap');
        triggerEntityClassAnim(container, ev.entityBId, 'anim-leap');
        spawnFloatingBadgeOnCell(container, ev.cellA, '🤸 PŘESKOK!', 'float-info');
        await sleep(ANIMATION_TIMINGS.MOVE_MS, animSpeed);
        break;

      case 'turn':
        SFX.turn();
        if (ev.free) {
          spawnFloatingBadgeOnEntity(container, ev.entityId, '🧄 OTOČKA ZDARMA', 'float-heal');
        }
        await sleep(90, animSpeed);
        break;

      case 'queue_insert':
        SFX.queueInsert();
        await sleep(90, animSpeed);
        break;

      case 'queue_remove':
        SFX.queueRemove();
        break;

      case 'friendly_fire':
        SFX.friendlyFire();
        spawnFloatingBadgeOnCell(container, ev.cell, '🧛‍♂️💥 FRIENDLY FIRE!', 'float-friendly');
        await sleep(180, animSpeed);
        break;

      case 'damage':
        SFX.hit();
        triggerEntityClassAnim(container, ev.targetId, 'anim-hurt');
        spawnFloatingBadgeOnCell(container, ev.cell, `−${ev.amount} HP`, 'float-dmg');
        await sleep(ANIMATION_TIMINGS.HIT_MS, animSpeed);
        break;

      case 'blocked_front_shield':
      case 'shield_blocked':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '🛡️ VYKRYTO!', 'float-info');
        await sleep(160, animSpeed);
        break;

      case 'collision_wall':
      case 'collision_entity':
      case 'collision_barrel':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '💥 KOLIZE!', 'float-dmg');
        await sleep(180, animSpeed);
        break;

      case 'status_added':
        if (ev.statusId === 'stun') {
          SFX.bell();
          spawnFloatingBadgeOnCell(container, ev.cell, '🔔 OMRÁČENÍ!', 'float-warn');
        }
        break;

      case 'heal':
        spawnFloatingBadgeOnCell(container, ev.cell, `+${ev.amount} HP`, 'float-heal');
        await sleep(140, animSpeed);
        break;

      case 'momentum':
        SFX.friendlyFire();
        spawnFloatingBadgeOnCell(container, 3, `🔥 MOMENTUM! (−${ev.reduction} CD)`, 'float-heal');
        await sleep(220, animSpeed);
        break;

      case 'death':
        SFX.death();
        triggerEntityClassAnim(container, ev.targetId, 'anim-death');
        await sleep(ANIMATION_TIMINGS.DEATH_MS, animSpeed);
        break;

      default:
        break;
    }
  }
}

function triggerEntityClassAnim(container, entityId, className) {
  if (!entityId) return;
  const el = container.querySelector(`#entity-dom-${entityId}`);
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function spawnFloatingBadgeOnEntity(container, entityId, text, variantClass) {
  const el = container.querySelector(`#entity-dom-${entityId}`);
  if (!el) return;
  const cellEl = el.closest('.board-cell');
  if (!cellEl) return;
  const idx = Number(cellEl.getAttribute('data-cell-index') || 0);
  spawnFloatingBadgeOnCell(container, idx, text, variantClass);
}

function spawnFloatingBadgeOnCell(container, cellIdx, text, variantClass = 'float-dmg') {
  const stageEl = container.querySelector(`#cell-stage-${cellIdx}`);
  if (!stageEl) return;
  const badge = document.createElement('div');
  badge.className = `floating-combat-text ${variantClass}`;
  badge.textContent = text;
  stageEl.appendChild(badge);
  setTimeout(() => badge.remove(), 950);
}
