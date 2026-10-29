import { NARRATIVE_EVENTS } from '../config/events.js';
import { HERO_TILES } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { grantTalismanToRun, grantTileToRun, upgradeTileInRun } from './run.js';

export function pickRandomEvent(runState) {
  const seen = new Set(runState.visitedEvents || []);
  const pool = NARRATIVE_EVENTS.filter((e) => !seen.has(e.id));
  const chosen = runState.rng.pick(pool.length > 0 ? pool : NARRATIVE_EVENTS);
  if (chosen && !runState.visitedEvents.includes(chosen.id)) {
    runState.visitedEvents.push(chosen.id);
  }
  return structuredClone(chosen);
}

export function resolveEventChoice(runState, eventId, choiceIndex) {
  const eventDef = NARRATIVE_EVENTS.find((e) => e.id === eventId);
  if (!eventDef) return { ok: false, message: 'Neznámá událost.' };
  const choice = eventDef.choices[choiceIndex];
  if (!choice) return { ok: false, message: 'Neplatná volba.' };
  if (choice.condition && !choice.condition(runState)) {
    return { ok: false, message: 'Na tuto volbu nemáš dostatek dukátů!' };
  }

  const eff = choice.effect || {};
  let summary = eff.log || 'Rozhodnutí bylo učiněno.';

  if (typeof eff.goldDelta === 'number') {
    runState.gold = Math.max(0, runState.gold + eff.goldDelta);
  }
  if (typeof eff.heal === 'number') {
    runState.heroHp = Math.min(runState.heroMaxHp, runState.heroHp + eff.heal);
  }
  if (typeof eff.damage === 'number') {
    runState.heroHp = Math.max(1, runState.heroHp - eff.damage);
  }
  if (eff.grantRandomTalisman) {
    const unowned = Object.keys(TALISMANS).filter((id) => !runState.talismans.includes(id));
    if (unowned.length > 0) {
      const talId = runState.rng.pick(unowned);
      grantTalismanToRun(runState, talId);
      summary += ` Získán talisman: ${TALISMANS[talId].name}!`;
    } else {
      runState.gold += 20;
      summary += ' (Všechny talismany už vlastníš, získáváš +20 dukátů.)';
    }
  }
  if (eff.grantRandomTile) {
    const ownedIds = new Set(runState.deck.map((d) => d.id));
    const available = Object.keys(HERO_TILES).filter((id) => !ownedIds.has(id));
    if (available.length > 0) {
      const tileId = runState.rng.pick(available);
      grantTileToRun(runState, tileId);
      summary += ` Získána destička: ${HERO_TILES[tileId].name}!`;
    } else {
      runState.gold += 18;
      summary += ' (+18 dukátů)';
    }
  }
  if (eff.upgradeRandomTile) {
    const upgradable = runState.deck
      .map((d, idx) => ({ ...d, idx }))
      .filter((d) => (d.upgradeLevel || 0) < 2);
    if (upgradable.length > 0) {
      const target = runState.rng.pick(upgradable);
      upgradeTileInRun(runState, target.idx);
      summary += ` Vylepšena destička: ${HERO_TILES[target.id].name}!`;
    } else {
      runState.gold += 15;
    }
  }

  return {
    ok: true,
    message: summary
  };
}
