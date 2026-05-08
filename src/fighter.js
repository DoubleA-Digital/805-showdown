import { C } from './constants.js';
import { calcKnockback, applyDI, resolveGrounding, findNearLedge, checkWalls } from './physics.js';

// Fighter state constants
export const STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  JUMP_RISE: 'jump_rise',
  JUMP_PEAK: 'jump_peak',
  JUMP_FALL: 'jump_fall',
  DOUBLE_JUMP: 'double_jump',
  LIGHT_NEUTRAL: 'light_neutral',
  LIGHT_SIDE: 'light_side',
  LIGHT_UP: 'light_up',
  LIGHT_DOWN: 'light_down',
  AIR_NEUTRAL: 'air_neutral',
  AIR_FORWARD: 'air_forward',
  AIR_BACK: 'air_back',
  AIR_UP: 'air_up',
  AIR_DOWN: 'air_down',
  HEAVY_SIDE: 'heavy_side',
  HEAVY_UP: 'heavy_up',
  HEAVY_DOWN: 'heavy_down',
  SIGNATURE: 'signature',
  DODGE_ROLL_L: 'dodge_roll_l',
  DODGE_ROLL_R: 'dodge_roll_r',
  SPOT_DODGE: 'spot_dodge',
  SHIELD: 'shield',
  SHIELD_BREAK: 'shield_break',
  PARRY: 'parry',
  HIT_STUN: 'hit_stun',
  KO_LAUNCH: 'ko_launch',
  DEATH: 'death',
  RESPAWN: 'respawn',
  LEDGE_HANG: 'ledge_hang',
  DASH: 'dash',
  WAVEDASH: 'wavedash',
  GRAB: 'grab',
  AIR_DODGE: 'air_dodge',
  RECOVERY: 'recovery',  // up-special recovery move
  WEAPON_PICKUP: 'weapon_pickup',
  WEAPON_THROW: 'weapon_throw',
  GROUND_POUND: 'ground_pound',  // aerial downward spike
};

export const ACTION = {
  NONE: 'none',
  LIGHT: 'light',
  HEAVY: 'heavy',
  SIG: 'sig',
  SHIELD: 'shield',
  DODGE: 'dodge',
  GRAB: 'grab',
};

export class Fighter {
  constructor(charData, playerKey, spawnX, spawnY) {
    this.data = charData;
    this.playerKey = playerKey;
    this.name = charData.name;
    this.palette = charData.palette;

    // Position & velocity
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facingRight = playerKey === 'p1';

    // State machine
    this.state = STATE.IDLE;
    this.stateFrame = 0;   // frames in current state
    this.animFrame = 0;    // animation frame index

    // Combat
    this.damage = 0;            // % damage
    this.hitPauseLeft = 0;      // freeze frames remaining
    this.activeHitboxes = [];
    this.hitThisMove = new Set(); // fighters already hit this move (prevent multi-hit)
    this.moveDef = null;          // current move definition
    this.movePhase = 'startup';   // startup | active | recovery

    // DI
    this.diX = 0;
    this.diY = 0;

    // Hurtboxes (default; can change per state)
    this.hurtboxes = [{ x: -18, y: -75, w: 36, h: 75 }];

    // Grounded state
    this.grounded = false;
    this.prevGrounded = false;
    this.coyoteFrames = 0;

    // Jumps
    this.jumpsLeft = 2;
    this.fastFalling = false;

    // Shield
    this.shieldHP = C.SHIELD_MAX;
    this.isShielding = false;
    this.shieldBroken = false;

    // Ledge
    this.ledgeHanging = false;
    this.ledge = null;
    this.ledgeInvincible = 0;

    // Respawn invincibility
    this.invincible = 0;

    // Dash tracking
    this.isDashing = false;
    this.dashDir = 0;
    this.dashFrame = 0;

    // Wavedash
    this.isWavedashing = false;
    this.wavedashFrame = 0;

    // Wall slide
    this.wallTouching = 0; // 0 = none, -1 = left wall, 1 = right wall

    // Statistics
    this.combo = 0;
    this.lastHitBy = null;

    // Stats from character data (multipliers)
    const stats = charData.stats || {};
    this.speedMult = stats.speed || 1.0;
    this.jumpMult  = stats.jump  || 1.0;
    this.airMult   = stats.air   || 1.0;
    this.fallMult  = stats.fall  || 1.0;
    this.weight    = charData.proportions?.weight || 100;

    // Parry
    this.parryWindow = 0;
    this.parryActive = false;

    // Fall-through platform flag
    this.fallingThrough = false;
    this.fallThroughTimer = 0;

    // Hit-stun end frame (set when entering HIT_STUN)
    this.hitStunEnd = 0;

    // Weapon
    this.currentWeapon = null;
    this.weaponThrowCooldown = 0;

    // Recovery
    this.recoveryCooldown = 0;
    this.usedRecovery = false;

    // Air dodge exhaustion
    this.airDodgesUsed = 0;
    this.airDodgePenaltyFrames = 0;

    // Wall jump
    this.wallJumpGrace = 0;
    this.lastWallSide = 0;

    // Combo tracking
    this.trueComboWindow = 0;
    this.cancelWindow = 0;
  }

  // ── State transition ──────────────────────────────────────────────────────

  setState(newState) {
    this.state = newState;
    this.stateFrame = 0;
    this.animFrame = 0;
    this.activeHitboxes = [];
    this.hitThisMove = new Set();
    this.moveDef = null;
    this.movePhase = 'startup';
    this._onEnterState(newState);
  }

  _onEnterState(state) {
    if (state === STATE.SHIELD) {
      this.isShielding = true;
      this.parryWindow = C.PARRY_WINDOW;
    } else {
      this.isShielding = false;
    }

    if (state === STATE.LEDGE_HANG) {
      this.ledgeInvincible = C.LEDGE_INVINCIBILITY;
      this.invincible = C.LEDGE_INVINCIBILITY;
    }

    if (state === STATE.RESPAWN) {
      this.invincible = C.RESPAWN_INVINCIBILITY;
    }

    if (state === STATE.DEATH) {
      this.vx = 0;
      this.vy = 0;
    }

    if (state === STATE.DOUBLE_JUMP) {
      this.vy = C.DOUBLE_JUMP_FORCE * this.jumpMult;
      this.fastFalling = false;
    }

    if (state === STATE.DODGE_ROLL_L || state === STATE.DODGE_ROLL_R) {
      const dir = state === STATE.DODGE_ROLL_L ? -1 : 1;
      this.vx = dir * 9;
    }

    if (state === STATE.WAVEDASH) {
      this.vy = 0;
      this.vx = (this.facingRight ? 1 : -1) * C.WAVEDASH_SLIDE_SPEED;
      this.isWavedashing = true;
      this.wavedashFrame = 0;
    }

    if (state === STATE.AIR_DODGE) {
      // velocity already set in _airDodge
    }
  }

  // ── Grounded & air helpers ────────────────────────────────────────────────

  get isAirborne() {
    return !this.grounded && !this.ledgeHanging;
  }

  get isAttacking() {
    return [
      STATE.LIGHT_NEUTRAL, STATE.LIGHT_SIDE, STATE.LIGHT_UP, STATE.LIGHT_DOWN,
      STATE.AIR_NEUTRAL, STATE.AIR_FORWARD, STATE.AIR_BACK, STATE.AIR_UP, STATE.AIR_DOWN,
      STATE.HEAVY_SIDE, STATE.HEAVY_UP, STATE.HEAVY_DOWN, STATE.SIGNATURE,
      STATE.RECOVERY, STATE.GROUND_POUND,
    ].includes(this.state);
  }

  get isHeavyAttacking() {
    return [STATE.HEAVY_SIDE, STATE.HEAVY_UP, STATE.HEAVY_DOWN, STATE.SIGNATURE].includes(this.state);
  }

  get isInvincible() {
    return (
      this.invincible > 0 ||
      this.state === STATE.DEATH ||
      this.state === STATE.RESPAWN ||
      (this.state === STATE.SPOT_DODGE &&
        this.stateFrame >= C.SPOT_DODGE_IFRAMES_START &&
        this.stateFrame <= C.SPOT_DODGE_IFRAMES_END) ||
      ((this.state === STATE.DODGE_ROLL_L || this.state === STATE.DODGE_ROLL_R) &&
        this.stateFrame >= C.ROLL_IFRAMES_START &&
        this.stateFrame <= C.ROLL_IFRAMES_END) ||
      (this.state === STATE.AIR_DODGE &&
        this.stateFrame >= C.AIR_DODGE_IFRAMES_START &&
        this.stateFrame <= C.AIR_DODGE_IFRAMES_END)
    );
  }

  // ── Input handling ────────────────────────────────────────────────────────

  handleInput(input) {
    if (this.hitPauseLeft > 0) return;
    if (this.state === STATE.DEATH || this.state === STATE.RESPAWN) return;
    if (this.state === STATE.SHIELD_BREAK) return;

    const p = this.playerKey;
    const dx = input.getX(p);
    const dy = input.getY(p);
    const grounded = this.grounded;
    const canAct = this._canAct();
    const canActAir = this._canActAir();

    // DI input (always active in hit stun / KO)
    if (this.state === STATE.HIT_STUN || this.state === STATE.KO_LAUNCH) {
      this.diX = dx;
      this.diY = dy;
      return;
    }

    this.diX = 0;
    this.diY = 0;
    this._inputDx = dx;

    // Ledge hang inputs
    if (this.state === STATE.LEDGE_HANG) {
      if (
        input.justPressed(p, 'up') ||
        input.justPressed(p, 'light') ||
        input.justPressed(p, 'heavy')
      ) {
        this._ledgeGetup();
      } else if (dy > 0.5) {
        this._ledgeDrop();
      }
      return;
    }

    // === SHIELD / PARRY ===
    if (input.isHeld(p, 'shield') && canAct) {
      if (this.state !== STATE.SHIELD) this.setState(STATE.SHIELD);

      // Spot dodge
      if (input.justPressed(p, 'down') && grounded) {
        this.setState(STATE.SPOT_DODGE);
        return;
      }
      // Roll dodge
      if (input.justPressed(p, 'left') && grounded) {
        this.facingRight = false;
        this.setState(STATE.DODGE_ROLL_L);
        return;
      }
      if (input.justPressed(p, 'right') && grounded) {
        this.facingRight = true;
        this.setState(STATE.DODGE_ROLL_R);
        return;
      }
      // Air dodge
      if (input.justPressed(p, 'up') && !grounded) {
        this._airDodge(dx, dy);
        return;
      }
      return;
    } else if (this.state === STATE.SHIELD) {
      this.setState(STATE.IDLE);
    }

    // === SIGNATURE ===
    if (input.consumeBuffer(p, 'sig') && canAct) {
      this._startMove(this.data.moves.signature, STATE.SIGNATURE);
      return;
    }

    // === HEAVY ATTACKS ===
    // Recovery move: up + heavy while airborne
    if (input.consumeBuffer(p, 'heavy') && !grounded && dy < -0.4 && !this.usedRecovery) {
      this._recoveryMove();
      return;
    }
    // Ground pound: down + heavy while airborne
    if (input.consumeBuffer(p, 'heavy') && !grounded && dy > 0.4) {
      this._groundPound();
      return;
    }
    if ((input.consumeBuffer(p, 'heavy') || input.hasBuffer(p, 'heavy')) && canAct) {
      input.consumeBuffer(p, 'heavy');
      if (grounded) {
        if (dy < -0.4) {
          this._startMove(this.data.moves.upHeavy, STATE.HEAVY_UP);
        } else if (dy > 0.4) {
          this._startMove(this.data.moves.downHeavy, STATE.HEAVY_DOWN);
        } else {
          this._startMove(this.data.moves.sideHeavy, STATE.HEAVY_SIDE);
        }
      } else {
        this._startMove(this.data.moves.sideHeavy, STATE.HEAVY_SIDE);
      }
      return;
    }

    // === LIGHT ATTACKS ===
    if ((input.consumeBuffer(p, 'light') || input.hasBuffer(p, 'light')) && (canAct || canActAir)) {
      input.consumeBuffer(p, 'light');
      if (grounded) {
        if (Math.abs(dx) > 0.3) {
          this.facingRight = dx > 0;
          this._startMove(this.data.moves.sideLight, STATE.LIGHT_SIDE);
        } else if (dy < -0.4) {
          this._startMove(this.data.moves.upLight, STATE.LIGHT_UP);
        } else if (dy > 0.4) {
          this._startMove(this.data.moves.downLight, STATE.LIGHT_DOWN);
        } else {
          this._startMove(this.data.moves.neutralLight, STATE.LIGHT_NEUTRAL);
        }
      } else {
        if (Math.abs(dx) > 0.5) {
          const forward = (dx > 0) === this.facingRight;
          if (forward) {
            this._startMove(this.data.moves.forwardAir, STATE.AIR_FORWARD);
          } else {
            this._startMove(this.data.moves.backAir, STATE.AIR_BACK);
          }
        } else if (dy < -0.4) {
          this._startMove(this.data.moves.upAir, STATE.AIR_UP);
        } else if (dy > 0.4) {
          this._startMove(this.data.moves.downAir, STATE.AIR_DOWN);
        } else {
          this._startMove(this.data.moves.neutralAir, STATE.AIR_NEUTRAL);
        }
      }
      return;
    }

    // === MOVEMENT ===
    if (canAct || this._isMovingState()) {
      // Dash detection
      if (grounded && !this.isDashing) {
        if (input.isDashInput(p, 'right')) {
          this.facingRight = true;
          this._startDash(1);
          return;
        }
        if (input.isDashInput(p, 'left')) {
          this.facingRight = false;
          this._startDash(-1);
          return;
        }
      }

      // Jump (grounded or coyote) — consume buffer to prevent double-trigger
      if (
        input.hasBuffer(p, 'up') &&
        (grounded || this.coyoteFrames > 0) &&
        this.jumpsLeft > 0
      ) {
        input.consumeBuffer(p, 'up');
        this._jump();
        return;
      }

      // Double jump
      if (
        input.hasBuffer(p, 'up') &&
        !grounded &&
        this.jumpsLeft > 0 &&
        this.state !== STATE.JUMP_RISE
      ) {
        input.consumeBuffer(p, 'up');
        this.jumpsLeft--;
        this.setState(STATE.DOUBLE_JUMP);
        return;
      }

      // Wall jump
      if (
        input.hasBuffer(p, 'up') &&
        !grounded &&
        this.wallJumpGrace > 0 &&
        this.jumpsLeft <= 1
      ) {
        input.consumeBuffer(p, 'up');
        this.vy = C.WALL_JUMP_Y;
        this.vx = -this.lastWallSide * C.WALL_JUMP_X;
        this.facingRight = this.lastWallSide < 0;
        this.wallJumpGrace = 0;
        this.setState(STATE.JUMP_RISE);
        return;
      }

      // Fast fall
      if (!grounded && dy > 0.5 && input.justPressed(p, 'down') && this.vy > 0) {
        this.fastFalling = true;
      }

      // Fall through platform
      if (grounded && dy > 0.7 && input.justPressed(p, 'down')) {
        this.fallingThrough = true;
        this.fallThroughTimer = 20;
      }

      // Walk / run
      if (!this.isDashing && !this.isWavedashing) {
        if (Math.abs(dx) > 0.1) {
          this.facingRight = dx > 0;
          if (grounded && this.state !== STATE.JUMP_RISE) {
            this.setState(Math.abs(dx) > 0.7 ? STATE.RUN : STATE.WALK);
          }
        } else if (
          grounded &&
          (this.state === STATE.WALK || this.state === STATE.RUN)
        ) {
          this.setState(STATE.IDLE);
        }
      }
    }
  }

  _canAct() {
    return (
      [STATE.IDLE, STATE.WALK, STATE.RUN, STATE.WAVEDASH].includes(this.state) ||
      (this.state === STATE.JUMP_FALL && this.grounded)
    );
  }

  _canActAir() {
    return [
      STATE.JUMP_RISE, STATE.JUMP_PEAK, STATE.JUMP_FALL, STATE.DOUBLE_JUMP,
    ].includes(this.state);
  }

  _isMovingState() {
    return [
      STATE.IDLE, STATE.WALK, STATE.RUN,
      STATE.JUMP_RISE, STATE.JUMP_PEAK, STATE.JUMP_FALL,
      STATE.DOUBLE_JUMP, STATE.DASH,
    ].includes(this.state);
  }

  _jump() {
    this.vy = C.JUMP_FORCE * this.jumpMult;
    this.jumpsLeft = 1;
    this.grounded = false;
    this.coyoteFrames = 0;
    this.fastFalling = false;
    this.setState(STATE.JUMP_RISE);
  }

  _startDash(dir) {
    this.isDashing = true;
    this.dashDir = dir;
    this.dashFrame = 0;
    this.vx = dir * C.DASH_SPEED * this.speedMult;
    this.setState(STATE.DASH);
  }

  _airDodge(dx, dy) {
    // Air dodge downward while on ground = wavedash
    if (dy > 0.6 && this.grounded) {
      this.setState(STATE.WAVEDASH);
      return;
    }
    // Check exhaustion
    if (this.airDodgesUsed >= C.AIR_DODGE_EXHAUSTION && !this.grounded) {
      this.airDodgePenaltyFrames = C.AIR_DODGE_PENALTY_FRAMES;
      return; // Can't air dodge
    }
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / mag) * C.AIR_DODGE_SPEED;
    this.vy = (dy / mag) * C.AIR_DODGE_SPEED;
    if (!this.grounded) {
      this.airDodgesUsed++;
      this.setState(STATE.AIR_DODGE);
    } else {
      this.setState(STATE.SPOT_DODGE);
    }
  }

  _recoveryMove() {
    if (this.recoveryCooldown > 0 || this.usedRecovery) return;
    this.usedRecovery = true;
    this.recoveryCooldown = C.RECOVERY_COOLDOWN;
    this.vy = C.RECOVERY_FORCE * this.jumpMult;
    this.vx *= 0.3; // reduce horizontal momentum
    this._startMove({
      name: 'Recovery',
      startup: C.RECOVERY_STARTUP,
      active: C.RECOVERY_ACTIVE,
      recovery: C.RECOVERY_RECOVERY,
      damage: 6,
      knockback: { base: 15, scaling: 0.4, angle: 85 },
      hitstun: 12,
      isHeavy: false,
      isSig: false,
      effect: 'sparkle',
      hitboxes: [{ x: -20, y: -95, w: 40, h: 40 }],
    }, STATE.RECOVERY);
  }

  _groundPound() {
    this.vy = 14; // spike downward
    this.fastFalling = true;
    this._startMove({
      name: 'Ground Pound',
      startup: 4,
      active: 6,
      recovery: 14,
      damage: 16,
      knockback: { base: 24, scaling: 0.9, angle: 270 },
      hitstun: 18,
      isHeavy: true,
      isSig: false,
      effect: 'explosion',
      hitboxes: [{ x: -20, y: -10, w: 40, h: 10 }],
    }, STATE.GROUND_POUND);
  }

  _ledgeGetup() {
    this.ledgeHanging = false;
    this.ledge = null;
    this.y -= 60;
    this.vy = -10;
    this.grounded = false;
    this.setState(STATE.JUMP_RISE);
  }

  _ledgeDrop() {
    this.ledgeHanging = false;
    this.ledge = null;
    this.fallingThrough = true;
    this.fallThroughTimer = 15;
    this.setState(STATE.JUMP_FALL);
  }

  _startMove(moveDef, stateName) {
    if (!moveDef) return;
    this.moveDef = moveDef;
    this.setState(stateName);
  }

  // ── Physics update ────────────────────────────────────────────────────────

  applyPhysics(platforms, stageW) {
    if (this.hitPauseLeft > 0) {
      this.hitPauseLeft--;
      return;
    }
    if (this.state === STATE.DEATH || this.state === STATE.RESPAWN) return;

    if (this.ledgeHanging) {
      // Snap to ledge position
      if (this.ledge) {
        this.x = this.ledge.x + (this.facingRight ? -12 : 12);
        this.y = this.ledge.y + 10;
      }
      return;
    }

    // Apply gravity
    if (!this.grounded) {
      let grav = C.GRAVITY * this.fallMult;
      if (this.fastFalling) grav *= C.FAST_FALL_MULT;
      this.vy = Math.min(this.vy + grav, C.MAX_FALL_SPEED * this.fallMult);
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Friction / movement
    if (this.grounded) {
      if (this.isDashing) {
        this.vx *= this.isWavedashing ? C.WAVEDASH_FRICTION : 0.92;
      } else {
        const targetVx = this._getTargetGroundVx();
        if (targetVx !== null) {
          this.vx += (targetVx - this.vx) * 0.35;
        } else {
          this.vx *= C.GROUND_FRICTION;
        }
      }
    } else {
      // Air control
      const targetAirVx = this._getTargetAirVx();
      if (targetAirVx !== null) {
        this.vx += (targetAirVx - this.vx) * (C.AIR_ACCEL * this.airMult);
        const cap = C.AIR_SPEED * this.speedMult * this.airMult;
        this.vx = Math.max(-cap, Math.min(cap, this.vx));
      } else {
        this.vx *= C.AIR_FRICTION;
      }
    }

    // Platform collision
    this.prevGrounded = this.grounded;
    const wasGrounded = this.grounded;
    this.grounded = false;

    if (this.fallThroughTimer > 0) {
      this.fallThroughTimer--;
      if (this.fallThroughTimer === 0) this.fallingThrough = false;
    }

    const landed = resolveGrounding(this, platforms);
    if (landed) {
      this.grounded = true;
      this.jumpsLeft = 2;
      this.fastFalling = false;
      this.isDashing = false;
      this.isWavedashing = false;
      this.wavedashFrame = 0;
      if (!wasGrounded && this.state !== STATE.SPOT_DODGE) {
        this._onLand();
      }
    }

    // Coyote time
    if (wasGrounded && !this.grounded) {
      this.coyoteFrames = 6;
    } else if (this.grounded) {
      this.coyoteFrames = 0;
    } else if (this.coyoteFrames > 0) {
      this.coyoteFrames--;
    }

    // Wall collision
    const walls = checkWalls(this, stageW);
    if (walls.hitLeft) {
      this.x = 14;
      if (this.vx < 0) {
        this.wallTouching = -1;
        this.vx = 0;
      }
    } else if (walls.hitRight) {
      this.x = stageW - 14;
      if (this.vx > 0) {
        this.wallTouching = 1;
        this.vx = 0;
      }
    } else {
      this.wallTouching = 0;
    }

    // Automatic air-state transitions when not attacking
    if (!this.grounded && !this.isAttacking) {
      if (this.vy < -2) this.setState(STATE.JUMP_RISE);
      else if (this.vy < 2) this.setState(STATE.JUMP_PEAK);
      else this.setState(STATE.JUMP_FALL);
    }

    // Invincibility countdown
    if (this.invincible > 0) this.invincible--;
    if (this.ledgeInvincible > 0) this.ledgeInvincible--;
  }

  _getTargetGroundVx() {
    if (this.state === STATE.WALK) {
      return this.facingRight
        ? C.WALK_SPEED * this.speedMult
        : -C.WALK_SPEED * this.speedMult;
    }
    if (this.state === STATE.RUN) {
      return this.facingRight
        ? C.RUN_SPEED * this.speedMult
        : -C.RUN_SPEED * this.speedMult;
    }
    return null;
  }

  _getTargetAirVx() {
    if (this.isAttacking) return null;
    const dx = this._inputDx || 0;
    if (Math.abs(dx) > 0.1) return dx * C.AIR_SPEED * this.speedMult * this.airMult;
    return null;
  }

  _onLand() {
    if ([STATE.KO_LAUNCH, STATE.HIT_STUN].includes(this.state)) {
      // Tech window — for now transition to idle
    }
    if (
      ![
        STATE.SPOT_DODGE, STATE.DODGE_ROLL_L, STATE.DODGE_ROLL_R,
        STATE.SHIELD, STATE.SHIELD_BREAK,
      ].includes(this.state)
    ) {
      this.setState(STATE.IDLE);
    }
  }

  // ── Move execution ────────────────────────────────────────────────────────

  updateMove() {
    if (!this.moveDef || this.hitPauseLeft > 0) return;
    const mv = this.moveDef;
    const f = this.stateFrame;

    if (f < mv.startup) {
      this.movePhase = 'startup';
      this.activeHitboxes = [];
    } else if (f < mv.startup + mv.active) {
      this.movePhase = 'active';
      this.activeHitboxes = mv.hitboxes || [];
    } else if (f < mv.startup + mv.active + mv.recovery) {
      this.movePhase = 'recovery';
      this.activeHitboxes = [];
    } else {
      // Move finished
      this.activeHitboxes = [];
      this.moveDef = null;
      this.setState(this.grounded ? STATE.IDLE : STATE.JUMP_FALL);
    }

    // Signature move momentum during active frames
    if (
      this.state === STATE.SIGNATURE &&
      mv.momentum &&
      this.movePhase === 'active'
    ) {
      this.vx += mv.momentum.x * (this.facingRight ? 1 : -1);
      this.vy += mv.momentum.y;
    }
  }

  // ── State tick ────────────────────────────────────────────────────────────

  tick(platforms, stageW) {
    this.stateFrame++;
    this.animFrame = this.stateFrame;

    // Shield drain / regen
    if (this.state === STATE.SHIELD) {
      this.shieldHP = Math.min(C.SHIELD_MAX, this.shieldHP - C.SHIELD_DRAIN);
      if (this.shieldHP <= 0) {
        this.shieldHP = 0;
        this.setState(STATE.SHIELD_BREAK);
      }
      if (this.parryWindow > 0) this.parryWindow--;
      this.parryActive = this.parryWindow > 0;
    } else {
      this.shieldHP = Math.min(C.SHIELD_MAX, this.shieldHP + C.SHIELD_REGEN);
    }

    // Shield break recovery
    if (
      this.state === STATE.SHIELD_BREAK &&
      this.stateFrame >= C.SHIELD_BREAK_STUN
    ) {
      this.shieldHP = C.SHIELD_MAX;
      this.setState(STATE.IDLE);
    }

    // Dash timing
    if (this.state === STATE.DASH) {
      this.dashFrame++;
      if (this.dashFrame >= C.DASH_DURATION) {
        this.isDashing = false;
        this.setState(STATE.IDLE);
      }
    }

    // Wavedash timing
    if (this.isWavedashing) {
      this.wavedashFrame++;
      if (Math.abs(this.vx) < 1 || this.wavedashFrame > 18) {
        this.isWavedashing = false;
        this.setState(STATE.IDLE);
      }
    }

    // Spot dodge timing
    if (
      this.state === STATE.SPOT_DODGE &&
      this.stateFrame >= C.SPOT_DODGE_FRAMES
    ) {
      this.setState(STATE.IDLE);
    }

    // Roll dodge timing
    if (
      (this.state === STATE.DODGE_ROLL_L || this.state === STATE.DODGE_ROLL_R) &&
      this.stateFrame >= C.ROLL_FRAMES
    ) {
      this.setState(STATE.IDLE);
    }

    // Air dodge timing
    if (this.state === STATE.AIR_DODGE && this.stateFrame >= C.AIR_DODGE_FRAMES) {
      this.setState(this.grounded ? STATE.IDLE : STATE.JUMP_FALL);
    }

    // Reset air dodge uses and recovery when grounded
    if (this.grounded) {
      this.airDodgesUsed = 0;
      this.usedRecovery = false;
    }

    // Penalty frames countdown
    if (this.airDodgePenaltyFrames > 0) this.airDodgePenaltyFrames--;

    // Recovery cooldown
    if (this.recoveryCooldown > 0) this.recoveryCooldown--;

    // Weapon throw cooldown
    if (this.weaponThrowCooldown > 0) this.weaponThrowCooldown--;

    // Wall jump grace
    if (this.wallTouching !== 0) {
      this.wallJumpGrace = C.WALL_JUMP_GRACE;
      this.lastWallSide = this.wallTouching;
    } else if (this.wallJumpGrace > 0) {
      this.wallJumpGrace--;
    }

    // Ledge hang timeout
    if (
      this.state === STATE.LEDGE_HANG &&
      this.stateFrame >= C.LEDGE_HANG_MAX
    ) {
      this._ledgeDrop();
    }

    // Move frame update
    if (this.isAttacking) this.updateMove();

    // Respawn duration
    if (
      this.state === STATE.RESPAWN &&
      this.stateFrame >= C.RESPAWN_DURATION
    ) {
      this.setState(STATE.IDLE);
    }

    // Ledge grab check (airborne, not attacking, falling or neutral)
    if (
      !this.grounded &&
      !this.ledgeHanging &&
      !this.isAttacking &&
      this.vy >= 0 &&
      this.state !== STATE.RESPAWN
    ) {
      const nearLedge = findNearLedge(this, platforms);
      if (nearLedge) {
        const goingToward =
          nearLedge.side === 'left' ? !this.facingRight : this.facingRight;
        if (!goingToward || this.jumpsLeft === 0) {
          this._grabLedge(nearLedge);
        }
      }
    }
  }

  _grabLedge(ledge) {
    this.ledgeHanging = true;
    this.ledge = ledge;
    this.vx = 0;
    this.vy = 0;
    this.facingRight = ledge.side === 'right';
    this.grounded = false;
    this.jumpsLeft = 2;
    this.setState(STATE.LEDGE_HANG);
  }

  // ── Take hit ──────────────────────────────────────────────────────────────

  takeHit(attacker, moveDef, hitEffect, effects) {
    if (this.isInvincible) return false;

    // Check parry
    if (this.state === STATE.SHIELD && this.parryActive) {
      this.setState(STATE.PARRY);
      effects?.announce('PARRY!', '#00FF00');
      return 'parry';
    }

    // Shield absorb
    if (this.state === STATE.SHIELD && this.shieldHP > 0) {
      this.shieldHP -= moveDef.damage * 1.5;
      if (this.shieldHP <= 0) {
        this.shieldHP = 0;
        this.setState(STATE.SHIELD_BREAK);
        effects?.announce('SHIELD BREAK!', '#FF3030');
      }
      const pause = moveDef.isHeavy ? C.HIT_PAUSE_HEAVY : C.HIT_PAUSE_LIGHT;
      attacker.hitPauseLeft = pause;
      this.hitPauseLeft = pause;
      return 'shielded';
    }

    // Apply damage
    this.damage += moveDef.damage;

    // Calculate knockback
    const kb = calcKnockback(
      this.damage,
      moveDef.knockback.base,
      moveDef.knockback.scaling,
      moveDef.knockback.angle,
      attacker.facingRight,
      this.weight,
    );

    // Apply DI
    const kbDI = applyDI(kb.vx, kb.vy, this.diX, this.diY);

    this.vx = kbDI.vx;
    this.vy = kbDI.vy;

    // Hit pause
    const isPowerful = moveDef.isHeavy || moveDef.isSig;
    const pause = isPowerful ? C.HIT_PAUSE_HEAVY : C.HIT_PAUSE_LIGHT;
    this.hitPauseLeft = pause;
    attacker.hitPauseLeft = pause;

    // Launch vs hit stun based on knockback magnitude
    const kbMag = Math.sqrt(kbDI.vx ** 2 + kbDI.vy ** 2);
    if (kbMag > 8) {
      this.grounded = false;
      this.ledgeHanging = false;
      this.setState(STATE.KO_LAUNCH);
    } else {
      this.setState(STATE.HIT_STUN);
      const hitstunFrames = Math.floor(kbMag * 3.5 + (moveDef.hitstun || 15));
      this.hitStunEnd = this.stateFrame + Math.max(hitstunFrames, moveDef.hitstun || 15);
    }

    attacker.trueComboWindow = C.TRUE_COMBO_WINDOW;
    this.lastHitBy = attacker.playerKey;

    return true;
  }

  // Called each frame to resolve hit stun exit
  updateHitStun() {
    if (this.state === STATE.HIT_STUN) {
      if (this.grounded && this.vy === 0) {
        this.setState(STATE.IDLE);
      } else if (this.hitStunEnd && this.stateFrame >= this.hitStunEnd) {
        this.setState(this.grounded ? STATE.IDLE : STATE.JUMP_FALL);
      }
    }
    // KO_LAUNCH exits when the game manager detects a blast-zone crossing
  }

  // ── Respawn ───────────────────────────────────────────────────────────────

  respawn(spawnX, spawnY) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.shieldHP = C.SHIELD_MAX;
    this.shieldBroken = false;
    this.isDashing = false;
    this.isWavedashing = false;
    this.ledgeHanging = false;
    this.fastFalling = false;
    this.fallingThrough = false;
    this.hitPauseLeft = 0;
    this.activeHitboxes = [];
    this.usedRecovery = false;
    this.recoveryCooldown = 0;
    this.airDodgesUsed = 0;
    this.airDodgePenaltyFrames = 0;
    this.weaponThrowCooldown = 0;
    this.currentWeapon = null;
    this.setState(STATE.RESPAWN);
  }
}
