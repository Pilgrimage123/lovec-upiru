import { BOARD_SIZE } from '../config/constants.js';
import { ENEMY_TILES } from '../config/enemies.js';
import { isValidCell, getEntityAt } from './board.js';
import { getSortedEnemiesByInitiative } from './state.js';

export function computeEnemyTileTargetCells(state, enemy, tileDef) {
  if (!enemy || enemy.hp <= 0 || !tileDef || !tileDef.pattern) return [];
  const results = [];
  let originCell = enemy.cell;

  // If the tile includes a lunge forward (e.g., Drábův výpad), calculate potential origin or direct offsets
  if (tileDef.lungeForward) {
    const stepCell = enemy.cell + enemy.facing * tileDef.lungeForward;
    if (isValidCell(stepCell) && !getEntityAt(state, stepCell)) {
      originCell = stepCell;
    }
  }

  const inGarlic = state.terrain[enemy.cell]?.type === 'garlic_cloud';
  const garlicPenalty = inGarlic ? 1 : 0;
  const empowerBonus = enemy.statuses?.empower ? enemy.statuses.empower : 0;

  if (tileDef.projectileRange) {
    // Raycast projectile: stops at the first occupied cell, but threatens all cells up to the first blocker
    for (const pat of tileDef.pattern) {
      const targetCell = originCell + enemy.facing * pat.offset;
      if (!isValidCell(targetCell)) continue;
      const dmg = Math.max(0, (pat.dmg || 0) + empowerBonus - garlicPenalty);
      results.push({
        cell: targetCell,
        dmg,
        effects: pat.effects || [],
        direction: enemy.facing,
        projectile: true
      });
      const occupant = getEntityAt(state, targetCell);
      if (occupant && occupant.id !== enemy.id) {
        break;
      }
    }
  } else {
    for (const pat of tileDef.pattern) {
      const targetCell = originCell + enemy.facing * pat.offset;
      if (!isValidCell(targetCell)) continue;
      const dmg = Math.max(0, (pat.dmg || 0) + empowerBonus - garlicPenalty);
      results.push({
        cell: targetCell,
        dmg,
        effects: pat.effects || [],
        direction: enemy.facing,
        projectile: false
      });
    }
  }

  return results;
}

export function computeBoardThreats(state, hoveredEnemyId = null) {
  const cells = Array.from({ length: BOARD_SIZE }, (_, idx) => ({
    cell: idx,
    totalDmg: 0,
    imminentDmg: 0,
    isArmedRed: false,
    isInspectReach: false,
    sources: [],
    inspectSources: [],
    nextTileSources: []
  }));

  const sortedEnemies = getSortedEnemiesByInitiative(state);

  sortedEnemies.forEach((enemy, index) => {
    const initiativeRank = index + 1;

    // 1. Armed Red enemies guarantee ground telegraph crosshairs
    const isArmed = enemy.queueState === 'ARMED_RED';
    const queueTiles = (enemy.actionQueue && enemy.actionQueue.length > 0)
      ? enemy.actionQueue
      : (isArmed || enemy.countdown <= 1 ? [enemy.queue?.[enemy.queueIndex % (enemy.queue?.length || 1)]].filter(Boolean) : []);

    if (isArmed && queueTiles.length > 0) {
      let simCell = enemy.cell;
      for (const tileId of queueTiles) {
        const tileDef = ENEMY_TILES[tileId];
        if (!tileDef) continue;

        if (tileDef.lungeForward) {
          const stepCell = simCell + enemy.facing * tileDef.lungeForward;
          if (isValidCell(stepCell) && !getEntityAt(state, stepCell)) {
            simCell = stepCell;
          }
        }

        const hits = computeEnemyTileTargetCells(state, { ...enemy, cell: simCell }, tileDef);
        for (const hit of hits) {
          const cellInfo = cells[hit.cell];
          cellInfo.totalDmg += hit.dmg;
          cellInfo.imminentDmg += hit.dmg;
          cellInfo.isArmedRed = true;
          cellInfo.sources.push({
            enemyId: enemy.id,
            enemyName: enemy.name,
            initiativeRank,
            tileId,
            tileName: tileDef.name,
            isArmedRed: true,
            countdown: 1,
            dmg: hit.dmg,
            direction: hit.direction,
            effects: hit.effects
          });
        }
      }
    } else if (enemy.queue && enemy.queue.length > 0) {
      // Legacy fallback for tests (e.g. Test 7 where countdown/queueIndex is set directly)
      const activeTileId = enemy.queue[enemy.queueIndex % enemy.queue.length];
      const activeTileDef = ENEMY_TILES[activeTileId];

      if (activeTileDef) {
        const hits = computeEnemyTileTargetCells(state, enemy, activeTileDef);
        for (const hit of hits) {
          const cellInfo = cells[hit.cell];
          cellInfo.totalDmg += hit.dmg;
          if (enemy.countdown <= 1) {
            cellInfo.imminentDmg += hit.dmg;
          }
          cellInfo.sources.push({
            enemyId: enemy.id,
            enemyName: enemy.name,
            initiativeRank,
            tileId: activeTileId,
            tileName: activeTileDef.name,
            countdown: enemy.countdown,
            dmg: hit.dmg,
            direction: hit.direction,
            effects: hit.effects
          });
        }
      }
    }

    // 2. Hover / Inspect Mode: highlight reachable attack cells of hovered enemy
    if (hoveredEnemyId && enemy.id === hoveredEnemyId) {
      const inspectTileIds = (enemy.actionPool && enemy.actionPool.length > 0)
        ? enemy.actionPool.map((p) => p.tileId)
        : enemy.queue || [];

      for (const tId of inspectTileIds) {
        const tDef = ENEMY_TILES[tId];
        if (tDef) {
          const hits = computeEnemyTileTargetCells(state, enemy, tDef);
          for (const hit of hits) {
            cells[hit.cell].isInspectReach = true;
            cells[hit.cell].inspectSources.push({
              enemyId: enemy.id,
              enemyName: enemy.name,
              tileId: tId,
              tileName: tDef.name,
              dmg: hit.dmg,
              direction: hit.direction,
              effects: hit.effects
            });
          }
        }
      }
    }
  });

  return cells;
}

export function computePlayerQueuePreview(state, hoveredTileInstanceId = null) {
  if (!state.hero || state.hero.hp <= 0) {
    return {
      ghostCell: 0,
      ghostFacing: 1,
      targetedCells: [],
      hoveredCells: []
    };
  }

  let simCell = state.hero.cell;
  let simFacing = state.hero.facing;
  const targetedCells = [];

  const queueTiles = state.queue
    .map((id) => state.hand.find((t) => t.instanceId === id))
    .filter(Boolean);

  queueTiles.forEach((tile, slotIndex) => {
    const isOpener = slotIndex === 0;
    const isFinisher = slotIndex >= 2;
    const stepHits = simulateTileAt(state, tile, simCell, simFacing, isOpener, isFinisher, slotIndex);
    simCell = stepHits.newHeroCell;
    simFacing = stepHits.newHeroFacing;
    targetedCells.push(...stepHits.hits);
  });

  const hoveredCells = [];
  if (hoveredTileInstanceId) {
    const hoveredTile = state.hand.find((t) => t.instanceId === hoveredTileInstanceId);
    if (hoveredTile) {
      const slotIndex = queueTiles.length;
      const isOpener = slotIndex === 0;
      const isFinisher = slotIndex >= 2;
      const simHover = simulateTileAt(state, hoveredTile, simCell, simFacing, isOpener, isFinisher, slotIndex);
      hoveredCells.push(...simHover.hits);
    }
  }

  return {
    ghostCell: simCell,
    ghostFacing: simFacing,
     heroMoved: simCell !== state.hero.cell || simFacing !== state.hero.facing,
    targetedCells,
    hoveredCells
  };
}

function simulateTileAt(state, tile, heroCell, heroFacing, isOpener, isFinisher, slotIndex) {
  let newHeroCell = heroCell;
  let newHeroFacing = heroFacing;
  const hits = [];

  if (tile.leapDistance) {
    const desired = Math.max(0, Math.min(BOARD_SIZE - 1, heroCell + heroFacing * tile.leapDistance));
    newHeroCell = desired;
    hits.push({
      cell: desired,
      dmg: 0,
      isMove: true,
      slotIndex,
      tileName: tile.name,
      effects: []
    });
  } else if (tile.projectileRange) {
    for (const pat of tile.pattern || []) {
      const c = heroCell + heroFacing * pat.offset;
      if (!isValidCell(c)) continue;
      let dmg = pat.dmg || 0;
      if (isOpener && tile.openerBonus?.dmgBonus) dmg += tile.openerBonus.dmgBonus;
      if (isFinisher && tile.finisherBonus?.dmgBonus) dmg += tile.finisherBonus.dmgBonus;
      const occupant = getEntityAt(state, c);
      hits.push({
        cell: c,
        dmg,
        isMove: false,
        slotIndex,
        tileName: tile.name,
        wouldKill: Boolean(occupant && occupant.hp <= dmg),
        effects: pat.effects || []
      });
      if (occupant && occupant.id !== state.hero.id) {
        break;
      }
    }
  } else {
    for (const pat of tile.pattern || []) {
      const c = heroCell + heroFacing * pat.offset;
      if (!isValidCell(c)) continue;
      let dmg = pat.dmg || 0;
      if (isOpener && tile.openerBonus?.dmgBonus) dmg += tile.openerBonus.dmgBonus;
      if (isFinisher && tile.finisherBonus?.dmgBonus) dmg += tile.finisherBonus.dmgBonus;
      const occupant = getEntityAt(state, c);
      hits.push({
        cell: c,
        dmg,
        isMove: Boolean(pat.isMoveTarget),
        slotIndex,
        tileName: tile.name,
        wouldKill: Boolean(occupant && occupant.hp <= dmg),
        effects: pat.effects || []
      });
    }
  }

  if (tile.selfFlipAfter) {
    newHeroFacing = -newHeroFacing;
  }

  return {
    newHeroCell,
    newHeroFacing,
    hits
  };
}
