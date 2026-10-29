export function formatLogEntryHtml(rawText, isLatest = false) {
  let text = String(rawText || '');

  // Extract turn badge if present, e.g. [Kolo 2]
  let turnBadge = '';
  const match = text.match(/^\[Kolo\s+(\d+)\]\s*(.*)$/);
  if (match) {
    turnBadge = `<span class="log-turn-pill">Kolo ${match[1]}</span>`;
    text = match[2];
  }

  // Highlight specific combat tokens
  let formatted = text
    .replace(/(\b\d+\s*DMG\b)/g, '<span class="log-hl-dmg">$1</span>')
    .replace(/(FRIENDLY FIRE!)/g, '<span class="log-hl-ff">$1</span>')
    .replace(/(MOMENTUM!)/g, '<span class="log-hl-mom">$1</span>')
    .replace(/(\b\+\d+\s*HP\b)/g, '<span class="log-hl-heal">$1</span>');

  return `
    <li class="chronicle-item ${isLatest ? 'chronicle-latest' : ''}">
      ${turnBadge}
      <span class="chronicle-text">${formatted}</span>
    </li>
  `;
}

export function renderChronicleLog(container, state, onOpenFullLog) {
  if (!container || !state) return;

  const logs = state.log || [];
  const recentLogs = logs.slice(-8); // show last 8 items

  const itemsHtml = recentLogs.length === 0
    ? `<li class="chronicle-empty">Zatím se v této bitvě nic nestalo.</li>`
    : recentLogs
        .map((entry, idx) => formatLogEntryHtml(entry, idx === recentLogs.length - 1))
        .join('');

  container.innerHTML = `
    <div class="chronicle-panel">
      <div class="chronicle-header">
        <div class="chronicle-title-group">
          <span class="chronicle-icon">📜</span>
          <span class="chronicle-title">Hradní kronikář (Bojový zápis)</span>
          <span class="chronicle-turn-counter">Kolo ${state.turn}</span>
          <span class="chronicle-count-pill">${logs.length} záznamů</span>
        </div>
        <button type="button" class="btn-parchment btn-xs" id="btn-open-full-log">
          📖 Celý deník výpravy
        </button>
      </div>
      <div class="chronicle-scroll-window" id="chronicle-scroll-box">
        <ul class="chronicle-list">
          ${itemsHtml}
        </ul>
      </div>
    </div>
  `;

  // Autoscroll to bottom to see latest entries immediately
  const scrollBox = container.querySelector('#chronicle-scroll-box');
  if (scrollBox) {
    scrollBox.scrollTop = scrollBox.scrollHeight;
  }

  container.querySelector('#btn-open-full-log')?.addEventListener('click', () => {
    onOpenFullLog?.();
  });
}
