import { C } from './constants.js';

// ── Weapon type definitions (data-driven) ────────────────────────────────────

export const WEAPON_DEFS = {
  sword: {
    name: 'Sword',
    color: '#C0C0C0',
    accentColor: '#888888',
    glowColor: '#6699FF',
    type: 'sword',
    throwDamage: 14,
    throwKnockback: { base: 22, scaling: 0.7, angle: 30 },
    throwSpeed: 18,
    sprite: 'sword',
    moves: {
      neutralLight: {
        name: 'Quick Slash', startup: 4, active: 5, recovery: 8,
        damage: 11, knockback: { base: 20, scaling: 0.65, angle: 40 },
        hitstun: 14, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 12, y: -65, w: 55, h: 22 }],
      },
      sideLight: {
        name: 'Sword Swipe', startup: 6, active: 6, recovery: 12,
        damage: 14, knockback: { base: 28, scaling: 0.8, angle: 35 },
        hitstun: 16, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 8, y: -60, w: 65, h: 28 }],
      },
      upLight: {
        name: 'Rising Slash', startup: 5, active: 7, recovery: 10,
        damage: 13, knockback: { base: 26, scaling: 0.75, angle: 85 },
        hitstun: 15, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -15, y: -95, w: 40, h: 35 }],
      },
      downLight: {
        name: 'Low Slash', startup: 5, active: 5, recovery: 9,
        damage: 10, knockback: { base: 16, scaling: 0.5, angle: 280 },
        hitstun: 13, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 5, y: -20, w: 50, h: 20 }],
      },
      neutralAir: {
        name: 'Spin Slash', startup: 5, active: 10, recovery: 12,
        damage: 12, knockback: { base: 20, scaling: 0.6, angle: 45 },
        hitstun: 14, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -30, y: -70, w: 65, h: 45 }],
      },
      forwardAir: {
        name: 'Aerial Stab', startup: 6, active: 6, recovery: 10,
        damage: 15, knockback: { base: 30, scaling: 0.85, angle: 30 },
        hitstun: 17, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 15, y: -60, w: 60, h: 25 }],
      },
      backAir: {
        name: 'Back Slash', startup: 7, active: 5, recovery: 10,
        damage: 13, knockback: { base: 28, scaling: 0.8, angle: 155 },
        hitstun: 16, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -55, y: -55, w: 50, h: 22 }],
      },
      upAir: {
        name: 'Upward Thrust', startup: 5, active: 6, recovery: 9,
        damage: 12, knockback: { base: 24, scaling: 0.7, angle: 88 },
        hitstun: 15, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -10, y: -105, w: 30, h: 35 }],
      },
      downAir: {
        name: 'Sword Spike', startup: 10, active: 5, recovery: 14,
        damage: 18, knockback: { base: 22, scaling: 0.9, angle: 270 },
        hitstun: 16, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -12, y: -18, w: 28, h: 18 }],
      },
      sideHeavy: {
        name: 'Power Cleave', startup: 16, active: 9, recovery: 22,
        damage: 26, knockback: { base: 45, scaling: 1.4, angle: 40 },
        hitstun: 25, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: 5, y: -70, w: 80, h: 40 }],
      },
      upHeavy: {
        name: 'Heaven Rend', startup: 14, active: 8, recovery: 18,
        damage: 22, knockback: { base: 38, scaling: 1.2, angle: 90 },
        hitstun: 22, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -20, y: -110, w: 50, h: 50 }],
      },
      downHeavy: {
        name: 'Plunge', startup: 18, active: 7, recovery: 24,
        damage: 24, knockback: { base: 35, scaling: 1.1, angle: 270 },
        hitstun: 22, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -20, y: -15, w: 50, h: 15 }],
      },
      signature: {
        name: 'Blade Storm', startup: 10, active: 28, recovery: 18,
        damage: 30, knockback: { base: 50, scaling: 1.6, angle: 50 },
        hitstun: 26, isHeavy: true, isSig: true, effect: 'sparkle',
        hitboxes: [{ x: -40, y: -100, w: 90, h: 90 }],
        momentum: { x: 0.5, y: -2 },
      },
    },
  },

  spear: {
    name: 'Spear',
    color: '#A08040',
    accentColor: '#704020',
    glowColor: '#FFCC00',
    type: 'spear',
    throwDamage: 16,
    throwKnockback: { base: 25, scaling: 0.8, angle: 25 },
    throwSpeed: 22,
    sprite: 'spear',
    moves: {
      neutralLight: {
        name: 'Poke', startup: 3, active: 4, recovery: 7,
        damage: 8, knockback: { base: 14, scaling: 0.5, angle: 30 },
        hitstun: 12, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: 10, y: -62, w: 70, h: 16 }],
      },
      sideLight: {
        name: 'Thrust', startup: 5, active: 5, recovery: 10,
        damage: 12, knockback: { base: 22, scaling: 0.65, angle: 25 },
        hitstun: 15, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: 5, y: -64, w: 80, h: 18 }],
      },
      upLight: {
        name: 'Upward Jab', startup: 4, active: 6, recovery: 9,
        damage: 10, knockback: { base: 18, scaling: 0.6, angle: 82 },
        hitstun: 14, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -10, y: -100, w: 25, h: 40 }],
      },
      downLight: {
        name: 'Low Poke', startup: 4, active: 4, recovery: 8,
        damage: 8, knockback: { base: 12, scaling: 0.45, angle: 285 },
        hitstun: 12, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: 5, y: -18, w: 65, h: 18 }],
      },
      neutralAir: {
        name: 'Spin Thrust', startup: 6, active: 9, recovery: 11,
        damage: 11, knockback: { base: 18, scaling: 0.6, angle: 40 },
        hitstun: 14, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -35, y: -65, w: 80, h: 38 }],
      },
      forwardAir: {
        name: 'Aerial Thrust', startup: 5, active: 6, recovery: 9,
        damage: 13, knockback: { base: 25, scaling: 0.75, angle: 28 },
        hitstun: 16, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: 10, y: -62, w: 75, h: 20 }],
      },
      backAir: {
        name: 'Reverse Thrust', startup: 8, active: 5, recovery: 11,
        damage: 12, knockback: { base: 23, scaling: 0.7, angle: 152 },
        hitstun: 15, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -70, y: -60, w: 65, h: 18 }],
      },
      upAir: {
        name: 'Overhead Thrust', startup: 5, active: 7, recovery: 10,
        damage: 11, knockback: { base: 20, scaling: 0.65, angle: 86 },
        hitstun: 14, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -12, y: -108, w: 28, h: 45 }],
      },
      downAir: {
        name: 'Drop Thrust', startup: 9, active: 5, recovery: 13,
        damage: 15, knockback: { base: 20, scaling: 0.85, angle: 270 },
        hitstun: 15, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -10, y: -22, w: 24, h: 22 }],
      },
      sideHeavy: {
        name: 'Javelin Lunge', startup: 14, active: 10, recovery: 20,
        damage: 28, knockback: { base: 48, scaling: 1.5, angle: 32 },
        hitstun: 26, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: 0, y: -68, w: 95, h: 35 }],
      },
      upHeavy: {
        name: 'Pole Vault', startup: 12, active: 8, recovery: 17,
        damage: 22, knockback: { base: 36, scaling: 1.15, angle: 90 },
        hitstun: 22, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -15, y: -115, w: 35, h: 55 }],
      },
      downHeavy: {
        name: 'Slam', startup: 16, active: 7, recovery: 22,
        damage: 23, knockback: { base: 33, scaling: 1.05, angle: 268 },
        hitstun: 21, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -18, y: -18, w: 55, h: 18 }],
      },
      signature: {
        name: 'Spear Barrage', startup: 8, active: 32, recovery: 20,
        damage: 28, knockback: { base: 46, scaling: 1.5, angle: 45 },
        hitstun: 24, isHeavy: true, isSig: true, effect: 'punch',
        hitboxes: [{ x: -10, y: -80, w: 100, h: 65 }],
        momentum: { x: 1.5, y: -1 },
      },
    },
  },

  axe: {
    name: 'Axe',
    color: '#888888',
    accentColor: '#556677',
    glowColor: '#FF4400',
    type: 'axe',
    throwDamage: 18,
    throwKnockback: { base: 28, scaling: 0.9, angle: 50 },
    throwSpeed: 14,
    sprite: 'axe',
    moves: {
      neutralLight: {
        name: 'Chop', startup: 6, active: 5, recovery: 10,
        damage: 13, knockback: { base: 22, scaling: 0.7, angle: 45 },
        hitstun: 15, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: 8, y: -75, w: 48, h: 30 }],
      },
      sideLight: {
        name: 'Horizontal Chop', startup: 8, active: 6, recovery: 13,
        damage: 16, knockback: { base: 30, scaling: 0.85, angle: 38 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: 5, y: -65, w: 60, h: 32 }],
      },
      upLight: {
        name: 'Upswing', startup: 7, active: 7, recovery: 11,
        damage: 14, knockback: { base: 28, scaling: 0.8, angle: 84 },
        hitstun: 16, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -18, y: -100, w: 45, h: 38 }],
      },
      downLight: {
        name: 'Ground Chop', startup: 6, active: 5, recovery: 10,
        damage: 12, knockback: { base: 18, scaling: 0.6, angle: 275 },
        hitstun: 14, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -5, y: -22, w: 55, h: 22 }],
      },
      neutralAir: {
        name: 'Aerial Chop', startup: 7, active: 8, recovery: 13,
        damage: 14, knockback: { base: 24, scaling: 0.72, angle: 50 },
        hitstun: 15, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -28, y: -80, w: 60, h: 50 }],
      },
      forwardAir: {
        name: 'Flying Chop', startup: 8, active: 7, recovery: 12,
        damage: 17, knockback: { base: 32, scaling: 0.9, angle: 42 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: 10, y: -70, w: 55, h: 38 }],
      },
      backAir: {
        name: 'Back Chop', startup: 9, active: 6, recovery: 12,
        damage: 15, knockback: { base: 30, scaling: 0.85, angle: 145 },
        hitstun: 17, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -52, y: -68, w: 50, h: 34 }],
      },
      upAir: {
        name: 'Axe Toss', startup: 7, active: 7, recovery: 11,
        damage: 15, knockback: { base: 26, scaling: 0.78, angle: 88 },
        hitstun: 16, isHeavy: false, effect: 'punch',
        hitboxes: [{ x: -15, y: -108, w: 38, h: 40 }],
      },
      downAir: {
        name: 'Axe Spike', startup: 12, active: 6, recovery: 16,
        damage: 20, knockback: { base: 26, scaling: 0.95, angle: 270 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -18, y: -20, w: 40, h: 20 }],
      },
      sideHeavy: {
        name: 'Overhead Axe', startup: 20, active: 10, recovery: 26,
        damage: 30, knockback: { base: 52, scaling: 1.6, angle: 45 },
        hitstun: 28, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: 0, y: -80, w: 75, h: 50 }],
      },
      upHeavy: {
        name: 'Rising Axe', startup: 16, active: 9, recovery: 20,
        damage: 25, knockback: { base: 42, scaling: 1.3, angle: 90 },
        hitstun: 24, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -25, y: -115, w: 58, h: 55 }],
      },
      downHeavy: {
        name: 'Earth Shatter', startup: 22, active: 8, recovery: 28,
        damage: 28, knockback: { base: 40, scaling: 1.2, angle: 270 },
        hitstun: 26, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -30, y: -20, w: 65, h: 20 }],
      },
      signature: {
        name: 'Ragnarok', startup: 14, active: 24, recovery: 22,
        damage: 34, knockback: { base: 56, scaling: 1.8, angle: 55 },
        hitstun: 28, isHeavy: true, isSig: true, effect: 'explosion',
        hitboxes: [{ x: -50, y: -110, w: 110, h: 100 }],
        momentum: { x: 0, y: -3.5 },
      },
    },
  },

  blasters: {
    name: 'Blasters',
    color: '#330066',
    accentColor: '#6600AA',
    glowColor: '#CC44FF',
    type: 'blasters',
    throwDamage: 10,
    throwKnockback: { base: 15, scaling: 0.5, angle: 35 },
    throwSpeed: 20,
    sprite: 'blasters',
    moves: {
      neutralLight: {
        name: 'Quick Shot', startup: 2, active: 4, recovery: 6,
        damage: 6, knockback: { base: 10, scaling: 0.35, angle: 40 },
        hitstun: 10, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 15, y: -58, w: 90, h: 14 }],
      },
      sideLight: {
        name: 'Blast Shot', startup: 4, active: 5, recovery: 9,
        damage: 9, knockback: { base: 16, scaling: 0.5, angle: 32 },
        hitstun: 12, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 12, y: -58, w: 100, h: 16 }],
      },
      upLight: {
        name: 'Angle Shot', startup: 4, active: 5, recovery: 8,
        damage: 8, knockback: { base: 14, scaling: 0.45, angle: 80 },
        hitstun: 12, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -12, y: -95, w: 28, h: 40 }],
      },
      downLight: {
        name: 'Low Shot', startup: 3, active: 4, recovery: 7,
        damage: 7, knockback: { base: 12, scaling: 0.4, angle: 285 },
        hitstun: 10, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 8, y: -18, w: 95, h: 14 }],
      },
      neutralAir: {
        name: 'Scatter Shot', startup: 4, active: 8, recovery: 10,
        damage: 8, knockback: { base: 14, scaling: 0.45, angle: 40 },
        hitstun: 12, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -80, y: -65, w: 170, h: 28 }],
      },
      forwardAir: {
        name: 'Forward Blast', startup: 4, active: 6, recovery: 9,
        damage: 10, knockback: { base: 18, scaling: 0.55, angle: 32 },
        hitstun: 13, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: 12, y: -60, w: 110, h: 18 }],
      },
      backAir: {
        name: 'Backward Blast', startup: 6, active: 5, recovery: 10,
        damage: 10, knockback: { base: 18, scaling: 0.55, angle: 148 },
        hitstun: 13, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -105, y: -60, w: 100, h: 18 }],
      },
      upAir: {
        name: 'Sky Shot', startup: 4, active: 6, recovery: 9,
        damage: 9, knockback: { base: 16, scaling: 0.5, angle: 88 },
        hitstun: 12, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -14, y: -105, w: 32, h: 48 }],
      },
      downAir: {
        name: 'Ground Burst', startup: 8, active: 5, recovery: 12,
        damage: 12, knockback: { base: 18, scaling: 0.7, angle: 270 },
        hitstun: 14, isHeavy: false, effect: 'sparkle',
        hitboxes: [{ x: -18, y: -20, w: 38, h: 20 }],
      },
      sideHeavy: {
        name: 'Charged Blast', startup: 18, active: 8, recovery: 20,
        damage: 24, knockback: { base: 42, scaling: 1.3, angle: 36 },
        hitstun: 24, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: 8, y: -65, w: 140, h: 30 }],
      },
      upHeavy: {
        name: 'Orbital Burst', startup: 14, active: 9, recovery: 18,
        damage: 20, knockback: { base: 36, scaling: 1.1, angle: 90 },
        hitstun: 22, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -20, y: -120, w: 50, h: 65 }],
      },
      downHeavy: {
        name: 'Ground Zero', startup: 16, active: 8, recovery: 22,
        damage: 22, knockback: { base: 32, scaling: 1.0, angle: 270 },
        hitstun: 22, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -40, y: -20, w: 90, h: 20 }],
      },
      signature: {
        name: 'Hyperlaser', startup: 12, active: 30, recovery: 16,
        damage: 28, knockback: { base: 48, scaling: 1.5, angle: 45 },
        hitstun: 26, isHeavy: true, isSig: true, effect: 'sparkle',
        hitboxes: [{ x: 10, y: -65, w: 200, h: 25 }],
        momentum: { x: 0.2, y: 0 },
      },
    },
  },

  hammer: {
    name: 'Hammer',
    color: '#AA4400',
    accentColor: '#552200',
    glowColor: '#FF6600',
    type: 'hammer',
    throwDamage: 20,
    throwKnockback: { base: 32, scaling: 1.0, angle: 55 },
    throwSpeed: 12,
    sprite: 'hammer',
    moves: {
      neutralLight: {
        name: 'Bonk', startup: 8, active: 5, recovery: 12,
        damage: 15, knockback: { base: 26, scaling: 0.8, angle: 50 },
        hitstun: 16, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: 5, y: -80, w: 55, h: 35 }],
      },
      sideLight: {
        name: 'Side Smash', startup: 10, active: 6, recovery: 15,
        damage: 18, knockback: { base: 34, scaling: 0.95, angle: 42 },
        hitstun: 18, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: 5, y: -75, w: 70, h: 40 }],
      },
      upLight: {
        name: 'Hammer Toss', startup: 9, active: 7, recovery: 13,
        damage: 16, knockback: { base: 30, scaling: 0.88, angle: 88 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -20, y: -110, w: 55, h: 45 }],
      },
      downLight: {
        name: 'Ground Pound', startup: 8, active: 6, recovery: 12,
        damage: 14, knockback: { base: 22, scaling: 0.7, angle: 272 },
        hitstun: 15, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -15, y: -25, w: 65, h: 25 }],
      },
      neutralAir: {
        name: 'Whirl', startup: 9, active: 9, recovery: 14,
        damage: 16, knockback: { base: 28, scaling: 0.82, angle: 50 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -35, y: -90, w: 80, h: 65 }],
      },
      forwardAir: {
        name: 'Aerial Smash', startup: 10, active: 7, recovery: 14,
        damage: 20, knockback: { base: 36, scaling: 1.0, angle: 44 },
        hitstun: 19, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: 8, y: -80, w: 70, h: 48 }],
      },
      backAir: {
        name: 'Backswing', startup: 11, active: 6, recovery: 14,
        damage: 18, knockback: { base: 34, scaling: 0.95, angle: 148 },
        hitstun: 18, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -65, y: -78, w: 62, h: 44 }],
      },
      upAir: {
        name: 'Uppercut', startup: 8, active: 8, recovery: 12,
        damage: 17, knockback: { base: 32, scaling: 0.9, angle: 90 },
        hitstun: 17, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -18, y: -115, w: 45, h: 48 }],
      },
      downAir: {
        name: 'Meteor Smash', startup: 14, active: 7, recovery: 18,
        damage: 24, knockback: { base: 28, scaling: 1.1, angle: 270 },
        hitstun: 18, isHeavy: false, effect: 'explosion',
        hitboxes: [{ x: -22, y: -25, w: 50, h: 25 }],
      },
      sideHeavy: {
        name: 'Demolish', startup: 24, active: 11, recovery: 30,
        damage: 35, knockback: { base: 60, scaling: 1.8, angle: 45 },
        hitstun: 30, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: 0, y: -90, w: 90, h: 58 }],
      },
      upHeavy: {
        name: 'Geyser', startup: 18, active: 10, recovery: 24,
        damage: 28, knockback: { base: 50, scaling: 1.4, angle: 90 },
        hitstun: 26, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -28, y: -125, w: 68, h: 65 }],
      },
      downHeavy: {
        name: 'Quake', startup: 26, active: 9, recovery: 32,
        damage: 32, knockback: { base: 48, scaling: 1.5, angle: 270 },
        hitstun: 28, isHeavy: true, effect: 'explosion',
        hitboxes: [{ x: -45, y: -28, w: 95, h: 28 }],
      },
      signature: {
        name: 'Earthbreaker', startup: 18, active: 20, recovery: 25,
        damage: 38, knockback: { base: 65, scaling: 2.0, angle: 55 },
        hitstun: 32, isHeavy: true, isSig: true, effect: 'explosion',
        hitboxes: [{ x: -60, y: -130, w: 130, h: 120 }],
        momentum: { x: 0.3, y: -4 },
      },
    },
  },
};

export const WEAPON_TYPE_LIST = Object.keys(WEAPON_DEFS);

// ── Weapon entity (lives on the stage as a pickup) ───────────────────────────

export class WeaponItem {
  constructor(weaponType, x, y) {
    this.type = weaponType;
    this.def = WEAPON_DEFS[weaponType];
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.active = true;         // false = being carried or removed
    this.thrown = false;        // true = currently in flight as a projectile
    this.thrownBy = null;       // reference to the Fighter who threw it
    this.hitThrown = new Set(); // fighters already hit by this throw
    this.bobOffset = Math.random() * Math.PI * 2; // for idle bobbing animation
    this.frame = 0;
    this.pickupCooldown = 0;    // prevent instant re-pickup after throw
  }

  update(platforms) {
    this.frame++;
    if (this.pickupCooldown > 0) this.pickupCooldown--;

    if (!this.grounded) {
      this.vy = Math.min(this.vy + 0.6, 18); // weapon gravity
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98;

      // Land on platforms
      for (const plat of platforms) {
        const inX = this.x + 15 > plat.x && this.x - 15 < plat.x + plat.w;
        const wasAbove = (this.y - this.vy) <= plat.y + 2;
        const isBelow = this.y >= plat.y - 2;
        if (inX && wasAbove && isBelow) {
          this.y = plat.y;
          this.vy = 0;
          this.vx *= 0.7;
          this.grounded = true;
          if (this.thrown) {
            this.thrown = false; // stop being a projectile after landing
            this.hitThrown.clear();
            this.pickupCooldown = 30;
          }
          break;
        }
      }
    } else {
      this.vx *= 0.85;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
  }

  // Returns the hitbox when thrown (in world coords), or null
  getThrownHitbox() {
    if (!this.thrown) return null;
    return { x: this.x - 20, y: this.y - 40, w: 40, h: 40 };
  }

  draw(ctx) {
    if (!this.active) return;
    const bob = this.grounded ? Math.sin(this.frame * 0.08 + this.bobOffset) * 4 : 0;
    const drawY = this.y - 30 + bob;

    ctx.save();
    ctx.translate(this.x, drawY);

    // Glow effect
    ctx.save();
    const glowAlpha = 0.3 + Math.sin(this.frame * 0.1 + this.bobOffset) * 0.15;
    ctx.globalAlpha = glowAlpha;
    const grd = ctx.createRadialGradient(0, 0, 5, 0, 0, 28);
    grd.addColorStop(0, this.def.glowColor + 'FF');
    grd.addColorStop(1, this.def.glowColor + '00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw weapon shape based on type
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = this.def.color;

    this._drawShape(ctx);

    // Pickup indicator when on ground
    if (this.grounded && !this.thrown) {
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE000';
      ctx.globalAlpha = 0.7 + Math.sin(this.frame * 0.1) * 0.3;
      ctx.fillText('▲ Pick Up', 0, -35);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  _drawShape(ctx) {
    switch (this.type) {
      case 'sword':
        // Blade
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.moveTo(-3, -28); ctx.lineTo(3, -28);
        ctx.lineTo(4, 10); ctx.lineTo(-4, 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Guard
        ctx.fillStyle = this.def.accentColor;
        ctx.fillRect(-10, 8, 20, 5);
        // Handle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 12, 6, 14);
        break;

      case 'spear':
        // Shaft
        ctx.fillStyle = this.def.accentColor;
        ctx.fillRect(-2, -5, 4, 38);
        ctx.stroke();
        // Head
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(6, -10); ctx.lineTo(-6, -10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;

      case 'axe':
        // Handle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -5, 4, 35);
        // Head
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.moveTo(-2, -25); ctx.lineTo(18, -18);
        ctx.lineTo(20, -5); ctx.lineTo(2, -2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;

      case 'blasters':
        // Left gun
        ctx.fillStyle = this.def.color;
        ctx.fillRect(-18, -10, 14, 8);
        ctx.fillRect(-8, -14, 6, 4);
        // Right gun
        ctx.fillRect(4, -10, 14, 8);
        ctx.fillRect(2, -14, 6, 4);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
        ctx.strokeRect(-18, -10, 14, 8);
        ctx.strokeRect(4, -10, 14, 8);
        break;

      case 'hammer':
        // Handle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -5, 4, 32);
        // Head
        ctx.fillStyle = this.def.color;
        ctx.fillRect(-18, -28, 36, 22);
        ctx.strokeRect(-18, -28, 36, 22);
        break;
    }
  }
}

// ── Weapon manager (tracks all weapons on stage) ─────────────────────────────

export class WeaponManager {
  constructor() {
    this.weapons = [];
    this.spawnTimer = 0;
    this.spawnInterval = C.WEAPON_SPAWN_INTERVAL || 600;
    this.spawnPoints = [];
    this.maxWeapons = 2;
  }

  setSpawnPoints(points) {
    this.spawnPoints = points;
  }

  update(platforms, fighters) {
    // Update all weapon entities
    for (const w of this.weapons) {
      w.update(platforms);
    }

    // Remove inactive weapons
    this.weapons = this.weapons.filter(w => w.active);

    // Weapon spawn timer
    this.spawnTimer++;
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.weapons.filter(w => !w.thrown && w.grounded).length < this.maxWeapons &&
      this.spawnPoints.length > 0
    ) {
      this.spawnTimer = 0;
      this._spawnWeapon();
    }
  }

  _spawnWeapon() {
    const pt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    const type = WEAPON_TYPE_LIST[Math.floor(Math.random() * WEAPON_TYPE_LIST.length)];
    const w = new WeaponItem(type, pt.x, pt.y - 50);
    w.vy = -5; // drop in from above
    this.weapons.push(w);
  }

  // Check if a fighter is near a weapon to pick it up
  checkPickup(fighter) {
    if (fighter.currentWeapon) return; // already has weapon
    const range = C.WEAPON_PICKUP_RANGE || 45;
    for (const w of this.weapons) {
      if (w.thrown || !w.active || w.pickupCooldown > 0) continue;
      const dx = fighter.x - w.x;
      const dy = fighter.y - w.y;
      if (Math.sqrt(dx * dx + dy * dy) < range) {
        // Pick up
        fighter.currentWeapon = w;
        w.active = false;
        return w;
      }
    }
    return null;
  }

  // Fighter throws their weapon
  throwWeapon(fighter) {
    if (!fighter.currentWeapon) return;
    const w = fighter.currentWeapon;
    w.active = true;
    w.thrown = true;
    w.thrownBy = fighter;
    w.hitThrown.clear();
    w.x = fighter.x + (fighter.facingRight ? 20 : -20);
    w.y = fighter.y - 50;
    const speed = w.def.throwSpeed || 18;
    w.vx = (fighter.facingRight ? 1 : -1) * speed;
    w.vy = -4;
    w.grounded = false;
    w.pickupCooldown = 60;
    fighter.currentWeapon = null;
    this.weapons.push(w);
    return w;
  }

  // Check thrown weapon hits against fighters
  checkThrownHits(fighters, effects) {
    for (const w of this.weapons) {
      if (!w.thrown) continue;
      const hbox = w.getThrownHitbox();
      if (!hbox) continue;

      for (const f of fighters) {
        if (f === w.thrownBy) continue; // can't hit yourself
        if (w.hitThrown.has(f)) continue;
        if (f.isInvincible) continue;

        // Check overlap with fighter hurtbox
        const hurtY = f.y - 75;
        const hurtX = f.x - 18;
        if (
          hbox.x < hurtX + 36 && hbox.x + hbox.w > hurtX &&
          hbox.y < hurtY + 75 && hbox.y + hbox.h > hurtY
        ) {
          w.hitThrown.add(f);
          f.damage += w.def.throwDamage;
          const kb = w.def.throwKnockback;
          const weightFactor = 100 / (f.weight + 50);
          const kbMag = (kb.base + f.damage * kb.scaling * 0.082) * weightFactor;
          const rad = kb.angle * Math.PI / 180;
          const dir = w.vx > 0 ? 1 : -1;
          f.vx = Math.cos(rad) * kbMag * dir;
          f.vy = -Math.sin(rad) * kbMag;
          f.hitPauseLeft = 4;
          if (kbMag > 8) {
            f.grounded = false;
            f.ledgeHanging = false;
            f.state = 'ko_launch';
            f.stateFrame = 0;
          } else {
            f.state = 'hit_stun';
            f.stateFrame = 0;
            f.hitStunEnd = f.stateFrame + Math.floor(kbMag * 3.5 + 15);
          }
          effects?.spawnHitEffect(w.x, w.y - 20, 'punch', 'light');
          effects?.spawnDamageNumber(f.x, f.y - 60, w.def.throwDamage);
        }
      }
    }
  }

  draw(ctx) {
    for (const w of this.weapons) {
      w.draw(ctx);
    }
  }

  reset() {
    this.weapons = [];
    this.spawnTimer = Math.floor(this.spawnInterval * 0.5); // first spawn at half interval
  }
}
