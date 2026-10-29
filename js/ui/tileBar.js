import { getAssetUrl } from './assets.js';
import { showTooltip, hideTooltip } from './tooltips.js';

export function renderTileBar(container, state, callbacks = {}) {
  if (!container || !state) return;

  const canStepLeft = canHeroMoveDir(state, -1);
  const canStepRight = canHeroMoveDir(state, 1);
  const inGarlic = state.terrain[state.hero.cell]?.type === 'garlic_cloud';
  const hasQueued = state.queue.length > 0;

  const tilesHtml = state.hand
    .map((tile, idx) => {
      const hotkey = idx + 1;
      const iconUrl = getAssetUrl(tile.icon, tile.name);
      const onCd = tile.currentCooldown > 0;
      const inQ = tile.inQueue;
      const queueSlotIdx = state.queue.indexOf(tile.instanceId);
      const disabled = onCd || inQ || state.queue.length >= state.maxQueueSlots || state.status !== 'playing';

      const rangeText = formatTileRangeLabel(tile);
      const badges = [];
      if (tile.resonance) badges.push('<span class="tile-tag tile-tag-resonance">✨ Rezonance</span>');

      return `
        <button type="button"
                class="player-tile-card ${onCd ? 'tile-on-cooldown' : ''} ${inQ ? 'tile-in-queue' : ''}"
                data-tile-instance="${tile.instanceId}"
                ${disabled ? 'disabled' : ''}>
          <div class="tile-card-top">
            <span class="tile-hotkey">[${hotkey}]</span>
            <span class="tile-cd-stat" title="Cooldown destičky">⏳ CD ${tile.maxCooldown}</span>
          </div>
          <div class="tile-card-art">
            <img src="${iconUrl}" alt="${tile.name}" class="tile-art-img" referrerpolicy="no-referrer" />
            ${
              onCd
                ? `<div class="tile-cooldown-overlay" aria-label="Nabíjí se ještě ${tile.currentCooldown} tahy">
                     <span class="cd-number">${tile.currentCooldown}</span>
                     <span class="cd-label">tahy</span>
                   </div>`
                : ''
            }
            ${
              inQ
                ? `<div class="tile-queued-overlay">
                     <span>Ve frontě #${queueSlotIdx + 1}</span>
                   </div>`
                : ''
            }
          </div>
          <div class="tile-card-name">${tile.name}</div>
          <div class="tile-card-metrics">
            <span class="tile-metric-dmg">⚔️ ${tile.dmg} DMG</span>
            <span class="tile-metric-range">📏 ${rangeText}</span>
          </div>
          <div class="tile-card-tags">${badges.join('')}</div>
        </button>
      `;
    })
    .join('');

  let executeBtnClass = 'btn-action';
  let executeBtnText = `🔥 ODPÁLIT KOMBO (0/${state.maxQueueSlots}) <kbd>Space</kbd>`;
  let executeBtnTitle = 'Nejprve vlož destičky do fronty (1 tah za destičku)';

  if (!hasQueued) {
    executeBtnClass += ' btn-execute-disabled';
  } else {
    executeBtnClass += ' btn-execute-combo btn-execute-ready btn-combo-primed';
    executeBtnText = `🔥 ODPÁLIT KOMBO! (${state.queue.length}/${state.maxQueueSlots}) <kbd>Space</kbd>`;
    executeBtnTitle = 'Okamžitý odpal! Kliknutím nebo Mezerníkem ihned provedeš všechny destičky ve frontě!';
  }

  container.innerHTML = `
    <div class="action-controls-row">
      <button type="button" class="btn-action" id="btn-act-left" ${!canStepLeft ? 'disabled' : ''} title="Krok nebo přeskok vlevo (Klávesa A nebo ⬅)">
        ⬅ Krok vlevo <kbd>A</kbd>
      </button>
      <button type="button" class="btn-action ${inGarlic ? 'btn-action-free' : ''}" id="btn-act-turn" title="Otočit čelem vzad (Klávesa W)">
        🔄 Otočit ${inGarlic ? '(ZDARMA v česneku!)' : ''} <kbd>W</kbd>
      </button>
      <button type="button" class="btn-action" id="btn-act-wait" title="Vyčkat 1 tah a zkrátit cooldowny (Klávesa S)">
        ⏳ Čekat <kbd>S</kbd>
      </button>
      <button type="button" class="btn-action" id="btn-act-right" ${!canStepRight ? 'disabled' : ''} title="Krok nebo přeskok vpravo (Klávesa D nebo ➡)">
        Krok vpravo ➡ <kbd>D</kbd>
      </button>
      <button type="button" class="${executeBtnClass}" id="btn-act-execute" ${!hasQueued ? 'disabled' : ''} title="${executeBtnTitle}">
        ${executeBtnText}
      </button>
    </div>

    <div class="tile-hand-Dock">
      <div class="tile-hand-strip">
        ${tilesHtml}
      </div>
    </div>
  `;

  container.querySelector('#btn-act-left')?.addEventListener('click', () => callbacks.onStep?.(-1));
  container.querySelector('#btn-act-right')?.addEventListener('click', () => callbacks.onStep?.(1));
  container.querySelector('#btn-act-turn')?.addEventListener('click', () => callbacks.onTurn?.());
  container.querySelector('#btn-act-wait')?.addEventListener('click', () => callbacks.onWait?.());
  container.querySelector('#btn-act-execute')?.addEventListener('click', () => callbacks.onExecuteQueue?.());

  container.querySelectorAll('[data-tile-instance]').forEach((btn) => {
    const instanceId = btn.getAttribute('data-tile-instance');
    const tile = state.hand.find((t) => t.instanceId === instanceId);
    if (!tile) return;

    btn.addEventListener('click', () => {
      hideTooltip();
      callbacks.onSelectTile?.(instanceId);
    });

    btn.addEventListener('mouseenter', (ev) => {
      callbacks.onHoverTile?.(instanceId);
      showTooltip(buildTileTooltipHtml(tile), ev.clientX, ev.clientY);
    });

    btn.addEventListener('mouseleave', () => {
      callbacks.onHoverTile?.(null);
      hideTooltip();
    });
  });
}

function canHeroMoveDir(state, dir) {
  if (!state.hero || state.hero.hp <= 0 || state.status !== 'playing') return false;
  const nextCell = state.hero.cell + dir;
  if (nextCell < 0 || nextCell >= 7) return false;
  const occ =
    state.enemies.find((e) => e.hp > 0 && e.cell === nextCell) ||
    state.props.find((p) => p.hp > 0 && p.cell === nextCell);
  if (!occ) return true;
  const behindCell = state.hero.cell + 2 * dir;
  if (behindCell < 0 || behindCell >= 7) return false;
  const behindOcc =
    state.enemies.find((e) => e.hp > 0 && e.cell === behindCell) ||
    state.props.find((p) => p.hp > 0 && p.cell === behindCell);
  return !behindOcc;
}

function formatTileRangeLabel(tile) {
  if (tile.leapDistance) return `Skok ${tile.leapDistance}`;
  if (tile.projectileRange) return `Střela 1–${tile.projectileRange}`;
  if (!tile.pattern || tile.pattern.length === 0) return 'Na místě';
  const offsets = tile.pattern.map((p) => (p.offset > 0 ? `+${p.offset}` : `${p.offset}`));
  return `Pole ${offsets.join(', ')}`;
}

export function buildTileTooltipHtml(tile) {
  return `
    <div class="tt-title">${tile.name}</div>
    <div class="tt-stat-row">
      ⚔️ Základní DMG: <strong>${tile.dmg}</strong> · ⏳ Cooldown: <strong>${tile.maxCooldown} tahy</strong>
      ${tile.quick ? ' · ⚡ <strong>Rychlovka (0 tahů)</strong>' : ''}
    </div>
    <div class="tt-desc">${tile.description}</div>
    ${tile.resonance ? `<div class="tt-bonus">✨ <strong>${tile.resonance.description}</strong></div>` : ''}
    ${tile.flavor ? `<div class="tt-flavor">${tile.flavor}</div>` : ''}
  `;
}
