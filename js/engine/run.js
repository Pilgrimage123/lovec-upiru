import { HERO_START_HP, HERO_START_GOLD, NODE_TYPES } from '../config/constants.js';
import { HERO_TILES, getHeroTileDefinition } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { createRng } from './rng.js';

export function createNewRun(seedInput = 'VENCA-1899') {
  const seed = String(seedInput || 'VENCA-1899').trim() || 'VENCA-1899';
  const rng = createRng(seed);

  const deck = [
    { id: 'oak_stake', upgradeLevel: 0, permanentCdReduction: 0 },
    { id: 'garlic_belch', upgradeLevel: 0, permanentCdReduction: 0 },
    { id: 'holy_syringe', upgradeLevel: 0, permanentCdReduction: 0 },
    { id: 'belly_vault', upgradeLevel: 0, permanentCdReduction: 0 }
  ];

  const runState = {
    seed,
    rng,
    act: 1,
    heroMaxHp: HERO_START_HP,
    heroHp: HERO_START_HP,
    gold: HERO_START_GOLD,
    deck,
    talismans: [],
    visitedEvents: [],
    currentNodeId: null,
    completedNodeIds: [],
    map: null,
    status: 'active', // 'active' | 'victory' | 'defeat'
    stats: {
      battlesWon: 0,
      elitesDefeated: 0,
      bossesDefeated: 0,
      totalDamageDealt: 0,
      totalFriendlyFire: 0,
      totalTurns: 0,
      goldEarned: HERO_START_GOLD
    }
  };

  runState.map = generateActMap(runState, 1);
  return runState;
}

export function generateActMap(runState, actNumber) {
  const rng = runState.rng;
  // 6 tiers per act:
  // Tier 0: Entry battle (Tutorial in Act 1, standard battle in Act 2/3)
  // Tier 1: Branching (Battle / Event)
  // Tier 2: Branching (Pub / Workshop / Battle)
  // Tier 3: Branching (Elite / Treasure / Event)
  // Tier 4: Rest & Prep (Pub / Workshop)
  // Tier 5: Act Boss

  const encounterPrefix = `act${actNumber}`;
  const nodes = [];

  // Tier 0
  const startNode = {
    id: `a${actNumber}_t0_n0`,
    tier: 0,
    lane: 1,
    type: NODE_TYPES.BATTLE,
    title: actNumber === 1 ? 'Noční vrátnice (Tutoriál)' : `Brána ${actNumber}. aktu`,
    encounterId: actNumber === 1 ? 'tutorial_1' : `${encounterPrefix}_battle_1`,
    next: [`a${actNumber}_t1_n0`, `a${actNumber}_t1_n1`]
  };
  nodes.push(startNode);

  // Tier 1 (2 nodes)
  const t1LeftType = rng.nextFloat() < 0.65 ? NODE_TYPES.BATTLE : NODE_TYPES.EVENT;
  const t1RightType = t1LeftType === NODE_TYPES.BATTLE ? NODE_TYPES.EVENT : NODE_TYPES.BATTLE;

  nodes.push({
    id: `a${actNumber}_t1_n0`,
    tier: 1,
    lane: 0,
    type: t1LeftType,
    title: getNodeTitle(t1LeftType),
    encounterId: t1LeftType === NODE_TYPES.BATTLE ? `${encounterPrefix}_battle_1` : null,
    next: [`a${actNumber}_t2_n0`, `a${actNumber}_t2_n1`]
  });
  nodes.push({
    id: `a${actNumber}_t1_n1`,
    tier: 1,
    lane: 2,
    type: t1RightType,
    title: getNodeTitle(t1RightType),
    encounterId: t1RightType === NODE_TYPES.BATTLE ? `${encounterPrefix}_battle_1` : null,
    next: [`a${actNumber}_t2_n1`, `a${actNumber}_t2_n2`]
  });

  // Tier 2 (3 nodes: Workshop, Battle, Pub)
  const t2Types = rng.shuffle([NODE_TYPES.WORKSHOP, NODE_TYPES.BATTLE, NODE_TYPES.PUB]);
  t2Types.forEach((type, idx) => {
    nodes.push({
      id: `a${actNumber}_t2_n${idx}`,
      tier: 2,
      lane: idx,
      type,
      title: getNodeTitle(type),
      encounterId: type === NODE_TYPES.BATTLE ? `${encounterPrefix}_battle_2` : null,
      next: idx === 0
        ? [`a${actNumber}_t3_n0`]
        : idx === 1
        ? [`a${actNumber}_t3_n0`, `a${actNumber}_t3_n1`]
        : [`a${actNumber}_t3_n1`]
    });
  });

  // Tier 3 (2 nodes: Elite vs Treasure/Battle)
  nodes.push({
    id: `a${actNumber}_t3_n0`,
    tier: 3,
    lane: 0,
    type: NODE_TYPES.ELITE,
    title: 'Elitní strážnice',
    encounterId: `${encounterPrefix}_elite`,
    next: [`a${actNumber}_t4_n0`, `a${actNumber}_t4_n1`]
  });

  const t3RightType = rng.nextFloat() < 0.5 ? NODE_TYPES.TREASURE : NODE_TYPES.BATTLE;
  nodes.push({
    id: `a${actNumber}_t3_n1`,
    tier: 3,
    lane: 2,
    type: t3RightType,
    title: getNodeTitle(t3RightType),
    encounterId: t3RightType === NODE_TYPES.BATTLE ? `${encounterPrefix}_battle_2` : null,
    next: [`a${actNumber}_t4_n0`, `a${actNumber}_t4_n1`]
  });

  // Tier 4 (2 nodes before Boss: Pub & Workshop)
  nodes.push({
    id: `a${actNumber}_t4_n0`,
    tier: 4,
    lane: 0,
    type: NODE_TYPES.PUB,
    title: 'Hospoda U Svěcené pípy',
    encounterId: null,
    next: [`a${actNumber}_t5_n0`]
  });
  nodes.push({
    id: `a${actNumber}_t4_n1`,
    tier: 4,
    lane: 2,
    type: NODE_TYPES.WORKSHOP,
    title: 'Kolářská dílna',
    encounterId: null,
    next: [`a${actNumber}_t5_n0`]
  });

  // Tier 5 (Boss)
  nodes.push({
    id: `a${actNumber}_t5_n0`,
    tier: 5,
    lane: 1,
    type: NODE_TYPES.BOSS,
    title: getBossTitle(actNumber),
    encounterId: `${encounterPrefix}_boss`,
    next: []
  });

  return {
    act: actNumber,
    nodes
  };
}

function getNodeTitle(type) {
  switch (type) {
    case NODE_TYPES.BATTLE:
      return 'Upíří hlídka';
    case NODE_TYPES.ELITE:
      return 'Elitní dráb';
    case NODE_TYPES.PUB:
      return 'Hospoda U Svěcené pípy';
    case NODE_TYPES.WORKSHOP:
      return 'Kolářská dílna';
    case NODE_TYPES.EVENT:
      return 'Podivné setkání';
    case NODE_TYPES.TREASURE:
      return 'Zapomenutá truhlice';
    case NODE_TYPES.BOSS:
      return 'Hradní Boss';
    default:
      return 'Komnata';
  }
}

function getBossTitle(actNumber) {
  if (actNumber === 1) return 'Arcikníže von Sosák';
  if (actNumber === 2) return 'Hraběnka Dagmar';
  return 'Drákula, generální ředitel';
}

export function getAvailableNodes(runState) {
  if (!runState.map) return [];
  if (!runState.currentNodeId) {
    return runState.map.nodes.filter((n) => n.tier === 0);
  }
  const current = runState.map.nodes.find((n) => n.id === runState.currentNodeId);
  if (!current) return [];
  return runState.map.nodes.filter((n) => current.next.includes(n.id));
}

export function generateBattleRewardChoices(runState, isEliteOrBoss = false) {
  const rng = runState.rng;
  const choices = [];

  // Choice 1: New Tile
  const ownedTileIds = new Set(runState.deck.map((d) => d.id));
  const unownedTiles = Object.keys(HERO_TILES).filter((id) => !ownedTileIds.has(id));
  const tilePool = unownedTiles.length > 0 ? unownedTiles : Object.keys(HERO_TILES);
  const chosenTileId = rng.pick(tilePool);
  if (chosenTileId) {
    const def = getHeroTileDefinition(chosenTileId, 0);
    choices.push({
      type: 'tile',
      tileId: chosenTileId,
      title: `Destička: ${def.name}`,
      subtitle: `DMG ${def.dmg} · CD ${def.cooldown}`,
      description: def.description
    });
  }

  // Choice 2: Talisman
  const unownedTalismans = Object.keys(TALISMANS).filter(
    (id) => !runState.talismans.includes(id)
  );
  if (unownedTalismans.length > 0) {
    const talId = rng.pick(unownedTalismans);
    const tal = TALISMANS[talId];
    choices.push({
      type: 'talisman',
      talismanId: talId,
      title: `${tal.badge} Talisman: ${tal.name}`,
      subtitle: 'Pasivní relikvie',
      description: tal.description
    });
  }

  // Choice 3: Gold Pouch
  const goldAmount = isEliteOrBoss ? 28 : 16;
  choices.push({
    type: 'gold',
    amount: goldAmount,
    title: `💰 Měšec berního úřadu (+${goldAmount} dukátů)`,
    subtitle: 'Hotovost do hospody a dílny',
    description: `Přidá ${goldAmount} poctivých dukátů do Vencova měšce.`
  });

  return choices;
}

export function grantTileToRun(runState, tileId) {
  const existing = runState.deck.find((d) => d.id === tileId);
  if (existing && (existing.upgradeLevel || 0) < 2) {
    existing.upgradeLevel = (existing.upgradeLevel || 0) + 1;
    return existing;
  }
  const entry = { id: tileId, upgradeLevel: 0, permanentCdReduction: 0 };
  runState.deck.push(entry);
  return entry;
}

export function grantTalismanToRun(runState, talismanId) {
  if (!runState.talismans.includes(talismanId)) {
    runState.talismans.push(talismanId);
    if (talismanId === 'butcher_apron') {
      runState.heroMaxHp += 2;
      runState.heroHp += 2;
    }
  }
}

export function upgradeTileInRun(runState, deckIndex) {
  const item = runState.deck[deckIndex];
  if (!item) return false;
  if ((item.upgradeLevel || 0) >= 2) return false;
  item.upgradeLevel = (item.upgradeLevel || 0) + 1;
  return true;
}

export function reduceTileCooldownInRun(runState, deckIndex) {
  const item = runState.deck[deckIndex];
  if (!item) return false;
  const def = getHeroTileDefinition(item.id, item.upgradeLevel || 0);
  const currentMax = Math.max(1, def.cooldown - (item.permanentCdReduction || 0));
  if (currentMax <= 1) return false;
  item.permanentCdReduction = (item.permanentCdReduction || 0) + 1;
  return true;
}

export function advanceActIfBossDefeated(runState) {
  if (runState.act < 3) {
    runState.act += 1;
    runState.currentNodeId = null;
    runState.heroHp = Math.min(runState.heroMaxHp, runState.heroHp + 3);
    runState.map = generateActMap(runState, runState.act);
    return { newAct: runState.act, victory: false };
  }
  runState.status = 'victory';
  return { newAct: 3, victory: true };
}
