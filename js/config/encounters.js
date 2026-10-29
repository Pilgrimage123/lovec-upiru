export const TERRAIN_PRESETS = [
  { id: 'barrel_center', props: [{ type: 'barrel', cell: 4 }], terrain: [{ type: 'plank_intact', cell: 2 }] },
  { id: 'spikes_and_plank', props: [], terrain: [{ type: 'spikes', cell: 3 }, { type: 'plank_intact', cell: 5 }] },
  { id: 'pit_edge', props: [{ type: 'barrel', cell: 2 }], terrain: [{ type: 'pit', cell: 5 }] },
  { id: 'garlic_corridor', props: [{ type: 'barrel', cell: 3 }], terrain: [{ type: 'garlic_cloud', cell: 2, duration: 2 }, { type: 'spikes', cell: 5 }] },
  { id: 'twin_planks', props: [], terrain: [{ type: 'plank_intact', cell: 2 }, { type: 'plank_intact', cell: 4 }] },
  { id: 'pit_and_spikes', props: [{ type: 'barrel', cell: 4 }], terrain: [{ type: 'pit', cell: 1 }, { type: 'spikes', cell: 3 }] }
];

export const ENCOUNTERS = {
  tutorial_1: {
    id: 'tutorial_1',
    act: 1,
    name: 'Předhradí: Noční vrátnice',
    isTutorial: true,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'praktikant', cell: 4, facing: -1 },
      { enemyId: 'urednik', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 1 }],
    terrain: [{ type: 'spikes', cell: 5 }],
    reinforcements: [
      { turnDelay: 4, gateCell: 6, enemyId: 'netopyr' }
    ],
    goldReward: 16
  },

  act1_battle_1: {
    id: 'act1_battle_1',
    act: 1,
    name: 'Zatuchlá chodba berního úřadu',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'praktikant', cell: 4, facing: -1 },
      { enemyId: 'praktikant', cell: 0, facing: 1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 6, enemyId: 'urednik' }
    ],
    goldReward: 18
  },

  act1_battle_2: {
    id: 'act1_battle_2',
    act: 1,
    name: 'Hradní spižírna u zelného sudu',
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'drab', cell: 4, facing: -1 },
      { enemyId: 'netopyr', cell: 6, facing: -1 }
    ],
    reinforcements: [
      { turnDelay: 4, gateCell: 0, enemyId: 'praktikant' }
    ],
    goldReward: 20
  },

  act1_elite: {
    id: 'act1_elite',
    act: 1,
    name: 'Černá kuchyně řeznice Boženy',
    isElite: true,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 5, facing: -1 },
      { enemyId: 'praktikant', cell: 0, facing: 1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 6, enemyId: 'netopyr' }
    ],
    goldReward: 30
  },

  act1_boss: {
    id: 'act1_boss',
    act: 1,
    name: 'Zrcadlový salón Arciknížete von Sosáka',
    isBoss: true,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_sosak', cell: 5, facing: -1 },
      { enemyId: 'netopyr', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    terrain: [{ type: 'spikes', cell: 4 }],
    reinforcements: [
      { turnDelay: 4, gateCell: 0, enemyId: 'netopyr' },
      { turnDelay: 7, gateCell: 6, enemyId: 'praktikant' }
    ],
    goldReward: 45
  },

  act2_battle_1: {
    id: 'act2_battle_1',
    act: 2,
    name: 'Strážnice u padací mříže',
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'vratny_stit', cell: 5, facing: -1 },
      { enemyId: 'urednik', cell: 1, facing: 1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 6, enemyId: 'ucetni_buffer' }
    ],
    goldReward: 22
  },

  act2_battle_2: {
    id: 'act2_battle_2',
    act: 2,
    name: 'Účetní archiv Krvavé a.s.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'drab', cell: 4, facing: -1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 0, enemyId: 'vratny_stit' },
      { turnDelay: 5, gateCell: 6, enemyId: 'netopyr' }
    ],
    goldReward: 24
  },

  act2_elite: {
    id: 'act2_elite',
    act: 2,
    name: 'Kancelář vrchního inkvizitora berňáku',
    isElite: true,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_urednik', cell: 5, facing: -1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 0, enemyId: 'drab' }
    ],
    goldReward: 35
  },

  act2_boss: {
    id: 'act2_boss',
    act: 2,
    name: 'Krajkový budoár Hraběnky Dagmar',
    isBoss: true,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_dagmar', cell: 5, facing: -1 },
      { enemyId: 'vratny_stit', cell: 0, facing: 1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    terrain: [{ type: 'plank_intact', cell: 4 }, { type: 'spikes', cell: 1 }],
    reinforcements: [
      { turnDelay: 4, gateCell: 6, enemyId: 'ucetni_buffer' },
      { turnDelay: 6, gateCell: 0, enemyId: 'netopyr' }
    ],
    goldReward: 55
  },

  act3_battle_1: {
    id: 'act3_battle_1',
    act: 3,
    name: 'Krypta daňových nedoplatků',
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'vratny_stit', cell: 5, facing: -1 },
      { enemyId: 'drab', cell: 1, facing: 1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 0, enemyId: 'urednik' }
    ],
    goldReward: 28
  },

  act3_battle_2: {
    id: 'act3_battle_2',
    act: 3,
    name: 'Předsálí správní rady',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'drab', cell: 4, facing: -1 },
      { enemyId: 'urednik', cell: 6, facing: -1 },
      { enemyId: 'netopyr', cell: 0, facing: 1 }
    ],
    reinforcements: [
      { turnDelay: 3, gateCell: 0, enemyId: 'vratny_stit' },
      { turnDelay: 5, gateCell: 6, enemyId: 'ucetni_buffer' }
    ],
    goldReward: 30
  },

  act3_elite: {
    id: 'act3_elite',
    act: 3,
    name: 'Sál noční revize',
    isElite: true,
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 5, facing: -1 },
      { enemyId: 'elite_urednik', cell: 1, facing: 1 }
    ],
    reinforcements: [
      { turnDelay: 4, gateCell: 6, enemyId: 'ucetni_buffer' }
    ],
    goldReward: 42
  },

  act3_boss: {
    id: 'act3_boss',
    act: 3,
    name: 'Zasedačka generálního ředitele Drákuly',
    isBoss: true,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_drakula', cell: 5, facing: -1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 4 }],
    terrain: [{ type: 'pit', cell: 0 }, { type: 'spikes', cell: 3 }],
    reinforcements: [
      { turnDelay: 3, gateCell: 6, enemyId: 'netopyr' },
      { turnDelay: 5, gateCell: 0, enemyId: 'vratny_stit' }
    ],
    goldReward: 100
  }
};
