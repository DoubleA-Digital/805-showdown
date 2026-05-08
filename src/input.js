import { C } from './constants.js';

// Key codes mapped to actions for each player
const BINDINGS = {
  p1: {
    left:   ['KeyA', 'ArrowLeft'],
    right:  ['KeyD', 'ArrowRight'],
    up:     ['KeyW', 'Space'],
    down:   ['KeyS'],
    light:  ['KeyG'],
    heavy:  ['KeyH'],
    sig:    ['KeyJ'],
    shield: ['KeyK', 'ShiftLeft'],
    grab:   ['KeyU'],
  },
  p2: {
    left:   ['ArrowLeft'],
    right:  ['ArrowRight'],
    up:     ['ArrowUp'],
    down:   ['ArrowDown'],
    light:  ['Numpad4'],
    heavy:  ['Numpad5'],
    sig:    ['Numpad6'],
    shield: ['Numpad0'],
    grab:   ['Numpad7'],
  },
};

// However, for 2-player sharing a keyboard we need separate bindings
// P1 uses WASD, P2 uses arrows - so redefine:
const KEY_BINDINGS = {
  p1: {
    left:   ['KeyA'],
    right:  ['KeyD'],
    up:     ['KeyW', 'Space'],
    down:   ['KeyS'],
    light:  ['KeyG'],
    heavy:  ['KeyH'],
    sig:    ['KeyJ'],
    shield: ['KeyK', 'ShiftLeft'],
    grab:   ['KeyU'],
  },
  p2: {
    left:   ['ArrowLeft'],
    right:  ['ArrowRight'],
    up:     ['ArrowUp'],
    down:   ['ArrowDown'],
    light:  ['Numpad4', 'Period'],
    heavy:  ['Numpad5', 'Slash'],
    sig:    ['Numpad6', 'Quote'],
    shield: ['Numpad0', 'Comma'],
    grab:   ['Numpad7', 'Semicolon'],
  },
};

export class InputManager {
  constructor() {
    this.held = new Set();
    this.prevHeld = new Set();

    // Input buffer: array of { action, player, frame }
    this.buffer = [];
    this.frame = 0;

    // State per player
    this.state = {
      p1: this._emptyState(),
      p2: this._emptyState(),
    };
    this.prevState = {
      p1: this._emptyState(),
      p2: this._emptyState(),
    };

    // Directional coyote: track how long directions have been held
    this.dirHoldFrames = {
      p1: { left: 0, right: 0, up: 0, down: 0 },
      p2: { left: 0, right: 0, up: 0, down: 0 },
    };

    // Gamepads
    this.gamepads = {};

    this._bindEvents();
  }

  _emptyState() {
    return {
      left: false, right: false, up: false, down: false,
      light: false, heavy: false, sig: false,
      shield: false, grab: false,
      dx: 0, dy: 0, // analog axis -1 to 1
    };
  }

  _bindEvents() {
    window.addEventListener('keydown', e => {
      this.held.add(e.code);
      e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.held.delete(e.code);
    });
    window.addEventListener('gamepadconnected', e => {
      this.gamepads[e.gamepad.index] = e.gamepad;
    });
    window.addEventListener('gamepaddisconnected', e => {
      delete this.gamepads[e.gamepad.index];
    });
  }

  update() {
    this.frame++;

    // Copy prev states
    for (const p of ['p1', 'p2']) {
      Object.assign(this.prevState[p], this.state[p]);
    }

    // Poll gamepads
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) this.gamepads[i] = pads[i];
    }

    // Update keyboard state
    for (const p of ['p1', 'p2']) {
      const bindings = KEY_BINDINGS[p];
      const state = this.state[p];

      for (const [action, keys] of Object.entries(bindings)) {
        state[action] = keys.some(k => this.held.has(k));
      }
      state.dx = (state.right ? 1 : 0) - (state.left ? 1 : 0);
      state.dy = (state.down ? 1 : 0) - (state.up ? 1 : 0);
    }

    // Apply gamepad P1 (first connected gamepad)
    const pad = Object.values(this.gamepads)[0];
    if (pad) {
      const s = this.state.p1;
      const ax = pad.axes[0];
      const ay = pad.axes[1];
      const DEAD = 0.2;
      s.left  = ax < -DEAD || pad.buttons[14]?.pressed;
      s.right = ax >  DEAD || pad.buttons[15]?.pressed;
      s.up    = ay < -DEAD || pad.buttons[12]?.pressed;
      s.down  = ay >  DEAD || pad.buttons[13]?.pressed;
      s.light  = pad.buttons[0]?.pressed;
      s.heavy  = pad.buttons[2]?.pressed;
      s.sig    = pad.buttons[3]?.pressed;
      s.shield = pad.buttons[4]?.pressed || pad.buttons[5]?.pressed;
      s.grab   = pad.buttons[1]?.pressed;
      s.dx = Math.abs(ax) > DEAD ? ax : 0;
      s.dy = Math.abs(ay) > DEAD ? ay : 0;
    }

    // Track direction hold frames
    for (const p of ['p1', 'p2']) {
      for (const dir of ['left', 'right', 'up', 'down']) {
        if (this.state[p][dir]) {
          this.dirHoldFrames[p][dir]++;
        } else {
          this.dirHoldFrames[p][dir] = 0;
        }
      }
    }

    // Add to input buffer
    for (const p of ['p1', 'p2']) {
      const cur = this.state[p];
      const prev = this.prevState[p];
      for (const action of ['light', 'heavy', 'sig', 'shield', 'grab', 'up', 'left', 'right', 'down']) {
        if (cur[action] && !prev[action]) {
          this.buffer.push({ action, player: p, frame: this.frame });
        }
      }
    }

    // Expire old buffer entries
    this.buffer = this.buffer.filter(b => this.frame - b.frame < C.INPUT_BUFFER);
  }

  // Check if action was just pressed this frame for a player
  justPressed(player, action) {
    return this.state[player][action] && !this.prevState[player][action];
  }

  // Check if action is currently held
  isHeld(player, action) {
    return this.state[player][action];
  }

  // Consume a buffered input (removes it from buffer)
  consumeBuffer(player, action) {
    const idx = this.buffer.findIndex(b => b.player === player && b.action === action);
    if (idx !== -1) {
      this.buffer.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Check buffer without consuming
  hasBuffer(player, action) {
    return this.buffer.some(b => b.player === player && b.action === action);
  }

  // Detect dash: two quick taps of same direction within 12 frames
  isDashInput(player, dir) {
    const frames = this.dirHoldFrames[player][dir];
    if (frames !== 1) return false;
    // Look for a previous tap in last 12 frames
    const prevTap = this.buffer.findIndex(b =>
      b.player === player && b.action === dir &&
      this.frame - b.frame <= 12 && this.frame - b.frame >= 2
    );
    return prevTap !== -1;
  }

  // Get smash direction: held for < 3 frames = smash input
  isSmashDir(player, dir) {
    return this.state[player][dir] && this.dirHoldFrames[player][dir] <= 3;
  }

  // Horizontal movement value -1 to 1
  getX(player) {
    return this.state[player].dx;
  }

  // Vertical movement value -1 (up) to 1 (down)
  getY(player) {
    return this.state[player].dy;
  }
}
