import { STRINGS } from '../config/strings.cs.js';

export function computeSlotBonuses(state, tile, slotIndex) {
  const isOpener = slotIndex === 0;
  const isFinisher = slotIndex === 2 || slotIndex === 3;

  let dmgBonus = 0;
  let flipTarget = false;
  let selfEmpower = 0;

  if (isOpener && tile.openerBonus) {
    dmgBonus += tile.openerBonus.dmgBonus || 0;
    flipTarget = Boolean(tile.openerBonus.flipTarget);
    selfEmpower += tile.openerBonus.selfEmpower || 0;
  }

  if (isFinisher && tile.finisherBonus) {
    dmgBonus += tile.finisherBonus.dmgBonus || 0;
  }

  if (isFinisher && state.talismans?.includes('oak_splinter')) {
    dmgBonus += 1;
  }

  if (!state.firstAttackUsed && tile.type !== 'move' && state.talismans?.includes('brass_lantern')) {
    dmgBonus += 1;
  }

  if (state.hero.statuses?.empower > 0 && (tile.dmg > 0 || dmgBonus > 0)) {
    dmgBonus += state.hero.statuses.empower;
  }

  return {
    isOpener,
    isFinisher,
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
