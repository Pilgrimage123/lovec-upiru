export const ENEMY_TILES = {
  step_toward: {
    id: 'step_toward',
    name: 'Šouravý krok',
    icon: 'intent.step',
    type: 'krok',
    delay: 1,
    cooldown: 1,
    pattern: [],
    description: 'Otočí se k Vencovi a popojde o 1 pole směrem k němu (je-li volno).'
  },
  turn_toward: {
    id: 'turn_toward',
    name: 'Bystré otočení',
    icon: 'intent.turn',
    type: 'otočení',
    delay: 1,
    cooldown: 1,
    pattern: [],
    description: 'Otočí se čelem k Vencovi.'
  },
  intern_bite: {
    id: 'intern_bite',
    name: 'Nešikovné kousnutí',
    icon: 'intent.strike',
    type: 'úder',
    delay: 2,
    cooldown: 2,
    pattern: [{ offset: 1, dmg: 1, effects: [] }],
    description: 'Kousne do pole přímo před sebou za 1 DMG.'
  },
  tax_stamp_shot: {
    id: 'tax_stamp_shot',
    name: 'Razítková střela',
    icon: 'intent.shoot',
    type: 'střela',
    delay: 3,
    cooldown: 3,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 1, projectile: true, effects: [] },
      { offset: 2, dmg: 1, projectile: true, effects: [] },
      { offset: 3, dmg: 1, projectile: true, effects: [] }
    ],
    description: 'Střelí úředním razítkem až o 3 pole vpřed (1 DMG prvnímu cíli v dráze).'
  },
  retreat_step: {
    id: 'retreat_step',
    name: 'Úřední odstup',
    icon: 'intent.step',
    type: 'krok',
    retreatIfClose: true,
    delay: 1,
    cooldown: 1,
    pattern: [],
    description: 'Drží si odstup od Venci nebo popojde do palebné pozice.'
  },
  windup_roar: {
    id: 'windup_roar',
    name: 'Těžký nápřah',
    icon: 'intent.windup',
    type: 'nápřah',
    delay: 1,
    cooldown: 2,
    selfEffect: { type: 'empower', amount: 1 },
    pattern: [],
    description: 'Otočí se k Vencovi a napne svaly (+1 DMG k příštímu úderu).'
  },
  drab_lunge: {
    id: 'drab_lunge',
    name: 'Drábův výpad',
    icon: 'intent.strike',
    type: 'úder',
    delay: 3,
    cooldown: 3,
    lungeForward: 1,
    pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 1 }] }],
    description: 'Popaskočí o 1 pole vpřed (je-li volno) a sekne před sebe za 2 DMG + odhození o 1 pole.'
  },
  cleaver_chop: {
    id: 'cleaver_chop',
    name: 'Sekáčkem do kotlety',
    icon: 'intent.strike',
    type: 'úder',
    delay: 2,
    cooldown: 2,
    pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] }],
    description: 'Sekne řeznickým sekáčkem 1 pole vpřed za 2 DMG + Krvácení.'
  },
  porter_bash: {
    id: 'porter_bash',
    name: 'Šťouchanec závorou',
    icon: 'intent.strike',
    type: 'úder',
    delay: 2,
    cooldown: 2,
    pattern: [{ offset: 1, dmg: 1, effects: [{ type: 'push', distance: 2 }] }],
    description: 'Udeří štítem 1 pole vpřed za 1 DMG a odhodí cíl o 2 pole.'
  },
  porter_guard: {
    id: 'porter_guard',
    name: 'Zavřená vrátnice',
    icon: 'intent.shield',
    type: 'štít',
    delay: 2,
    cooldown: 2,
    selfEffect: { type: 'shield', amount: 1 },
    pattern: [],
    description: 'Otočí se k Vencovi a zapře se za štít (+1 Štít).'
  },
  bat_swoop: {
    id: 'bat_swoop',
    name: 'Prudký nálet',
    icon: 'intent.strike',
    type: 'úder',
    delay: 1,
    cooldown: 1,
    pattern: [
      { offset: 1, dmg: 1, effects: [] },
      { offset: 2, dmg: 1, effects: [] }
    ],
    description: 'Rychlý přelet nad 2 poli vpřed za 1 DMG.'
  },
  accountant_buff: {
    id: 'accountant_buff',
    name: 'Daňová optimalizace krve',
    icon: 'intent.heal',
    type: 'léčení',
    delay: 2,
    cooldown: 3,
    supportAllies: true,
    healAmount: 2,
    empowerAmount: 1,
    pattern: [],
    description: 'Vyléčí nejbližšího spojence o 2 HP a přidá mu Zesílení (+1 DMG).'
  },
  accountant_curse: {
    id: 'accountant_curse',
    name: 'Upomínka v krvi',
    icon: 'intent.shoot',
    type: 'střela',
    delay: 3,
    cooldown: 3,
    projectileRange: 4,
    pattern: [
      { offset: 1, dmg: 1, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 2, dmg: 1, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 3, dmg: 1, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 4, dmg: 1, projectile: true, effects: [{ type: 'confusion', amount: 1 }] }
    ],
    description: 'Hodí lejstro na dosah 4 polí za 1 DMG + Zmatení.'
  },
  boss_sosak_drain: {
    id: 'boss_sosak_drain',
    name: 'Aristokratické sosání',
    icon: 'intent.strike',
    type: 'úder',
    delay: 2,
    cooldown: 2,
    lifesteal: 1,
    pattern: [
      { offset: 1, dmg: 2, effects: [] },
      { offset: 2, dmg: 2, effects: [] }
    ],
    description: 'Švihne kordem na 2 pole vpřed za 2 DMG a vyléčí si 1 HP.'
  },
  boss_sosak_summon: {
    id: 'boss_sosak_summon',
    name: 'Písknutí na kurýra',
    icon: 'intent.summon',
    type: 'přivolání',
    delay: 3,
    cooldown: 3,
    summonEnemyId: 'netopyr',
    pattern: [],
    description: 'Přivolá Netopýra-kurýra na nejbližší volnou bránu.'
  },
  boss_dagmar_hex: {
    id: 'boss_dagmar_hex',
    name: 'Krvavá krajková kletba',
    icon: 'intent.shoot',
    type: 'střela',
    delay: 2,
    cooldown: 2,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: 2, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: 3, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] }
    ],
    description: 'Temná vlna na 3 pole vpřed za 2 DMG + Krvácení.'
  },
  boss_dagmar_thorns: {
    id: 'boss_dagmar_thorns',
    name: 'Růže z hrobky',
    icon: 'intent.summon',
    type: 'přivolání',
    delay: 3,
    cooldown: 3,
    spawnSpikesAtHero: true,
    pattern: [
      { offset: 1, dmg: 1, effects: [{ type: 'push', distance: 2 }] },
      { offset: -1, dmg: 1, effects: [{ type: 'push', distance: 2 }] }
    ],
    description: 'Odhodí sousedy na obou stranách za 1 DMG (Push 2).'
  },
  boss_dracula_audit: {
    id: 'boss_dracula_audit',
    name: 'Generální audit krve',
    icon: 'intent.strike',
    type: 'úder',
    delay: 2,
    cooldown: 2,
    pattern: [
      { offset: 1, dmg: 3, effects: [{ type: 'push', distance: 1 }] },
      { offset: 2, dmg: 3, effects: [{ type: 'push', distance: 1 }] }
    ],
    description: 'Drtivý úder na 2 pole vpřed za 3 DMG + Push 1.'
  },
  boss_dracula_decree: {
    id: 'boss_dracula_decree',
    name: 'Dekret představenstva',
    icon: 'intent.shoot',
    type: 'střela',
    delay: 3,
    cooldown: 3,
    projectileRange: 5,
    pattern: [
      { offset: 1, dmg: 2, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 2, dmg: 2, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 3, dmg: 2, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 4, dmg: 2, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 5, dmg: 2, projectile: true, effects: [{ type: 'stun', amount: 1 }] }
    ],
    description: 'Střela přes 5 polí za 2 DMG prvnímu cíli v dráze.'
  }
};

export const ENEMIES = {
  praktikant: {
    id: 'praktikant',
    name: 'Upír-praktikant Ignác',
    sprite: 'enemy.praktikant',
    archetype: 'fodder',
    comboCapacity: 1,
    maxHp: 4,
    flying: false,
    frontShield: false,
    actionPool: ['intern_bite'],
    queue: ['step_toward', 'intern_bite'],
    flavor: '„Mám teprve třetí noční směnu a už mě pálí žáha z česneku!“'
  },
  urednik: {
    id: 'urednik',
    name: 'Krvavý berní úředník',
    sprite: 'enemy.urednik',
    archetype: 'ranged',
    comboCapacity: 2,
    maxHp: 5,
    flying: false,
    frontShield: false,
    actionPool: ['tax_stamp_shot', 'retreat_step'],
    queue: ['retreat_step', 'tax_stamp_shot'],
    flavor: '„Kolkovné za vstup do hrobky jste uhradil?! Formulář K-13!“'
  },
  drab: {
    id: 'drab',
    name: 'Krvavá drábová Božena',
    sprite: 'enemy.drab',
    archetype: 'brute',
    comboCapacity: 2,
    maxHp: 7,
    flying: false,
    frontShield: false,
    actionPool: ['windup_roar', 'drab_lunge'],
    queue: ['windup_roar', 'drab_lunge'],
    flavor: '„Karbanátky z lovců dělám zásadně na cibulce!“'
  },
  vratny_stit: {
    id: 'vratny_stit',
    name: 'Vrátný se štítem',
    sprite: 'enemy.vratny_stit',
    archetype: 'shielder',
    comboCapacity: 2,
    maxHp: 5,
    flying: false,
    frontShield: true,
    actionPool: ['porter_bash', 'porter_guard'],
    queue: ['step_toward', 'porter_bash', 'porter_guard'],
    flavor: '„Přes vrátnici jenom s propustkou podepsanou hrabětem!“ (Blokuje přímé zásahy zepředu.)'
  },
  netopyr: {
    id: 'netopyr',
    name: 'Netopýr-kurýr',
    sprite: 'enemy.netopyr',
    archetype: 'fodder',
    comboCapacity: 1,
    maxHp: 1,
    flying: true,
    frontShield: false,
    actionPool: ['bat_swoop'],
    queue: ['step_toward', 'bat_swoop'],
    flavor: '„Pííí! Doporučený dopis z finančáku!“ (Létá nad propastmi a prkny.)'
  },
  ucetni_buffer: {
    id: 'ucetni_buffer',
    name: 'Upíří účetní Květuše',
    sprite: 'enemy.ucetni_buffer',
    archetype: 'support',
    comboCapacity: 2,
    maxHp: 4,
    flying: false,
    frontShield: false,
    actionPool: ['accountant_curse', 'accountant_buff'],
    queue: ['accountant_buff', 'accountant_curse'],
    flavor: '„Krevní rozvaha musí sedět na kapku přesně!“ (Léčí a posiluje spolubojovníky.)'
  },

  elite_drab: {
    id: 'elite_drab',
    name: 'Elitní řeznice Božena',
    sprite: 'enemy.drab',
    archetype: 'brute',
    isElite: true,
    comboCapacity: 3,
    maxHp: 11,
    flying: false,
    frontShield: false,
    actionPool: ['windup_roar', 'cleaver_chop', 'drab_lunge'],
    queue: ['windup_roar', 'cleaver_chop', 'drab_lunge'],
    flavor: '„Dvojitá porce tlačenky! Pojď blíž, dědku!“'
  },
  elite_urednik: {
    id: 'elite_urednik',
    name: 'Vrchní inkvizitor berňáku',
    sprite: 'enemy.urednik',
    archetype: 'ranged',
    isElite: true,
    comboCapacity: 3,
    maxHp: 10,
    flying: false,
    frontShield: true,
    actionPool: ['tax_stamp_shot', 'porter_bash', 'turn_toward'],
    queue: ['turn_toward', 'tax_stamp_shot', 'porter_bash'],
    flavor: '„Exekuce krve se odkládat nebude!“ (Zepředu chráněn deskami spisu.)'
  },

  boss_sosak: {
    id: 'boss_sosak',
    name: 'Arcikníže von Sosák',
    sprite: 'boss.arcikniaze_sosak',
    archetype: 'boss',
    isBoss: true,
    act: 1,
    comboCapacity: 3,
    maxHp: 14,
    flying: false,
    frontShield: false,
    mirrorCloak: true,
    enrageTile: 'boss_sosak_summon',
    actionPool: ['boss_sosak_drain', 'boss_sosak_summon', 'turn_toward'],
    queue: ['step_toward', 'boss_sosak_drain', 'turn_toward'],
    flavor: '„Zrcadlový plášť z Vídně! Při kombu ze stejného směru si prohodím místo se sudem nebo netopýrem!“'
  },
  boss_dagmar: {
    id: 'boss_dagmar',
    name: 'Hraběnka Dagmar z Černé Krajky',
    sprite: 'boss.hrabenka_dagmar',
    archetype: 'boss',
    isBoss: true,
    act: 2,
    comboCapacity: 3,
    maxHp: 18,
    flying: false,
    frontShield: false,
    bloodThorns: true,
    enrageTile: 'accountant_buff',
    actionPool: ['boss_dagmar_hex', 'boss_dagmar_thorns', 'accountant_buff'],
    queue: ['step_toward', 'boss_dagmar_hex', 'boss_dagmar_thorns'],
    flavor: '„Moje krajky jsou tkané z půlnoční mlhy a neplacených směn!“'
  },
  boss_drakula: {
    id: 'boss_drakula',
    name: 'Drákula, generální ředitel Krvavé a.s.',
    sprite: 'boss.drakula_generalni_reditel',
    archetype: 'boss',
    isBoss: true,
    act: 3,
    comboCapacity: 3,
    maxHp: 24,
    flying: false,
    frontShield: false,
    mirrorCloak: true,
    corporateSynergy: true,
    enrageTile: 'boss_sosak_summon',
    actionPool: ['boss_dracula_audit', 'boss_dracula_decree', 'boss_sosak_summon'],
    queue: ['step_toward', 'boss_dracula_audit', 'boss_dracula_decree'],
    flavor: '„Vaše stížnost na kousnutí do krku byla postoupena oddělení věčného spánku!“'
  }
};
