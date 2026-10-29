export const BOARD_SIZE = 7;
export const QUEUE_SLOTS = 3;
export const MAX_QUEUE_SLOTS = 4;
export const QUEUE_INSERT_COST = 1;
export const HERO_START_HP = 10;
export const HERO_START_GOLD = 25;
export const GARLIC_CLOUD_DURATION = 2;
export const BLEED_DURATION = 2;
export const BARREL_MAX_HP = 2;
export const SPIKES_DAMAGE = 2;
export const PLANK_COLLAPSE_DAMAGE = 2;
export const BARREL_EXPLODE_DAMAGE = 2;
export const COLLISION_DAMAGE = 1;

export const ANIMATION_TIMINGS = {
  QUEUE_STEP_MS: 450,
  TURN_TRANSITION_MS: 300,
  ENEMY_ACTION_MS: 420,
  MOVE_MS: 200,
  HIT_MS: 220,
  DEATH_MS: 320
};

export const NODE_TYPES = {
  BATTLE: 'battle',
  ELITE: 'elite',
  PUB: 'pub',
  WORKSHOP: 'workshop',
  EVENT: 'event',
  TREASURE: 'treasure',
  BOSS: 'boss'
};

export const ENTITY_TYPES = {
  HERO: 'hero',
  ENEMY: 'enemy',
  PROP: 'prop'
};

export const FACING = {
  LEFT: -1,
  RIGHT: 1
};
