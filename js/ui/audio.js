let audioCtx = null;
let soundEnabled = true;

function getCtx() {
  if (!soundEnabled) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(val) {
  soundEnabled = Boolean(val);
}

export function isSoundEnabled() {
  return soundEnabled;
}

function playTone(freq, type = 'triangle', duration = 0.12, gainVal = 0.12, slideTo = null) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors on restricted autoplay
  }
}

export const SFX = {
  step() {
    playTone(150, 'triangle', 0.08, 0.1, 95);
  },
  swap() {
    playTone(240, 'sine', 0.14, 0.14, 420);
  },
  turn() {
    playTone(210, 'sine', 0.06, 0.08, 260);
  },
  queueInsert() {
    playTone(330, 'triangle', 0.09, 0.11, 440);
  },
  queueRemove() {
    playTone(280, 'triangle', 0.08, 0.09, 190);
  },
  hit() {
    playTone(110, 'sawtooth', 0.15, 0.18, 55);
  },
  collision() {
    playTone(85, 'square', 0.18, 0.2, 42);
  },
  friendlyFire() {
    playTone(392, 'triangle', 0.12, 0.15, 523);
    setTimeout(() => playTone(523, 'triangle', 0.18, 0.15, 659), 90);
  },
  bell() {
    playTone(587, 'sine', 0.32, 0.16, 580);
  },
  death() {
    playTone(160, 'sawtooth', 0.24, 0.15, 48);
  },
  victory() {
    playTone(330, 'triangle', 0.12, 0.14);
    setTimeout(() => playTone(440, 'triangle', 0.12, 0.14), 110);
    setTimeout(() => playTone(554, 'triangle', 0.24, 0.16), 220);
  },
  defeat() {
    playTone(220, 'sawtooth', 0.2, 0.14, 160);
    setTimeout(() => playTone(160, 'sawtooth', 0.35, 0.14, 95), 180);
  }
};
