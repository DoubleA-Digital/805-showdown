// Per-stage theme + screen text config. Easy to swap.

export const STAGE_THEMES = {
  downtown: {
    arenaGlow: '#2A6FFF',
    runeColor: '#5BA8FF',
    rayColor: 'rgba(120,180,255,0.18)',
    moteColor: 'rgba(160,200,255,0.55)',
    tint: '#0B1228',
  },
  rooftop: {
    arenaGlow: '#FF884E',
    runeColor: '#FFC176',
    rayColor: 'rgba(255,180,120,0.18)',
    moteColor: 'rgba(255,210,160,0.55)',
    tint: '#3A1A0F',
  },
  beach: {
    arenaGlow: '#7DD8F2',
    runeColor: '#A4ECF8',
    rayColor: 'rgba(255,250,210,0.20)',
    moteColor: 'rgba(255,255,210,0.55)',
    tint: '#0B2638',
  },
  gym: {
    arenaGlow: '#5870FF',
    runeColor: '#9AAEFF',
    rayColor: 'rgba(180,200,255,0.16)',
    moteColor: 'rgba(200,210,255,0.55)',
    tint: '#08080F',
  },
  classroom: {
    arenaGlow: '#FFC36A',
    runeColor: '#FFE2A1',
    rayColor: 'rgba(255,220,160,0.16)',
    moteColor: 'rgba(255,235,200,0.55)',
    tint: '#1F140A',
  },
};

export function getTheme(stageKey) {
  return STAGE_THEMES[stageKey] || STAGE_THEMES.downtown;
}

// Loading tips shown on the boot loader and between matches
export const LOADING_TIPS = [
  'Tip: Use dodges to escape combos.',
  'Tip: Heavy attacks hit harder but are easier to punish.',
  'Tip: Control the platform to control the fight.',
  'Tip: Mix light attacks and movement to pressure opponents.',
  'Tip: Wavedash out of shield for a quick reset.',
  'Tip: Edge-guarding wins more matches than KO power.',
  'Tip: Save your double jump for recovery, not offense.',
  'Tip: Parry on reaction — dodge on prediction.',
];

// Loading screen configuration
export const LOADING_CONFIG = {
  title: '805',
  subtitle: 'SHOWDOWN',
  tagline: 'PLATFORM FIGHTER',
  durationFrames: 180,         // ~3s of animated boot loader
  fadeFrames: 30,
};

// VS screen / countdown configuration
export const VS_CONFIG = {
  vsScreenFrames: 180,
  countdownFrames: 60,         // each digit (3, 2, 1) for ~1s
  fightFrames: 50,
  flashFrames: 18,
};
