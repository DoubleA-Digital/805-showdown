// Simple CPU controller for training mode and bot matches
// Modes: 'dummy_idle', 'dummy_jump', 'dummy_attack', 'cpu_easy', 'cpu_medium', 'cpu_hard'

export class CPU {
  constructor(mode = 'dummy_idle') {
    this.mode = mode;
    this.frame = 0;
    this.actionTimer = 0;
    this.targetX = 640;
    this.jumpTimer = 0;
    this.attackCooldown = 0;
    this.dodgeCooldown = 0;
    this.reactionDelay = this._getReactionDelay();
    this.pendingAction = null;
    this.pendingActionDelay = 0;
  }

  _getReactionDelay() {
    switch (this.mode) {
      case 'cpu_easy':   return 24; // 24 frames (~0.4s) reaction
      case 'cpu_medium': return 14; // 14 frames (~0.23s) reaction
      case 'cpu_hard':   return 6;  // 6 frames (~0.1s) reaction
      default:           return 999; // dummy never reacts
    }
  }

  // Returns a fake input object for the fighter to use
  // Returns: { dx, dy, light, heavy, sig, shield, dodge, jump, pickup }
  update(fighter, opponent) {
    this.frame++;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    switch (this.mode) {
      case 'dummy_idle':
        return this._dummyIdle(fighter);
      case 'dummy_jump':
        return this._dummyJump(fighter);
      case 'dummy_attack':
        return this._dummyAttack(fighter);
      case 'cpu_easy':
        return this._cpuEasy(fighter, opponent);
      case 'cpu_medium':
        return this._cpuMedium(fighter, opponent);
      case 'cpu_hard':
        return this._cpuHard(fighter, opponent);
      default:
        return this._null();
    }
  }

  _null() {
    return { dx: 0, dy: 0, light: false, heavy: false, sig: false,
             shield: false, dodge: false, jump: false, pickup: false };
  }

  _dummyIdle(fighter) {
    return this._null();
  }

  _dummyJump(fighter) {
    // Jump periodically
    const jump = (this.frame % 90 === 0);
    return { ...this._null(), jump };
  }

  _dummyAttack(fighter) {
    // Randomly attack every ~60 frames
    const light = (this.frame % 60 === 0 && this.attackCooldown === 0);
    if (light) this.attackCooldown = 30;
    return { ...this._null(), light };
  }

  _cpuEasy(fighter, opponent) {
    if (!opponent) return this._null();
    return this._basicAI(fighter, opponent, { aggression: 0.3, dodgeChance: 0.1 });
  }

  _cpuMedium(fighter, opponent) {
    if (!opponent) return this._null();
    return this._basicAI(fighter, opponent, { aggression: 0.6, dodgeChance: 0.3 });
  }

  _cpuHard(fighter, opponent) {
    if (!opponent) return this._null();
    return this._basicAI(fighter, opponent, { aggression: 0.85, dodgeChance: 0.6 });
  }

  _basicAI(fighter, opponent, config) {
    const result = this._null();
    const dx_to_opp = opponent.x - fighter.x;
    const dist = Math.abs(dx_to_opp);
    const grounded = fighter.grounded;

    // Move toward opponent
    if (dist > 60) {
      result.dx = dx_to_opp > 0 ? 1 : -1;
    }

    // Jump to reach opponent if they're higher
    if (opponent.y < fighter.y - 80 && grounded && this.frame % 45 === 0) {
      result.jump = true;
    }

    // Jump over opponent if too close
    if (dist < 40 && grounded && this.frame % 120 === 0) {
      result.jump = true;
    }

    // Attack when close
    if (dist < 100 && this.attackCooldown === 0) {
      const rng = Math.random();
      if (rng < config.aggression * 0.4) {
        result.heavy = true;
        this.attackCooldown = 45;
      } else if (rng < config.aggression) {
        result.light = true;
        this.attackCooldown = 20;
      }
    }

    // Dodge incoming attacks
    if (
      opponent.activeHitboxes?.length > 0 &&
      dist < 120 &&
      Math.random() < config.dodgeChance &&
      this.dodgeCooldown === 0
    ) {
      result.shield = true;
      this.dodgeCooldown = 40;
    }

    // Recovery: if off-stage and low, jump
    if (!grounded && fighter.y > 600 && fighter.jumpsLeft > 0) {
      result.jump = true;
    }

    // Use signature when low damage against them
    if (dist < 80 && Math.random() < 0.02 && this.attackCooldown === 0) {
      result.sig = true;
      this.attackCooldown = 90;
    }

    return result;
  }
}

// Adapts CPU output into fighter handleInput-compatible format
export function applyCPUInput(fighter, cpuInput, inputManager) {
  // This function is used by game.js to feed CPU actions as if they were real inputs
  // The fighter's handleInput reads from inputManager, but for CPU we bypass this
  // by directly calling fighter state transitions

  const p = fighter.playerKey;

  // We inject into the inputManager's state so handleInput works normally
  if (inputManager._cpuOverride) {
    inputManager._cpuOverride[p] = cpuInput;
  }
}
