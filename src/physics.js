import { C } from './constants.js';

// Calculate knockback velocity given damage%, base KB, scaling, and angle
export function calcKnockback(damage, baseKB, scaling, angleDeg, facingRight, weight = 100) {
  const weightFactor = 100 / (weight + 50);
  const kb = (baseKB + damage * scaling * C.KB_SCALING) * weightFactor;
  const rad = angleDeg * Math.PI / 180;
  return {
    vx: Math.cos(rad) * kb * (facingRight ? 1 : -1),
    vy: -Math.sin(rad) * kb, // negative = up
  };
}

// Apply DI to knockback trajectory
export function applyDI(vx, vy, diX, diY) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag < 0.1) return { vx, vy };
  // DI: perpendicular influence
  const nx = -vy / mag;
  const ny = vx / mag;
  const dot = diX * nx + diY * ny;
  return {
    vx: vx + nx * dot * C.DI_INFLUENCE * mag,
    vy: vy + ny * dot * C.DI_INFLUENCE * mag,
  };
}

// AABB rectangle collision check
export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Point in rect
export function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Resolve a character landing on a platform
// Returns corrected y and grounded=true if the character's feet touch
export function resolveGrounding(fighter, platforms) {
  if (fighter.vy < 0) return false; // Moving upward
  const feet = fighter.y;
  const feetPrev = feet - fighter.vy;

  for (const plat of platforms) {
    const inX = fighter.x + 12 > plat.x && fighter.x - 12 < plat.x + plat.w;
    const wasAbove = feetPrev <= plat.y + 2;
    const isBelow = feet >= plat.y - 2;
    if (inX && wasAbove && isBelow && !plat.passThrough) {
      fighter.y = plat.y;
      fighter.vy = 0;
      return true;
    }
    // Passthrough platforms: only land if not holding down
    if (inX && wasAbove && isBelow && plat.passThrough && !fighter.fallingThrough) {
      fighter.y = plat.y;
      fighter.vy = 0;
      return true;
    }
  }
  return false;
}

// Check if any hitbox overlaps any hurtbox and return first collision
export function checkHitboxes(attacker, defender) {
  if (!attacker.activeHitboxes || attacker.activeHitboxes.length === 0) return null;

  const hurtboxes = defender.hurtboxes || [{ x: -20, y: -80, w: 40, h: 80 }];

  for (const hb of attacker.activeHitboxes) {
    const hbWorld = {
      x: attacker.x + (attacker.facingRight ? hb.x : -(hb.x + hb.w)),
      y: attacker.y + hb.y,
      w: hb.w, h: hb.h,
    };
    for (const hurt of hurtboxes) {
      const hurtWorld = {
        x: defender.x + (defender.facingRight ? hurt.x : -(hurt.x + hurt.w)),
        y: defender.y + hurt.y,
        w: hurt.w, h: hurt.h,
      };
      if (rectsOverlap(hbWorld.x, hbWorld.y, hbWorld.w, hbWorld.h,
                       hurtWorld.x, hurtWorld.y, hurtWorld.w, hurtWorld.h)) {
        return { hitbox: hb, hurtbox: hurt, hbWorld, hurtWorld };
      }
    }
  }
  return null;
}

// Wall collision check — returns { hitLeft, hitRight }
export function checkWalls(fighter, stageW = 1280) {
  const r = 14;
  return {
    hitLeft:  fighter.x - r < 0,
    hitRight: fighter.x + r > stageW,
  };
}

// Ledge detection — returns ledge object if near a ledge
export function findNearLedge(fighter, platforms) {
  for (const plat of platforms) {
    if (plat.passThrough) continue;
    // Left ledge
    const lx = plat.x, ly = plat.y;
    if (Math.abs(fighter.x - lx) < C.LEDGE_GRAB_RANGE &&
        fighter.y > ly - 20 && fighter.y < ly + 60) {
      return { x: lx, y: ly, side: 'left', platform: plat };
    }
    // Right ledge
    const rx = plat.x + plat.w;
    if (Math.abs(fighter.x - rx) < C.LEDGE_GRAB_RANGE &&
        fighter.y > ly - 20 && fighter.y < ly + 60) {
      return { x: rx, y: ly, side: 'right', platform: plat };
    }
  }
  return null;
}
