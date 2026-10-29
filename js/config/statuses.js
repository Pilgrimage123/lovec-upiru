export const STATUSES = {
  confusion: {
    id: 'confusion',
    name: 'Zmatení',
    icon: 'status.confusion',
    badge: '🌀',
    color: '#9b59b6',
    description: 'Při příštím kroku se postava zamotá a vykročí náhodným směrem (pokud je volno).'
  },

  stun: {
    id: 'stun',
    name: 'Omráčení',
    icon: 'status.stun',
    badge: '🔔',
    color: '#f1c40f',
    description: 'Zcela přeskočí aktivní destičku nepřítele při jejím vyhodnocení a posune frontu.'
  },
  bleed: {
    id: 'bleed',
    name: 'Krvácení',
    icon: 'status.bleed',
    badge: '🩸',
    color: '#c0392b',
    description: 'Způsobí 1 DMG na konci každého tahu po dobu 2 tahů.'
  },
  shield: {
    id: 'shield',
    name: 'Štít z poklopu',
    icon: 'status.shield',
    badge: '🛡️',
    color: '#2980b9',
    description: 'Zcela vykryje příští obdržený zásah (1 vrstva = 1 zásah).'
  },
  empower: {
    id: 'empower',
    name: 'Zesílení',
    icon: 'status.empower',
    badge: '🔥',
    color: '#d35400',
    description: 'Příští útočná akce způsobí +1 DMG.'
  }
};
