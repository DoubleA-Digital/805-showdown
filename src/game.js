import { C } from './constants.js';
import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { Fighter, STATE } from './fighter.js';
import { drawCharacter, drawPortrait, drawDebugBoxes } from './renderer.js';
import { EffectManager } from './effects.js';
import { HUD } from './hud.js';
import { STAGES, STAGE_LIST, getStage, drawCharacterShadow } from './stages.js';
import { CHARACTERS } from './characters/index.js';
import { checkHitboxes } from './physics.js';
import { CPU } from './cpu.js';
import { WeaponManager } from './weapon.js';
import {
  drawLoadingScreen,
  drawVersusBackdrop,
  drawVersusCard,
  drawVersusEmblem,
  drawStagePreviewCard,
  drawVersusFooter,
  drawCountdown,
  drawScreenFlash,
  drawFade,
} from './ui_screens.js';
import { LOADING_CONFIG, VS_CONFIG } from './config/stage_themes.js';

// ── Game state enum ───────────────────────────────────────────────────────

const GAME_STATE = {
  LOADING: 'loading',
  TITLE: 'title',
  CHAR_SELECT: 'char_select',
  STAGE_SELECT: 'stage_select',
  VS_SCREEN: 'vs_screen',
  INTRO: 'intro',          // 3-2-1-FIGHT countdown before MATCH
  MATCH: 'match',
  RESULTS: 'results',
};

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

// ── Main Game class ───────────────────────────────────────────────────────

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiCanvas = document.getElementById('ui-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.uiCtx = this.uiCanvas.getContext('2d');

    this.input = new InputManager();
    this.effects = new EffectManager();
    this.hud = new HUD();
    this.audio = new AudioManager();

    this.gameState = GAME_STATE.LOADING;
    this.frame = 0;
    this.matchTimer = C.FPS * 180; // 3-minute match

    // Loading screen state
    this.loadingFrame = 0;
    this.loadingProgress = 0;
    this.loadingDone = false;

    // Intro countdown state
    this.introFrame = 0;
    this.flashFrame = 0;        // counts down a global flash effect

    // Generic transition fade (1 = fully black, 0 = clear)
    this.transitionAlpha = 0;
    this.transitionTarget = 0;

    // Character select
    this.selectedChar = { p1: 0, p2: 1 };
    this.selectedStage = 0;
    this.charSelectPhase = 'p1'; // p1 | p2 | both
    this.cursorMove = { p1: { cd: 0 }, p2: { cd: 0 } };

    // Match state
    this.fighters = null;
    this.stage = null;
    this.stocks = { p1: C.STOCKS, p2: C.STOCKS };
    this.matchEnded = false;
    this.resultFrame = 0;
    this.winner = null;

    // Title
    this.titleFrame = 0;
    this.titleReady = false;

    // Weapon and training mode
    this.weaponManager = null;
    this.cpu = null;  // null = human vs human, CPU instance = training mode
    this.cpuMode = 'dummy_idle';
    this.trainingMode = false;
    this.trainingOptions = {
      resetOnKO: true,
      showDamage: true,
      unlimitedStocks: true,
    };

    // Mouse state
    this.mouse = { x: 0, y: 0, clicked: false };
    this._menuEnterPressed = false;
    this._initMouse();

    // Start loop
    this._loop = this._loop.bind(this);
    this._lastTime = 0;
    this._accum = 0;
    requestAnimationFrame(this._loop);
  }

  _initMouse() {
    // Use the UI canvas (top-most) for mouse events so it captures all clicks
    const target = this.uiCanvas;

    const _getCanvasPos = (e) => {
      const rect = target.getBoundingClientRect();
      // Account for CSS scaling when viewport is narrower than 1280px
      const scaleX = C.W / rect.width;
      const scaleY = C.H / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY,
      };
    };

    target.addEventListener('mousemove', (e) => {
      const pos = _getCanvasPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });

    target.addEventListener('click', (e) => {
      const pos = _getCanvasPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.clicked = true;
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') this._menuEnterPressed = true;
    });

    // Reset cursor when leaving canvas
    target.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  _loop(ts) {
    requestAnimationFrame(this._loop);
    const dt = ts - this._lastTime;
    this._lastTime = ts;
    this._accum += dt;
    const frameTime = 1000 / C.FPS;
    while (this._accum >= frameTime) {
      this._update();
      this._accum -= frameTime;
    }
    this._render();
  }

  _update() {
    this.input.update();
    this.mouse.clicked = false;
    const menuEnter = this._menuEnterPressed;
    this._menuEnterPressed = false;
    this._menuEnterThisFrame = menuEnter;
    this.frame++;

    // Tick the global transition fade toward its target
    const fadeStep = 0.04;
    if (this.transitionAlpha < this.transitionTarget) {
      this.transitionAlpha = Math.min(this.transitionTarget, this.transitionAlpha + fadeStep);
    } else if (this.transitionAlpha > this.transitionTarget) {
      this.transitionAlpha = Math.max(this.transitionTarget, this.transitionAlpha - fadeStep);
    }
    if (this.flashFrame > 0) this.flashFrame--;

    switch (this.gameState) {
      case GAME_STATE.LOADING:
        this._updateLoading();
        break;
      case GAME_STATE.TITLE:
        this._updateTitle();
        break;
      case GAME_STATE.CHAR_SELECT:
        this._updateCharSelect();
        break;
      case GAME_STATE.STAGE_SELECT:
        this._updateStageSelect();
        break;
      case GAME_STATE.VS_SCREEN:
        this._updateVSScreen();
        break;
      case GAME_STATE.INTRO:
        this._updateIntro();
        break;
      case GAME_STATE.MATCH:
        this._updateMatch();
        break;
      case GAME_STATE.RESULTS:
        this._updateResults();
        break;
    }

    this.effects.update();
    if (this.gameState === GAME_STATE.MATCH && this.fighters) {
      this.hud.update(this.stocks);
    } else {
      this.hud.update(null);
    }
  }

  _render() {
    const ctx = this.ctx;
    const uiCtx = this.uiCtx;

    // Apply screen shake
    ctx.save();
    ctx.translate(this.effects.shake.x, this.effects.shake.y);
    uiCtx.save();

    ctx.clearRect(-20, -20, C.W + 40, C.H + 40);
    uiCtx.clearRect(0, 0, C.W, C.H);

    switch (this.gameState) {
      case GAME_STATE.LOADING:
        this._renderLoading(ctx, uiCtx);
        break;
      case GAME_STATE.TITLE:
        this._renderTitle(ctx, uiCtx);
        break;
      case GAME_STATE.CHAR_SELECT:
        this._renderCharSelect(ctx, uiCtx);
        break;
      case GAME_STATE.STAGE_SELECT:
        this._renderStageSelect(ctx, uiCtx);
        break;
      case GAME_STATE.VS_SCREEN:
        this._renderVSScreen(ctx, uiCtx);
        break;
      case GAME_STATE.INTRO:
        // The match is also drawn underneath; intro renders the countdown overlay on top
        this._renderMatch(ctx, uiCtx);
        this._renderIntro(uiCtx);
        break;
      case GAME_STATE.MATCH:
        this._renderMatch(ctx, uiCtx);
        break;
      case GAME_STATE.RESULTS:
        this._renderResults(ctx, uiCtx);
        break;
    }

    // Top-most: global transition fade + flash
    if (this.transitionAlpha > 0) drawFade(uiCtx, this.transitionAlpha, 'out');
    if (this.flashFrame > 0) {
      const a = this.flashFrame / VS_CONFIG.flashFrames;
      drawScreenFlash(uiCtx, a, '#FFFFFF');
    }

    ctx.restore();
    uiCtx.restore();
  }

  // ── LOADING ─────────────────────────────────────────────────────────────

  _updateLoading() {
    this.loadingFrame++;
    const dur = LOADING_CONFIG.durationFrames;
    this.loadingProgress = Math.min(1, this.loadingFrame / dur);
    if (this.loadingFrame >= dur && !this.loadingDone) {
      this.loadingDone = true;
      this.transitionTarget = 1;
    }
    // Once fully faded, swap to TITLE and fade back in
    if (this.loadingDone && this.transitionAlpha >= 0.99) {
      this.gameState = GAME_STATE.TITLE;
      this.titleFrame = 0;
      this.titleReady = false;
      this.transitionTarget = 0;
    }
    // Allow skipping with any button after halfway
    if (this.loadingFrame > 60 &&
        (this.input.justPressed('p1', 'light') || this.input.justPressed('p1', 'heavy') ||
         this.input.justPressed('p1', 'shield'))) {
      this.loadingFrame = dur;
    }
  }

  _renderLoading(ctx, uiCtx) {
    const fadeIn = Math.min(1, this.loadingFrame / LOADING_CONFIG.fadeFrames);
    drawLoadingScreen(ctx, this.loadingFrame, this.loadingProgress, fadeIn);
  }

  // ── INTRO COUNTDOWN ─────────────────────────────────────────────────────

  _updateIntro() {
    this.introFrame++;
    // Physics paused during the dramatic countdown — effects tick from main update loop.
    const totalCountdown = VS_CONFIG.countdownFrames * 3 + VS_CONFIG.fightFrames;
    if (this.introFrame >= totalCountdown) {
      this.gameState = GAME_STATE.MATCH;
      this.flashFrame = VS_CONFIG.flashFrames;
      this.effects.shake.add(C.SHAKE_HEAVY);
      this.effects.announce('FIGHT!', '#FFB347');
      this.frame = 0;
    }
  }

  _renderIntro(uiCtx) {
    const cd = VS_CONFIG.countdownFrames;
    const fightStart = cd * 3;
    const f = this.introFrame;
    let label = '3', color = '#7BB7FF', t;
    if (f < cd)            { label = '3'; color = '#7BB7FF'; t = f / cd; }
    else if (f < cd * 2)   { label = '2'; color = '#A4ECF8'; t = (f - cd) / cd; }
    else if (f < cd * 3)   { label = '1'; color = '#FFE0A0'; t = (f - cd * 2) / cd; }
    else                   { label = 'FIGHT!'; color = '#FFB347'; t = (f - fightStart) / VS_CONFIG.fightFrames; }
    drawCountdown(uiCtx, label, t, color);
  }

  // ── TITLE ──────────────────────────────────────────────────────────────

  _updateTitle() {
    this.titleFrame++;
    if (this.titleFrame > 60) this.titleReady = true;

    if (this.titleReady &&
        (this.input.justPressed('p1', 'light') || this.input.justPressed('p1', 'heavy') ||
         this.input.justPressed('p1', 'up') || this.input.justPressed('p2', 'light'))) {
      this.flashFrame = VS_CONFIG.flashFrames;
      this.gameState = GAME_STATE.CHAR_SELECT;
      this.charSelectPhase = 'p1';
      this.selectedChar = { p1: 0, p2: 1 };
      this.frame = 0;
    }
  }

  _renderTitle(ctx) {
    // Fantasy backdrop matching the loading screen vibe
    const bgGrad = ctx.createLinearGradient(0, 0, 0, C.H);
    bgGrad.addColorStop(0, '#0A0823');
    bgGrad.addColorStop(0.5, '#15123E');
    bgGrad.addColorStop(1, '#1A0E36');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, C.W, C.H);
    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.31) % C.W;
      const sy = (i * 91.7) % 360;
      const tw = 0.3 + Math.sin(this.frame * 0.04 + i) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${tw})`;
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    // Light beams
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const angle = lerp(-0.6, 0.6, i / 4);
      ctx.save();
      ctx.translate(640, -40);
      ctx.rotate(angle);
      const lg = ctx.createLinearGradient(0, 0, 0, 720);
      lg.addColorStop(0, 'rgba(120,160,255,0.16)');
      lg.addColorStop(0.7, 'rgba(120,160,255,0.04)');
      lg.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(-90, 0, 180, 720);
      ctx.restore();
    }
    ctx.restore();

    // Animated character silhouettes in background
    const silColors = CHARACTERS.map(c => c.palette.aura);
    for (let i = 0; i < 5; i++) {
      const bx = (i / 5) * 1280 + 128;
      const by = 420 + Math.sin(this.frame * 0.04 + i) * 15;
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = silColors[i * 2] || '#FF8C00';
      ctx.fillRect(bx - 20, by - 80, 40, 80);
      ctx.restore();
    }

    // Particle lines
    for (let i = 0; i < 12; i++) {
      const y = ((this.frame * 2 + i * 60) % 720);
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(C.W, y);
      ctx.stroke();
      ctx.restore();
    }

    // Main logo
    ctx.save();
    const pulse = 1 + Math.sin(this.frame * 0.08) * 0.02;
    ctx.translate(C.W / 2, 260);
    ctx.scale(pulse, pulse);

    // "805" large text
    ctx.font = '900 120px "Arial Black", Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 10;
    ctx.strokeText('805', 0, 0);
    const logoGrad = ctx.createLinearGradient(-200, -100, 200, 0);
    logoGrad.addColorStop(0, '#FF8C00');
    logoGrad.addColorStop(0.5, '#FFE000');
    logoGrad.addColorStop(1, '#FF4500');
    ctx.fillStyle = logoGrad;
    ctx.fillText('805', 0, 0);

    // "SHOWDOWN"
    ctx.font = '900 56px "Arial Black", Arial';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('SHOWDOWN', 0, 70);
    ctx.fillStyle = '#fff';
    ctx.fillText('SHOWDOWN', 0, 70);

    ctx.restore();

    // Character portraits
    for (let i = 0; i < CHARACTERS.length; i++) {
      const char = CHARACTERS[i];
      const px = (i / (CHARACTERS.length - 1)) * 1100 + 90;
      const py = 540 + Math.sin(this.frame * 0.05 + i * 0.7) * 8;

      // Aura circle
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.frame * 0.08 + i) * 0.2;
      const aGrad = ctx.createRadialGradient(px, py - 15, 5, px, py - 15, 38);
      aGrad.addColorStop(0, char.palette.aura + 'AA');
      aGrad.addColorStop(1, char.palette.aura + '00');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(px, py - 15, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawPortrait(ctx, char, px, py - 15, 38);

      ctx.font = `bold 11px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.fillText(char.name.toUpperCase(), px, py + 26);
    }

    // Press to start
    if (this.titleReady && Math.floor(this.frame / 20) % 2 === 0) {
      ctx.font = 'bold 22px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('PRESS ANY BUTTON TO START', C.W / 2, 460);
      ctx.fillText('PRESS ANY BUTTON TO START', C.W / 2, 460);
    }

    // Controls hint
    ctx.font = '13px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('P1: WASD + GHJ  |  P2: Arrow Keys + Numpad', C.W / 2, 700);
    ctx.fillText('G=Light  H=Heavy  J=Sig (hold dir for variant)  K=Dodge  U=Grab', C.W / 2, 716);
  }

  // ── CHARACTER SELECT ───────────────────────────────────────────────────

  _updateCharSelect() {
    const COLS = 5;
    const cellW = 180, cellH = 140;
    const startX = (C.W - COLS * cellW) / 2 + 10;
    const startY = 360;

    // phase: 'p1' → P1 is picking, 'p2' → P2 is picking, 'done' → both locked
    const phase = this.charSelectPhase;
    const activeP = phase === 'p1' ? 'p1' : phase === 'p2' ? 'p2' : null;

    // Mouse hover — preview for whoever is currently picking
    let hoveredCell = -1;
    for (let i = 0; i < CHARACTERS.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cellLeft  = startX + col * cellW + 2;
      const cellTop   = startY + row * cellH + 2;
      const cellRight = cellLeft + cellW - 4;
      const cellBot   = cellTop  + cellH - 4;
      if (this.mouse.x >= cellLeft && this.mouse.x <= cellRight &&
          this.mouse.y >= cellTop  && this.mouse.y <= cellBot) {
        hoveredCell = i;
        if (activeP) this.selectedChar[activeP] = i;
        break;
      }
    }
    this.mouse._charHoveredCell = hoveredCell;
    this.uiCanvas.style.cursor = (hoveredCell >= 0 && phase !== 'done') ? 'pointer' : 'default';

    // Click → lock in and advance phase
    if (this.mouse.clicked && hoveredCell >= 0) {
      if (phase === 'p1') {
        this.selectedChar.p1 = hoveredCell;
        this.charSelectPhase = 'p2';
        // Default P2 to an adjacent character so hover shows a distinct preview
        this.selectedChar.p2 = (hoveredCell + 1) % CHARACTERS.length;
      } else if (phase === 'p2') {
        this.selectedChar.p2 = hoveredCell;
        this.charSelectPhase = 'done';
      }
    }

    // Enter confirms once both players have picked
    if (phase === 'done' && this._menuEnterThisFrame) {
      this.gameState = GAME_STATE.STAGE_SELECT;
    }
  }

  _renderCharSelect(ctx) {
    const COLS = 5;
    const cellW = 180, cellH = 140;
    const startX = (C.W - COLS * cellW) / 2 + 10;
    const startY = 360;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, C.H);
    bgGrad.addColorStop(0, '#07071A');
    bgGrad.addColorStop(1, '#0D0A14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, C.W, C.H);

    // Subtle grid pattern
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#8888FF';
    ctx.lineWidth = 1;
    for (let x = 0; x < C.W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke();
    }
    for (let y = 0; y < C.H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke();
    }
    ctx.restore();

    const phase = this.charSelectPhase; // 'p1' | 'p2' | 'done'
    const p1Locked = phase === 'p2' || phase === 'done';
    const p2Locked = phase === 'done';

    // ── Header ──
    ctx.save();
    ctx.font = '900 14px "Arial Black"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#556';
    ctx.letterSpacing = '6px';
    const headerLabel = phase === 'p1' ? 'PLAYER 1 — PICK YOUR FIGHTER'
                      : phase === 'p2' ? 'PLAYER 2 — PICK YOUR FIGHTER'
                      : 'READY TO FIGHT!';
    const headerColor = phase === 'p1' ? '#4488FF' : phase === 'p2' ? '#FF4444' : '#FFE000';
    ctx.fillStyle = headerColor;
    ctx.shadowColor = headerColor;
    ctx.shadowBlur = 14;
    ctx.fillText(headerLabel, C.W / 2, 30);
    ctx.shadowBlur = 0;
    ctx.letterSpacing = '0px';
    for (const [sx, ex] of [[80, C.W/2 - 200], [C.W/2 + 200, C.W - 80]]) {
      ctx.beginPath(); ctx.moveTo(sx, 25); ctx.lineTo(ex, 25);
      ctx.strokeStyle = 'rgba(100,100,160,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();

    // ── Player Preview Panels ──
    const p1Char = CHARACTERS[this.selectedChar.p1];
    const p2Char = CHARACTERS[this.selectedChar.p2];

    for (const [p, char, panelX] of [['p1', p1Char, 60], ['p2', p2Char, C.W - 380]]) {
      const isLocked = p === 'p1' ? p1Locked : p2Locked;
      const isActive = (p === 'p1' && phase === 'p1') || (p === 'p2' && phase === 'p2');
      const pColor = p === 'p1' ? '#4488FF' : '#FF4444';
      const aura = char.palette.aura;
      const panelAlpha = isActive ? 1.0 : isLocked ? 0.9 : 0.35;

      ctx.save();
      ctx.globalAlpha = panelAlpha;

      // Panel bg
      const pGrad = ctx.createLinearGradient(panelX, 50, panelX + 320, 340);
      pGrad.addColorStop(0, p === 'p1' ? '#0A0A25' : '#1A0808');
      pGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pGrad;
      if (ctx.roundRect) ctx.roundRect(panelX, 50, 320, 290, 12);
      else ctx.rect(panelX, 50, 320, 290);
      ctx.fill();

      // Active panel: animated border glow
      if (isActive) {
        const pulse = 0.6 + Math.sin(this.frame * 0.12) * 0.4;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 24 * pulse;
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 2.5;
        if (ctx.roundRect) ctx.roundRect(panelX, 50, 320, 290, 12);
        else ctx.rect(panelX, 50, 320, 290);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      ctx.save();
      ctx.globalAlpha = panelAlpha;

      // Player label
      ctx.font = '900 13px "Arial Black"';
      ctx.textAlign = 'left';
      ctx.fillStyle = pColor;
      ctx.letterSpacing = '4px';
      ctx.fillText(p === 'p1' ? 'PLAYER 1' : 'PLAYER 2', panelX + 16, 80);
      ctx.letterSpacing = '0px';

      // Accent bar (thicker + glow when active)
      ctx.fillStyle = pColor;
      if (isActive) { ctx.shadowColor = pColor; ctx.shadowBlur = 12; }
      ctx.fillRect(panelX, 50, 4, 290);
      ctx.shadowBlur = 0;

      // "NOW PICKING" / "LOCKED IN" badge
      if (isActive) {
        const blink = Math.floor(this.frame / 16) % 2 === 0;
        if (blink) {
          ctx.fillStyle = pColor;
          ctx.globalAlpha = panelAlpha * 0.9;
          const badgeW = 110, badgeH = 18;
          ctx.fillRect(panelX + 204, 64, badgeW, badgeH);
          ctx.globalAlpha = panelAlpha;
          ctx.font = 'bold 11px "Arial Black"';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000';
          ctx.fillText('NOW PICKING', panelX + 204 + badgeW / 2, 76);
        }
      } else if (isLocked) {
        ctx.fillStyle = '#22CC44';
        ctx.globalAlpha = panelAlpha * 0.9;
        const badgeW = 92, badgeH = 18;
        ctx.fillRect(panelX + 222, 64, badgeW, badgeH);
        ctx.globalAlpha = panelAlpha;
        ctx.font = 'bold 11px "Arial Black"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText('LOCKED IN', panelX + 222 + badgeW / 2, 76);
      }

      // Portrait + aura
      const bob = Math.sin(this.frame * 0.06) * (isActive ? 4 : 1);
      const aGrad = ctx.createRadialGradient(panelX + 160, 195 + bob, 10, panelX + 160, 195 + bob, 90);
      aGrad.addColorStop(0, aura + (isActive ? 'BB' : '55'));
      aGrad.addColorStop(1, aura + '00');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(panelX + 160, 195 + bob, 90, 0, Math.PI * 2);
      ctx.fill();

      drawPortrait(ctx, char, panelX + 100, 195 + bob, 75);

      // Character name
      ctx.font = '900 22px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(char.name.toUpperCase(), panelX + 160, 305);
      ctx.fillStyle = isActive ? '#fff' : isLocked ? '#ddd' : '#888';
      ctx.fillText(char.name.toUpperCase(), panelX + 160, 305);

      // Stats tags
      const stats = char.stats || {};
      const tags = [];
      if ((stats.speed || 1) >= 1.1) tags.push('FAST');
      if ((stats.jump || 1) >= 1.1) tags.push('JUMPER');
      if ((char.proportions?.weight || 100) >= 105) tags.push('HEAVY');
      if ((stats.air || 1) >= 1.1) tags.push('AERIAL');
      if (tags.length === 0) tags.push('BALANCED');
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      let tagX = panelX + 80;
      for (const tag of tags.slice(0, 3)) {
        ctx.fillStyle = pColor;
        ctx.globalAlpha = panelAlpha * 0.25;
        ctx.fillRect(tagX - 4, 316, ctx.measureText(tag).width + 12, 15);
        ctx.globalAlpha = panelAlpha;
        ctx.fillStyle = pColor;
        ctx.fillText(tag, tagX + ctx.measureText(tag).width / 2 + 2, 327);
        tagX += ctx.measureText(tag).width + 22;
      }

      ctx.restore();
    }

    // ── Character Grid ──
    for (let i = 0; i < CHARACTERS.length; i++) {
      const char = CHARACTERS[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = startX + col * cellW + cellW / 2;
      const cy = startY + row * cellH + cellH / 2;

      // Which players have this cell selected, and which are locked
      const isP1sel = this.selectedChar.p1 === i;
      const isP2sel = this.selectedChar.p2 === i;
      const isP1Locked = isP1sel && p1Locked;
      const isP2Locked = isP2sel && p2Locked;
      const isActiveHover = this.mouse._charHoveredCell === i;

      // Decide highlight color: locked takes priority, then active hover
      let borderColor = null;
      if (isP1Locked && isP2Locked) borderColor = 'both';
      else if (isP1Locked) borderColor = '#4488FF';
      else if (isP2Locked) borderColor = '#FF4444';
      else if (isActiveHover && phase !== 'done') {
        borderColor = phase === 'p1' ? '#4488FFAA' : '#FF4444AA';
      }

      const isHighlighted = borderColor !== null;

      // Cell background
      ctx.save();
      ctx.globalAlpha = isHighlighted ? 0.9 : 0.5;
      const cellGrad = ctx.createLinearGradient(cx - cellW/2, cy - cellH/2, cx + cellW/2, cy + cellH/2);
      if (isP1Locked && isP2Locked) { cellGrad.addColorStop(0, '#1A1A2A'); cellGrad.addColorStop(1, '#2A1A1A'); }
      else if (isP1Locked) { cellGrad.addColorStop(0, '#0A0A28'); cellGrad.addColorStop(1, '#131330'); }
      else if (isP2Locked) { cellGrad.addColorStop(0, '#280A0A'); cellGrad.addColorStop(1, '#301313'); }
      else if (isActiveHover && phase !== 'done') {
        const c = phase === 'p1' ? '#0A0A22' : '#220A0A';
        cellGrad.addColorStop(0, c); cellGrad.addColorStop(1, c);
      } else { cellGrad.addColorStop(0, '#0F0F18'); cellGrad.addColorStop(1, '#0F0F18'); }
      ctx.fillStyle = cellGrad;
      if (ctx.roundRect) ctx.roundRect(startX + col * cellW + 2, startY + row * cellH + 2, cellW - 4, cellH - 4, 8);
      else ctx.rect(startX + col * cellW + 2, startY + row * cellH + 2, cellW - 4, cellH - 4);
      ctx.fill();

      // Border
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(startX + col * cellW + 2, startY + row * cellH + 2, cellW - 4, cellH - 4, 8);
      else ctx.rect(startX + col * cellW + 2, startY + row * cellH + 2, cellW - 4, cellH - 4);
      if (borderColor === 'both') {
        ctx.strokeStyle = '#AA66FF';
        ctx.shadowColor = '#AA66FF';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
      } else if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 16;
        ctx.lineWidth = isHighlighted && (isP1Locked || isP2Locked) ? 2.5 : 1.5;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Portrait
      const bobY = cy - 15 + (isHighlighted ? Math.sin(this.frame * 0.08) * 3 : 0);
      drawPortrait(ctx, char, cx, bobY, isHighlighted ? 46 : 40);

      // Name
      ctx.font = `${isHighlighted ? 'bold' : ''} 11px "Arial Black", Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isHighlighted ? '#fff' : '#667';
      ctx.fillText(char.name.toUpperCase(), cx, cy + 45);

      // P1/P2 locked badges on cells
      if (isP1Locked) {
        ctx.fillStyle = '#4488FF';
        ctx.font = 'bold 9px Arial';
        ctx.fillText('P1', cx - (isP2Locked ? 10 : 0), cy + 57);
      }
      if (isP2Locked) {
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 9px Arial';
        ctx.fillText('P2', cx + (isP1Locked ? 10 : 0), cy + 57);
      }
    }

    // ── Bottom Hint ──
    ctx.save();
    ctx.font = 'bold 15px "Arial Black"';
    ctx.textAlign = 'center';
    if (phase === 'done') {
      // "PRESS ENTER TO FIGHT!" — blinking yellow
      const blink = Math.floor(this.frame / 18) % 2 === 0;
      ctx.fillStyle = blink ? '#FFE000' : '#AA8800';
      ctx.shadowColor = '#FFE000';
      ctx.shadowBlur = blink ? 18 : 0;
      ctx.fillText('PRESS ENTER TO FIGHT!', C.W / 2, 710);
    } else {
      const pickColor = phase === 'p1' ? '#4488FF' : '#FF4444';
      const pickLabel = phase === 'p1' ? 'PLAYER 1: Click your fighter'
                                       : 'PLAYER 2: Click your fighter';
      ctx.fillStyle = pickColor;
      ctx.fillText(pickLabel, C.W / 2, 710);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── STAGE SELECT ───────────────────────────────────────────────────────

  _updateStageSelect() {
    const dx = this.input.getX('p1');
    if (this.input.justPressed('p1', 'right') || (dx > 0.5 && this.input.justPressed('p1', 'right'))) {
      this.selectedStage = (this.selectedStage + 1) % STAGE_LIST.length;
    }
    if (this.input.justPressed('p1', 'left') || (dx < -0.5 && this.input.justPressed('p1', 'left'))) {
      this.selectedStage = (this.selectedStage - 1 + STAGE_LIST.length) % STAGE_LIST.length;
    }
    if (this.input.justPressed('p1', 'light') || this.input.justPressed('p1', 'heavy')) {
      this._startMatch();
    }
    if (this.input.justPressed('p1', 'shield')) {
      this.gameState = GAME_STATE.CHAR_SELECT;
      this.charSelectPhase = 'p1';
      this.selectedChar = { p1: 0, p2: 1 };
    }

    // Mouse hover and click on stage thumbnails
    const thumbW = 200, thumbH = 40;
    const totalW = STAGE_LIST.length * (thumbW + 10);
    let tx = (C.W - totalW) / 2;
    let hoveredStage = -1;
    for (let i = 0; i < STAGE_LIST.length; i++) {
      const thumbLeft = tx;
      const thumbTop  = C.H - 85;
      if (this.mouse.x >= thumbLeft && this.mouse.x <= thumbLeft + thumbW &&
          this.mouse.y >= thumbTop  && this.mouse.y <= thumbTop + thumbH) {
        hoveredStage = i;
        this.selectedStage = i;
        break;
      }
      tx += thumbW + 10;
    }
    this.mouse._stageHoveredThumb = hoveredStage;
    this.uiCanvas.style.cursor = hoveredStage >= 0 ? 'pointer' : 'default';

    if (this.mouse.clicked && hoveredStage >= 0) {
      this._startMatch();
    }
  }

  _renderStageSelect(ctx) {
    const stageName = STAGE_LIST[this.selectedStage];
    const stage = STAGES[stageName];

    // Preview stage background
    stage.draw(ctx, this.frame);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, C.W, 120);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, C.H - 100, C.W, 100);

    // Stage name
    ctx.font = '900 48px "Arial Black", Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(stage.name, C.W / 2, 65);
    ctx.fillStyle = '#FFE000';
    ctx.fillText(stage.name, C.W / 2, 65);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(stage.subname, C.W / 2, 95);

    // Stage thumbnails
    const thumbW = 200, thumbH = 40;
    const totalW = STAGE_LIST.length * (thumbW + 10);
    let tx = (C.W - totalW) / 2;
    for (let i = 0; i < STAGE_LIST.length; i++) {
      const selected = i === this.selectedStage;
      const isMouseHovered = this.mouse._stageHoveredThumb === i;
      ctx.save();
      if (isMouseHovered && !selected) {
        ctx.shadowColor = 'rgba(255,255,255,0.7)';
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = selected ? '#FFE000' : (isMouseHovered ? '#666' : '#444');
      ctx.fillRect(tx, C.H - 85, thumbW, thumbH);
      ctx.strokeStyle = selected ? '#FFF' : (isMouseHovered ? 'rgba(255,255,255,0.7)' : '#666');
      ctx.lineWidth = selected ? 2 : (isMouseHovered ? 2 : 1);
      ctx.strokeRect(tx, C.H - 85, thumbW, thumbH);
      ctx.restore();
      ctx.font = `bold ${selected ? 14 : 12}px "Arial Black"`;
      ctx.textAlign = 'center';
      ctx.fillStyle = selected ? '#000' : '#aaa';
      ctx.fillText(STAGES[STAGE_LIST[i]].name, tx + thumbW / 2, C.H - 60);
      tx += thumbW + 10;
    }

    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = Math.floor(this.frame / 20) % 2 ? '#FFE000' : '#AA8800';
    ctx.fillText('G/H = Fight!  |  K = Back', C.W / 2, C.H - 12);
  }

  // ── VS SCREEN ─────────────────────────────────────────────────────────

  _updateVSScreen() {
    this.vsScreenTimer--;
    if (this.vsScreenTimer <= 0) {
      // Brief flash, then enter INTRO countdown overlaid on the match
      this.flashFrame = VS_CONFIG.flashFrames;
      this.gameState = GAME_STATE.INTRO;
      this.introFrame = 0;
      this.frame = 0;
    }
  }

  _renderVSScreen(ctx) {
    const t = 1 - this.vsScreenTimer / VS_CONFIG.vsScreenFrames;
    const p1Char = CHARACTERS[this.selectedChar.p1];
    const p2Char = CHARACTERS[this.selectedChar.p2];
    const stageName = STAGE_LIST[this.selectedStage];
    const stage = STAGES[stageName];

    // Diagonal split fantasy backdrop with energy streaks
    drawVersusBackdrop(ctx, this.frame, '#4488FF', '#FF4444');

    // Stage name banner
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.font = '900 16px "Arial Black", Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9FC8FF';
    ctx.shadowColor = '#5BA8FF';
    ctx.shadowBlur = 14;
    ctx.fillText('— STAGE —', C.W / 2, 56);
    ctx.font = '900 22px "Arial Black", Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(stage?.name?.toUpperCase() || 'STAGE', C.W / 2, 88);
    ctx.restore();

    // Player cards (slide in)
    const cardW = 360, cardH = 460;
    const slide = Math.max(0, 1 - Math.pow(1 - Math.min(1, t * 2.5), 2));
    const p1X = lerp(-cardW, 60, slide);
    const p2X = lerp(C.W, C.W - 60 - cardW, slide);
    drawVersusCard(ctx, this.frame, {
      x: p1X, y: 130, w: cardW, h: cardH,
      char: p1Char, isP1: true, slideIn: slide,
      drawPortraitFn: drawPortrait,
    });
    drawVersusCard(ctx, this.frame, {
      x: p2X, y: 130, w: cardW, h: cardH,
      char: p2Char, isP1: false, slideIn: slide,
      drawPortraitFn: drawPortrait,
    });

    // Stage preview thumbnail
    const previewW = 200, previewH = 112;
    const previewX = (C.W - previewW) / 2;
    const previewY = 130;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    drawStagePreviewCard(ctx, this.frame, stage, previewX, previewY, previewW, previewH);
    ctx.restore();

    // VS emblem (pops in)
    const vsT = Math.min(1, Math.max(0, t * 1.6 - 0.2));
    if (vsT > 0) {
      drawVersusEmblem(ctx, this.frame, vsT);
    }

    // Footer status
    drawVersusFooter(ctx, this.frame, this.vsScreenTimer < 30 ? 'GET READY!' : 'LOADING FIGHT');
  }

  // ── MATCH START ────────────────────────────────────────────────────────

  _startMatch() {
    const stageName = STAGE_LIST[this.selectedStage];
    this.stage = getStage(stageName);

    const p1CharData = CHARACTERS[this.selectedChar.p1];
    const p2CharData = CHARACTERS[this.selectedChar.p2];

    const spawn1 = this.stage.spawnPoints[0];
    const spawn2 = this.stage.spawnPoints[1];

    this.fighters = {
      p1: new Fighter(p1CharData, 'p1', spawn1.x, spawn1.y),
      p2: new Fighter(p2CharData, 'p2', spawn2.x, spawn2.y),
    };

    this.stocks = { p1: C.STOCKS, p2: C.STOCKS };
    this.matchTimer = C.FPS * 180;
    this.matchEnded = false;
    this.winner = null;
    this.resultFrame = 0;

    this.effects = new EffectManager();

    // Training mode setup
    if (this.trainingMode) {
      this.cpu = new CPU(this.cpuMode);
      this.stocks = { p1: 99, p2: 99 }; // effectively unlimited
    } else {
      this.cpu = null;
    }

    // Initialize weapon manager
    this.weaponManager = new WeaponManager();
    const wPoints = this.stage.weaponSpawnPoints || [
      { x: C.W / 2, y: 420 },
      { x: 320, y: 280 },
      { x: 960, y: 280 },
    ];
    this.weaponManager.setSpawnPoints(wPoints);
    this.weaponManager.reset();

    this.gameState = GAME_STATE.VS_SCREEN;
    this.vsScreenTimer = 180; // 3 seconds
    this.frame = 0;
    setTimeout(() => {
      this.effects.announce('ROUND 1!', '#FFE000');
    }, 200);
  }

  // ── MATCH UPDATE ────────────────────────────────────────────────────────

  _updateMatch() {
    if (this.matchEnded) {
      this.resultFrame++;
      if (this.resultFrame > 180) {
        this.gameState = GAME_STATE.RESULTS;
        this.effects.spawnConfetti();
      }
      return;
    }

    const platforms = this.stage.platforms;
    const fighters = [this.fighters.p1, this.fighters.p2];

    // Snapshot states before update for audio/event detection
    const prevStates = {};
    const prevGrounded = {};
    for (const f of fighters) {
      prevStates[f.playerKey] = f.state;
      prevGrounded[f.playerKey] = f.grounded;
    }

    // Handle input for each fighter
    for (const f of fighters) {
      if (f.state !== STATE.DEATH && f.state !== STATE.RESPAWN) {
        if (this.trainingMode && f.playerKey === 'p2' && this.cpu) {
          // CPU controls P2
          this._applyCPUToFighter(f, this.fighters.p1);
        } else {
          f.handleInput(this.input);
        }
      }
    }

    // Physics
    for (const f of fighters) {
      f.applyPhysics(platforms, C.W);
      f.tick(platforms, C.W);
      f.updateHitStun();
    }

    // Audio events based on state transitions
    for (const f of fighters) {
      const prev = prevStates[f.playerKey];
      const cur = f.state;
      const wasGrounded = prevGrounded[f.playerKey];
      if (prev !== STATE.JUMP_RISE && cur === STATE.JUMP_RISE) {
        this.audio.jump();
      }
      if (prev !== STATE.DOUBLE_JUMP && cur === STATE.DOUBLE_JUMP) {
        this.audio.doubleJump();
      }
      if (!wasGrounded && f.grounded && cur !== STATE.DEATH && cur !== STATE.RESPAWN) {
        this.audio.land();
      }
      if (prev !== cur && (
        cur === STATE.SPOT_DODGE || cur === STATE.DODGE_ROLL_L ||
        cur === STATE.DODGE_ROLL_R || cur === STATE.AIR_DODGE
      )) {
        this.audio.dodge();
      }
      if (prev !== STATE.SIGNATURE && cur === STATE.SIGNATURE) {
        this.audio.signature();
      }
    }

    // Hit detection: p1 hits p2
    this._checkHit(this.fighters.p1, this.fighters.p2);
    // p2 hits p1
    this._checkHit(this.fighters.p2, this.fighters.p1);

    // Ambient particles
    const ambients = this.stage.getAmbientParticles(this.frame);
    for (const a of ambients) {
      this.effects.spawnAmbient(a.x, a.y, a.color);
    }

    // Dust puffs on landing
    for (const f of fighters) {
      if (!f.prevGrounded && f.grounded && f.state !== STATE.RESPAWN) {
        this.effects.spawnDustPuff(f.x, f.y);
      }
      f.prevGrounded = f.grounded;
    }

    // Check blast zones — any non-dead/non-respawning fighter that leaves the arena dies
    for (const [key, f] of Object.entries(this.fighters)) {
      if (f.state !== STATE.DEATH && f.state !== STATE.RESPAWN && f.state !== STATE.LEDGE_HANG) {
        if (f.x < C.BLAST_L || f.x > C.BLAST_R || f.y < C.BLAST_T || f.y > C.BLAST_B) {
          this._handleKO(key, f);
        }
      }
    }

    // Weapon system
    if (this.weaponManager) {
      this.weaponManager.update(this.stage.platforms, fighters);
      for (const f of fighters) {
        // U / grab key: pickup or throw
        if (this.input.justPressed(f.playerKey, 'grab')) {
          if (f.currentWeapon) {
            this.weaponManager.throwWeapon(f);
          } else {
            const picked = this.weaponManager.checkPickup(f);
            if (picked) {
              // Switch moveset to weapon moves
              f._originalMoves = f.data.moves;
              f.data = { ...f.data, moves: picked.def.moves };
            }
          }
        }
      }
      this.weaponManager.checkThrownHits(fighters, this.effects);

      // Restore unarmed moves if fighter dropped weapon
      for (const f of fighters) {
        if (!f.currentWeapon && f._originalMoves) {
          f.data = { ...f.data, moves: f._originalMoves };
          f._originalMoves = null;
        }
      }
    }

    // Timer
    if (this.matchTimer > 0) {
      this.matchTimer--;
      if (this.matchTimer === 0) this._timeUp();
    }

    // Last stock announcements
    for (const [key, stk] of Object.entries(this.stocks)) {
      if (stk === 1 && this.frame % (C.FPS * 10) === 0) {
        this.effects.announce('LAST STOCK!', '#FF3030', `${this.fighters[key].name}`);
      }
    }
  }

  _applyCPUToFighter(fighter, opponent) {
    if (!this.cpu) return;
    const cpuInput = this.cpu.update(fighter, opponent);

    // Translate CPU input to fighter state changes
    // Only act if fighter can currently act
    const canAct = ['idle', 'walk', 'run', 'wavedash', 'jump_fall'].includes(fighter.state);
    const canActAir = ['jump_rise', 'jump_peak', 'jump_fall', 'double_jump'].includes(fighter.state);

    if (fighter.hitPauseLeft > 0) return;
    if (['death', 'respawn', 'shield_break', 'hit_stun', 'ko_launch'].includes(fighter.state)) return;

    const dx = cpuInput.dx || 0;
    const grounded = fighter.grounded;

    // Movement
    if (dx !== 0 && (canAct || canActAir)) {
      fighter.facingRight = dx > 0;
      if (grounded) {
        fighter.vx += dx * 0.8;
        const maxSpd = 9.0 * (fighter.speedMult || 1);
        fighter.vx = Math.max(-maxSpd, Math.min(maxSpd, fighter.vx));
        if (Math.abs(fighter.vx) > 6) fighter.state = 'run';
        else fighter.state = 'walk';
      } else {
        fighter.vx += dx * 0.5;
      }
    }

    // Jump
    if (cpuInput.jump && (grounded || fighter.coyoteFrames > 0) && fighter.jumpsLeft > 0) {
      fighter.vy = -17.5 * (fighter.jumpMult || 1);
      fighter.jumpsLeft = 1;
      fighter.grounded = false;
      fighter.coyoteFrames = 0;
      fighter.state = 'jump_rise';
      fighter.stateFrame = 0;
    } else if (cpuInput.jump && !grounded && fighter.jumpsLeft > 0) {
      fighter.jumpsLeft--;
      fighter.vy = -15.0 * (fighter.jumpMult || 1);
      fighter.state = 'double_jump';
      fighter.stateFrame = 0;
    }

    // Attacks
    if (canAct || canActAir) {
      if (cpuInput.sig && !fighter.isAttacking) {
        const mv = fighter.data.moves.signature;
        if (mv) { fighter.moveDef = mv; fighter.state = 'signature'; fighter.stateFrame = 0; fighter.activeHitboxes = []; fighter.hitThisMove = new Set(); fighter.movePhase = 'startup'; }
      } else if (cpuInput.heavy && !fighter.isAttacking && canAct) {
        const mv = fighter.data.moves.sideHeavy;
        if (mv) { fighter.moveDef = mv; fighter.state = 'heavy_side'; fighter.stateFrame = 0; fighter.activeHitboxes = []; fighter.hitThisMove = new Set(); fighter.movePhase = 'startup'; }
      } else if (cpuInput.light && !fighter.isAttacking) {
        const mv = grounded ? fighter.data.moves.neutralLight : fighter.data.moves.neutralAir;
        const st = grounded ? 'light_neutral' : 'air_neutral';
        if (mv) { fighter.moveDef = mv; fighter.state = st; fighter.stateFrame = 0; fighter.activeHitboxes = []; fighter.hitThisMove = new Set(); fighter.movePhase = 'startup'; }
      }

      // Shield
      if (cpuInput.shield && canAct) {
        fighter.state = 'shield';
        fighter.stateFrame = 0;
        fighter.isShielding = true;
      }
    }
  }

  _checkHit(attacker, defender) {
    if (!attacker.activeHitboxes?.length) return;
    if (defender.isInvincible) return;
    if (attacker.hitThisMove.has(defender)) return;

    const collision = checkHitboxes(attacker, defender);
    if (collision) {
      attacker.hitThisMove.add(defender);
      const moveDef = attacker.moveDef;
      if (!moveDef) return;

      const result = defender.takeHit(attacker, moveDef, collision, this.effects);
      if (result === true || result === 'shielded') {
        // Spawn hit effect
        const hitX = (attacker.x + defender.x) / 2;
        const hitY = defender.y - 40;
        const power = moveDef.isSig ? 'sig' : moveDef.isHeavy ? 'heavy' : 'light';
        this.effects.spawnHitEffect(hitX, hitY, moveDef.effect || 'punch', power);

        // Audio
        if (power === 'sig') this.audio.hitSig();
        else if (power === 'heavy') this.audio.hitHeavy();
        else this.audio.hitLight();

        if (result === true) {
          this.effects.spawnDamageNumber(defender.x, defender.y - 60, moveDef.damage);
          this.hud.notifyDamage(defender.playerKey);
        }
      }
    }
  }

  _handleKO(playerKey, fighter) {
    if (fighter.state === STATE.DEATH || fighter.state === STATE.RESPAWN) return;
    const opponentKey = playerKey === 'p1' ? 'p2' : 'p1';
    this.stocks[playerKey]--;

    fighter.setState(STATE.DEATH);
    this.effects.spawnKOParticles(fighter.x, fighter.y);
    this.effects.triggerKOFlash();
    this.effects.announce('KO!', '#FFE000', fighter.name);
    this.audio.ko();

    if (this.stocks[playerKey] <= 0) {
      // Match over
      this.winner = this.fighters[opponentKey];
      this.matchEnded = true;
      setTimeout(() => {
        this.effects.announce('WINNER!', '#FFE000', this.winner.name);
        this.audio.winFanfare();
      }, 500);
    } else {
      // Respawn
      fighter.damage = 0;
      const spawn = this.stage.spawnPoints[playerKey === 'p1' ? 0 : 1];
      setTimeout(() => {
        fighter.respawn(spawn.x, spawn.y - 100);
      }, 2000);
    }
  }

  _timeUp() {
    // Winner is player with more stocks, or lower damage on tie
    const { p1, p2 } = this.fighters;
    if (this.stocks.p1 > this.stocks.p2) this.winner = p1;
    else if (this.stocks.p2 > this.stocks.p1) this.winner = p2;
    else this.winner = p1.damage < p2.damage ? p1 : p2;
    this.matchEnded = true;
    this.effects.announce('TIME!', '#FF8C00');
    setTimeout(() => {
      this.effects.announce('WINNER!', '#FFE000', this.winner?.name);
    }, 2000);
  }

  // ── MATCH RENDER ────────────────────────────────────────────────────────

  _renderMatch(ctx, uiCtx) {
    // Draw stage background
    this.stage.draw(ctx, this.frame);

    // Draw character shadows
    for (const f of Object.values(this.fighters)) {
      drawCharacterShadow(ctx, f, this.stage.platforms);
    }

    // Particles below fighters
    this.effects.drawBelowFighters(ctx);

    // Draw weapons (below fighters)
    if (this.weaponManager) this.weaponManager.draw(ctx);

    // Draw fighters
    for (const f of Object.values(this.fighters)) {
      if (f.state !== STATE.DEATH) {
        drawCharacter(ctx, f, this.frame);
      }
    }

    // Hitbox debug overlay
    if (window.DEBUG_HITBOXES) {
      for (const f of Object.values(this.fighters)) {
        if (f.state !== STATE.DEATH) drawDebugBoxes(ctx, f);
      }
    }

    // Weapon held indicator
    for (const f of Object.values(this.fighters)) {
      if (f.currentWeapon) {
        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.currentWeapon.def.glowColor;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.strokeText(`[${f.currentWeapon.def.name}]`, f.x, f.y - 90);
        ctx.fillText(`[${f.currentWeapon.def.name}]`, f.x, f.y - 90);
        ctx.restore();
      }
    }

    // Hit effects + damage numbers
    this.effects.drawAboveFighters(ctx);

    // HUD (on ui canvas)
    this.hud.draw(uiCtx, this.fighters.p1, this.fighters.p2, this.matchTimer, this.stocks);

    // Announcer + KO flash
    this.effects.drawUI(uiCtx);

    // Debug info
    if (window.DEBUG) {
      uiCtx.font = '12px monospace';
      uiCtx.fillStyle = '#0f0';
      const p1 = this.fighters.p1;
      uiCtx.fillText(`P1: ${p1.state} | vx:${p1.vx.toFixed(1)} vy:${p1.vy.toFixed(1)} | ${p1.damage.toFixed(0)}%`, 10, 20);
      const p2 = this.fighters.p2;
      uiCtx.fillText(`P2: ${p2.state} | vx:${p2.vx.toFixed(1)} vy:${p2.vy.toFixed(1)} | ${p2.damage.toFixed(0)}%`, 10, 36);
      uiCtx.fillText(`Frame: ${this.frame}`, 10, 52);
      const p1w = this.fighters.p1.currentWeapon;
      const p2w = this.fighters.p2.currentWeapon;
      uiCtx.fillText(`P1 weapon: ${p1w ? p1w.def.name : 'none'} | P2 weapon: ${p2w ? p2w.def.name : 'none'}`, 10, 68);
      uiCtx.fillText(`Hitboxes: ~ toggle | Training: T toggle | CPU: ${this.cpuMode}`, 10, 84);
    }
  }

  // ── RESULTS ────────────────────────────────────────────────────────────

  _updateResults() {
    this.resultFrame++;

    // Any button returns to title after 3 seconds
    if (this.resultFrame > C.FPS * 3 &&
        (this.input.justPressed('p1', 'light') || this.input.justPressed('p1', 'heavy') ||
         this.input.justPressed('p2', 'light') || this.input.justPressed('p2', 'heavy'))) {
      this.gameState = GAME_STATE.TITLE;
      this.titleFrame = 0;
      this.titleReady = false;
    }
  }

  _renderResults(ctx, uiCtx) {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, C.H);
    bgGrad.addColorStop(0, '#050510');
    bgGrad.addColorStop(1, '#0A0A20');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, C.W, C.H);

    // Confetti particles
    this.effects.drawBelowFighters(ctx);

    // Podium
    const podH = 120;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(C.W / 2 - 80, 460, 160, podH);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(C.W / 2 - 280, 500, 160, podH - 40);
    ctx.fillStyle = '#CD7F32';
    ctx.fillRect(C.W / 2 + 120, 520, 160, podH - 60);

    // Podium labels
    ctx.font = 'bold 24px "Arial Black"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText('1', C.W / 2, 500);
    ctx.fillText('2', C.W / 2 - 200, 526);
    ctx.fillText('3', C.W / 2 + 200, 538);

    // Winner portrait
    if (this.winner) {
      const winnerBob = Math.sin(this.resultFrame * 0.08) * 6;
      drawPortrait(ctx, this.winner, C.W / 2, 420 + winnerBob, 70);

      // Winner aura
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(this.resultFrame * 0.1) * 0.2;
      const wGrad = ctx.createRadialGradient(C.W / 2, 420, 10, C.W / 2, 420, 100);
      wGrad.addColorStop(0, this.winner.palette.aura + 'AA');
      wGrad.addColorStop(1, this.winner.palette.aura + '00');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.arc(C.W / 2, 420, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // WINNER text
    ctx.font = '900 72px "Arial Black", Arial';
    ctx.textAlign = 'center';
    const scale = 1 + Math.sin(this.resultFrame * 0.1) * 0.03;
    ctx.save();
    ctx.translate(C.W / 2, 200);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText('WINNER!', 0, 0);
    const wGrad2 = ctx.createLinearGradient(-200, -60, 200, 0);
    wGrad2.addColorStop(0, '#FFE000');
    wGrad2.addColorStop(0.5, '#FF8C00');
    wGrad2.addColorStop(1, '#FF4500');
    ctx.fillStyle = wGrad2;
    ctx.fillText('WINNER!', 0, 0);
    ctx.restore();

    if (this.winner) {
      ctx.font = '900 38px "Arial Black", Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.winner.name.toUpperCase(), C.W / 2, 250);
      ctx.fillText(this.winner.name.toUpperCase(), C.W / 2, 250);
    }

    // Stats
    if (this.fighters) {
      for (const [key, f] of Object.entries(this.fighters)) {
        const px = key === 'p1' ? C.W / 2 - 260 : C.W / 2 + 100;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${f.name}: ${this.stocks[key]} stocks`, px, 650);
      }
    }

    // Press to continue
    if (this.resultFrame > C.FPS * 3 && Math.floor(this.resultFrame / 20) % 2 === 0) {
      ctx.font = 'bold 20px "Arial Black"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE000';
      ctx.fillText('PRESS ANY BUTTON TO CONTINUE', C.W / 2, 690);
    }

    // Announcer
    this.effects.drawUI(uiCtx);
  }
}

// ── Boot sequence ──────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');

  // Hide the basic HTML loader almost immediately — the polished canvas
  // loading screen takes over from here.
  setTimeout(() => {
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.style.display = 'none', 350);
    }
    window.game = new Game();

    // Debug mode toggle
    window.addEventListener('keydown', e => {
      if (e.key === '`') window.DEBUG = !window.DEBUG;
      if (e.key === '~') window.DEBUG_HITBOXES = !window.DEBUG_HITBOXES;

      // Training mode toggle (T key)
      if (e.key === 't' || e.key === 'T') {
        window.game.trainingMode = !window.game.trainingMode;
        if (window.game.trainingMode && !window.game.cpu) {
          window.game.cpu = new CPU(window.game.cpuMode);
        } else if (!window.game.trainingMode) {
          window.game.cpu = null;
        }
        console.log('Training mode:', window.game.trainingMode);
      }

      // Cycle CPU modes (C key)
      if (e.key === 'c' || e.key === 'C') {
        const modes = ['dummy_idle', 'dummy_jump', 'dummy_attack', 'cpu_easy', 'cpu_medium', 'cpu_hard'];
        const idx = modes.indexOf(window.game.cpuMode);
        window.game.cpuMode = modes[(idx + 1) % modes.length];
        if (window.game.cpu) window.game.cpu.mode = window.game.cpuMode;
        console.log('CPU mode:', window.game.cpuMode);
      }

      // Spawn weapon at center (W key in debug)
      if ((e.key === 'p' || e.key === 'P') && window.game.weaponManager) {
        window.game.weaponManager._spawnWeapon();
        console.log('Weapon spawned!');
      }
    });
  }, 200);
});
