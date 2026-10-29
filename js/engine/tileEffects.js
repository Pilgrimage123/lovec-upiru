import { GARLIC_CLOUD_DURATION } from '../config/constants.js';
import {
  isValidCell,
  getEntityAt,
  findNearestEmptyCell,
  addStatus,
  applyDamage,
  pushEntity,
  pullEntity,
  triggerCellTerrainOnEnter,
  assertBoardInvariant
} from './board.js';
import { computeSlotBonuses } from './combo.js';

export function executeHeroTile(state, tile, slotIndex, comboLength, events = []) {
  if (!state.hero || state.hero.hp <= 0 || !tile) return;

  const bonuses = computeSlotBonuses(state, tile, slotIndex);
  const hero = state.hero;

  events.push({
    type: 'tile_start',
    tileId: tile.id,
    instanceId: tile.instanceId,
    tileName: tile.name,
    slotIndex,
    isOpener: bonuses.isOpener,
    isFinisher: bonuses.isFinisher
  });

  // Self effects before attack
  if (tile.selfEffect) {
    addStatus(hero, tile.selfEffect.type, tile.selfEffect.amount || 1, events);
  }
  if (bonuses.selfEmpower > 0) {
    addStatus(hero, 'empower', bonuses.selfEmpower, events);
  }

  // Movement / Leap tile (e.g. Hospodský přemet přes pupík)
  if (tile.leapDistance) {
    const startCell = hero.cell;
    if (tile.leaveGarlicCloud) {
      state.terrain[startCell] = {
        type: 'garlic_cloud',
        duration: GARLIC_CLOUD_DURATION
      };
      events.push({
        type: 'terrain_spawn',
        terrainType: 'garlic_cloud',
        cell: startCell
      });
      events.push({
        type: 'log',
        text: `🧄 Venca zanechal na poli ${startCell + 1} štiplavý Česnekový oblak!`
      });
    }

    const desiredCell = hero.cell + hero.facing * tile.leapDistance;
    const landingCell = findNearestEmptyCell(state, desiredCell, hero.facing);

    if (landingCell !== null && landingCell !== hero.cell) {
      hero.cell = landingCell;
      events.push({
        type: 'leap',
        entityId: hero.id,
        from: startCell,
        to: landingCell
      });
      events.push({
        type: 'log',
        text: `🤸 ${tile.name}: Venca přeskočil z pole ${startCell + 1} na pole ${landingCell + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, landingCell, events);
    }
  } else if (tile.projectileRange) {
    // Projectile raycast: hits first non-hero entity in range
    let hitTarget = null;
    let hitPat = null;
    let hitCell = null;

    for (const pat of tile.pattern || []) {
      const c = hero.cell + hero.facing * pat.offset;
      if (!isValidCell(c)) break;
      hitCell = c;
      const occupant = getEntityAt(state, c);
      if (occupant && occupant.id !== hero.id) {
        hitTarget = occupant;
        hitPat = pat;
        break;
      }
    }

    events.push({
      type: 'projectile_vfx',
      from: hero.cell,
      to: hitCell ?? hero.cell,
      facing: hero.facing,
      tileId: tile.id
    });

    if (hitTarget && hitPat) {
      resolveSinglePatternHit(state, tile, hitPat, hitTarget, bonuses, comboLength, events);
    } else {
      events.push({
        type: 'tile_whiff',
        tileId: tile.id,
        cell: hitCell ?? hero.cell
      });
      events.push({
        type: 'log',
        text: `💨 ${tile.name} prolétla prázdnou chodbou naprázdno.`
      });
    }
  } else {
    // Pattern melee / area hits
    let anyHit = false;
    for (const pat of tile.pattern || []) {
      const targetCell = hero.cell + hero.facing * pat.offset;
      if (!isValidCell(targetCell)) continue;

      events.push({
        type: 'strike_vfx',
        from: hero.cell,
        cell: targetCell,
        tileId: tile.id
      });

      // Terrain spawning effects that happen on the cell regardless of occupant
      for (const eff of pat.effects || []) {
        if (eff.type === 'spawn_spikes') {
          state.terrain[targetCell] = { type: 'spikes' };
          events.push({
            type: 'terrain_spawn',
            terrainType: 'spikes',
            cell: targetCell
          });
          events.push({
            type: 'log',
            text: `🗡️ Z podlahy na poli ${targetCell + 1} vyrazily naostřené kůly!`
          });
        } else if (eff.type === 'spawn_garlic_target') {
          state.terrain[targetCell] = {
            type: 'garlic_cloud',
            duration: GARLIC_CLOUD_DURATION
          };
          events.push({
            type: 'terrain_spawn',
            terrainType: 'garlic_cloud',
            cell: targetCell
          });
        }
      }

      const occupant = getEntityAt(state, targetCell);
      if (occupant && occupant.id !== hero.id) {
        anyHit = true;
        resolveSinglePatternHit(state, tile, pat, occupant, bonuses, comboLength, events);
      }
    }

    if (!anyHit && (tile.pattern || []).length > 0) {
      events.push({
        type: 'tile_whiff',
        tileId: tile.id,
        cell: hero.cell + hero.facing
      });
      events.push({
        type: 'log',
        text: `💨 ${tile.name} promáchla do prázdného vzduchu.`
      });
    }
  }

  // Consume hero empower if an offensive tile was used
  if (tile.dmg > 0 || bonuses.dmgBonus > 0) {
    state.firstAttackUsed = true;
    if (hero.statuses?.empower) {
      delete hero.statuses.empower;
    }
  }

  // Self-flip after tile (e.g., Facka růžencem)
  if (tile.selfFlipAfter && hero.hp > 0) {
    hero.facing = -hero.facing;
    events.push({
      type: 'turn',
      entityId: hero.id,
      facing: hero.facing,
      free: true
    });
    events.push({
      type: 'log',
      text: `🔄 Venca se po ráně otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  }

  assertBoardInvariant(state);
}

function resolveSinglePatternHit(state, tile, pat, target, bonuses, comboLength, events) {
  const hero = state.hero;
  const hitDir = Math.sign(target.cell - hero.cell) || hero.facing;
  const totalDmg = Math.max(0, (pat.dmg || 0) + bonuses.dmgBonus);

  if (totalDmg > 0) {
    const dealt = applyDamage(
      state,
      target,
      totalDmg,
      {
        type: 'direct',
        attackerId: hero.id,
        attackerCell: hero.cell,
        isComboHit: comboLength >= 2,
        reason: tile.id
      },
      events
    );
    state.stats.damageDealt = (state.stats.damageDealt || 0) + dealt;
  }

  // Apply opener flip bonus even if target survived (e.g., Hasičská stříkačka)
  if (bonuses.flipTarget && target.hp > 0 && target.entityType === 'enemy') {
    target.facing = -target.facing;
    events.push({
      type: 'turn',
      entityId: target.id,
      facing: target.facing
    });
    events.push({
      type: 'log',
      text: `🔄 Proud svěcené vody otočil postavu ${target.name} čelem vzad!`
    });
  }

  // Execute pattern effects on surviving target
  for (const eff of pat.effects || []) {
    if (target.hp <= 0) break;

    switch (eff.type) {
      case 'push':
        pushEntity(state, target, hitDir, eff.distance || 1, events);
        break;
      case 'pull':
        pullEntity(state, target, hero.cell, events);
        break;
      case 'flip_target':
        if (target.entityType === 'enemy') {
          target.facing = -target.facing;
          events.push({
            type: 'turn',
            entityId: target.id,
            facing: target.facing
          });
          events.push({
            type: 'log',
            text: `🔄 ${target.name} byl otočen čelem vzad!`
          });
        }
        break;
      case 'stun':
        addStatus(target, 'stun', eff.amount || 1, events);
        break;
      case 'bleed':
        addStatus(target, 'bleed', eff.amount || 2, events);
        break;
      case 'confusion':
        addStatus(target, 'confusion', eff.amount || 1, events);
        break;
      default:
        break;
    }
  }
}
