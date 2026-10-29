import assert from 'node:assert/strict';
import { createRng } from '../js/engine/rng.js';
import {
  assertBoardInvariant,
  getEntityAt,
  pushEntity,
  pullEntity,
  triggerCellTerrainOnEnter
} from '../js/engine/board.js';
import { createBattleState, createEnemyInstance, createPropInstance } from '../js/engine/state.js';
import {
  playerStep,
  playerTurnAround,
  playerEnqueueTile,
  playerRemoveFromQueue,
  playerReorderQueue,
  playerPrepareQueue,
  playerExecuteFullQueueSync,
  endPlayerTurn
} from '../js/engine/rules.js';
import { computeBoardThreats } from '../js/engine/threat.js';
import { createNewRun } from '../js/engine/run.js';

function createCleanTestBattle() {
  const state = createBattleState({
    seed: 'TEST-SEED-42',
    encounterId: 'tutorial_1'
  });
  state.enemies = [];
  state.props = [];
  state.reinforcements = [];
  for (let i = 0; i < state.terrain.length; i++) {
    state.terrain[i] = { type: 'none' };
  }
  state.hero.cell = 2;
  state.hero.facing = 1;
  state.hero.hp = 10;
  assertBoardInvariant(state);
  return state;
}

console.log('🧪 Spouštím testy herního enginu LOVEC UPÍRŮ...');

// 1. Invariant jedné entity na poli
{
  const state = createCleanTestBattle();
  state.enemies.push(createEnemyInstance('praktikant', 4, -1));
  assert.doesNotThrow(() => assertBoardInvariant(state));

  state.enemies.push(createEnemyInstance('urednik', 4, -1));
  assert.throws(() => assertBoardInvariant(state), /Invariant porušen/);
  console.log('  ✔ 1. Invariant jedné entity na poli ověřen');
}

// 2. Swap / Leapfrog (povolen při volném poli za cílem, zakázán při obsazeném poli nebo zdi)
{
  const state = createCleanTestBattle();
  state.hero.cell = 2;
  const enemy = createEnemyInstance('praktikant', 3, -1);
  state.enemies.push(enemy);

  // Pole 4 je volné -> swap uspěje
  const res1 = playerStep(state, 1);
  assert.equal(res1.ok, true);
  assert.equal(state.hero.cell, 3);
  assert.equal(enemy.cell, 2);
  assertBoardInvariant(state);

  // Nyní zablokujeme pole za nepřítelem sudem
  state.props.push(createPropInstance('barrel', 1));
  const resBlocked = playerStep(state, -1);
  assert.equal(resBlocked.ok, false);
  assert.equal(state.hero.cell, 3);
  assert.equal(enemy.cell, 2);
  console.log('  ✔ 2. Swap / Leapfrog (včetně blokace) ověřen');
}

// 3. Push s kolizemi (zeď i entita do entity +1 DMG oběma bez Staggeru)
{
  const state = createCleanTestBattle();
  const e1 = createEnemyInstance('drab', 4, -1);
  const e2 = createEnemyInstance('urednik', 5, -1);
  state.enemies.push(e1, e2);

  const initialHp1 = e1.hp;
  const initialHp2 = e2.hp;

  const events = [];
  pushEntity(state, e1, 1, 2, events);

  // e1 narazil do e2 na poli 5 -> oba dostanou 1 kolizní DMG (žádný Stagger)
  assert.equal(e1.cell, 4);
  assert.equal(e2.cell, 5);
  assert.equal(e1.hp, initialHp1 - 1);
  assert.equal(e2.hp, initialHp2 - 1);
  assert.equal(e1.statuses?.stagger || 0, 0);
  assert.equal(e2.statuses?.stagger || 0, 0);

  // Push do zdi na poli 6
  const eWall = createEnemyInstance('urednik', 6, -1);
  state.enemies = [eWall];
  const wallHpBefore = eWall.hp;
  pushEntity(state, eWall, 1, 1, []);
  assert.equal(eWall.hp, wallHpBefore - 1);
  assert.equal(eWall.statuses?.stagger || 0, 0);
  console.log('  ✔ 3. Push a kolize (entita i zeď s kolizním DMG, bez Staggeru) ověřeny');
}

// 4. Pull (přitáhne cíl těsně před útočníka)
{
  const state = createCleanTestBattle();
  state.hero.cell = 1;
  state.hero.facing = 1;
  const enemy = createEnemyInstance('urednik', 5, -1);
  state.enemies.push(enemy);

  pullEntity(state, enemy, state.hero.cell, []);
  assert.equal(enemy.cell, 2);
  assertBoardInvariant(state);
  console.log('  ✔ 4. Pull (přitažení před Vencu) ověřen');
}

// 5. Propast (okamžitá smrt pro chodící, létající netopýr přežije)
{
  const state = createCleanTestBattle();
  state.terrain[4] = { type: 'pit' };
  const walker = createEnemyInstance('praktikant', 3, -1);
  const flyer = createEnemyInstance('netopyr', 5, -1);
  state.enemies.push(walker, flyer);

  pushEntity(state, walker, 1, 1, []);
  assert.equal(walker.hp, 0);

  pushEntity(state, flyer, -1, 1, []);
  assert.equal(flyer.cell, 4);
  assert.equal(flyer.hp, 1);
  console.log('  ✔ 5. Propast (smrt vs. létající netopýr) ověřena');
}

// 6. Prohnilé prkno (1. stoupnutí zapraská, 2. stoupnutí se prolomí za 2 DMG)
{
  const state = createCleanTestBattle();
  state.terrain[3] = { type: 'plank_intact' };
  const e = createEnemyInstance('drab', 2, 1);
  state.enemies.push(e);
  const startHp = e.hp;

  // 1. stoupnutí -> praskne
  e.cell = 3;
  triggerCellTerrainOnEnter(state, e, 3, []);
  assert.equal(state.terrain[3].type, 'plank_cracked');
  assert.equal(e.hp, startHp);

  // 2. stoupnutí -> prolomí se a dá 2 DMG
  triggerCellTerrainOnEnter(state, e, 3, []);
  assert.equal(state.terrain[3].type, 'none');
  assert.equal(e.hp, startHp - 2);
  console.log('  ✔ 6. Prohnilé prkno (prasknutí a prolomení za 2 DMG) ověřeno');
}

// 7. Přepočet dosahu (Threat Overlay) při změně facing nepřítele
{
  const state = createCleanTestBattle();
  const enemy = createEnemyInstance('praktikant', 4, -1);
  // Nastavíme aktivní destičku na úder (index 1: intern_bite, 1 pole vpřed)
  enemy.queueIndex = 1;
  enemy.countdown = 2;
  state.enemies.push(enemy);

  let threats = computeBoardThreats(state);
  assert.equal(threats[3].totalDmg, 1);
  assert.equal(threats[5].totalDmg, 0);

  // Otočíme nepřítele doprava -> ohrožené pole se okamžitě přepočítá na 5
  enemy.facing = 1;
  threats = computeBoardThreats(state);
  assert.equal(threats[3].totalDmg, 0);
  assert.equal(threats[5].totalDmg, 1);
  console.log('  ✔ 7. Dynamický přepočet Threat Overlay při otočení ověřen');
}

// 8. Friendly Fire (upír zasáhne jiného upíra při odpočtu 0)
{
  const state = createCleanTestBattle();
  state.hero.cell = 0;
  const attacker = createEnemyInstance('praktikant', 4, 1); // dívá se doprava na pole 5!
  attacker.queueIndex = 1; // intern_bite (1 DMG na 1 pole vpřed)
  attacker.countdown = 1;

  const victim = createEnemyInstance('urednik', 5, -1);
  victim.countdown = 3;
  const victimHpBefore = victim.hp;

  state.enemies.push(attacker, victim);

  const events = [];
  endPlayerTurn(state, events);

  assert.equal(victim.hp, victimHpBefore - 1);
  assert.equal(state.stats.friendlyFireCount, 1);
  assert.ok(events.some((ev) => ev.type === 'friendly_fire'));
  console.log('  ✔ 8. Friendly Fire mezi upíry ověřen');
}

// 9. Bonusy slotů (Otevírák v 1. slotu a Zakončovák ve 3. slotu)
{
  const state = createBattleState({
    seed: 'SLOT-TEST',
    deck: [
      { id: 'holy_syringe', upgradeLevel: 0 }, // Otevírák: otočí cíl čelem vzad
      { id: 'funeral_shroud', upgradeLevel: 0 }, // Rychlovka
      { id: 'oak_stake', upgradeLevel: 0 } // Zakončovák: +2 DMG (celkem 4 DMG)
    ]
  });
  state.enemies = [];
  state.props = [];
  state.reinforcements = [];
  state.hero.cell = 2;
  state.hero.facing = 1;

  const target = createEnemyInstance('drab', 3, -1); // 7 HP, dívá se vlevo (-1)
  target.countdown = 9;
  state.enemies.push(target);

  // Vložíme 3 destičky do fronty
  playerEnqueueTile(state, state.hand[0].instanceId); // 1. slot: holy_syringe (Otevírák)
  playerEnqueueTile(state, state.hand[1].instanceId); // 2. slot: funeral_shroud
  playerEnqueueTile(state, state.hand[2].instanceId); // 3. slot: oak_stake (Zakončovák: 2 + 2 = 4 DMG, plus +1 Empower z plachty = 5 DMG)

  const execRes = playerExecuteFullQueueSync(state);
  assert.equal(execRes.ok, true);
  // Cíl dostal 1 DMG ze stříkačky + 5 DMG z kolíku (2 základ + 2 Zakončovák + 1 Empower) = 6 DMG -> zbývá 1 HP
  assert.equal(target.hp, 1);
  console.log('  ✔ 9. Bonusy slotů (Otevírák a Zakončovák) ověřeny');
}

// 10. Momentum a vyhodnocení fronty při smrti cíle uprostřed komba
{
  const state = createBattleState({
    seed: 'MOMENTUM-TEST',
    deck: [
      { id: 'oak_stake', upgradeLevel: 0 },
      { id: 'garlic_belch', upgradeLevel: 0 },
      { id: 'holy_syringe', upgradeLevel: 0 }
    ]
  });
  state.enemies = [];
  state.props = [];
  state.reinforcements = [];
  state.hero.cell = 2;
  state.hero.facing = 1;

  // Nepřítel má jen 2 HP -> zemře hned po 1. destičce ve frontě, 2. a 3. destička nesmí spadnout a aktivuje se Momentum!
  const weakEnemy = createEnemyInstance('praktikant', 3, -1);
  weakEnemy.hp = 2;
  weakEnemy.countdown = 10;
  state.enemies.push(weakEnemy);

  playerEnqueueTile(state, state.hand[0].instanceId);
  playerEnqueueTile(state, state.hand[1].instanceId);

  const res = playerExecuteFullQueueSync(state);
  assert.equal(res.ok, true);
  assert.equal(weakEnemy.hp, 0);
  assert.equal(state.status, 'won');
  assert.ok(res.events.some((e) => e.type === 'momentum'));
  // Cooldown oak_stake (3) byl snížen o délku komba (2) a o 1 na konci tahu = 0!
  assert.equal(state.hand[0].currentCooldown, 0);
  console.log('  ✔ 10. Momentum a bezpečné dohrání komba po smrti cíle ověřeno');
}

// 11. Deterministický seed
{
  const rngA = createRng('HRAD-KOST-1901');
  const rngB = createRng('HRAD-KOST-1901');
  const seqA = Array.from({ length: 10 }, () => rngA.nextInt(1, 1000));
  const seqB = Array.from({ length: 10 }, () => rngB.nextInt(1, 1000));
  assert.deepEqual(seqA, seqB);

  const runA = createNewRun('HRAD-KOST-1901');
  const runB = createNewRun('HRAD-KOST-1901');
  assert.deepEqual(
    runA.map.nodes.map((n) => n.type),
    runB.map.nodes.map((n) => n.type)
  );
  console.log('  ✔ 11. Deterministický seed (RNG i generování mapy) ověřen');
}

// 12. Otočení v Česnekovém oblaku zdarma + vyjmutí z fronty zdarma
{
  const state = createCleanTestBattle();
  state.enemies.push(createEnemyInstance('praktikant', 6, -1));
  state.terrain[state.hero.cell] = { type: 'garlic_cloud', duration: 2 };
  const turnBefore = state.turn;
  const turnRes = playerTurnAround(state);
  assert.equal(turnRes.ok, true);
  assert.equal(turnRes.freeTurn, true);
  assert.equal(state.turn, turnBefore);

  // Vložení a vyjmutí z fronty
  playerEnqueueTile(state, state.hand[0].instanceId);
  assert.equal(state.queue.length, 1);
  const remRes = playerRemoveFromQueue(state, 0);
  assert.equal(remRes.ok, true);
  assert.equal(state.queue.length, 0);
  assert.equal(state.hand[0].inQueue, false);
  console.log('  ✔ 12. Otočení v česneku zdarma a vyjmutí destičky z fronty ověřeno');
}

// 13. Libovolné přerovnání kombo fronty bez ceny tahu (0 tahů)
{
  const state = createCleanTestBattle();
  state.enemies.push(createEnemyInstance('drab', 5, -1));

  // Enqueue three tiles
  const t0 = state.hand[0].instanceId;
  const t1 = state.hand[1].instanceId;
  const t2 = state.hand[2].instanceId;

  playerEnqueueTile(state, t0);
  playerEnqueueTile(state, t1);
  playerEnqueueTile(state, t2);

  assert.deepEqual(state.queue, [t0, t1, t2]);
  const turnBefore = state.turn;

  // Move tile from index 2 to index 0 (drag & drop to front)
  const reorderRes1 = playerReorderQueue(state, 2, 0);
  assert.equal(reorderRes1.ok, true);
  assert.equal(reorderRes1.freeTurn, true);
  assert.equal(state.turn, turnBefore); // 0 turn cost!
  assert.deepEqual(state.queue, [t2, t0, t1]);
  assert.ok(reorderRes1.events.some((e) => e.type === 'queue_reorder'));

  // Move tile from index 0 back to index 1
  const reorderRes2 = playerReorderQueue(state, 0, 1);
  assert.equal(reorderRes2.ok, true);
  assert.equal(state.turn, turnBefore); // still 0 turn cost!
  assert.deepEqual(state.queue, [t0, t2, t1]);

  // Invalid indices check
  const badRes = playerReorderQueue(state, 99, 0);
  assert.equal(badRes.ok, false);
  assert.deepEqual(state.queue, [t0, t2, t1]);

  console.log('  ✔ 13. Libovolné přerovnání kombo fronty bez ceny tahu (0 tahů) ověřeno');
}

// 14. Deterministická AI: priorita otočení při hráči za zády a krok vpřed při vzdálenosti > 1
{
  const state = createCleanTestBattle();
  state.hero.cell = 5;
  state.hero.facing = -1;

  // Nepřítel na poli 3 dívající se vlevo (-1), hráč je na poli 5 (za zády nepřítele!)
  const e = createEnemyInstance('praktikant', 3, -1);
  state.enemies.push(e);

  // Krok 1: Hráč čeká 1 tah -> Nepřítel se MUSÍ nejdříve otočit doprava (1)
  endPlayerTurn(state, []);
  assert.equal(e.facing, 1);
  assert.equal(e.cell, 3);

  // Krok 2: Nepřítel se dívá doprava, ale hráč je na poli 5 (vzdálenost 2, dosah kousnutí 1)
  // Nepřítel popojde o 1 pole vpřed na pole 4
  endPlayerTurn(state, []);
  assert.equal(e.cell, 4);
  assert.equal(e.facing, 1);

  // Krok 3: Nyní je hráč v dosahu 1 pole -> nepřítel připraví útok a uzamkne se do ARMED_RED
  endPlayerTurn(state, []);
  assert.equal(e.queueState, 'ARMED_RED');
  assert.ok(e.actionQueue.length >= 1);
  console.log('  ✔ 14. Deterministické polohování (otočení při hráči za zády, krok vpřed a arming) ověřeno');
}

// 15. ARMED_RED Lock-in: nepřítel neotáčí směr ani neuhýbá, odpálí kombo do telegrafovaných polí
{
  const state = createCleanTestBattle();
  state.hero.cell = 2;

  // Drábová Božena na poli 3 dívající se doleva (-1)
  const drab = createEnemyInstance('drab', 3, -1);
  drab.queueState = 'ARMED_RED';
  drab.actionQueue = ['windup_roar', 'drab_lunge']; // kombo: nápřah + výpad (2 DMG + push)
  state.enemies.push(drab);

  // Hráč skočí za záda drábové na pole 4 (swap nebo krok)
  state.hero.cell = 4;

  const events = [];
  endPlayerTurn(state, events);

  // Drábová Božena byla uzamčena v ARMED_RED doleva (-1)
  // Odpálila kombo doleva do prázdna/zdi (neotočila se na Vencu!)
  assert.equal(drab.facing, -1);
  assert.equal(drab.queueState, 'EMPTY');
  assert.equal(drab.actionQueue.length, 0);
  assert.equal(state.hero.hp, 10); // Venca neutrpěl žádné poškození, protože stál za ní!
  console.log('  ✔ 15. ARMED_RED Lock-in (odpálení do telegrafovaných polí bez dobrovolného otočení) ověřeno');
}

// 16. Dynamický přepočet zón zásahu na podlaze při nuceném posunu (Push / Swap)
{
  const state = createCleanTestBattle();
  state.hero.cell = 0;

  // Nepřítel na poli 3 v ARMED_RED dívající se doprava (+1) s úderem na 1 pole
  const e = createEnemyInstance('praktikant', 3, 1);
  e.queueState = 'ARMED_RED';
  e.actionQueue = ['intern_bite'];
  state.enemies.push(e);

  // Původní telegrafovaná zóna na podlaze je pole 4
  let threats = computeBoardThreats(state);
  assert.equal(threats[4].isArmedRed, true);
  assert.equal(threats[4].totalDmg, 1);
  assert.equal(threats[2].isArmedRed, false);

  // Hráč nepřítele násilně odstrčí o 1 pole doprava (pushEntity)
  pushEntity(state, e, 1, 1, []);
  assert.equal(e.cell, 4);
  assert.equal(e.facing, 1); // Směr zůstává uzamčen
  assert.equal(e.queueState, 'ARMED_RED'); // Stav ARMED_RED přetrvává

  // Zóna zásahu se okamžitě přepočítá relativně k nové pozici -> pole 5!
  threats = computeBoardThreats(state);
  assert.equal(threats[4].isArmedRed, false);
  assert.equal(threats[5].isArmedRed, true);
  assert.equal(threats[5].totalDmg, 1);
  console.log('  ✔ 16. Dynamický přepočet zón zásahu při nuceném posunu ověřen');
}

// 17. Přerušení a pozdržení odpalu fronty omráčením (Stun)
{
  const state = createCleanTestBattle();
  state.hero.cell = 2;

  const e = createEnemyInstance('praktikant', 3, -1);
  e.queueState = 'ARMED_RED';
  e.actionQueue = ['intern_bite'];
  state.enemies.push(e);

  // Udělíme nepříteli omráčení (Stun) před vyhodnocením jeho tahu
  e.statuses.stun = 1;

  const events = [];
  endPlayerTurn(state, events);

  // Nepřítel byl omráčen: neodpálil frontu, fronta zůstala zachována a byla pozdržena!
  assert.equal(state.hero.hp, 10);
  assert.equal(e.queueState, 'ARMED_RED');
  assert.equal(e.actionQueue.length, 1);
  assert.ok(events.some((ev) => ev.type === 'enemy_stun_skipped'));
  console.log('  ✔ 17. Pozdržení odpalu fronty omráčením (Stun) ověřeno');
}

// 18. Umístění destičky do fronty stojí 1 tah (synchronní tahový systém)
{
  const state = createCleanTestBattle();
  const enemy = createEnemyInstance('praktikant', 5, -1);
  state.enemies.push(enemy);

  const turnBefore = state.turn;
  const tileId = state.hand[0].instanceId;

  const res = playerEnqueueTile(state, tileId);
  assert.equal(res.ok, true);
  assert.equal(res.freeTurn, false); // Stojí 1 tah!
  assert.equal(state.turn, turnBefore + 1); // Tah herního světa postoupil
  assert.equal(state.queue.length, 1);
  assert.equal(state.isQueuePrepared, false);
  console.log('  ✔ 18. Umístění destičky do fronty stojí 1 tah (a posouvá tah nepřátel) ověřeno');
}

// 19. Příprava na odpálení fronty stojí 1 tah a odpal vyčistí frontu
{
  const state = createCleanTestBattle();
  const enemy = createEnemyInstance('drab', 5, -1);
  state.enemies.push(enemy);

  // Vložíme 1 destičku do fronty
  playerEnqueueTile(state, state.hand[0].instanceId);
  assert.equal(state.isQueuePrepared, false);

  const turnBeforePrep = state.turn;
  const prepRes = playerPrepareQueue(state);
  assert.equal(prepRes.ok, true);
  assert.equal(state.isQueuePrepared, true);
  assert.equal(state.turn, turnBeforePrep + 1); // Příprava stála 1 tah!

  // Nyní provedeme odpal připraveného komba
  const execRes = playerExecuteFullQueueSync(state);
  assert.equal(execRes.ok, true);
  assert.equal(state.queue.length, 0);
  assert.equal(state.isQueuePrepared, false);
  console.log('  ✔ 19. Příprava odpalu komba (1 tah) a provedení odpalu ověřeno');
}

// 20. Vyřazení mechaniky Stagger ze hry
{
  const state = createCleanTestBattle();
  const enemy = createEnemyInstance('praktikant', 4, -1);
  state.enemies.push(enemy);

  // Status stagger nesmí existovat
  const { STATUSES } = await import('../js/config/statuses.js');
  assert.equal(STATUSES.stagger, undefined);

  // addStatus se staggerem nesmí nic přidat ani změnit
  const { addStatus } = await import('../js/engine/board.js');
  addStatus(enemy, 'stagger', 1, []);
  assert.equal(enemy.statuses?.stagger || 0, 0);
  console.log('  ✔ 20. Kompletní vyřazení mechaniky Stagger ověřeno');
}

console.log('✅ VŠECH 20 TESTOVACÍCH SAD ÚSPĚŠNĚ PROŠLO!');

