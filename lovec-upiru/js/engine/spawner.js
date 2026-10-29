import { BOARD_SIZE } from '../config/constants.js';
import { getEntityAt, assertBoardInvariant } from './board.js';
import { createEnemyInstance } from './state.js';

export function processReinforcements(state, events = []) {
  if (!state.reinforcements || state.reinforcements.length === 0) return events;

  for (const reinf of state.reinforcements) {
    if (reinf.spawned) continue;

    reinf.turnsRemaining = Math.max(0, reinf.turnsRemaining - 1);

    if (reinf.turnsRemaining <= 0) {
      const gateCell = reinf.gateCell === 0 ? 0 : BOARD_SIZE - 1;
      const occupant = getEntityAt(state, gateCell);

      if (occupant) {
        // Gate is occupied: delay reinforcement by 1 turn
        reinf.turnsRemaining = 1;
        events.push({
          type: 'spawn_delayed',
          gateCell,
          enemyId: reinf.enemyId
        });
        events.push({
          type: 'log',
          text: `🚪 Brána na poli ${gateCell + 1} je ucpaná! Posila se opožďuje o 1 tah.`
        });
      } else {
        reinf.spawned = true;
        const facing = gateCell === 0 ? 1 : -1;
        const enemy = createEnemyInstance(reinf.enemyId, gateCell, facing);
        state.enemies.push(enemy);
        events.push({
          type: 'spawn',
          enemy: structuredClone(enemy),
          cell: gateCell
        });
        events.push({
          type: 'log',
          text: `🚪 Z brány na poli ${gateCell + 1} vtrhla na bojiště posila: ${enemy.name}!`
        });
      }
    }
  }

  assertBoardInvariant(state);
  return events;
}
