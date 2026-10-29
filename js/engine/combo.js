import { STRINGS } from '../config/strings.cs.js';

export function computeSlotBonuses(state, tile, slotIndex) {
  let dmgBonus = 0;
  let flipTarget = false;
  let selfEmpower = 0;

  // Talisman: Oak splinter gives +1 DMG to 3rd or 4th slot in queue
  if ((slotIndex === 2 || slotIndex === 3) && state.talismans?.includes('oak_splinter')) {
    dmgBonus += 1;
  }

  if (!state.firstAttackUsed && tile.type !== 'move' && state.talismans?.includes('brass_lantern')) {
    dmgBonus += 1;
  }

  if (state.hero.statuses?.empower > 0 && (tile.dmg > 0 || dmgBonus > 0)) {
    dmgBonus += state.hero.statuses.empower;
  }

  return {
    isOpener: false,
    isFinisher: false,
    dmgBonus,
    flipTarget,
    selfEmpower
  };
}

export function applyMomentumIfLastEnemyKilled(state, comboLength, events = []) {
  if (comboLength < 2) return false;
  const anyLivingEnemy = state.enemies.some((e) => e.hp > 0);
  const anyPendingReinforcement = state.reinforcements.some((r) => !r.spawned);
  if (anyLivingEnemy || anyPendingReinforcement) return false;

  for (const tile of state.hand) {
    if (tile.currentCooldown > 0) {
      tile.currentCooldown = Math.max(0, tile.currentCooldown - comboLength);
    }
  }

  events.push({
    type: 'momentum',
    comboLength,
    reduction: comboLength
  });
  events.push({
    type: 'log',
    text: `🔥 ${STRINGS.momentumQuotes[0]} (−${comboLength} CD všem destičkám)`
  });

  return true;
}
