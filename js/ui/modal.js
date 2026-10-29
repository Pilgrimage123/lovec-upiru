import { HERO_TILES, getHeroTileDefinition } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import {
  grantTileToRun,
  grantTalismanToRun,
  upgradeTileInRun,
  reduceTileCooldownInRun
} from '../engine/run.js';
import { resolveEventChoice } from '../engine/events.js';

export function closeModal(modalRoot) {
  if (!modalRoot) return;
  modalRoot.innerHTML = '';
  modalRoot.classList.add('hidden');
}

export function openRulesModal(modalRoot) {
  modalRoot.classList.remove('hidden');
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>📖 Pravidla lovu upírů (Manuál Venci Česnekáče)</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body rules-grid">
          <div class="rule-block">
            <h4>1. 1D Bojiště (7 polí) a Ekonomika tahu</h4>
            <p>Na každém ze 7 kamenných polí smí stát nejvýše jedna postava nebo sud. Jeden tvůj <strong>TAH</strong> je právě jedna z akcí:</p>
            <ul>
              <li><strong>Krok vlevo / vpravo (A / D):</strong> Posun o 1 pole bez změny směru pohledu. Pokud na cílovém poli stojí upír či sud a pole <em>za ním</em> je volné, Venca ho přeskočí a prohodí si s ním místo (<strong>Swap / Leapfrog</strong>)!</li>
              <li><strong>Otočení (W):</strong> Změní směr pohledu (◀ / ▶). Stojíš-li v <strong>Česnekovém oblaku</strong>, je otočení <strong>ZDARMA (0 tahů)</strong>!</li>
              <li><strong>Čekání (S):</strong> Stojí 1 tah, sníží cooldowny tvých destiček.</li>
              <li><strong>Vložení destičky do Fronty (1–9 / klik):</strong> Stojí 1 tah (pokud destička nemá vlastnost <em>Rychlovka</em> = 0 tahů). Vyjmutí destičky z fronty zpět do ruky je vždy zdarma.</li>
              <li><strong>PROVÉST KOMBO (Mezerník / Space):</strong> Odpálí všechny destičky ve frontě zleva doprava za <strong>JEDEN tah</strong>!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>2. Fronty nepřátel, Záměry a Friendly Fire</h4>
            <ul>
              <li>Nad každým upírem vidíš jeho <strong>pořadí iniciativy (#1, #2, #3 zleva doprava)</strong> a pás jeho destiček akcí.</li>
              <li>První zvýrazněná destička má <strong>odpočet (⏳)</strong>. Na konci každého tvého tahu klesne odpočet o 1.</li>
              <li>Při odpočtu <strong>0</strong> upír provede akci do polí podle své <strong>AKTUÁLNÍ polohy a otočení</strong>!</li>
              <li><strong>FRIENDLY FIRE:</strong> Pokud upíra poodstrčíš, přitáhneš nebo otočíš hasičskou stříkačkou, při odpočtu 0 napálí plnou silou vlastního kolegu nebo sud!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>3. Kolize, Terén a Blesková reakce</h4>
            <ul>
              <li><strong>Odhození (Push) a Kolize:</strong> Narazí-li odhozená postava do zdi nebo do jiné postavy, utrpí obě <strong>+1 kolizní DMG</strong>. Vhození do sudu se zelím sud rozbije (2 DMG + Zmatení).</li>
              <li><strong>Blesková reakce:</strong> Když upíři odpálí svou červenou frontu, máš okamžitou šanci zareagovat – úkrokem z linie střelby, bleskovou otočkou, krytem (+2 Štít) nebo bleskovým protiúderem!</li>
              <li><strong>Terén:</strong> <em>Propast</em> = okamžitá smrt (kromě létajících netopýrů). <em>Kůly</em> = 2 DMG. <em>Prohnilé prkno</em> = 1. stoupnutí zapraská, 2. stoupnutí se prolomí za 2 DMG.</li>
              <li><strong>Momentum:</strong> Zabiješ-li posledního nepřítele bitvy kombem 2+ destiček, zkrátí se cooldowny všech tvých destiček o počet destiček v kombu!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
}

export function openFullLogModal(modalRoot, logs = []) {
  modalRoot.classList.remove('hidden');

  // Group log rows by Round if they contain [Kolo X]
  const turnGroups = [];
  let currentGroup = { turn: 1, entries: [] };

  logs.forEach((rawText, idx) => {
    const text = String(rawText || '');
    const match = text.match(/^\[Kolo\s+(\d+)\]\s*(.*)$/);
    if (match) {
      const turnNum = Number(match[1]);
      if (turnNum !== currentGroup.turn && currentGroup.entries.length > 0) {
        turnGroups.push(currentGroup);
        currentGroup = { turn: turnNum, entries: [] };
      } else {
        currentGroup.turn = turnNum;
      }
      currentGroup.entries.push({ idx: idx + 1, text: match[2] });
    } else {
      currentGroup.entries.push({ idx: idx + 1, text });
    }
  });
  if (currentGroup.entries.length > 0) {
    turnGroups.push(currentGroup);
  }

  const groupsHtml = turnGroups
    .map((grp) => `
      <div class="full-log-round-section">
        <div class="full-log-round-title">⚔️ Kolo ${grp.turn}</div>
        <div class="full-log-round-items">
          ${grp.entries.map((e) => `
            <div class="full-log-row">
              <span class="log-idx">#${e.idx}</span>
              <span class="log-row-text">${e.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `)
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>📜 Kompletní deník bojových událostí (${logs.length} záznamů)</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body full-log-scroll" id="full-log-scroll-area">
          ${groupsHtml || '<p>Kronikář zatím nezaznamenal žádné události.</p>'}
        </div>
      </div>
    </div>
  `;

  const scrollArea = modalRoot.querySelector('#full-log-scroll-area');
  if (scrollArea) {
    setTimeout(() => {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 20);
  }

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
}

export function openSettingsModal(modalRoot, settings, metaStats, callbacks = {}) {
  modalRoot.classList.remove('hidden');
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>⚙️ Nastavení & Nová výprava</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body settings-form">
          <div class="setting-row">
            <label for="sel-anim-speed"><strong>Rychlost přehrávání animací:</strong></label>
            <select id="sel-anim-speed" class="parchment-input">
              <option value="1" ${settings.animSpeed === 1 ? 'selected' : ''}>Normální (1×)</option>
              <option value="2" ${settings.animSpeed === 2 ? 'selected' : ''}>Rychlá (2×)</option>
              <option value="0" ${settings.animSpeed === 0 ? 'selected' : ''}>Okamžitá (přeskočit animace)</option>
            </select>
          </div>

          <div class="setting-row">
            <label for="chk-sound"><strong>Zvukové efekty (WebAudio syntéza):</strong></label>
            <input type="checkbox" id="chk-sound" ${settings.soundEnabled ? 'checked' : ''} />
          </div>

          <hr class="tt-divider" />

          <div class="setting-row-col">
            <label for="inp-custom-seed"><strong>Spustit novou výpravu s vlastním seedem:</strong></label>
            <div class="seed-input-group">
              <input type="text" id="inp-custom-seed" class="parchment-input" value="${settings.currentSeed || 'VENCA-1899'}" placeholder="Např. HRAD-1905" />
              <button type="button" class="btn-parchment" id="btn-start-seed">🎲 Spustit seed</button>
              <button type="button" class="btn-parchment" id="btn-random-seed">🔀 Náhodný běh</button>
            </div>
          </div>

          <hr class="tt-divider" />
          <div class="meta-stats-box">
            <h4>🏆 Nejlepší výsledky (localStorage)</h4>
            <p>Nejvyšší dosažený akt: <strong>${metaStats.bestAct || 1}</strong> · Vítězné výpravy: <strong>${metaStats.victories || 0}</strong> · Celkem poraženo upírů: <strong>${metaStats.totalKills || 0}</strong></p>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('#sel-anim-speed')?.addEventListener('change', (e) => {
    callbacks.onChangeAnimSpeed?.(Number(e.target.value));
  });
  modalRoot.querySelector('#chk-sound')?.addEventListener('change', (e) => {
    callbacks.onToggleSound?.(e.target.checked);
  });
  modalRoot.querySelector('#btn-start-seed')?.addEventListener('click', () => {
    const val = modalRoot.querySelector('#inp-custom-seed')?.value || 'VENCA-1899';
    closeModal(modalRoot);
    callbacks.onStartNewRun?.(val);
  });
  modalRoot.querySelector('#btn-random-seed')?.addEventListener('click', () => {
    const randomSeed = `LOV-${Math.floor(1000 + Math.random() * 9000)}`;
    closeModal(modalRoot);
    callbacks.onStartNewRun?.(randomSeed);
  });
}

export function openBattleRewardModal(modalRoot, runState, choices, onComplete) {
  modalRoot.classList.remove('hidden');

  const cardsHtml = choices
    .map(
      (c, idx) => `
      <div class="reward-choice-card">
        <div class="reward-card-title">${c.title}</div>
        <div class="reward-card-sub">${c.subtitle}</div>
        <p class="reward-card-desc">${c.description}</p>
        <button type="button" class="btn-parchment btn-pick-reward" data-reward-idx="${idx}">
          Vybrat tuto odměnu
        </button>
      </div>
    `
    )
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🏆 Bitva vyhrána! Vyber si 1 ze 3 odměn</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">Venca vytřel podlahu s upíří patrolou a prohledává kapsy poražených:</p>
          <div class="reward-choices-grid">
            ${cardsHtml}
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-skip-reward">Přeskočit odměnu a pokračovat na mapu ➡</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-reward-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-reward-idx'));
      const chosen = choices[idx];
      if (chosen) {
        if (chosen.type === 'tile') {
          grantTileToRun(runState, chosen.tileId);
        } else if (chosen.type === 'talisman') {
          grantTalismanToRun(runState, chosen.talismanId);
        } else if (chosen.type === 'gold') {
          runState.gold += chosen.amount;
        }
      }
      closeModal(modalRoot);
      onComplete?.();
    });
  });

  modalRoot.querySelector('#btn-skip-reward')?.addEventListener('click', () => {
    closeModal(modalRoot);
    onComplete?.();
  });
}

export function openPubModal(modalRoot, runState, onLeavePub) {
  modalRoot.classList.remove('hidden');

  const ownedTileIds = new Set(runState.deck.map((d) => d.id));
  const shopTilePool = Object.keys(HERO_TILES).filter((id) => !ownedTileIds.has(id));
  const shopTileId = shopTilePool[0] || 'rosary_slap';
  const shopTileDef = getHeroTileDefinition(shopTileId, 0);

  const unownedTalismans = Object.keys(TALISMANS).filter((id) => !runState.talismans.includes(id));
  const shopTalismanId = unownedTalismans[0] || null;
  const shopTalisman = shopTalismanId ? TALISMANS[shopTalismanId] : null;

  let healedInThisVisit = false;
  let cdReducedInThisVisit = false;
  let boughtTile = false;
  let boughtTalisman = false;

  function renderContent() {
    const deckButtonsHtml = runState.deck
      .map((entry, idx) => {
        const def = getHeroTileDefinition(entry.id, entry.upgradeLevel || 0);
        const effCd = Math.max(1, def.cooldown - (entry.permanentCdReduction || 0));
        const canReduce = !cdReducedInThisVisit && runState.gold >= 14 && effCd > 1;
        return `
          <button type="button" class="btn-parchment btn-sm" data-reduce-cd-idx="${idx}" ${!canReduce ? 'disabled' : ''}>
            ⏳ Zkrátit CD: ${def.name} (nyní CD ${effCd}) — 14 dukátů
          </button>
        `;
      })
      .join('');

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <h3>🍺 Hospoda U Svěcené pípy (Měšec: 💰 ${runState.gold} dukátů · ❤️ ${runState.heroHp}/${runState.heroMaxHp} HP)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-pub">Opustit hospodu ➡</button>
          </div>
          <div class="modal-body pub-grid">
            <div class="pub-section">
              <h4>1. Teplá dršťková a ležák</h4>
              <p>Hospodský ti natočí poctivý džbánek na kuráž.</p>
              <button type="button" class="btn-parchment" id="btn-pub-heal" ${healedInThisVisit || runState.heroHp >= runState.heroMaxHp ? 'disabled' : ''}>
                🍺 Dát si pivo a guláš (+2 HP ZDARMA)
              </button>
            </div>

            <div class="pub-section">
              <h4>2. Promazat výzbroj sádlem (Trvale −1 Cooldown)</h4>
              <p>Jedné destičce trvale snížíš nabíjení o 1 tah (min. CD 1):</p>
              <div class="pub-deck-list">${deckButtonsHtml}</div>
            </div>

            <div class="pub-section">
              <h4>3. Podpultové zboží od štamgastů</h4>
              <div class="pub-shop-items">
                <div class="reward-choice-card">
                  <div class="reward-card-title">Destička: ${shopTileDef.name}</div>
                  <p class="reward-card-desc">${shopTileDef.description}</p>
                  <button type="button" class="btn-parchment" id="btn-pub-buy-tile" ${boughtTile || runState.gold < 18 ? 'disabled' : ''}>
                    💰 Koupit destičku (18 dukátů)
                  </button>
                </div>

                ${
                  shopTalisman
                    ? `<div class="reward-choice-card">
                         <div class="reward-card-title">${shopTalisman.badge} ${shopTalisman.name}</div>
                         <p class="reward-card-desc">${shopTalisman.description}</p>
                         <button type="button" class="btn-parchment" id="btn-pub-buy-tal" ${boughtTalisman || runState.gold < shopTalisman.price ? 'disabled' : ''}>
                           💰 Koupit talisman (${shopTalisman.price} dukátů)
                         </button>
                       </div>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    modalRoot.querySelector('#btn-pub-heal')?.addEventListener('click', () => {
      healedInThisVisit = true;
      runState.heroHp = Math.min(runState.heroMaxHp, runState.heroHp + 2);
      renderContent();
    });

    modalRoot.querySelectorAll('[data-reduce-cd-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-reduce-cd-idx'));
        if (runState.gold >= 14 && reduceTileCooldownInRun(runState, idx)) {
          runState.gold -= 14;
          cdReducedInThisVisit = true;
          renderContent();
        }
      });
    });

    modalRoot.querySelector('#btn-pub-buy-tile')?.addEventListener('click', () => {
      if (!boughtTile && runState.gold >= 18) {
        runState.gold -= 18;
        boughtTile = true;
        grantTileToRun(runState, shopTileId);
        renderContent();
      }
    });

    modalRoot.querySelector('#btn-pub-buy-tal')?.addEventListener('click', () => {
      if (shopTalisman && !boughtTalisman && runState.gold >= shopTalisman.price) {
        runState.gold -= shopTalisman.price;
        boughtTalisman = true;
        grantTalismanToRun(runState, shopTalisman.id);
        renderContent();
      }
    });

    modalRoot.querySelector('#btn-leave-pub')?.addEventListener('click', () => {
      closeModal(modalRoot);
      onLeavePub?.();
    });
  }

  renderContent();
}

export function openWorkshopModal(modalRoot, runState, onLeaveWorkshop) {
  modalRoot.classList.remove('hidden');
  let freeUpgradeUsed = false;

  function renderWorkshop() {
    const cardsHtml = runState.deck
      .map((entry, idx) => {
        const curDef = getHeroTileDefinition(entry.id, entry.upgradeLevel || 0);
        const maxReached = (entry.upgradeLevel || 0) >= 2;
        const nextDef = !maxReached ? getHeroTileDefinition(entry.id, (entry.upgradeLevel || 0) + 1) : null;
        const cost = freeUpgradeUsed ? 16 : 0;
        const canAfford = !maxReached && (cost === 0 || runState.gold >= cost);

        return `
          <div class="reward-choice-card">
            <div class="reward-card-title">${curDef.name} (Úroveň ${entry.upgradeLevel || 0}/2)</div>
            <p class="reward-card-desc">Nyní: ${curDef.description}</p>
            ${
              nextDef
                ? `<p class="tt-bonus">Po vylepšení: <strong>${nextDef.name}</strong> — ${nextDef.description}</p>
                   <button type="button" class="btn-parchment" data-upg-idx="${idx}" ${!canAfford ? 'disabled' : ''}>
                     ⚒️ Vylepšit (${cost === 0 ? '1. vylepšení ZDARMA' : `${cost} dukátů`})
                   </button>`
                : `<span class="hud-muted-text">✔ Maximální mistrovská úroveň</span>`
            }
          </div>
        `;
      })
      .join('');

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <h3>⚒️ Kolářská a kovářská dílna (💰 ${runState.gold} dukátů)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-workshop">Pokračovat na mapu ➡</button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">Mistr kolář ti první destičku přiostří zadarmo, další pak za 16 dukátů:</p>
            <div class="reward-choices-grid">${cardsHtml}</div>
          </div>
        </div>
      </div>
    `;

    modalRoot.querySelectorAll('[data-upg-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-upg-idx'));
        const cost = freeUpgradeUsed ? 16 : 0;
        if (runState.gold >= cost && upgradeTileInRun(runState, idx)) {
          runState.gold -= cost;
          freeUpgradeUsed = true;
          renderWorkshop();
        }
      });
    });

    modalRoot.querySelector('#btn-leave-workshop')?.addEventListener('click', () => {
      closeModal(modalRoot);
      onLeaveWorkshop?.();
    });
  }

  renderWorkshop();
}

export function openEventModal(modalRoot, runState, eventDef, onComplete) {
  modalRoot.classList.remove('hidden');

  const choicesHtml = eventDef.choices
    .map((c, idx) => {
      const allowed = !c.condition || c.condition(runState);
      return `
        <button type="button" class="btn-parchment event-choice-btn" data-choice-idx="${idx}" ${!allowed ? 'disabled' : ''}>
          👉 ${c.label}
        </button>
      `;
    })
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>❓ ${eventDef.title}</h3>
        </div>
        <div class="modal-body">
          <p class="event-narrative-text">${eventDef.text}</p>
          <div class="event-choices-stack" id="event-choices-box">
            ${choicesHtml}
          </div>
          <div id="event-outcome-box" class="hidden"></div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-choice-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-choice-idx'));
      const res = resolveEventChoice(runState, eventDef.id, idx);
      const choicesBox = modalRoot.querySelector('#event-choices-box');
      const outcomeBox = modalRoot.querySelector('#event-outcome-box');
      if (choicesBox) choicesBox.classList.add('hidden');
      if (outcomeBox) {
        outcomeBox.classList.remove('hidden');
        outcomeBox.innerHTML = `
          <div class="event-outcome-msg">${res.message}</div>
          <button type="button" class="btn-parchment" id="btn-event-continue">Pokračovat na mapu ➡</button>
        `;
        outcomeBox.querySelector('#btn-event-continue')?.addEventListener('click', () => {
          closeModal(modalRoot);
          onComplete?.();
        });
      }
    });
  });
}

export function openTreasureModal(modalRoot, runState, onComplete) {
  modalRoot.classList.remove('hidden');
  const unownedTalismans = Object.keys(TALISMANS).filter((id) => !runState.talismans.includes(id));
  const talId = unownedTalismans.length > 0 ? runState.rng.pick(unownedTalismans) : null;
  const tal = talId ? TALISMANS[talId] : null;
  const bonusGold = 20;

  if (talId) {
    grantTalismanToRun(runState, talId);
  }
  runState.gold += bonusGold;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>💎 Hradní pokladnice!</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">Venca vypáčil dubovou truhlici za oltářem a našel:</p>
          <div class="reward-choice-card">
            ${
              tal
                ? `<div class="reward-card-title">${tal.badge} ${tal.name}</div>
                   <p class="reward-card-desc">${tal.description}</p>`
                : ''
            }
            <p class="tt-bonus">💰 Navíc +${bonusGold} dukátů do měšce!</p>
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-treasure-done">Sebrat kořist a pokračovat ➡</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-treasure-done')?.addEventListener('click', () => {
    closeModal(modalRoot);
    onComplete?.();
  });
}

export function openRunEndModal(modalRoot, runState, isVictory, callbacks = {}) {
  modalRoot.classList.remove('hidden');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>${isVictory ? '🏆 SLAVNÉ VÍTĚZSTVÍ VENCI ČESNEKÁČE!' : '⚰️ VENCA ČESNEKÁČ PADL V BOJI'}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">
            ${
              isVictory
                ? 'Generální ředitel Drákula dostal dubovým kolíkem přímo přes daňové přiznání! Hrad je vyčištěn a Venca míří na zaslouženou dvanáctku!'
                : 'Upíří byrokracie tentokrát Vencu udolala. Ale moravský česnek ještě neřekl poslední slovo!'
            }
          </p>
          <div class="summary-stats-grid">
            <div class="stat-pill">Dosažený akt: <strong>${runState.act} / 3</strong></div>
            <div class="stat-pill">Vyhrané bitvy: <strong>${runState.stats.battlesWon}</strong></div>
            <div class="stat-pill">Rozdané poškození: <strong>${runState.stats.totalDamageDealt} DMG</strong></div>
            <div class="stat-pill">Friendly Fire zásahy: <strong>${runState.stats.totalFriendlyFire}</strong></div>
            <div class="stat-pill">Odehrané tahy: <strong>${runState.stats.totalTurns}</strong></div>
            <div class="stat-pill">Seed běhu: <strong>${runState.seed}</strong></div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-retry-same-seed">
              🔁 Opakovat stejný seed (${runState.seed})
            </button>
            <button type="button" class="btn-parchment btn-execute-ready" id="btn-new-random-run">
              ⚔️ Nová výprava (nový seed)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-retry-same-seed')?.addEventListener('click', () => {
    closeModal(modalRoot);
    callbacks.onRetrySeed?.(runState.seed);
  });

  modalRoot.querySelector('#btn-new-random-run')?.addEventListener('click', () => {
    closeModal(modalRoot);
    const nextSeed = `VENCA-${Math.floor(1000 + Math.random() * 9000)}`;
    callbacks.onNewRun?.(nextSeed);
  });
}
