// All tunable game constants — edit here to adjust feel
export const C = {
  // Display
  W: 1280, H: 720, FPS: 60,

  // Physics — tuned for Brawlhalla-style floaty feel
  GRAVITY: 0.48,
  MAX_FALL_SPEED: 15,
  FAST_FALL_MULT: 3.2,
  JUMP_FORCE: -18.5,
  DOUBLE_JUMP_FORCE: -17.0,
  WALK_SPEED: 5.2,
  RUN_SPEED: 9.0,
  DASH_SPEED: 14.0,
  DASH_DURATION: 18,
  AIR_SPEED: 7.5,
  AIR_ACCEL: 0.95,
  GROUND_FRICTION: 0.80,
  AIR_FRICTION: 0.97,
  WAVEDASH_FRICTION: 0.82,
  WAVEDASH_SLIDE_SPEED: 11.0,

  // Ledge
  LEDGE_GRAB_RANGE: 40,
  LEDGE_INVINCIBILITY: 120,
  LEDGE_HANG_MAX: 180,
  WALL_JUMP_FORCE_X: 10,
  WALL_JUMP_FORCE_Y: -14,

  // Combat
  INPUT_BUFFER: 9,
  COMBO_BUFFER: 9,
  HIT_PAUSE_LIGHT: 3,
  HIT_PAUSE_HEAVY: 8,
  HIT_PAUSE_SIG: 10,
  DI_INFLUENCE: 0.14,
  BASE_KB: 5.0,
  KB_SCALING: 0.082,

  // Dodge (shield button is now a dodge button — no standing shield camping)
  DODGE_COOLDOWN: 45,   // frames between dodges

  // Shield (kept for shield-break stun logic only)
  SHIELD_MAX: 100,
  SHIELD_SIZE_MAX: 55,
  SHIELD_SIZE_MIN: 20,
  SHIELD_DRAIN: 0.75,
  SHIELD_REGEN: 0.45,
  SHIELD_BREAK_STUN: 200,
  SPOT_DODGE_FRAMES: 15,
  SPOT_DODGE_IFRAMES_START: 2,
  SPOT_DODGE_IFRAMES_END: 14,
  ROLL_FRAMES: 22,
  ROLL_IFRAMES_START: 4,
  ROLL_IFRAMES_END: 18,
  PARRY_WINDOW: 5,
  PARRY_COUNTER_FRAMES: 20,

  // Stocks
  STOCKS: 3,
  RESPAWN_INVINCIBILITY: 180,
  RESPAWN_DURATION: 60,

  // Blast zones
  BLAST_L: -260,
  BLAST_R: 1540,
  BLAST_T: -320,
  BLAST_B: 860,

  // Visual
  OUTLINE_THICK: 3,
  SHAKE_LIGHT: 2,
  SHAKE_HEAVY: 8,
  SHAKE_SIG: 12,
  SHAKE_DECAY: 0.85,
  PARTICLE_MAX: 500,
  DAMAGE_NUM_DURATION: 50,
  ANNOUNCER_DURATION: 90,
  KO_FLASH_DURATION: 45,

  // Character rendering
  CHAR_SCALE: 1.0,
  HEAD_RADIUS: 22,
  TORSO_W: 28, TORSO_H: 34,
  ARM_UPPER: 18, ARM_LOWER: 16,
  LEG_UPPER: 20, LEG_LOWER: 18,

  // Platform
  DUST_PARTICLES: 6,
  SHADOW_ALPHA: 0.28,

  // Spawn points for 2 players
  SPAWN_P1: { x: 420, y: 350 },
  SPAWN_P2: { x: 860, y: 350 },

  // Weapon system
  WEAPON_SPAWN_INTERVAL: 600,   // frames between weapon spawns
  WEAPON_THROW_SPEED: 18,
  WEAPON_PICKUP_RANGE: 45,

  // Recovery move
  RECOVERY_FORCE: -22,
  RECOVERY_STARTUP: 6,
  RECOVERY_ACTIVE: 12,
  RECOVERY_RECOVERY: 20,
  RECOVERY_COOLDOWN: 180,  // frames before can use again

  // Air dodge (separate from spot dodge)
  AIR_DODGE_SPEED: 14,
  AIR_DODGE_FRAMES: 25,
  AIR_DODGE_IFRAMES_START: 3,
  AIR_DODGE_IFRAMES_END: 20,
  AIR_DODGE_EXHAUSTION: 1,  // uses per airtime before exhausted
  AIR_DODGE_PENALTY_FRAMES: 40,  // lag if used too many times

  // Combo system
  TRUE_COMBO_WINDOW: 12,  // frames defender is in guaranteed combo
  CANCEL_WINDOW: 8,       // frames where you can cancel into next action

  // Wall jump
  WALL_JUMP_X: 11,
  WALL_JUMP_Y: -15,
  WALL_JUMP_GRACE: 8,  // frames after touching wall that you can wall jump
};
