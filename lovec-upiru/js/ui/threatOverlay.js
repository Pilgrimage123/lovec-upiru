export function renderCellThreatAndPreviewHtml(cellIndex, cellThreat, queuePreview, state) {
  const parts = [];

  // 1. ARMED_RED Ground Telegraph Crosshair on this cell
  if (cellThreat && cellThreat.isArmedRed) {
    const totalDmg = cellThreat.totalDmg;
    const arrows = Array.from(
      new Set(cellThreat.sources.filter((s) => s.isArmedRed).map((s) => (s.direction === 1 ? '▶' : '◀')))
    ).join('');
    const effectIcons = collectEffectIcons(cellThreat.sources.filter((s) => s.isArmedRed));

    parts.push(`
      <div class="ground-crosshair-badge animate-pulse-crosshair"
           title="Zatelegrafovaná zóna dopadu! ARMED nepřítel zde v příštím tahu odpálí útok za ${totalDmg} DMG!">
        <div class="crosshair-header">
          <span class="crosshair-target-icon">🎯</span>
          <span class="crosshair-tag">CÍL ÚTOKU</span>
        </div>
        <div class="crosshair-dmg-row">
          <span class="crosshair-dir">${arrows}</span>
          <span class="crosshair-dmg-val">💥 ${totalDmg} DMG</span>
          ${effectIcons ? `<span class="crosshair-eff">${effectIcons}</span>` : ''}
        </div>
      </div>
    `);
  } else if (cellThreat && cellThreat.sources.length > 0) {
    // Legacy fallback threat badge
    const totalDmg = cellThreat.totalDmg;
    const isImminent = cellThreat.sources.some((s) => s.countdown <= 1);
    const arrows = Array.from(
      new Set(cellThreat.sources.map((s) => (s.direction === 1 ? '▶' : '◀')))
    ).join('');
    const effectIcons = collectEffectIcons(cellThreat.sources);

    parts.push(`
      <div class="threat-badge ${isImminent ? 'threat-badge-imminent' : 'threat-badge-warning'}"
           title="Ohrožené pole! Součet DMG: ${totalDmg}">
        <span class="threat-dir">${arrows}</span>
        <span class="threat-dmg">💥 ${totalDmg} DMG</span>
        ${effectIcons ? `<span class="threat-eff">${effectIcons}</span>` : ''}
      </div>
    `);
  }

  // 2. Hovered enemy inspect reach highlight
  if (cellThreat && cellThreat.isInspectReach) {
    const inspectCount = cellThreat.inspectSources?.length || 1;
    parts.push(`
      <div class="inspect-reach-badge" title="Pole v dosahu útoků inspectovaného nepřítele (${inspectCount} schopností)">
        <span>👁️ Dosah útoku</span>
      </div>
    `);
  }

  // 3. Player queued combo preview on this cell
  if (queuePreview) {
    const cellHits = queuePreview.targetedCells.filter((h) => h.cell === cellIndex);
    if (cellHits.length > 0) {
      const sumDmg = cellHits.reduce((a, b) => a + (b.dmg || 0), 0);
      const anyKill = cellHits.some((h) => h.wouldKill);
      const isMoveOnly = cellHits.every((h) => h.isMove);

      parts.push(`
        <div class="preview-badge preview-badge-queue">
          ${isMoveOnly ? '🤸 Dopad' : `⚔️ Kombo: ${sumDmg} DMG`}
          ${anyKill ? '<span class="preview-kill">💀 SMRT</span>' : ''}
        </div>
      `);
    }

    // 4. Hovered player tile preview from hand
    const hoverHits = queuePreview.hoveredCells.filter((h) => h.cell === cellIndex);
    if (hoverHits.length > 0) {
      const hoverDmg = hoverHits.reduce((a, b) => a + (b.dmg || 0), 0);
      const hoverKill = hoverHits.some((h) => h.wouldKill);
      const isMove = hoverHits.every((h) => h.isMove);
      parts.push(`
        <div class="preview-badge preview-badge-hover">
          ${isMove ? '👣 Doskok' : `🎯 Dosah: ${hoverDmg} DMG`}
          ${hoverKill ? ' 💀' : ''}
        </div>
      `);
    }

    // 5. Ghost of Venca if queued movement changes his cell
    if (queuePreview.heroMoved && queuePreview.ghostCell === cellIndex && state.hero.cell !== cellIndex) {
      parts.push(`
        <div class="hero-ghost-marker" title="Sem se Venca přesune po odehrání fronty">
          👻 Venca (${queuePreview.ghostFacing === 1 ? '▶' : '◀'})
        </div>
      `);
    }
  }

  return parts.join('');
}

function collectEffectIcons(sources) {
  const icons = new Set();
  for (const s of sources) {
    for (const eff of s.effects || []) {
      if (eff.type === 'push') icons.add('💨Push');
      if (eff.type === 'bleed') icons.add('🩸');
      if (eff.type === 'stun') icons.add('🔔');
      if (eff.type === 'confusion') icons.add('🌀');
    }
  }
  return Array.from(icons).join(' ');
}
