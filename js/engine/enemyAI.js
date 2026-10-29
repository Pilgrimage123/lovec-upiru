import { BOARD_SIZE } from '../config/constants.js';
import { ENEMY_TILES } from '../config/enemies.js';
import { STRINGS } from '../config/strings.cs.js';
import {
  isValidCell,
  getEntityAt,
  addStatus,
  applyDamage,
  pushEntity,
  triggerCellTerrainOnEnter,
  assertBoardInvariant
} from './board.js';
import { createEnemyInstance, getSortedEnemiesByInitiative } from './state.js';

export function advanceEnemyTileQueue(enemy) {
  if (enemy.queue && enemy.queue.length > 0) {
    enemy.queueIndex = (enemy.queueIndex + 1) % enemy.queue.length;
    const nextTileId = enemy.queue[enemy.queueIndex];
    const nextTileDef = ENEMY_TILES[nextTileId];
    enemy.countdown = nextTileDef ? nextTileDef.delay : 2;
  }
}

export function canTileHitTarget(state, enemy, tileDef, fromCell, facing, targetCell) {
  if (!tileDef || !tileDef.pattern) return false;
  let origin = fromCell;
  if (tileDef.lungeForward) {
    const lungeCell = fromCell + facing * tileDef.lungeForward;
    if (isValidCell(lungeCell) && (!getEntityAt(state, lungeCell) || lungeCell === targetCell)) {
      origin = lungeCell;
    }
  }

  if (tileDef.projectileRange) {
    for (const pat of tileDef.pattern) {
      const c = origin + facing * pat.offset;
      if (!isValidCell(c)) break;
      if (c === targetCell) return true;
      const occupant = getEntityAt(state, c);
      if (occupant && occupant.id !== enemy.id) {
        break; // blocked by obstacle
      }
    }
    return false;
  }

  return (tileDef.pattern || []).some((pat) => origin + facing * pat.offset === targetCell);
}

export function planEnemyIntent(state, enemy) {
  if (!enemy || enemy.hp <= 0 || !state.hero || state.hero.hp <= 0) {
    enemy.nextAction = null;
    return;
  }

  // If already ARMED_RED, lock-in guarantees execution in the upcoming turn!
  if (enemy.queueState === 'ARMED_RED') {
    enemy.nextAction = { type: 'execute_queue' };
    return;
  }

  const heroCell = state.hero.cell;
  const diff = heroCell - enemy.cell;
  const dirToHero = Math.sign(diff) || enemy.facing;

  // RULE 1: If hero is behind enemy, turn towards hero first!
  if (dirToHero !== enemy.facing && heroCell !== enemy.cell) {
    enemy.nextAction = { type: 'turn', dir: dirToHero };
    return;
  }

  // RULE 2: Facing hero. Check ready actionPool tiles to attack or queue.
  const pool = enemy.actionPool || [];
  const readyTiles = pool.filter(
    (p) => p.currentCooldown === 0 && !(enemy.actionQueue || []).includes(p.tileId)
  );

  // Check if any ready tile can hit hero from current cell
  const hittingReady = readyTiles.filter((p) => {
    const def = ENEMY_TILES[p.tileId];
    return canTileHitTarget(state, enemy, def, enemy.cell, enemy.facing, heroCell);
  });

  if (hittingReady.length > 0) {
    // Pick the best attack tile (highest damage or first in pool)
    const bestTile = hittingReady[0];
    const capacity = enemy.comboCapacity || 2;
    const currentQueueLen = (enemy.actionQueue || []).length;

    if (currentQueueLen < capacity) {
      enemy.nextAction = { type: 'queue_tile', tileId: bestTile.tileId };
      return;
    } else {
      // Queue is full -> arm!
      enemy.queueState = 'ARMED_RED';
      enemy.nextAction = { type: 'execute_queue' };
      return;
    }
  }

  // If already has tiles in queue that can hit hero
  const queuedCanHit = (enemy.actionQueue || []).some((tileId) => {
    const def = ENEMY_TILES[tileId];
    return canTileHitTarget(state, enemy, def, enemy.cell, enemy.facing, heroCell);
  });

  if (queuedCanHit) {
    if (enemy.archetype === 'fodder' || (enemy.actionQueue || []).length >= (enemy.comboCapacity || 2)) {
      enemy.queueState = 'ARMED_RED';
      enemy.nextAction = { type: 'execute_queue' };
      return;
    }
  }

  // RULE 3: Positioning (Step / Retreat)
  const dist = Math.abs(diff);

  // Ranged archetype retreats if player gets within melee range (<= 1)
  if (enemy.archetype === 'ranged' && dist <= 1) {
    const retreatCell = enemy.cell - enemy.facing;
    if (isValidCell(retreatCell) && !getEntityAt(state, retreatCell)) {
      enemy.nextAction = { type: 'step', dir: -enemy.facing, reason: 'retreat' };
      return;
    }
  }

  // Advance towards hero if out of range
  if (dist > 1) {
    const stepCell = enemy.cell + enemy.facing;
    if (isValidCell(stepCell) && !getEntityAt(state, stepCell)) {
      enemy.nextAction = { type: 'step', dir: enemy.facing, reason: 'advance' };
      return;
    }
  }

  // Non-attack ready tiles (buffs, shields, summons)
  const nonAttackReady = readyTiles.find((p) => {
    const def = ENEMY_TILES[p.tileId];
    return def && (def.type === 'nápřah' || def.type === 'štít' || def.type === 'léčení' || def.type === 'přivolání');
  });

  if (nonAttackReady && (enemy.actionQueue || []).length < (enemy.comboCapacity || 2)) {
    enemy.nextAction = { type: 'queue_tile', tileId: nonAttackReady.tileId };
    return;
  }

  // If queue has any tiles and no further movement or tiles can be added, arm!
  if ((enemy.actionQueue || []).length > 0) {
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
    return;
  }

  // Default wait/idle
  enemy.nextAction = { type: 'idle' };
}

export function checkAndApplyArming(state, enemy, events = []) {
  if (enemy.queueState === 'ARMED_RED') return;
  if (!enemy.actionQueue || enemy.actionQueue.length === 0) return;

  let shouldArm = false;
  const capacity = enemy.comboCapacity || 2;

  // Capacity reached
  if (enemy.actionQueue.length >= capacity) {
    shouldArm = true;
  }
  // Fodder archetype arms as soon as 1 attack tile is queued
  else if (enemy.archetype === 'fodder' && enemy.actionQueue.length >= 1) {
    shouldArm = true;
  }
  // No remaining ready tiles in pool
  else {
    const remainingReady = (enemy.actionPool || []).filter(
      (p) => p.currentCooldown === 0 && !enemy.actionQueue.includes(p.tileId)
    );
    if (remainingReady.length === 0) {
      shouldArm = true;
    }
  }

  if (shouldArm) {
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
    events.push({
      type: 'enemy_armed',
      enemyId: enemy.id,
      enemyName: enemy.name,
      cell: enemy.cell
    });
    events.push({
      type: 'log',
      text: `🚨 ${enemy.name} zčervenal a zaměřil cíl (ARMED – pálí v příštím tahu)!`
    });
  }
}

export function initializeAllEnemiesIntent(state) {
  if (!state || !state.enemies) return;
  for (const enemy of state.enemies) {
    if (enemy.hp > 0) {
      planEnemyIntent(state, enemy);
      checkAndApplyArming(state, enemy, []);
      planEnemyIntent(state, enemy);
      enemy.countdown = enemy.queueState === 'ARMED_RED' ? 1 : 2;
    }
  }
}

export function processEnemiesPhase(state, events = []) {
  if (!state.hero || state.hero.hp <= 0) return events;

  // Evaluate enemies in fixed initiative order (left to right)
  const orderedEnemies = getSortedEnemiesByInitiative(state);

  for (const enemy of orderedEnemies) {
    if (enemy.hp <= 0 || state.hero.hp <= 0) continue;

    // Check stun (Omráčení)
    if (enemy.statuses?.stun > 0) {
      enemy.statuses.stun -= 1;
      if (enemy.statuses.stun <= 0) delete enemy.statuses.stun;
      events.push({
        type: 'enemy_stun_skipped',
        enemyId: enemy.id,
        enemyName: enemy.name,
        cell: enemy.cell
      });
      events.push({
        type: 'log',
        text: `🔔 ${enemy.name} je omráčený a vynechává akci!`
      });
      // Stun delays execution or action; keep ARMED_RED if armed
      continue;
    }

    // If enemy had no planned action yet (e.g. freshly created or added without initialization), plan it now
    if (!enemy.nextAction && enemy.queueState !== 'ARMED_RED') {
      planEnemyIntent(state, enemy);
      checkAndApplyArming(state, enemy, []);
    }

    // Decrement cooldowns in actionPool for tiles not currently in queue
    if (enemy.actionPool) {
      for (const item of enemy.actionPool) {
        if (!enemy.actionQueue?.includes(item.tileId) && item.currentCooldown > 0) {
          item.currentCooldown = Math.max(0, item.currentCooldown - 1);
        }
      }
    }

    // Check if enemy is firing their ARMED_RED queue or legacy test attack
    const isArmedQueue = (enemy.queueState === 'ARMED_RED' || enemy.countdown <= 1) && (enemy.actionQueue || []).length > 0;
    const isLegacyArmedAttack = enemy.countdown <= 1 && enemy.queue && (enemy.queueIndex > 0 || enemy.queueState === 'ARMED_RED');

    if (isArmedQueue) {
      const targetedCells = getEnemyQueuedTargetCells(state, enemy);
      events.push({
        type: 'enemy_queue_firing',
        enemyId: enemy.id,
        enemyName: enemy.name,
        cell: enemy.cell,
        queue: [...enemy.actionQueue],
        targetedCells
      });

      // Player reaction opportunity when enemy fires queue!
      const rxType = state.pendingReaction || state.autoReaction || null;
      if (rxType && rxType !== 'skip') {
        applyPlayerReaction(state, rxType, events);
      }
      state.pendingReaction = null;

      // Execute combo only if enemy survived reaction and is not stunned
      if (enemy.hp > 0 && !(enemy.statuses?.stun > 0)) {
        events.push({
          type: 'enemy_queue_execution_start',
          enemyId: enemy.id,
          enemyName: enemy.name,
          cell: enemy.cell,
          queue: [...enemy.actionQueue]
        });
        events.push({
          type: 'log',
          text: `⚡ ${enemy.name} odpálil celou frontu akcí (${enemy.actionQueue.length} ${enemy.actionQueue.length === 1 ? 'destička' : 'destičky'})!`
        });

        const queueCopy = [...enemy.actionQueue];
        for (const tileId of queueCopy) {
          if (enemy.hp <= 0 || state.hero.hp <= 0) break;
          const tileDef = ENEMY_TILES[tileId];
          if (tileDef) {
            executeSingleEnemyTile(state, enemy, tileDef, events);
            // Put on cooldown
            const poolItem = enemy.actionPool?.find((p) => p.tileId === tileId);
            if (poolItem) {
              poolItem.currentCooldown = poolItem.maxCooldown;
            }
          }
        }
      } else if (enemy.hp <= 0) {
        events.push({
          type: 'log',
          text: `💀 ${enemy.name} byl zlikvidován reakcí ještě před provedením své fronty!`
        });
      }

      enemy.actionQueue = [];
      enemy.queueState = 'EMPTY';
    } else if (isLegacyArmedAttack) {
      // Legacy fallback for test setups that assign enemy.queue and set countdown = 1
      const activeTileId = enemy.queue[enemy.queueIndex % enemy.queue.length];
      const tileDef = ENEMY_TILES[activeTileId];
      if (tileDef) {
        executeSingleEnemyTile(state, enemy, tileDef, events);
      }
      advanceEnemyTileQueue(enemy);
    } else if (enemy.nextAction) {
      // Perform telegraphed turn / step / queue_tile / arm
      performEnemyAction(state, enemy, enemy.nextAction, events);
    }

    // Post-action: check transition to ARMED_RED and plan next turn
    if (enemy.hp > 0 && state.hero.hp > 0) {
      checkAndApplyArming(state, enemy, events);
      planEnemyIntent(state, enemy);
      enemy.countdown = enemy.queueState === 'ARMED_RED' ? 1 : 2;
    }
  }

  assertBoardInvariant(state);
  return events;
}

function performEnemyAction(state, enemy, action, events) {
  if (!action) return;

  if (action.type === 'turn') {
    enemy.facing = action.dir;
    events.push({
      type: 'turn',
      entityId: enemy.id,
      facing: enemy.facing
    });
    events.push({
      type: 'log',
      text: `🔄 ${enemy.name} se otočil ${enemy.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  } else if (action.type === 'step') {
    const targetCell = enemy.cell + action.dir;
    if (isValidCell(targetCell) && !getEntityAt(state, targetCell)) {
      const fromCell = enemy.cell;
      enemy.cell = targetCell;
      events.push({
        type: 'move',
        entityId: enemy.id,
        from: fromCell,
        to: targetCell,
        facing: enemy.facing
      });
      events.push({
        type: 'log',
        text: `👣 ${enemy.name} popošel na pole ${targetCell + 1}.`
      });
      triggerCellTerrainOnEnter(state, enemy, targetCell, events);
    } else {
      events.push({
        type: 'enemy_step_blocked',
        enemyId: enemy.id,
        from: enemy.cell,
        blockedCell: targetCell
      });
      events.push({
        type: 'log',
        text: `🚧 ${enemy.name} chtěl popojít, ale pole je obsazené.`
      });
    }
  } else if (action.type === 'queue_tile') {
    const tileId = action.tileId;
    const tileDef = ENEMY_TILES[tileId];
    if (!enemy.actionQueue) enemy.actionQueue = [];
    enemy.actionQueue.push(tileId);
    enemy.queueState = 'QUEUING_GRAY';
    events.push({
      type: 'enemy_queue_tile',
      enemyId: enemy.id,
      tileId,
      tileName: tileDef?.name || tileId,
      slotIndex: enemy.actionQueue.length - 1
    });
    events.push({
      type: 'log',
      text: `📥 ${enemy.name} připravil do komba „${tileDef?.name || tileId}“ (slot #${enemy.actionQueue.length}).`
    });
  } else if (action.type === 'arm') {
    enemy.queueState = 'ARMED_RED';
    events.push({
      type: 'enemy_armed',
      enemyId: enemy.id,
      cell: enemy.cell
    });
    events.push({
      type: 'log',
      text: `🚨 ${enemy.name} zčervenal, zamkl frontu útoků (ARMED) a v příštím tahu odpálí kombo!`
    });
  }
}

export function executeSingleEnemyTile(state, enemy, tileDef, events = []) {
  const hero = state.hero;
  events.push({
    type: 'enemy_action_start',
    enemyId: enemy.id,
    enemyName: enemy.name,
    cell: enemy.cell,
    tileId: tileDef.id,
    tileName: tileDef.name,
    tileType: tileDef.type
  });

  // 1. Turn action ('otočení')
  if (tileDef.type === 'otočení') {
    const desiredFacing = Math.sign(hero.cell - enemy.cell) || enemy.facing;
    enemy.facing = desiredFacing;
    events.push({
      type: 'turn',
      entityId: enemy.id,
      facing: enemy.facing
    });
    events.push({
      type: 'log',
      text: `🔄 ${enemy.name} se otočil směrem k Vencovi.`
    });
    return;
  }

  // 2. Step action ('krok')
  if (tileDef.type === 'krok') {
    const dirToHero = Math.sign(hero.cell - enemy.cell) || enemy.facing;
    enemy.facing = dirToHero;
    events.push({
      type: 'turn',
      entityId: enemy.id,
      facing: enemy.facing
    });

    let moveDir = dirToHero;
    if (tileDef.retreatIfClose && Math.abs(hero.cell - enemy.cell) <= 1) {
      moveDir = -dirToHero;
    }

    // Confusion randomizes step direction
    if (enemy.statuses?.confusion > 0) {
      enemy.statuses.confusion -= 1;
      if (enemy.statuses.confusion <= 0) delete enemy.statuses.confusion;
      moveDir = state.rng.nextFloat() < 0.5 ? -1 : 1;
      events.push({
        type: 'log',
        text: `🌀 Zmatený ${enemy.name} vrávorá náhodným směrem!`
      });
    }

    const targetCell = enemy.cell + moveDir;
    if (!isValidCell(targetCell) || getEntityAt(state, targetCell)) {
      events.push({
        type: 'enemy_step_blocked',
        enemyId: enemy.id,
        from: enemy.cell,
        blockedCell: targetCell
      });
      events.push({
        type: 'log',
        text: `🚧 ${enemy.name} chtěl popojít, ale pole je obsazené (krok zablokován).`
      });
      return;
    }

    const fromCell = enemy.cell;
    enemy.cell = targetCell;
    events.push({
      type: 'move',
      entityId: enemy.id,
      from: fromCell,
      to: targetCell,
      facing: enemy.facing
    });
    triggerCellTerrainOnEnter(state, enemy, targetCell, events);
    return;
  }

  // 3. Windup ('nápřah') or Shield ('štít')
  if (tileDef.type === 'nápřah' || tileDef.type === 'štít') {
    if (tileDef.selfEffect) {
      addStatus(enemy, tileDef.selfEffect.type, tileDef.selfEffect.amount || 1, events);
    }
    events.push({
      type: 'log',
      text: `💢 ${enemy.name} použil „${tileDef.name}“!`
    });
    return;
  }

  // 4. Support / Heal ('léčení')
  if (tileDef.type === 'léčení' && tileDef.supportAllies) {
    const allies = state.enemies.filter((e) => e.hp > 0 && e.id !== enemy.id);
    const targetAlly = allies.length > 0
      ? allies.sort((a, b) => Math.abs(a.cell - enemy.cell) - Math.abs(b.cell - enemy.cell))[0]
      : enemy;

    const healAmt = tileDef.healAmount || 1;
    const oldHp = targetAlly.hp;
    targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
    const healed = targetAlly.hp - oldHp;
    if (healed > 0) {
      events.push({
        type: 'heal',
        targetId: targetAlly.id,
        cell: targetAlly.cell,
        amount: healed
      });
    }
    if (tileDef.empowerAmount) {
      addStatus(targetAlly, 'empower', tileDef.empowerAmount, events);
    }
    events.push({
      type: 'log',
      text: `💉 ${enemy.name} provedla „${tileDef.name}“ na postavu ${targetAlly.name} (+${healed} HP, +Zesílení)!`
    });
    return;
  }

  // 5. Summon ('přivolání')
  if (tileDef.summonEnemyId) {
    const gates = [0, BOARD_SIZE - 1];
    const freeGate = gates.find((g) => !getEntityAt(state, g));
    if (freeGate !== undefined) {
      const facing = freeGate === 0 ? 1 : -1;
      const spawned = createEnemyInstance(tileDef.summonEnemyId, freeGate, facing);
      state.enemies.push(spawned);
      events.push({
        type: 'spawn',
        enemy: structuredClone(spawned),
        cell: freeGate
      });
      events.push({
        type: 'log',
        text: `🦇 ${enemy.name} přivolal posilu: ${spawned.name} na bráně ${freeGate + 1}!`
      });
    }
    if (!tileDef.pattern || tileDef.pattern.length === 0) {
      return;
    }
  }

  // 6. Optional lunge before strike (e.g., Drábův výpad)
  if (tileDef.lungeForward) {
    const stepCell = enemy.cell + enemy.facing * tileDef.lungeForward;
    if (isValidCell(stepCell) && !getEntityAt(state, stepCell)) {
      const fromCell = enemy.cell;
      enemy.cell = stepCell;
      events.push({
        type: 'move',
        entityId: enemy.id,
        from: fromCell,
        to: stepCell,
        facing: enemy.facing
      });
      triggerCellTerrainOnEnter(state, enemy, stepCell, events);
      if (enemy.hp <= 0) return;
    }
  }

  // 7. Attack / Shoot execution into SPECIFIC CELLS based on CURRENT position and facing
  const inGarlic = state.terrain[enemy.cell]?.type === 'garlic_cloud';
  const garlicPenalty = inGarlic ? 1 : 0;
  const empowerBonus = enemy.statuses?.empower || 0;

  if (tileDef.projectileRange) {
    let hitTarget = null;
    let hitPat = null;
    let endCell = enemy.cell;

    for (const pat of tileDef.pattern || []) {
      const c = enemy.cell + enemy.facing * pat.offset;
      if (!isValidCell(c)) break;
      endCell = c;
      const occupant = getEntityAt(state, c);
      if (occupant && occupant.id !== enemy.id) {
        hitTarget = occupant;
        hitPat = pat;
        break;
      }
    }

    events.push({
      type: 'enemy_projectile_vfx',
      enemyId: enemy.id,
      from: enemy.cell,
      to: endCell,
      facing: enemy.facing
    });

    if (hitTarget && hitPat) {
      resolveEnemyHitOnTarget(state, enemy, tileDef, hitPat, hitTarget, empowerBonus, garlicPenalty, events);
    } else {
      events.push({
        type: 'log',
        text: `💨 ${enemy.name} vystřelil „${tileDef.name}“, ale trefil jen holou zeď.`
      });
    }
  } else {
    let anyHit = false;
    for (const pat of tileDef.pattern || []) {
      const targetCell = enemy.cell + enemy.facing * pat.offset;
      if (!isValidCell(targetCell)) continue;

      events.push({
        type: 'enemy_strike_vfx',
        enemyId: enemy.id,
        from: enemy.cell,
        cell: targetCell
      });

      const occupant = getEntityAt(state, targetCell);
      if (occupant && occupant.id !== enemy.id) {
        anyHit = true;
        resolveEnemyHitOnTarget(state, enemy, tileDef, pat, occupant, empowerBonus, garlicPenalty, events);
      }
    }

    if (!anyHit && (tileDef.pattern || []).length > 0) {
      events.push({
        type: 'log',
        text: `💨 ${enemy.name} promáchl akcí „${tileDef.name}“ do prázdna!`
      });
    }
  }

  if (enemy.statuses?.empower) {
    delete enemy.statuses.empower;
  }
}

function resolveEnemyHitOnTarget(state, attacker, tileDef, pat, target, empowerBonus, garlicPenalty, events) {
  const isFriendlyFire = target.entityType === 'enemy';
  const sextonBonus = isFriendlyFire && state.talismans?.includes('sexton_keyring') ? 1 : 0;
  const dmg = Math.max(0, (pat.dmg || 0) + empowerBonus - garlicPenalty + sextonBonus);

  if (isFriendlyFire) {
    state.stats.friendlyFireCount = (state.stats.friendlyFireCount || 0) + 1;
    const quote = state.rng.pick(STRINGS.friendlyFireQuotes) || STRINGS.friendlyFireQuotes[0];
    events.push({
      type: 'friendly_fire',
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetId: target.id,
      targetName: target.name,
      cell: target.cell,
      amount: dmg
    });
    events.push({
      type: 'log',
      text: `🧛‍♂️💥 FRIENDLY FIRE! ${attacker.name} zasáhl vlastního kumpána (${target.name})! ${quote}`
    });
  } else {
    events.push({
      type: 'log',
      text: `⚔️ ${attacker.name} zasáhl cíl ${target.name} akcí „${tileDef.name}“ (${dmg} DMG)!`
    });
  }

  if (dmg > 0) {
    const dealt = applyDamage(
      state,
      target,
      dmg,
      {
        type: 'direct',
        attackerId: attacker.id,
        attackerCell: attacker.cell,
        reason: tileDef.id
      },
      events
    );

    if (tileDef.lifesteal && dealt > 0 && attacker.hp > 0) {
      const heal = Math.min(attacker.maxHp - attacker.hp, tileDef.lifesteal);
      if (heal > 0) {
        attacker.hp += heal;
        events.push({
          type: 'heal',
          targetId: attacker.id,
          cell: attacker.cell,
          amount: heal
        });
      }
    }
  }

  const hitDir = Math.sign(target.cell - attacker.cell) || attacker.facing;
  for (const eff of pat.effects || []) {
    if (target.hp <= 0) break;
    if (eff.type === 'push') {
      pushEntity(state, target, hitDir, eff.distance || 1, events);
    } else if (eff.type === 'bleed') {
      addStatus(target, 'bleed', eff.amount || 2, events);
    } else if (eff.type === 'confusion') {
      addStatus(target, 'confusion', eff.amount || 1, events);
    } else if (eff.type === 'stun') {
      addStatus(target, 'stun', eff.amount || 1, events);
    }
  }
}

export function getNextFiringEnemy(state) {
  if (!state || !state.enemies || !state.hero || state.hero.hp <= 0) return null;
  const orderedEnemies = getSortedEnemiesByInitiative(state);
  for (const enemy of orderedEnemies) {
    if (enemy.hp > 0 && !(enemy.statuses?.stun > 0)) {
      const isArmedQueue =
        (enemy.queueState === 'ARMED_RED' || enemy.countdown <= 1) && (enemy.actionQueue || []).length > 0;
      if (isArmedQueue) {
        return enemy;
      }
    }
  }
  return null;
}

export function getEnemyQueuedTargetCells(state, enemy) {
  if (!enemy || !enemy.actionQueue || enemy.actionQueue.length === 0) return [];
  const cells = new Set();
  let currentCell = enemy.cell;
  const facing = enemy.facing;

  for (const tileId of enemy.actionQueue) {
    const def = ENEMY_TILES[tileId];
    if (!def) continue;

    let origin = currentCell;
    if (def.lungeForward) {
      const lungeCell = currentCell + facing * def.lungeForward;
      if (isValidCell(lungeCell)) {
        origin = lungeCell;
      }
    }

    if (def.projectileRange) {
      for (const pat of def.pattern || []) {
        const c = origin + facing * pat.offset;
        if (!isValidCell(c)) break;
        cells.add(c);
        const occupant = getEntityAt(state, c);
        if (occupant && occupant.id !== enemy.id) break;
      }
    } else {
      for (const pat of def.pattern || []) {
        const c = origin + facing * pat.offset;
        if (isValidCell(c)) {
          cells.add(c);
        }
      }
    }
  }
  return Array.from(cells).sort((a, b) => a - b);
}

export function getAvailablePlayerReactions(state) {
  if (!state || !state.hero || state.hero.hp <= 0) {
    return {
      canStepLeft: false,
      canStepRight: false,
      canTurn: false,
      canParry: false,
      canCounter: false
    };
  }
  const hero = state.hero;
  const leftCell = hero.cell - 1;
  const rightCell = hero.cell + 1;
  const canStepLeft = isValidCell(leftCell) && !getEntityAt(state, leftCell);
  const canStepRight = isValidCell(rightCell) && !getEntityAt(state, rightCell);
  const frontCell = hero.cell + hero.facing;
  const frontOcc = isValidCell(frontCell) ? getEntityAt(state, frontCell) : null;
  const canCounter = Boolean(frontOcc && frontOcc.hp > 0 && frontOcc.entityType === 'enemy');

  return {
    canStepLeft,
    canStepRight,
    canTurn: true,
    canParry: true,
    canCounter
  };
}

export function applyPlayerReaction(state, reactionType, events = []) {
  if (!state.hero || state.hero.hp <= 0) return { ok: false };
  const hero = state.hero;

  if (reactionType === 'step_left') {
    const targetCell = hero.cell - 1;
    if (isValidCell(targetCell) && !getEntityAt(state, targetCell)) {
      const fromCell = hero.cell;
      hero.cell = targetCell;
      events.push({
        type: 'move',
        entityId: hero.id,
        from: fromCell,
        to: targetCell,
        facing: hero.facing,
        isReaction: true
      });
      events.push({
        type: 'player_reaction',
        reactionType: 'step_left',
        from: fromCell,
        to: targetCell
      });
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Venca uskočil o pole vlevo na pole ${targetCell + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, targetCell, events);
      return { ok: true, reactionType };
    } else {
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Úkrok vlevo zablokován!`
      });
      return { ok: false, reason: 'blocked' };
    }
  }

  if (reactionType === 'step_right') {
    const targetCell = hero.cell + 1;
    if (isValidCell(targetCell) && !getEntityAt(state, targetCell)) {
      const fromCell = hero.cell;
      hero.cell = targetCell;
      events.push({
        type: 'move',
        entityId: hero.id,
        from: fromCell,
        to: targetCell,
        facing: hero.facing,
        isReaction: true
      });
      events.push({
        type: 'player_reaction',
        reactionType: 'step_right',
        from: fromCell,
        to: targetCell
      });
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Venca uskočil o pole vpravo na pole ${targetCell + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, targetCell, events);
      return { ok: true, reactionType };
    } else {
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Úkrok vpravo zablokován!`
      });
      return { ok: false, reason: 'blocked' };
    }
  }

  if (reactionType === 'turn') {
    hero.facing = -hero.facing;
    events.push({
      type: 'turn',
      entityId: hero.id,
      facing: hero.facing,
      isReaction: true
    });
    events.push({
      type: 'player_reaction',
      reactionType: 'turn',
      facing: hero.facing
    });
    events.push({
      type: 'log',
      text: `⚡ Blesková reakce: Venca se bleskově otočil ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}!`
    });
    return { ok: true, reactionType };
  }

  if (reactionType === 'parry' || reactionType === 'parry_dodge') {
    addStatus(hero, 'shield', 2, events);
    events.push({
      type: 'player_reaction',
      reactionType: 'parry',
      cell: hero.cell
    });
    events.push({
      type: 'log',
      text: `⚡ Blesková reakce: Venca pozvedl kryt a získal 2 Štít!`
    });
    return { ok: true, reactionType: 'parry' };
  }

  if (reactionType === 'counter' || reactionType === 'counter_thrust') {
    const targetCell = hero.cell + hero.facing;
    events.push({
      type: 'strike_vfx',
      from: hero.cell,
      cell: targetCell,
      tileId: 'oak_stake',
      isReaction: true
    });
    const occ = isValidCell(targetCell) ? getEntityAt(state, targetCell) : null;
    if (occ && occ.hp > 0) {
      applyDamage(state, occ, 2, { reason: 'counter_thrust', type: 'direct' }, events);
      events.push({
        type: 'player_reaction',
        reactionType: 'counter',
        targetId: occ.id,
        dmg: 2
      });
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Venca zasadil ${occ.name} bleskový protiúder kolíkem za 2 DMG!`
      });
    } else {
      events.push({
        type: 'log',
        text: `⚡ Blesková reakce: Venca bodnul kolíkem dopředu do prázdného pole!`
      });
    }
    return { ok: true, reactionType: 'counter' };
  }

  events.push({
    type: 'log',
    text: `🛡️ Venca pevně stojí a čelí odpalu fronty bez úhybu.`
  });
  return { ok: true, reactionType: 'skip' };
}
