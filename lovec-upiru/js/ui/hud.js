import { TALISMANS } from '../config/talismans.js';
import { STRINGS } from '../config/strings.cs.js';
import { showTooltip, hideTooltip } from './tooltips.js';

export function renderHud(container, runState, battleState, callbacks = {}) {
  if (!container || !runState) return;

  const hp = battleState ? battleState.hero.hp : runState.heroHp;
  const maxHp = battleState ? battleState.hero.maxHp : runState.heroMaxHp;
  const actName = STRINGS.acts[runState.act] || `Akt ${runState.act}`;
  const locationTitle = battleState ? battleState.encounterName : 'Mapa výpravy';

  const heartsHtml = Array.from({ length: maxHp }, (_, i) => {
    const full = i < hp;
    return `<span class="hp-pip ${full ? 'hp-pip-full' : 'hp-pip-empty'}" title="Život ${i + 1}/${maxHp}">${full ? '❤️' : '🖤'}</span>`;
  }).join('');

  const talismansHtml =
    runState.talismans.length === 0
      ? `<span class="hud-muted-text">Žádné talismany</span>`
      : runState.talismans
          .map((id) => {
            const t = TALISMANS[id];
            if (!t) return '';
            return `<button type="button" class="talisman-badge" data-talisman-id="${t.id}" aria-label="${t.name}">
              <span class="talisman-icon">${t.badge}</span>
              <span class="talisman-name">${t.name}</span>
            </button>`;
          })
          .join('');

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-left">
        <div class="hud-brand">
          <span class="hud-title">🧄 LOVEC UPÍRŮ</span>
          <span class="hud-separator">·</span>
          <span class="hud-act">${actName}</span>
          <span class="hud-separator">·</span>
          <span class="hud-location">${locationTitle}</span>
        </div>
        <div class="hud-vitals">
          <div class="hud-hp-group" title="Zdraví Venci Česnekáče">
            <span class="hud-vital-label">Zdraví:</span>
            <div class="hud-hearts">${heartsHtml}</div>
            <span class="hud-hp-numbers">${hp}/${maxHp} HP</span>
          </div>
          <span class="hud-separator">·</span>
          <div class="hud-gold" title="Hradní dukáty na útratu v hospodě a dílně">
            💰 <strong>${runState.gold}</strong> dukátů
          </div>
          <span class="hud-separator">·</span>
          <div class="hud-seed" title="Deterministický seed výpravy">
            🎲 Seed: <strong>${runState.seed}</strong>
          </div>
        </div>
      </div>

      <div class="hud-center-talismans">
        <span class="hud-vital-label">Talismany:</span>
        <div class="talisman-strip">${talismansHtml}</div>
      </div>

      <div class="hud-actions">
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-map" title="Zobrazit mapu aktu">
          🗺️ Mapa
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-rules" title="Pravidla a nápověda (F1)">
          📖 Pravidla
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-settings" title="Nastavení rychlosti, zvuku a seedu">
          ⚙️ Nastavení
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-talisman-id]').forEach((el) => {
    const id = el.getAttribute('data-talisman-id');
    const tal = TALISMANS[id];
    if (!tal) return;
    el.addEventListener('mouseenter', (ev) => {
      showTooltip(
        `<div class="tt-title">${tal.badge} ${tal.name}</div>
         <div class="tt-desc">${tal.description}</div>`,
        ev.clientX,
        ev.clientY
      );
    });
    el.addEventListener('mouseleave', hideTooltip);
  });

  container.querySelector('#btn-hud-map')?.addEventListener('click', () => callbacks.onToggleMap?.());
  container.querySelector('#btn-hud-rules')?.addEventListener('click', () => callbacks.onOpenRules?.());
  container.querySelector('#btn-hud-settings')?.addEventListener('click', () => callbacks.onOpenSettings?.());
}
