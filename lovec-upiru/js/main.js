import { ANIMATION_TIMINGS, NODE_TYPES } from './config/constants.js';
import { createBattleState } from './engine/state.js';
import {
  playerStep,
  playerTurnAround,
  playerWait,
  playerEnqueueTile,
  playerRemoveFromQueue,
  playerReorderQueue,
  playerPrepareQueue,
  executeQueuedTileStep,
  finalizeQueueExecution,
  checkBattleOutcome
} from './engine/rules.js';
import {
  createNewRun,
  generateBattleRewardChoices,
  advanceActIfBossDefeated
} from './engine/run.js';
import { pickRandomEvent } from './engine/events.js';
import { initAssets } from './ui/assets.js';
import { renderHud } from './ui/hud.js';
import { renderBattleBoard, playEngineEvents, sleep } from './ui/renderer.js';
import { renderTileBar } from './ui/tileBar.js';
import { renderChronicleLog } from './ui/log.js';
import { renderMapScreen } from './ui/mapScreen.js';
import {
  openRulesModal,
  openFullLogModal,
  openSettingsModal,
  openBattleRewardModal,
  openPubModal,
  openWorkshopModal,
  openEventModal,
  openTreasureModal,
  openRunEndModal
} from './ui/modal.js';
import { initTooltips, hideTooltip } from './ui/tooltips.js';
import { initKeyboardInput } from './ui/input.js';
import { setSoundEnabled, SFX } from './ui/audio.js';

const META_STORAGE_KEY = 'lovec_upiru_meta_v1';

const appState = {
  screen: 'battle', // 'battle' | 'map'
  runState: null,
  battleState: null,
  isAnimating: false,
  hoveredEnemyId: null,
  hoveredTileId: null,
  settings: {
    animSpeed: 1,
    soundEnabled: true,
    currentSeed: 'VENCA-1899'
  },
  metaStats: loadMetaStats()
};

function loadMetaStats() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return {
    bestAct: 1,
    victories: 0,
    totalKills: 0,
    lastSeed: 'VENCA-1899'
  };
}

function saveMetaStats() {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(appState.metaStats));
  } catch {
    // ignore storage errors
  }
}

async function bootstrap() {
  initTooltips();

  const loadingBar = document.getElementById('loading-progress-fill');
  const loadingText = document.getElementById('loading-progress-text');
  const loadingScreen = document.getElementById('loading-overlay');

  await initAssets((loaded, total, key) => {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (loadingText) loadingText.textContent = `Načítám pergameny a postavy (${loaded}/${total}): ${key}...`;
  });

  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }

  initKeyboardInput({
    isInputLocked: () =>
      appState.isAnimating ||
      appState.screen !== 'battle' ||
      !document.getElementById('modal-root')?.classList.contains('hidden'),
    onStep: (dir) => handlePlayerStep(dir),
    onTurn: () => handlePlayerTurn(),
    onWait: () => handlePlayerWait(),
    onExecuteQueue: () => handleExecuteOrPrepareQueue(),
    onPopQueue: () => {
      if (appState.battleState && appState.battleState.queue.length > 0) {
        handleRemoveQueueSlot(appState.battleState.queue.length - 1);
      }
    },
    onHotkeyTile: (idx) => {
      const tile = appState.battleState?.hand[idx];
      if (tile) handleSelectTile(tile.instanceId);
    },
    onOpenRules: () => openRulesModal(document.getElementById('modal-root'))
  });

  startNewRun(appState.metaStats.lastSeed || 'VENCA-1899');
}

function startNewRun(seedInput = 'VENCA-1899') {
  appState.settings.currentSeed = seedInput;
  appState.metaStats.lastSeed = seedInput;
  saveMetaStats();

  appState.runState = createNewRun(seedInput);
  // Immediately launch the entry node of Act 1 (Tutorial / Gatehouse battle) so player is in action right away
  const firstNode = appState.runState.map.nodes[0];
  enterMapNode(firstNode);
}

function enterMapNode(node) {
  const run = appState.runState;
  const modalRoot = document.getElementById('modal-root');
  run.currentNodeId = node.id;

  if (
    node.type === NODE_TYPES.BATTLE ||
    node.type === NODE_TYPES.ELITE ||
    node.type === NODE_TYPES.BOSS
  ) {
    appState.screen = 'battle';
    appState.battleState = createBattleState({
      seed: `${run.seed}_${node.id}`,
      rng: run.rng,
      encounterId: node.encounterId,
      heroMaxHp: run.heroMaxHp,
      heroHp: run.heroHp,
      deck: run.deck,
      talismans: run.talismans
    });
    renderAll();
    return;
  }

  if (node.type === NODE_TYPES.PUB) {
    renderAll();
    openPubModal(modalRoot, run, () => {
      completeCurrentNodeAndShowMap();
    });
    return;
  }

  if (node.type === NODE_TYPES.WORKSHOP) {
    renderAll();
    openWorkshopModal(modalRoot, run, () => {
      completeCurrentNodeAndShowMap();
    });
    return;
  }

  if (node.type === NODE_TYPES.EVENT) {
    renderAll();
    const evDef = pickRandomEvent(run);
    openEventModal(modalRoot, run, evDef, () => {
      completeCurrentNodeAndShowMap();
    });
    return;
  }

  if (node.type === NODE_TYPES.TREASURE) {
    renderAll();
    openTreasureModal(modalRoot, run, () => {
      completeCurrentNodeAndShowMap();
    });
  }
}

function completeCurrentNodeAndShowMap() {
  const run = appState.runState;
  if (run.currentNodeId && !run.completedNodeIds.includes(run.currentNodeId)) {
    run.completedNodeIds.push(run.currentNodeId);
  }
  appState.battleState = null;
  appState.screen = 'map';
  renderAll();
}

function appendEventsToLog(state, events = [], turnOverride = null) {
  if (!state || !state.log || !Array.isArray(events)) return;
  const turnNum = turnOverride ?? state.turn;
  const turnTag = `[Kolo ${turnNum}]`;
  for (const ev of events) {
    if (ev.type === 'log' && ev.text) {
      const formatted = ev.text.startsWith('[Kolo')
        ? ev.text
        : `${turnTag} ${ev.text}`;
      state.log.push(formatted);
    }
  }
}

async function handlePlayerStep(dir) {
  if (appState.isAnimating || !appState.battleState) return;
  appState.isAnimating = true;
  hideTooltip();

  const turnBefore = appState.battleState.turn;
  const res = playerStep(appState.battleState, dir);
  appendEventsToLog(appState.battleState, res.events, turnBefore);
  await splitAndPlayTurnEvents(res.events);

  appState.isAnimating = false;
  renderAll();
  await checkPostActionBattleState();
}

async function handlePlayerTurn() {
  if (appState.isAnimating || !appState.battleState) return;
  appState.isAnimating = true;
  hideTooltip();

  const turnBefore = appState.battleState.turn;
  const res = playerTurnAround(appState.battleState);
  appendEventsToLog(appState.battleState, res.events, turnBefore);
  await splitAndPlayTurnEvents(res.events);

  appState.isAnimating = false;
  renderAll();
  await checkPostActionBattleState();
}

async function handlePlayerWait() {
  if (appState.isAnimating || !appState.battleState) return;
  appState.isAnimating = true;
  hideTooltip();

  const turnBefore = appState.battleState.turn;
  const res = playerWait(appState.battleState);
  appendEventsToLog(appState.battleState, res.events, turnBefore);
  await splitAndPlayTurnEvents(res.events);

  appState.isAnimating = false;
  renderAll();
  await checkPostActionBattleState();
}

async function handleSelectTile(instanceId) {
  if (appState.isAnimating || !appState.battleState) return;
  appState.isAnimating = true;
  hideTooltip();

  const turnBefore = appState.battleState.turn;
  const res = playerEnqueueTile(appState.battleState, instanceId);
  appendEventsToLog(appState.battleState, res.events, turnBefore);
  await splitAndPlayTurnEvents(res.events);

  appState.isAnimating = false;
  renderAll();
  await checkPostActionBattleState();
}

function handleRemoveQueueSlot(slotIdx) {
  if (appState.isAnimating || !appState.battleState) return;
  hideTooltip();
  const res = playerRemoveFromQueue(appState.battleState, slotIdx);
  if (res.ok) {
    appendEventsToLog(appState.battleState, res.events);
  }
  SFX.queueRemove();
  renderAll();
}

function handleReorderQueue(fromIdx, toIdx) {
  if (appState.isAnimating || !appState.battleState) return;
  hideTooltip();
  const res = playerReorderQueue(appState.battleState, fromIdx, toIdx);
  if (res.ok) {
    appendEventsToLog(appState.battleState, res.events);
    SFX.cardSelect();
    renderAll();
  }
}

export async function handleExecuteOrPrepareQueue() {
  const state = appState.battleState;
  if (appState.isAnimating || !state || state.queue.length === 0 || state.status !== 'playing') {
    return;
  }

  // 1. If queue is not yet prepared, preparing costs 1 full turn (enemies act!)
  if (!state.isQueuePrepared) {
    appState.isAnimating = true;
    hideTooltip();
    const turnBefore = state.turn;
    const res = playerPrepareQueue(state);
    appendEventsToLog(state, res.events, turnBefore);
    SFX.cardSelect?.();
    await splitAndPlayTurnEvents(res.events);

    appState.isAnimating = false;
    renderAll();
    await checkPostActionBattleState();
    return;
  }

  // 2. Queue is already prepared: execute the combo!
  await executeQueue();
}

// Required async queue execution with step-by-step pauses and processEnemyTurn()
export async function executeQueue() {
  const state = appState.battleState;
  if (appState.isAnimating || !state || state.queue.length === 0 || state.status !== 'playing') {
    return;
  }

  appState.isAnimating = true;
  hideTooltip();

  const boardContainer = document.getElementById('center-stage');
  const queueSnapshot = [...state.queue];
  const comboLength = queueSnapshot.length;
  const turnBefore = state.turn;

  for (let i = 0; i < queueSnapshot.length; i++) {
    if (state.hero.hp <= 0) break;
    const tileInstanceId = queueSnapshot[i];
    const nextInstanceId = queueSnapshot[i + 1] || null;

    const stepEvents = executeQueuedTileStep(
      state,
      tileInstanceId,
      i,
      comboLength,
      nextInstanceId
    );
    appendEventsToLog(state, stepEvents, turnBefore);

    renderAll();
    await playEngineEvents(boardContainer, stepEvents, appState.settings.animSpeed);
    await sleep(ANIMATION_TIMINGS.QUEUE_STEP_MS, appState.settings.animSpeed);

    if (checkBattleOutcome(state) !== 'playing') {
      break;
    }
  }

  await sleep(ANIMATION_TIMINGS.TURN_TRANSITION_MS, appState.settings.animSpeed);
  await processEnemyTurn(comboLength);

  appState.isAnimating = false;
  renderAll();
  await checkPostActionBattleState();
}

export async function processEnemyTurn(comboLength = 1) {
  const state = appState.battleState;
  if (!state) return;
  const boardContainer = document.getElementById('center-stage');
  const turnBefore = state.turn;
  const endEvents = finalizeQueueExecution(state, comboLength);
  appendEventsToLog(state, endEvents, turnBefore);
  renderAll();
  await playEngineEvents(boardContainer, endEvents, appState.settings.animSpeed);
}

async function splitAndPlayTurnEvents(events = []) {
  const boardContainer = document.getElementById('center-stage');
  renderAll();
  await playEngineEvents(boardContainer, events, appState.settings.animSpeed);
}

async function checkPostActionBattleState() {
  const state = appState.battleState;
  const run = appState.runState;
  if (!state || !run) return;

  const modalRoot = document.getElementById('modal-root');

  if (state.status === 'lost' || state.hero.hp <= 0) {
    SFX.defeat();
    run.heroHp = 0;
    run.status = 'defeat';
    updateMetaStatsFromBattle(state, run, false);
    openRunEndModal(modalRoot, run, false, {
      onRetrySeed: (seed) => startNewRun(seed),
      onNewRun: (seed) => startNewRun(seed)
    });
    return;
  }

  if (state.status === 'won') {
    SFX.victory();
    run.heroHp = state.hero.hp;

    // Talisman: Placatka slivovice s křížkem heals +1 HP after each battle
    if (run.talismans.includes('sacred_flask')) {
      run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 1);
    }

    // Gold reward + sexton keyring friendly fire bonus
    const ffBonusGold = run.talismans.includes('sexton_keyring')
      ? (state.stats.friendlyFireCount || 0) * 3
      : 0;
    run.gold += (state.goldReward || 18) + ffBonusGold;

    updateMetaStatsFromBattle(state, run, true);

    if (state.isBoss) {
      run.stats.bossesDefeated += 1;
      const adv = advanceActIfBossDefeated(run);
      if (adv.victory) {
        appState.metaStats.victories = (appState.metaStats.victories || 0) + 1;
        saveMetaStats();
        openRunEndModal(modalRoot, run, true, {
          onRetrySeed: (seed) => startNewRun(seed),
          onNewRun: (seed) => startNewRun(seed)
        });
        return;
      }
      appState.metaStats.bestAct = Math.max(appState.metaStats.bestAct || 1, run.act);
      saveMetaStats();
      const choices = generateBattleRewardChoices(run, true);
      openBattleRewardModal(modalRoot, run, choices, () => {
        appState.battleState = null;
        appState.screen = 'map';
        renderAll();
      });
      return;
    }

    const choices = generateBattleRewardChoices(run, state.isElite);
    openBattleRewardModal(modalRoot, run, choices, () => {
      completeCurrentNodeAndShowMap();
    });
  }
}

function updateMetaStatsFromBattle(battleState, runState, won) {
  if (won) {
    runState.stats.battlesWon += 1;
    if (battleState.isElite) runState.stats.elitesDefeated += 1;
  }
  runState.stats.totalDamageDealt += battleState.stats.damageDealt || 0;
  runState.stats.totalFriendlyFire += battleState.stats.friendlyFireCount || 0;
  runState.stats.totalTurns += battleState.stats.turnsTaken || 0;

  appState.metaStats.totalKills =
    (appState.metaStats.totalKills || 0) + (battleState.stats.enemiesKilled || 0);
  appState.metaStats.bestAct = Math.max(appState.metaStats.bestAct || 1, runState.act);
  saveMetaStats();
}

function renderAll() {
  const hudRoot = document.getElementById('hud-root');
  const centerStage = document.getElementById('center-stage');
  const bottomRoot = document.getElementById('bottom-root');
  const logRoot = document.getElementById('log-root');
  const modalRoot = document.getElementById('modal-root');

  renderHud(hudRoot, appState.runState, appState.battleState, {
    onToggleMap: () => {
      if (appState.screen === 'map' && appState.battleState) {
        appState.screen = 'battle';
      } else {
        appState.screen = 'map';
      }
      renderAll();
    },
    onOpenRules: () => openRulesModal(modalRoot),
    onOpenSettings: () =>
      openSettingsModal(modalRoot, appState.settings, appState.metaStats, {
        onChangeAnimSpeed: (val) => {
          appState.settings.animSpeed = val;
        },
        onToggleSound: (enabled) => {
          appState.settings.soundEnabled = enabled;
          setSoundEnabled(enabled);
        },
        onStartNewRun: (seed) => startNewRun(seed)
      })
  });

  if (appState.screen === 'map' || !appState.battleState) {
    renderMapScreen(centerStage, appState.runState, {
      canReturnToBattle: Boolean(appState.battleState && appState.battleState.status === 'playing'),
      onReturnToBattle: () => {
        appState.screen = 'battle';
        renderAll();
      },
      onSelectNode: (node) => enterMapNode(node)
    });
    if (bottomRoot) bottomRoot.innerHTML = '';
    if (logRoot) logRoot.innerHTML = '';
    return;
  }

  renderBattleBoard(
    centerStage,
    appState.battleState,
    {
      hoveredEnemyId: appState.hoveredEnemyId,
      hoveredTileId: appState.hoveredTileId
    },
    {
      onRemoveQueueSlot: (slotIdx) => handleRemoveQueueSlot(slotIdx),
      onReorderQueue: (fromIdx, toIdx) => handleReorderQueue(fromIdx, toIdx),
      onHoverEnemy: (enemyId) => {
        if (appState.hoveredEnemyId !== enemyId) {
          appState.hoveredEnemyId = enemyId;
          renderBattleBoardOnly();
        }
      }
    }
  );

  renderTileBar(bottomRoot, appState.battleState, {
    onStep: (dir) => handlePlayerStep(dir),
    onTurn: () => handlePlayerTurn(),
    onWait: () => handlePlayerWait(),
    onExecuteQueue: () => handleExecuteOrPrepareQueue(),
    onSelectTile: (instanceId) => handleSelectTile(instanceId),
    onHoverTile: (instanceId) => {
      if (appState.hoveredTileId !== instanceId) {
        appState.hoveredTileId = instanceId;
        renderBattleBoardOnly();
      }
    }
  });

  renderChronicleLog(logRoot, appState.battleState, () => {
    openFullLogModal(modalRoot, appState.battleState?.log || []);
  });
}

function renderBattleBoardOnly() {
  if (appState.screen !== 'battle' || !appState.battleState) return;
  const centerStage = document.getElementById('center-stage');
  renderBattleBoard(
    centerStage,
    appState.battleState,
    {
      hoveredEnemyId: appState.hoveredEnemyId,
      hoveredTileId: appState.hoveredTileId
    },
    {
      onRemoveQueueSlot: (slotIdx) => handleRemoveQueueSlot(slotIdx),
      onReorderQueue: (fromIdx, toIdx) => handleReorderQueue(fromIdx, toIdx),
      onHoverEnemy: (enemyId) => {
        appState.hoveredEnemyId = enemyId;
      }
    }
  );
}

window.addEventListener('DOMContentLoaded', bootstrap);
