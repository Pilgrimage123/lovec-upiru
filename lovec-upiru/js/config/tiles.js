export const HERO_TILES = {
  oak_stake: {
    id: 'oak_stake',
    name: 'Dubový kolík',
    icon: 'tile.oak_stake',
    type: 'attack',
    dmg: 2,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 2, effects: [] }],
    openerBonus: null,
    finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG (celkem 4 DMG).' },
    resonance: null,
    description: 'Poctivý dubový kolík ořezaný kapesním kudlou. Dosah 1 pole vpřed.',
    flavor: '„Na upíra jedině dub, smrk se mu v žebrech tříští!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Okovaný dubový kolík+',
        dmg: 3,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 3, effects: [] }],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG (celkem 5 DMG).' },
        description: 'Vylepšená špice: 3 DMG na 1 pole vpřed. Zakončovák: +2 DMG.'
      },
      {
        level: 2,
        name: 'Svěcený dubový kolík++',
        dmg: 3,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 3, effects: [{ type: 'bleed', amount: 2 }] }],
        finisherBonus: { dmgBonus: 3, description: 'Zakončovák (3. slot): +3 DMG a Krvácení.' },
        description: 'Mistrovský kolík (CD 2): 3 DMG + Krvácení. Zakončovák: +3 DMG.'
      }
    ]
  },

  garlic_belch: {
    id: 'garlic_belch',
    name: 'Česnekový pšouk',
    icon: 'tile.garlic_belch',
    type: 'attack',
    dmg: 1,
    cooldown: 4,
    quick: false,
    pattern: [{ offset: 1, dmg: 1, effects: [{ type: 'push', distance: 2 }] }],
    openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG z čerstvého dechu.' },
    finisherBonus: null,
    resonance: null,
    description: '1 DMG na 1 pole vpřed a prudce odhodí cíl o 2 pole vzad (Push 2).',
    flavor: '„Topinka se šesti stroužky moravského paličáku dělá divy.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Česnekový vichr+',
        dmg: 2,
        cooldown: 4,
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 3 }] }],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: '2 DMG na 1 pole vpřed a Push o 3 pole vzad.'
      },
      {
        level: 2,
        name: 'Hospodský uragán++',
        dmg: 2,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 3 }, { type: 'spawn_garlic_target' }] }],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: 'CD 3, 2 DMG, Push o 3 pole a zanechá Česnekový oblak.'
      }
    ]
  },

  holy_syringe: {
    id: 'holy_syringe',
    name: 'Hasičská stříkačka se svěcenou vodou',
    icon: 'tile.holy_syringe',
    type: 'ranged',
    dmg: 1,
    cooldown: 4,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 1, projectile: true, effects: [] },
      { offset: 2, dmg: 1, projectile: true, effects: [] },
      { offset: 3, dmg: 1, projectile: true, effects: [] }
    ],
    openerBonus: { flipTarget: true, description: 'Otevírák (1. slot): prudký proud otočí zasaženého nepřítele čelem vzad!' },
    finisherBonus: null,
    resonance: null,
    description: 'Střela na dosah až 3 pole (zastaví se o první cíl) za 1 DMG. Otevírák: otočí cíl čelem vzad!',
    flavor: '„Půjčeno ze zbrojnice SDH Horní Děs, posvěceno panem farářem.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mosazná stříkačka+',
        dmg: 2,
        cooldown: 4,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 2, projectile: true, effects: [] },
          { offset: 2, dmg: 2, projectile: true, effects: [] },
          { offset: 3, dmg: 2, projectile: true, effects: [] },
          { offset: 4, dmg: 2, projectile: true, effects: [] }
        ],
        openerBonus: { flipTarget: true, description: 'Otevírák (1. slot): otočí cíl čelem vzad.' },
        description: 'Dosah 4 pole, 2 DMG prvnímu cíli. Otevírák: otočí cíl čelem vzad.'
      },
      {
        level: 2,
        name: 'Tlaková stříkačka++',
        dmg: 2,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 2, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 2, dmg: 2, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 3, dmg: 2, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 4, dmg: 2, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] }
        ],
        openerBonus: { dmgBonus: 1, flipTarget: true, description: 'Otevírák (1. slot): +1 DMG a vždy otočí cíl.' },
        description: 'CD 3, dosah 4, 2 DMG, otočí cíl v jakémkoliv slotu a odhodí o 1 pole.'
      }
    ]
  },

  belly_vault: {
    id: 'belly_vault',
    name: 'Hospodský přemet přes pupík',
    icon: 'tile.belly_vault',
    type: 'move',
    dmg: 0,
    cooldown: 2,
    quick: false,
    leapDistance: 2,
    leaveGarlicCloud: true,
    pattern: [{ offset: 2, dmg: 0, isMoveTarget: true, effects: [] }],
    openerBonus: null,
    finisherBonus: null,
    resonance: { nextTileCdReduction: 1, description: 'Rezonance: další destička ve frontě má po odehrání CD −1.' },
    description: 'Přeskok o 2 pole vpřed přes entity (je-li obsazeno, přistane na nejbližším volném poli). Zanechá Česnekový oblak (2 tahy). Rezonance: další destička CD −1.',
    flavor: '„Sice v kříži křupne, ale upír čumí jak tele na nová vrata!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Sokolský přemet přes pupík+',
        dmg: 0,
        cooldown: 2,
        leapDistance: 2,
        leaveGarlicCloud: true,
        resonance: { nextTileCdReduction: 2, description: 'Rezonance: další destička ve frontě má CD −2.' },
        description: 'Přeskok o 2 pole vpřed, Česnekový oblak a Rezonance sníží CD další destičky o 2.'
      },
      {
        level: 2,
        name: ' Mistrovský přemet s výkopem++',
        dmg: 0,
        cooldown: 1,
        leapDistance: 2,
        leaveGarlicCloud: true,
        selfEffect: { type: 'empower', amount: 1 },
        resonance: { nextTileCdReduction: 2, description: 'Rezonance: další destička má CD −2 + získáš Zesílení (+1 DMG).' },
        description: 'CD 1! Přeskok o 2 pole, Česnekový oblak, Zesílení (+1 DMG) a Rezonance CD −2.'
      }
    ]
  },

  rosary_slap: {
    id: 'rosary_slap',
    name: 'Facka růžencem',
    icon: 'tile.rosary_slap',
    type: 'attack',
    dmg: 1,
    cooldown: 2,
    quick: false,
    selfFlipAfter: true,
    pattern: [{ offset: -1, dmg: 1, effects: [] }],
    openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG překvapenému uličníkovi za zády.' },
    finisherBonus: null,
    resonance: null,
    description: 'Švihne 1 pole ZA ZÁDY za 1 DMG a okamžitě otočí Vencu čelem vzad.',
    flavor: '„Kdo mi to funí za krk?! Tady máš desátek přes dršku!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Dvojitá facka růžencem+',
        dmg: 2,
        cooldown: 2,
        selfFlipAfter: true,
        pattern: [{ offset: -1, dmg: 2, effects: [] }],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: '2 DMG za zády a otočí Vencu čelem vzad.'
      },
      {
        level: 2,
        name: 'Kajícná facka růžencem++',
        dmg: 2,
        cooldown: 1,
        selfFlipAfter: true,
        pattern: [{ offset: -1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] }],
        openerBonus: { dmgBonus: 2, description: 'Otevírák (1. slot): +2 DMG.' },
        description: 'CD 1, 2 DMG za zády + Zmatení a otočí Vencu.'
      }
    ]
  },

  funeral_hook: {
    id: 'funeral_hook',
    name: 'Půjčený pohřební hák',
    icon: 'tile.funeral_hook',
    type: 'ranged',
    dmg: 1,
    cooldown: 4,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 1, projectile: true, effects: [{ type: 'pull' }] },
      { offset: 2, dmg: 1, projectile: true, effects: [{ type: 'pull' }] },
      { offset: 3, dmg: 1, projectile: true, effects: [{ type: 'pull' }] }
    ],
    openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG přitaženému cíli.' },
    finisherBonus: null,
    resonance: null,
    description: 'Dosah až 3 pole: první zasaženou entitu zraní za 1 DMG a přitáhne těsně před Vencu (Pull).',
    flavor: '„Hrobník říkal, ať mu ho vrátím do pátku. Pojď sem, holoubku!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Kovaný pohřební hák+',
        dmg: 2,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 2, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 2, dmg: 2, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 3, dmg: 2, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 4, dmg: 2, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] }
        ],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: 'CD 3, dosah 4 pole, 2 DMG + Pull + Krvácení.'
      },
      {
        level: 2,
        name: 'Řeznický hák na korheľe++',
        dmg: 3,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 3, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 2, dmg: 3, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 3, dmg: 3, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 4, dmg: 3, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] }
        ],
        openerBonus: { dmgBonus: 2, description: 'Otevírák (1. slot): +2 DMG.' },
        description: 'Dosah 4 pole, 3 DMG + Pull + silné Krvácení (3).'
      }
    ]
  },

  manhole_shield: {
    id: 'manhole_shield',
    name: 'Štít z kanálového poklopu',
    icon: 'tile.manhole_shield',
    type: 'defense',
    dmg: 0,
    cooldown: 4,
    quick: false,
    selfEffect: { type: 'shield', amount: 1 },
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'push', distance: 1 }] }],
    openerBonus: { selfEmpower: 1, description: 'Otevírák (1. slot): přidá Vencovi i Zesílení (+1 DMG).' },
    finisherBonus: null,
    resonance: null,
    description: 'Dá Vencovi Štít (blokuje 1 zásah) a odstrčí nepřítele přímo před ním o 1 pole.',
    flavor: '„Litinová klasika z roku 1924. Ani zuby hraběte skrz to neprojdou.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Litinový poklop+',
        dmg: 1,
        cooldown: 3,
        selfEffect: { type: 'shield', amount: 1 },
        pattern: [{ offset: 1, dmg: 1, effects: [{ type: 'push', distance: 1 }] }],
        openerBonus: { selfEmpower: 1, description: 'Otevírák (1. slot): +Zesílení.' },
        description: 'CD 3, Štít + 1 DMG a Push o 1 pole vzad.'
      },
      {
        level: 2,
        name: 'Pancéřový poklop vodáren++',
        dmg: 2,
        cooldown: 3,
        selfEffect: { type: 'shield', amount: 1 },
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 2 }] }],
        openerBonus: { selfEmpower: 1, description: 'Otevírák (1. slot): +Zesílení.' },
        description: 'Štít + 2 DMG a Push o 2 pole vzad.'
      }
    ]
  },

  sacristy_bell: {
    id: 'sacristy_bell',
    name: 'Kostelní zvonec na ministranty',
    icon: 'tile.sacristy_bell',
    type: 'control',
    dmg: 1,
    cooldown: 5,
    quick: false,
    pattern: [
      { offset: 1, dmg: 1, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 2, dmg: 1, effects: [{ type: 'stun', amount: 1 }] }
    ],
    openerBonus: null,
    finisherBonus: { dmgBonus: 1, description: 'Zakončovák (3. slot): +1 DMG do obou polí.' },
    resonance: null,
    description: 'Zazvoní na 2 pole vpřed za 1 DMG a všem zasaženým způsobí Omráčení (přeskočí jejich aktivní akci!).',
    flavor: '„Po třech pivech z toho brní uši i mrtvému.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Mosazný zvon z kaple+',
        dmg: 1,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 1, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 1, effects: [{ type: 'stun', amount: 1 }] }
        ],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG.' },
        description: 'CD 4, zasáhne 2 pole vpřed za 1 DMG + Omráčení.'
      },
      {
        level: 2,
        name: 'Polední zvon Hromburác++',
        dmg: 2,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 2, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 2, effects: [{ type: 'stun', amount: 1 }] }
        ],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG.' },
        description: 'CD 4, zasáhne 2 pole vpřed za 2 DMG + Omráčení.'
      }
    ]
  },

  wood_axe: {
    id: 'wood_axe',
    name: 'Sekera na polena',
    icon: 'tile.wood_axe',
    type: 'attack',
    dmg: 2,
    cooldown: 4,
    quick: false,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: -1, dmg: 2, effects: [{ type: 'bleed', amount: 2 }] }
    ],
    openerBonus: null,
    finisherBonus: { dmgBonus: 1, description: 'Zakončovák (3. slot): +1 DMG na obě strany.' },
    resonance: null,
    description: 'Rozmáchne se kolem dokola a zasáhne OBA sousedy (1 pole vpřed i 1 pole vzad) za 2 DMG + Krvácení.',
    flavor: '„Tuhle mi půjčil švagr, když jsme poráželi kůlnu.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Nabroušená sekera+',
        dmg: 3,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 3, effects: [{ type: 'bleed', amount: 2 }] },
          { offset: -1, dmg: 3, effects: [{ type: 'bleed', amount: 2 }] }
        ],
        finisherBonus: { dmgBonus: 1, description: 'Zakončovák (3. slot): +1 DMG.' },
        description: '3 DMG do obou sousedních polí + Krvácení.'
      },
      {
        level: 2,
        name: 'Dřevorubecký obouručák++',
        dmg: 3,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 3, effects: [{ type: 'bleed', amount: 2 }, { type: 'push', distance: 1 }] },
          { offset: -1, dmg: 3, effects: [{ type: 'bleed', amount: 2 }, { type: 'push', distance: 1 }] }
        ],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG.' },
        description: 'CD 3, 3 DMG na obě strany + Krvácení + odhození o 1 pole.'
      }
    ]
  },

  plank_stomp: {
    id: 'plank_stomp',
    name: 'Dupnutí na prkno',
    icon: 'tile.plank_stomp',
    type: 'control',
    dmg: 1,
    cooldown: 3,
    quick: false,
    pattern: [
      { offset: 1, dmg: 1, effects: [{ type: 'spawn_spikes' }] },
      { offset: 2, dmg: 1, effects: [{ type: 'push', distance: 1 }] }
    ],
    openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
    finisherBonus: null,
    resonance: null,
    description: 'Zasáhne 2 pole vpřed za 1 DMG: na 1. poli vyrazí z podlahy Naostřené kůly a na 2. poli cíl odhodí o 1 pole.',
    flavor: '„Tady soudruzi památkáři šetřili na hřebíkách!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Těžká bota na prkno+',
        dmg: 2,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 2, effects: [{ type: 'spawn_spikes' }] },
          { offset: 2, dmg: 2, effects: [{ type: 'push', distance: 1 }] }
        ],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: '2 DMG na 2 pole vpřed, vytvoří Kůly na 1. poli a odhodí 2. pole.'
      },
      {
        level: 2,
        name: 'Okovaná bota s hřeby++',
        dmg: 2,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 2, effects: [{ type: 'spawn_spikes' }] },
          { offset: 2, dmg: 2, effects: [{ type: 'spawn_spikes' }, { type: 'push', distance: 1 }] }
        ],
        openerBonus: { dmgBonus: 1, description: 'Otevírák (1. slot): +1 DMG.' },
        description: 'CD 2, 2 DMG a vyrazí Kůly na OBOU polích před Vencou!'
      }
    ]
  },

  funeral_shroud: {
    id: 'funeral_shroud',
    name: 'Pohřební plachta',
    icon: 'tile.funeral_shroud',
    type: 'utility',
    dmg: 0,
    cooldown: 3,
    quick: false,
    selfEffect: { type: 'empower', amount: 1 },
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }] }],
    openerBonus: null,
    finisherBonus: null,
    resonance: { nextTileCdReduction: 1, description: 'Rezonance: další destička ve frontě má CD −1.' },
    description: 'Hodí plachtu na souseda vpřed (Zmatení + otočení) a Venca získá Zesílení (+1 DMG).',
    flavor: '„Kukuč! Kdo zhasnul v rakvi?!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Vyšívaná pohřební plachta+',
        dmg: 1,
        cooldown: 3,
        quick: false,
        selfEffect: { type: 'empower', amount: 1 },
        pattern: [{ offset: 1, dmg: 1, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }] }],
        resonance: { nextTileCdReduction: 1, description: 'Rezonance: další destička má CD −1.' },
        description: '1 DMG, Zmatení, otočení a Zesílení pro Vencu.'
      },
      {
        level: 2,
        name: 'Olovená pohřební plachta++',
        dmg: 1,
        cooldown: 2,
        quick: false,
        selfEffect: { type: 'empower', amount: 1 },
        pattern: [{ offset: 1, dmg: 1, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }, { type: 'stun', amount: 1 }] }],
        resonance: { nextTileCdReduction: 1, description: 'Rezonance: další destička má CD −1.' },
        description: 'CD 2, 1 DMG, Omráčení, otočení a Zesílení.'
      }
    ]
  },

  silver_crucifix_beam: {
    id: 'silver_crucifix_beam',
    name: 'Blesk z posvěceného krucifixu',
    icon: 'tile.silver_crucifix_beam',
    type: 'ranged',
    dmg: 2,
    cooldown: 5,
    quick: false,
    pattern: [
      { offset: 1, dmg: 2, effects: [] },
      { offset: 2, dmg: 2, effects: [] },
      { offset: 3, dmg: 2, effects: [] }
    ],
    openerBonus: null,
    finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG všem v paprsku (celkem 4 DMG)!' },
    resonance: null,
    description: 'Průrazný paprsek přes 3 pole vpřed – zasáhne VŠECHNY nepřátele v řadě za 2 DMG! Zakončovák: +2 DMG.',
    flavor: '„Zasviť jim na cestu do pekla, pane faráři!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Zlatý krucifix+',
        dmg: 3,
        cooldown: 5,
        pattern: [
          { offset: 1, dmg: 3, effects: [] },
          { offset: 2, dmg: 3, effects: [] },
          { offset: 3, dmg: 3, effects: [] }
        ],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG (celkem 5 DMG).' },
        description: 'Průrazný paprsek na 3 pole za 3 DMG. Zakončovák: +2 DMG.'
      },
      {
        level: 2,
        name: 'Arcibiskupský krucifix++',
        dmg: 4,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 4, effects: [] },
          { offset: 2, dmg: 4, effects: [] },
          { offset: 3, dmg: 4, effects: [] },
          { offset: 4, dmg: 4, effects: [] }
        ],
        finisherBonus: { dmgBonus: 2, description: 'Zakončovák (3. slot): +2 DMG.' },
        description: 'CD 4, průrazný paprsek na 4 pole za 4 DMG všem.'
      }
    ]
  }
};

export function getHeroTileDefinition(tileId, upgradeLevel = 0) {
  const base = HERO_TILES[tileId];
  if (!base) return null;
  if (!upgradeLevel || !base.upgrades || upgradeLevel <= 0) {
    return structuredClone(base);
  }
  const upg = base.upgrades[Math.min(upgradeLevel - 1, base.upgrades.length - 1)];
  return structuredClone({
    ...base,
    ...upg,
    id: base.id,
    upgradeLevel
  });
}
