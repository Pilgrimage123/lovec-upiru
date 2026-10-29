import { QUEUE_INSERT_COST } from '../config/constants.js';
import {
  isValidCell,
  getEntityAt,
  addStatus,
  applyDamage,
  triggerCellTerrainOnEnter,
  assertBoardInvariant
} from './board.js';
import { executeHeroTile } from './tileEffects.js';
import { applyMomentumIfLastEnemyKilled } from './combo.js';
import { processEnemiesPhase } from './enemyAI.js';
import { processReinforcements } from './spawner.js';

export function checkBattleOutcome(state, events = []) {
  if (state.hero.hp <= 0) {
    state.status = 'lost';
    events.push({ type: 'battle_lost' });
    return 'lost';
  }
  const anyLivingEnemy = state.enemies.some((e) => e.hp > 0);
  const anyPendingReinf = state.reinforcements.some((r) => !r.spawned);
  if (!anyLivingEnemy && !anyPendingReinf) {
    state.status = 'won';
    events.push({ type: 'battle_won' });
    return 'won';
  }
  return 'playing';
}

export function endPlayerTurn(state, events = [], extraCdReduction = 0) {
  state.stats.turnsTaken = (state.stats.turnsTaken || 0) + 1;

  // 1. Reduce cooldowns of hero tiles by 1 (+ extraCdReduction if waiting with pocket watch)
  const cdDrop = 1 + extraCdReduction;
  for (const tile of state.hand) {
    if (!tile.inQueue && tile.currentCooldown > 0) {
      tile.currentCooldown = Math.max(0, tile.currentCooldown - cdDrop);
    }
  }

  // Check if battle already won before enemies act
  if (checkBattleOutcome(state, events) !== 'playing') {
    return events;
  }

  // 2. Process enemy countdowns and actions
  processEnemiesPhase(state, events);

  if (checkBattleOutcome(state, events) !== 'playing') {
    return events;
  }

  // 3. Process bleed on all living entities
  const allLiving = [state.hero, ...state.enemies.filter((e) => e.hp > 0)];
  for (const ent of allLiving) {
    if (ent.hp > 0 && ent.statuses?.bleed > 0) {
      events.push({
        type: 'log',
        text: `🩸 ${ent.name} krvácí (1 DMG).`
      });
      applyDamage(state, ent, 1, { reason: 'bleed' }, events);
      if (ent.statuses.bleed) {
        ent.statuses.bleed -= 1;
        if (ent.statuses.bleed <= 0) delete ent.statuses.bleed;
      }
    }
  }

  if (checkBattleOutcome(state, events) !== 'playing') {
    return events;
  }

  // 4. Tick terrain durations (e.g., garlic_cloud)
  for (let c = 0; c < state.terrain.length; c++) {
    const t = state.terrain[c];
    if (t && t.type === 'garlic_cloud' && typeof t.duration === 'number') {
      t.duration -= 1;
      if (t.duration <= 0) {
        state.terrain[c] = { type: 'none' };
        events.push({
          type: 'terrain_expire',
          terrainType: 'garlic_cloud',
          cell: c
        });
      }
    }
  }

  // 5. Process gate reinforcements
  processReinforcements(state, events);

  state.turn += 1;
  checkBattleOutcome(state, events);
  assertBoardInvariant(state);
  return events;
}

export function playerStepNoEnd(state, direction) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  let dir = Math.sign(direction);
  if (!dir) return { ok: false, events };

  const hero = state.hero;

  // Confusion check on hero
  if (hero.statuses?.confusion > 0) {
    hero.statuses.confusion -= 1;
    if (hero.statuses.confusion <= 0) delete hero.statuses.confusion;
    dir = state.rng.nextFloat() < 0.5 ? -1 : 1;
    events.push({
      type: 'log',
      text: `🌀 Venca má v hlavě motolici a vykročil náhodným směrem!`
    });
  }

  const nextCell = hero.cell + dir;
  if (!isValidCell(nextCell)) {
    events.push({
      type: 'invalid_action',
      reason: 'Tam už je hradní zeď!'
    });
    return { ok: false, events };
  }

  const occupant = getEntityAt(state, nextCell);
  if (!occupant) {
    // Simple step of 1 cell without changing facing
    const fromCell = hero.cell;
    hero.cell = nextCell;
    events.push({
      type: 'move',
      entityId: hero.id,
      from: fromCell,
      to: nextCell,
      facing: hero.facing
    });
    events.push({
      type: 'log',
      text: `👣 Venca popošel na pole ${nextCell + 1}.`
    });
    triggerCellTerrainOnEnter(state, hero, nextCell, events);
  } else {
    // SWAP / LEAPFROG: allowed if cell behind occupant is within bounds and empty
    const behindCell = hero.cell + 2 * dir;
    if (!isValidCell(behindCell) || getEntityAt(state, behindCell)) {
      events.push({
        type: 'invalid_action',
        reason: 'Přeskok není možný – pole za překážkou není volné!'
      });
      return { ok: false, events };
    }

    const oldHeroCell = hero.cell;
    hero.cell = nextCell;
    occupant.cell = oldHeroCell;

    events.push({
      type: 'swap',
      entityAId: hero.id,
      entityBId: occupant.id,
      cellA: hero.cell,
      cellB: occupant.cell
    });
    events.push({
      type: 'log',
      text: `🤸 Přeskok! Venca si prohodil místo s entitou ${occupant.name}!`
    });

    if (state.talismans?.includes('beer_frog')) {
      addStatus(hero, 'shield', 1, events);
      events.push({
        type: 'log',
        text: `🐸 Pivní žába: Venca získal po přeskoku Štít!`
      });
    }

    triggerCellTerrainOnEnter(state, hero, hero.cell, events);
    if (occupant.hp > 0) {
      triggerCellTerrainOnEnter(state, occupant, occupant.cell, events);
    }
  }

  state.isQueuePrepared = false;
  assertBoardInvariant(state);
  return { ok: true, events };
}

export function playerStep(state, direction) {
  const res = playerStepNoEnd(state, direction);
  if (!res.ok) return res;
  endPlayerTurn(state, res.events);
  return res;
}

export function playerTurnAroundNoEnd(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  const hero = state.hero;
  hero.facing = -hero.facing;
  state.isQueuePrepared = false;

  const inGarlic = state.terrain[hero.cell]?.type === 'garlic_cloud';
  events.push({
    type: 'turn',
    entityId: hero.id,
    facing: hero.facing,
    free: inGarlic
  });

  if (
    state.talismans?.includes('holy_aspergillum') &&
    state.turn - (state.lastTurnAspergillumTurn ?? -99) >= 2
  ) {
    const frontCell = hero.cell + hero.facing;
    const frontOcc = getEntityAt(state, frontCell);
    if (frontOcc && frontOcc.entityType === 'enemy') {
      state.lastTurnAspergillumTurn = state.turn;
      applyDamage(state, frontOcc, 1, { reason: 'aspergillum' }, events);
      events.push({
        type: 'log',
        text: `💦 Farářův kropáč při otočce postříkal svěcenou vodou postavu ${frontOcc.name} (1 DMG)!`
      });
    }
  }

  if (inGarlic) {
    events.push({
      type: 'log',
      text: `🧄 Otočení v Česnekovém oblaku je ZDARMA (nestojí tah)!`
    });
    return { ok: true, freeTurn: true, events };
  }

  events.push({
    type: 'log',
    text: `🔄 Venca se otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
  });
  return { ok: true, freeTurn: false, events };
}

export function playerTurnAround(state) {
  const res = playerTurnAroundNoEnd(state);
  if (!res.ok) return res;
  if (!res.freeTurn) {
    endPlayerTurn(state, res.events);
  }
  return res;
}

export function playerWaitNoEnd(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  state.isQueuePrepared = false;
  const extraCd = state.talismans?.includes('pocket_watch') ? 1 : 0;
  events.push({
    type: 'wait',
    entityId: state.hero.id
  });
  events.push({
    type: 'log',
    text: extraCd > 0
      ? `⏳ Venca vyčkává a natahuje dědovy cibule (cooldowny −2).`
      : `⏳ Venca si upravil klobouk a vyčkává (1 tah).`
  });

  return { ok: true, extraCd, events };
}

export function playerWait(state) {
  const res = playerWaitNoEnd(state);
  if (!res.ok) return res;
  endPlayerTurn(state, res.events, res.extraCd || 0);
  return res;
}

export function playerEnqueueTileNoEnd(state, tileInstanceId) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  if (state.queue.length >= state.maxQueueSlots) {
    events.push({
      type: 'invalid_action',
      reason: 'Fronta akcí už je plná!'
    });
    return { ok: false, events };
  }

  const tile = state.hand.find((t) => t.instanceId === tileInstanceId);
  if (!tile) return { ok: false, events };

  if (tile.inQueue) {
    events.push({
      type: 'invalid_action',
      reason: 'Tato destička už je ve frontě!'
    });
    return { ok: false, events };
  }

  if (tile.currentCooldown > 0) {
    events.push({
      type: 'invalid_action',
      reason: `Destička „${tile.name}“ se ještě nabíjí (${tile.currentCooldown} tahy)!`
    });
    return { ok: false, events };
  }

  tile.inQueue = true;
  state.queue.push(tile.instanceId);
  state.isQueuePrepared = false;

  events.push({
    type: 'queue_insert',
    instanceId: tile.instanceId,
    tileName: tile.name,
    slotIndex: state.queue.length - 1
  });

  events.push({
    type: 'log',
    text: `📥 Destička „${tile.name}“ vložena do fronty (slot #${state.queue.length}). Spotřebován 1 tah.`
  });

  return { ok: true, freeTurn: false, events };
}

export function playerEnqueueTile(state, tileInstanceId) {
  const res = playerEnqueueTileNoEnd(state, tileInstanceId);
  if (!res.ok) return res;
  endPlayerTurn(state, res.events);
  return res;
}

export function playerRemoveFromQueue(state, slotIndexOrInstanceId) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  state.isQueuePrepared = false;
  let idx = -1;
  if (typeof slotIndexOrInstanceId === 'number') {
    idx = slotIndexOrInstanceId;
  } else {
    idx = state.queue.indexOf(slotIndexOrInstanceId);
  }

  if (idx < 0 || idx >= state.queue.length) {
    return { ok: false, events };
  }

  const [removedId] = state.queue.splice(idx, 1);
  const tile = state.hand.find((t) => t.instanceId === removedId);
  if (tile) {
    tile.inQueue = false;
  }

  events.push({
    type: 'queue_remove',
    instanceId: removedId,
    tileName: tile?.name || ''
  });
  events.push({
    type: 'log',
    text: `📤 Destička „${tile?.name || removedId}“ vrácena z fronty do zásoby (zdarma).`
  });

  return { ok: true, freeTurn: true, events };
}

export function playerReorderQueue(state, fromIndex, toIndex) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  if (fromIndex === toIndex) return { ok: true, events };
  if (fromIndex < 0 || fromIndex >= state.queue.length) return { ok: false, events };
  if (toIndex < 0 || toIndex >= state.queue.length) return { ok: false, events };

  state.isQueuePrepared = false;
  const [movedId] = state.queue.splice(fromIndex, 1);
  state.queue.splice(toIndex, 0, movedId);

  const tile = state.hand.find((t) => t.instanceId === movedId);
  events.push({
    type: 'queue_reorder',
    fromIndex,
    toIndex,
    instanceId: movedId,
    tileName: tile?.name || ''
  });
  events.push({
    type: 'log',
    text: `🔀 Přerovnáno kombo: „${tile?.name || 'Destička'}“ přesunuta na pozici #${toIndex + 1} (bez ceny tahu).`
  });

  return { ok: true, freeTurn: true, events };
}

export function playerPrepareQueue(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };

  if (!state.queue || state.queue.length === 0) {
    events.push({
      type: 'invalid_action',
      reason: 'Fronta je prázdná – nejprve do ní vlož akční destičky!'
    });
    return { ok: false, events };
  }

  state.isQueuePrepared = true;
  events.push({
    type: 'queue_prepared',
    queueLength: state.queue.length
  });
  events.push({
    type: 'log',
    text: `🎯 Venca se napřáhl k odpalu komba (${state.queue.length} destiček)! Příprava stála 1 tah.`
  });

  endPlayerTurn(state, events);
  return { ok: true, events };
}

export function executeQueuedTileStep(state, tileInstanceId, slotIndex, comboLength, nextTileInstanceId = null) {
  const events = [];
  const tile = state.hand.find((t) => t.instanceId === tileInstanceId);
  if (!tile) return events;

  // Reset boss mirror cloak tracker at start of combo
  if (slotIndex === 0) {
    for (const enemy of state.enemies) {
      enemy.lastComboHitDir = null;
    }
    if (comboLength >= 3 && state.talismans?.includes('notary_stamp')) {
      for (const enemy of state.enemies) {
        if (enemy.hp > 0) {
          applyDamage(state, enemy, 1, { reason: 'notary_stamp' }, events);
        }
      }
      events.push({
        type: 'log',
        text: `💮 Falešné obecní razítko: Plné kombo udělilo všem upírům 1 DMG z úředního výnosu!`
      });
    }
  }

  executeHeroTile(state, tile, slotIndex, comboLength, events);

  tile.inQueue = false;
  tile.currentCooldown = tile.maxCooldown;

  // Resonance: reduce next queued tile's cooldown after it executes (or immediately reduce its maxCooldown for this cycle)
  if (tile.resonance?.nextTileCdReduction && nextTileInstanceId) {
    const nextTile = state.hand.find((t) => t.instanceId === nextTileInstanceId);
    if (nextTile) {
      nextTile.pendingResonanceReduction =
        (nextTile.pendingResonanceReduction || 0) + tile.resonance.nextTileCdReduction;
      events.push({
        type: 'resonance_triggered',
        fromTileId: tile.id,
        toTileId: nextTile.id,
        reduction: tile.resonance.nextTileCdReduction
      });
      events.push({
        type: 'log',
        text: `✨ Rezonance! „${nextTile.name}“ bude mít po odehrání cooldown kratší o ${tile.resonance.nextTileCdReduction}!`
      });
    }
  }

  if (tile.pendingResonanceReduction) {
    tile.currentCooldown = Math.max(0, tile.currentCooldown - tile.pendingResonanceReduction);
    delete tile.pendingResonanceReduction;
  }

  return events;
}

export function finalizeQueueExecution(state, comboLength) {
  const events = [];
  state.queue = [];
  state.isQueuePrepared = false;
  if (comboLength >= 2) {
    state.stats.combosExecuted = (state.stats.combosExecuted || 0) + 1;
  }

  applyMomentumIfLastEnemyKilled(state, comboLength, events);
  endPlayerTurn(state, events);
  return events;
}

export function playerExecuteFullQueueSync(state) {
  const allEvents = [];
  if (state.status !== 'playing' || state.queue.length === 0) {
    return { ok: false, events: allEvents };
  }

  const queueSnapshot = [...state.queue];
  const comboLength = queueSnapshot.length;

  for (let i = 0; i < queueSnapshot.length; i++) {
    if (state.hero.hp <= 0) break;
    const stepEvents = executeQueuedTileStep(
      state,
      queueSnapshot[i],
      i,
      comboLength,
      queueSnapshot[i + 1] || null
    );
    allEvents.push(...stepEvents);
  }

  const endEvents = finalizeQueueExecution(state, comboLength);
  allEvents.push(...endEvents);
  return { ok: true, events: allEvents };
}
