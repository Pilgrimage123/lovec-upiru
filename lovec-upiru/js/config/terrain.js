export const TERRAIN_TYPES = {
  none: {
    id: 'none',
    name: 'Kamenná dlažba',
    icon: 'terrain.stone',
    description: 'Obyčejná hradní dlaždice postříkaná pivem a voskem ze svíček.'
  },
  plank_intact: {
    id: 'plank_intact',
    name: 'Prohnilé prkno',
    icon: 'terrain.plank_intact',
    description: '1. stoupnutí zapraská. 2. stoupnutí prkno prolomí a způsobí 2 DMG (létající netopýři prkno neprolomí).'
  },
  plank_cracked: {
    id: 'plank_cracked',
    name: 'Napůl zlomené prkno',
    icon: 'terrain.plank_cracked',
    description: 'Už praská ve švech! Další stoupnutí jej prolomí za 2 DMG.'
  },
  pit: {
    id: 'pit',
    name: 'Hradní propast',
    icon: 'terrain.pit',
    description: 'Bezedná šachta do sklepení. Vhození nebo stoupnutí znamená okamžitou smrt (kromě létajících potvor).'
  },
  spikes: {
    id: 'spikes',
    name: 'Naostřené kůly',
    icon: 'terrain.spikes',
    description: 'Dubové špičáky v podlaze. Každý přesun nebo odhození na toto pole způsobí okamžitě 2 DMG.'
  },
  garlic_cloud: {
    id: 'garlic_cloud',
    name: 'Česnekový oblak',
    icon: 'terrain.garlic_cloud',
    description: 'Štiplavý moravský česnek (2 tahy). Nepřátelé v oblaku dávají o 1 DMG méně; Venca se v něm otáčí zdarma (0 tahů).'
  }
};

export const PROPS = {
  barrel: {
    id: 'barrel',
    name: 'Sud s kyselým zelím',
    icon: 'terrain.barrel',
    maxHp: 2,
    description: 'Těžký dubový sud (2 HP). Blokuje pohyb, lze jej přeskočit. Při vhození postavy do sudu nebo rozbití praskne a způsobí 2 DMG + Zmatení.'
  }
};
