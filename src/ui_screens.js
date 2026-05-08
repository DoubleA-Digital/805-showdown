// Reusable visual presentation pieces:
// - drawArenaGlow / drawLightRays / drawRuneRing / drawArenaMotes for in-stage atmosphere
// - drawScreenFlash + drawCountdown for transitions
// - drawLoadingScreen for the boot loader
// - drawVersusBackdrop / drawVersusCard for the VS screen
//
// All functions are pure: they take ctx + opts and draw at the given coords. No state.

import { C } from './constants.js';
import { LOADING_TIPS, LOADING_CONFIG, VS_CONFIG, getTheme } from './config/stage_themes.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function withAlpha(hex, a) {
  // hex like "#RRGGBB" → "rgba(r,g,b,a)"
  if (!hex || hex[0] !== '#') return `rgba(255,255,255,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundedRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

// ── Arena atmosphere (in-match) ───────────────────────────────────────────

// Soft halo of light around the main fighting platform.
export function drawArenaGlow(ctx, frame, opts) {
  const { cx = 640, cy = 600, w = 1280, color = '#2A6FFF' } = opts || {};
  const pulse = 0.5 + Math.sin(frame * 0.04) * 0.15;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, w * 0.45);
  grad.addColorStop(0, withAlpha(color, 0.32 * pulse));
  grad.addColorStop(0.5, withAlpha(color, 0.10 * pulse));
  grad.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.45, 200, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// God-rays shining down from above the arena.
export function drawLightRays(ctx, frame, opts) {
  const { color = 'rgba(120,180,255,0.18)', count = 6, originX = 640, originY = -60 } = opts || {};
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(frame * 0.01 + i * 1.7) * 60;
    const angle = lerp(-0.7, 0.7, i / (count - 1));
    const w = 80 + i * 16;
    const len = 720;
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, 0, len);
    grad.addColorStop(0, color);
    grad.addColorStop(0.6, color.replace(/[\d.]+\)/, '0.05)'));
    grad.addColorStop(1, color.replace(/[\d.]+\)/, '0)'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + drift * 0.05, 0);
    ctx.lineTo(w / 2 + drift * 0.05, 0);
    ctx.lineTo(w * 1.5 + drift, len);
    ctx.lineTo(-w * 1.5 + drift, len);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Animated rune ring etched into the floor under the arena.
export function drawRuneRing(ctx, frame, opts) {
  const { cx = 640, cy = 598, w = 360, color = '#5BA8FF' } = opts || {};
  const pulse = 0.55 + Math.sin(frame * 0.06) * 0.30;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.6);
  glow.addColorStop(0, withAlpha(color, 0.30 * pulse));
  glow.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.6, w * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Main ring
  ctx.strokeStyle = withAlpha(color, 0.85 * pulse);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, w * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ring
  ctx.strokeStyle = withAlpha(color, 0.55 * pulse);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2 - 14, w * 0.11, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Rune ticks around the ring
  const ticks = 16;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2 + frame * 0.005;
    const rx = cx + Math.cos(a) * (w / 2);
    const ry = cy + Math.sin(a) * (w * 0.14);
    ctx.fillStyle = withAlpha(color, 0.9 * pulse);
    ctx.beginPath();
    ctx.arc(rx, ry, i % 4 === 0 ? 3 : 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Spinning rune sigil at center top
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(frame * 0.01);
  ctx.strokeStyle = withAlpha(color, 0.65 * pulse);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = 20;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.4);
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// Slow-floating motes / energy particles drifting upward.
export function drawArenaMotes(ctx, frame, opts) {
  const { color = 'rgba(160,200,255,0.55)', count = 24 } = opts || {};
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const seed = i * 73.91;
    const baseX = (seed * 17) % 1280;
    const t = (frame * 0.6 + seed * 11) % 720;
    const y = 720 - t;
    const sway = Math.sin(frame * 0.02 + i) * 18;
    const x = baseX + sway;
    const r = 1 + ((i * 7) % 5) * 0.4;
    const a = 0.4 + Math.sin(frame * 0.03 + i) * 0.3;
    ctx.fillStyle = color;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Composite all atmosphere layers for a stage. Theme is loaded from stage key.
export function drawArenaAtmosphere(ctx, frame, stageKey, mainCx, mainCy, mainW) {
  const t = getTheme(stageKey);
  drawLightRays(ctx, frame, { color: t.rayColor });
  drawArenaGlow(ctx, frame, { cx: mainCx, cy: mainCy, w: mainW, color: t.arenaGlow });
}

export function drawArenaRunes(ctx, frame, stageKey, mainCx, mainCy, mainW) {
  const t = getTheme(stageKey);
  drawRuneRing(ctx, frame, { cx: mainCx, cy: mainCy, w: mainW, color: t.runeColor });
}

export function drawArenaMotesForStage(ctx, frame, stageKey) {
  const t = getTheme(stageKey);
  drawArenaMotes(ctx, frame, { color: t.moteColor });
}

// Foreground vignette tinted to the stage theme.
export function drawArenaVignette(ctx, stageKey) {
  const t = getTheme(stageKey);
  ctx.save();
  const grad = ctx.createRadialGradient(640, 360, 280, 640, 360, 800);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, withAlpha(t.tint, 0.40));
  grad.addColorStop(1, withAlpha(t.tint, 0.85));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
}

// ── Screen transitions ───────────────────────────────────────────────────

// Full-screen radial flash; alpha is 0..1.
export function drawScreenFlash(ctx, alpha, color = '#FFFFFF') {
  if (alpha <= 0) return;
  ctx.save();
  const grad = ctx.createRadialGradient(640, 360, 0, 640, 360, 900);
  grad.addColorStop(0, withAlpha(color, alpha));
  grad.addColorStop(0.5, withAlpha(color, alpha * 0.7));
  grad.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
}

// Soft fade to/from black. progress 0..1, mode 'in' (fade from black) | 'out' (fade to black)
export function drawFade(ctx, progress, mode = 'in') {
  const a = mode === 'in' ? 1 - progress : progress;
  if (a <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
}

// Big punchy countdown number / text with scale-in pulse and outer glow.
export function drawCountdown(ctx, label, t, color = '#7BB7FF') {
  // t is 0..1 within the digit's lifespan.
  const popIn = easeOutCubic(Math.min(1, t * 3));
  const fade  = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  const scale = lerp(0.4, 1.1, popIn);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(640, 320);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 220px "Arial Black", Impact, Arial';
  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 60;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 14;
  ctx.strokeText(label, 0, 0);
  // Gradient fill
  const grad = ctx.createLinearGradient(0, -120, 0, 120);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, '#1A2B68');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 0;
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

// ── Boot loading screen ──────────────────────────────────────────────────

// Animated mist + parallax layer pieces used by the loading screen.
function drawLoadingBackdrop(ctx, frame) {
  // Deep purple/blue gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#0A0823');
  sky.addColorStop(0.5, '#15123E');
  sky.addColorStop(1, '#1A0E36');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);

  // Far stars
  ctx.save();
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 137.31) % 1280);
    const sy = ((i * 91.7) % 720) * 0.55;
    const tw = 0.4 + Math.sin(frame * 0.04 + i) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${tw})`;
    ctx.fillRect(sx, sy, 1.4, 1.4);
  }
  ctx.restore();

  // Distant cliffs / silhouettes
  ctx.save();
  ctx.fillStyle = '#0B0B22';
  const peaks = [60, 200, 360, 520, 700, 880, 1040, 1220];
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.lineTo(0, 540);
  for (let i = 0; i < peaks.length; i++) {
    ctx.lineTo(peaks[i] - 30, 480 + ((i % 2) * 30));
    ctx.lineTo(peaks[i],      440 + ((i % 3) * 20));
    ctx.lineTo(peaks[i] + 30, 470 + ((i % 2) * 25));
  }
  ctx.lineTo(1280, 540);
  ctx.lineTo(1280, 720);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Drifting fog band
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const fx = ((frame * 0.4 + i * 360) % 1600) - 200;
    const fy = 480 + i * 20;
    const grad = ctx.createRadialGradient(fx, fy, 10, fx, fy, 220);
    grad.addColorStop(0, 'rgba(120,140,220,0.18)');
    grad.addColorStop(1, 'rgba(120,140,220,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(fx - 220, fy - 80, 440, 160);
  }
  ctx.restore();

  // Light rays from above
  drawLightRays(ctx, frame, { color: 'rgba(120,160,255,0.15)', count: 7 });

  // Floating motes
  drawArenaMotes(ctx, frame, { color: 'rgba(180,210,255,0.6)', count: 30 });
}

// Stone/metal frame around a panel
function drawStoneFrame(ctx, x, y, w, h, color = '#5BA8FF') {
  // Dark inner panel
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 12);
  const innerGrad = ctx.createLinearGradient(0, y, 0, y + h);
  innerGrad.addColorStop(0, 'rgba(20,28,60,0.92)');
  innerGrad.addColorStop(1, 'rgba(8,10,28,0.94)');
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Inner highlight
  ctx.strokeStyle = withAlpha(color, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundedRect(ctx, x + 4, y + 4, w - 8, h - 8, 10);
  ctx.stroke();

  // Outer thick frame
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 12);
  ctx.strokeStyle = '#1A2B58';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.stroke();

  // Corner studs
  ctx.shadowBlur = 0;
  for (const [sx, sy] of [[x + 12, y + 12], [x + w - 12, y + 12], [x + 12, y + h - 12], [x + w - 12, y + h - 12]]) {
    ctx.fillStyle = '#0E1A36';
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Glowing bar (used for loading + HUD-style energy).
function drawGlowBar(ctx, x, y, w, h, progress, color = '#4DA3FF') {
  // Bar trough
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(8,14,32,0.92)';
  ctx.fill();
  ctx.strokeStyle = '#10204A';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Fill
  const fillW = Math.max(0, Math.min(1, progress)) * (w - 6);
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x + 3, y + 3, w - 6, h - 6, (h - 6) / 2);
  ctx.clip();
  const fillGrad = ctx.createLinearGradient(x, y, x + w, y);
  fillGrad.addColorStop(0, '#1F4ED8');
  fillGrad.addColorStop(0.5, color);
  fillGrad.addColorStop(1, '#A4ECF8');
  ctx.fillStyle = fillGrad;
  ctx.fillRect(x + 3, y + 3, fillW, h - 6);
  // Animated highlight scrub
  const t = (Date.now() % 1500) / 1500;
  const sx = x + 3 + fillW * t - 30;
  const hg = ctx.createLinearGradient(sx, 0, sx + 80, 0);
  hg.addColorStop(0, 'rgba(255,255,255,0)');
  hg.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(sx, y + 3, 80, h - 6);
  ctx.restore();
  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.strokeStyle = withAlpha(color, 0.6);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export function drawLoadingScreen(ctx, frame, progress, fade) {
  drawLoadingBackdrop(ctx, frame);

  // Title plate
  const cx = 640;
  const titleY = 200;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 805
  ctx.font = '900 160px "Arial Black", Impact, Arial';
  ctx.shadowColor = '#4DA3FF';
  ctx.shadowBlur = 40;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 10;
  ctx.strokeText(LOADING_CONFIG.title, cx, titleY);
  const titleGrad = ctx.createLinearGradient(0, titleY - 80, 0, titleY + 80);
  titleGrad.addColorStop(0, '#FFFFFF');
  titleGrad.addColorStop(0.5, '#7BB7FF');
  titleGrad.addColorStop(1, '#1F4ED8');
  ctx.fillStyle = titleGrad;
  ctx.fillText(LOADING_CONFIG.title, cx, titleY);

  // SHOWDOWN sub
  ctx.font = '900 56px "Arial Black", Impact, Arial';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#FFE000';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText(LOADING_CONFIG.subtitle, cx, titleY + 90);
  const subGrad = ctx.createLinearGradient(0, titleY + 60, 0, titleY + 130);
  subGrad.addColorStop(0, '#FFE0A0');
  subGrad.addColorStop(0.5, '#FF9B3F');
  subGrad.addColorStop(1, '#FF4500');
  ctx.fillStyle = subGrad;
  ctx.fillText(LOADING_CONFIG.subtitle, cx, titleY + 90);

  // Tagline
  ctx.shadowBlur = 0;
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'rgba(180,200,255,0.7)';
  ctx.letterSpacing = '8px';
  ctx.fillText(LOADING_CONFIG.tagline, cx, titleY + 132);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // Decorative arena platform silhouette below
  ctx.save();
  const aGrad = ctx.createRadialGradient(cx, 540, 40, cx, 540, 320);
  aGrad.addColorStop(0, 'rgba(80,160,255,0.35)');
  aGrad.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = aGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 540, 320, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stone slab silhouette
  ctx.fillStyle = '#0E1A36';
  ctx.beginPath();
  ctx.moveTo(cx - 220, 560);
  ctx.bezierCurveTo(cx - 240, 540, cx - 260, 530, cx - 280, 525);
  ctx.lineTo(cx - 200, 480);
  ctx.lineTo(cx + 200, 480);
  ctx.lineTo(cx + 280, 525);
  ctx.bezierCurveTo(cx + 260, 530, cx + 240, 540, cx + 220, 560);
  ctx.lineTo(cx + 220, 600);
  ctx.lineTo(cx - 220, 600);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5BA8FF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#5BA8FF';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Rune ring on the slab
  drawRuneRing(ctx, frame, { cx, cy: 482, w: 320, color: '#7BB7FF' });
  ctx.restore();

  // Loading bar panel
  const barW = 540, barH = 24;
  const barX = cx - barW / 2;
  const barY = 620;
  drawStoneFrame(ctx, cx - 320, barY - 20, 640, 80, '#5BA8FF');
  drawGlowBar(ctx, barX, barY, barW, barH, progress, '#4DA3FF');

  // Progress percentage
  ctx.save();
  ctx.font = 'bold 14px "Arial Black", Arial';
  ctx.fillStyle = '#9FC8FF';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(progress * 100)}%   LOADING`, cx, barY + 50);
  ctx.restore();

  // Cycling tip text
  const tipIdx = Math.floor(frame / 180) % LOADING_TIPS.length;
  const tip = LOADING_TIPS[tipIdx];
  const tipFade = (Math.sin((frame % 180) / 180 * Math.PI)) * 0.85 + 0.15;
  ctx.save();
  ctx.globalAlpha = tipFade;
  ctx.font = 'italic 17px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#E0EBFF';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillText(tip, cx, 700);
  ctx.restore();

  // Fade overlay (in/out)
  if (fade < 1) drawFade(ctx, fade, 'in');
}

// ── Versus screen helpers ────────────────────────────────────────────────

// Diagonal split background with energy streaks. Pass two team colors.
export function drawVersusBackdrop(ctx, frame, p1Color = '#4488FF', p2Color = '#FF4444') {
  // Base dark
  const bg = ctx.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#070617');
  bg.addColorStop(1, '#0F0A1F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // Diagonal split colored wash
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Left blue panel
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(720, 0);
  ctx.lineTo(560, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  const lg = ctx.createLinearGradient(0, 0, 720, 720);
  lg.addColorStop(0, withAlpha(p1Color, 0.32));
  lg.addColorStop(1, withAlpha(p1Color, 0));
  ctx.fillStyle = lg;
  ctx.fill();
  // Right red panel
  ctx.beginPath();
  ctx.moveTo(560, 0);
  ctx.lineTo(1280, 0);
  ctx.lineTo(1280, 720);
  ctx.lineTo(720, 720);
  ctx.closePath();
  const rg = ctx.createLinearGradient(560, 0, 1280, 720);
  rg.addColorStop(0, withAlpha(p2Color, 0));
  rg.addColorStop(1, withAlpha(p2Color, 0.32));
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.restore();

  // Diagonal slash band
  ctx.save();
  const slashGrad = ctx.createLinearGradient(560, 0, 720, 720);
  slashGrad.addColorStop(0, withAlpha(p1Color, 0));
  slashGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  slashGrad.addColorStop(1, withAlpha(p2Color, 0));
  ctx.fillStyle = slashGrad;
  ctx.beginPath();
  ctx.moveTo(560 + 40, 0);
  ctx.lineTo(720 + 40, 0);
  ctx.lineTo(560 - 40, 720);
  ctx.lineTo(400 - 40, 720);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Energy streaks racing horizontally
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const seed = i * 53.7;
    const sy = (seed * 7) % 720;
    const t = (frame * 4 + seed) % 1280;
    const sx = (i % 2 === 0) ? t : 1280 - t;
    const len = 80 + (i % 3) * 50;
    const c = i % 2 === 0 ? p1Color : p2Color;
    const sg = ctx.createLinearGradient(sx, sy, sx + (i % 2 === 0 ? len : -len), sy);
    sg.addColorStop(0, withAlpha(c, 0));
    sg.addColorStop(0.5, withAlpha(c, 0.7));
    sg.addColorStop(1, withAlpha(c, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(Math.min(sx, sx + (i % 2 === 0 ? len : -len)), sy, len, 2);
  }
  ctx.restore();

  // Floating sparks
  drawArenaMotes(ctx, frame, { color: 'rgba(220,230,255,0.55)', count: 40 });

  // Light rays behind
  drawLightRays(ctx, frame, { color: 'rgba(140,170,255,0.10)', count: 8 });
}

// A polished character card. drawPortraitFn is passed in to keep this module
// independent of the renderer.
export function drawVersusCard(ctx, frame, opts) {
  const { x, y, w, h, char, isP1, slideIn = 1, drawPortraitFn } = opts;
  const accent = isP1 ? '#4488FF' : '#FF4444';
  const bob = Math.sin(frame * 0.05 + (isP1 ? 0 : 0.7)) * 4;

  ctx.save();
  ctx.globalAlpha = slideIn;

  // Card backing
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  if (isP1) { bg.addColorStop(0, '#0A1A4A'); bg.addColorStop(1, '#040820'); }
  else      { bg.addColorStop(0, '#4A0A0A'); bg.addColorStop(1, '#200404'); }
  ctx.fillStyle = bg;
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 16);
  ctx.fill();

  // Aura behind portrait
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 16);
  ctx.clip();
  const aura = ctx.createRadialGradient(x + w / 2, y + h * 0.45, 30, x + w / 2, y + h * 0.45, w);
  aura.addColorStop(0, withAlpha(char.palette.aura || '#FFFFFF', 0.55));
  aura.addColorStop(1, withAlpha(char.palette.aura || '#FFFFFF', 0));
  ctx.fillStyle = aura;
  ctx.fillRect(x, y, w, h);
  // Light streaks inside the card
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const sy = y + (i / 4) * h;
    const sg = ctx.createLinearGradient(x, sy, x + w, sy);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, withAlpha(accent, 0.18));
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x, sy - 1, w, 2);
  }
  ctx.restore();

  // Portrait
  if (drawPortraitFn) {
    drawPortraitFn(ctx, char, x + w / 2, y + h * 0.45 + bob, Math.min(w, h) * 0.42);
  }

  // Frame
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 16);
  ctx.strokeStyle = '#0A0F22';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 16);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Player tag
  ctx.fillStyle = accent;
  ctx.fillRect(x + 14, y + 14, 90, 22);
  ctx.font = '900 13px "Arial Black", Arial';
  ctx.fillStyle = '#0A0F22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isP1 ? 'PLAYER 1' : 'PLAYER 2', x + 14 + 45, y + 14 + 11);
  ctx.textBaseline = 'alphabetic';

  // Name plate
  const nameY = y + h - 36;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x + 14, nameY, w - 28, 26);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 14, nameY, w - 28, 26);
  ctx.font = '900 18px "Arial Black", Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.fillText(char.name.toUpperCase(), x + w / 2, nameY + 18);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// Big glowing VS emblem.
export function drawVersusEmblem(ctx, frame, t = 1) {
  const cx = 640, cy = 360;
  const scale = 1 + Math.sin(frame * 0.08) * 0.04;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale * t, scale * t);
  ctx.globalAlpha = t;

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#FFE000';
  ctx.shadowBlur = 32;
  ctx.stroke();
  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFE000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = '900 96px "Arial Black", Impact, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 12;
  ctx.strokeText('VS', 0, 4);
  const grad = ctx.createLinearGradient(-80, -60, 80, 60);
  grad.addColorStop(0, '#FFE000');
  grad.addColorStop(0.5, '#FF8C00');
  grad.addColorStop(1, '#FF4500');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#FF8C00';
  ctx.shadowBlur = 24;
  ctx.fillText('VS', 0, 4);

  // Spark tick rays around it
  ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + frame * 0.02;
    const r1 = 116, r2 = 130 + (i % 3) * 5;
    ctx.strokeStyle = '#FFE000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

// Stage preview thumbnail card on the VS screen.
export function drawStagePreviewCard(ctx, frame, stage, x, y, w, h) {
  ctx.save();
  // Backing
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fill();
  // Clip and render the stage at small scale
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x + 4, y + 4, w - 8, h - 8, 8);
  ctx.clip();
  ctx.translate(x + 4, y + 4);
  ctx.scale((w - 8) / 1280, (h - 8) / 720);
  if (stage && stage.draw) stage.draw(ctx, frame);
  ctx.restore();
  // Frame
  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, 10);
  ctx.strokeStyle = '#5BA8FF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#5BA8FF';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Label
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x, y + h - 22, w, 22);
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = '#9FC8FF';
  ctx.textAlign = 'center';
  ctx.fillText(stage?.name?.toUpperCase() || 'STAGE', x + w / 2, y + h - 7);
  ctx.restore();
}

// Bottom info bar + ready-status pulse on the VS screen.
export function drawVersusFooter(ctx, frame, label = 'LOADING FIGHT') {
  const w = 460, h = 44;
  const x = 640 - w / 2, y = 660;
  drawStoneFrame(ctx, x, y, w, h, '#5BA8FF');
  ctx.save();
  ctx.font = '900 16px "Arial Black", Impact, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pulse = 0.6 + Math.sin(frame * 0.12) * 0.4;
  ctx.fillStyle = `rgba(180,220,255,${pulse})`;
  ctx.shadowColor = '#5BA8FF';
  ctx.shadowBlur = 14;
  ctx.fillText(label, 640, y + h / 2);
  ctx.restore();
}

// Re-export config for convenience
export { LOADING_TIPS, LOADING_CONFIG, VS_CONFIG, getTheme };
