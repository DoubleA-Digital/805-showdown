import { C } from './constants.js';
import { STATE } from './fighter.js';

// ── Pose interpolation helper ─────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

// Pose = object with body-part angles (degrees) and transform overrides
const REST_POSE = {
  bodyLean: 0, headNod: 0,
  lShoulder: -15, lElbow: 20,
  rShoulder:  15, rElbow: 20,
  lHip: 5,  lKnee: 5,
  rHip: -5, rKnee: 5,
  bodyY: 0, squishX: 1, squishY: 1,
};

// Prebuilt pose library — spread REST_POSE first so every key is always present
const POSES = {
  idle:    { ...REST_POSE },
  walk1:   { ...REST_POSE, lShoulder: -40, rShoulder:  30, lHip:  20, lKnee: 10, rHip: -15, rKnee:  5 },
  walk2:   { ...REST_POSE, lShoulder:  30, rShoulder: -40, lHip: -15, lKnee:  5, rHip:  20, rKnee: 10 },
  run1:    { ...REST_POSE, bodyLean: 18, lShoulder: -70, rShoulder:  55, lHip:  40, lKnee: 25, rHip: -30, rKnee:  8 },
  run2:    { ...REST_POSE, bodyLean: 18, lShoulder:  55, rShoulder: -70, lHip: -30, rKnee:  8, rHip:  40, lKnee: 25 },
  jumpRise: { ...REST_POSE, lShoulder: -90, rShoulder: -90, lHip: -15, rHip: -15, lKnee: 40, rKnee: 40, bodyY: -6, squishX: 0.82, squishY: 1.18 },
  jumpPeak: { ...REST_POSE, lShoulder: -60, rShoulder: -60, lHip: -25, rHip: -25, lKnee: 55, rKnee: 55 },
  jumpFall: { ...REST_POSE, lShoulder:  40, rShoulder:  40, lHip:  12, rHip:  12, lKnee: 12, rKnee: 12, squishX: 1.12, squishY: 0.88 },
  lightN:  { ...REST_POSE, rShoulder: -10, rElbow: -40, bodyLean: 5 },
  lightN2: { ...REST_POSE, rShoulder: 100, rElbow: -15, bodyLean: 20, lShoulder: -30, squishX: 1.08 },
  lightS:  { ...REST_POSE, rShoulder:  70, rElbow: -10, bodyLean: 25, lShoulder: -35, squishX: 1.12 },
  lightU:  { ...REST_POSE, rShoulder: -120, rElbow:  20, lShoulder: -90, bodyLean: -5, bodyY: -8, squishY: 1.1 },
  lightD:  { ...REST_POSE, rShoulder:  30, lShoulder:  30, lHip: 20, rHip: 20, lKnee: 30, rKnee: 30, bodyY: 8 },
  heavyS:  { ...REST_POSE, rShoulder: 110, rElbow: -25, bodyLean:  35, lShoulder: -55, squishX: 1.22, bodyY: -6 },
  heavyU:  { ...REST_POSE, rShoulder: -160, lShoulder: -150, bodyLean: -10, bodyY: -12, squishY: 1.2 },
  heavyD:  { ...REST_POSE, rShoulder:  60, lShoulder:  60, bodyLean:  20, lKnee: 60, rKnee: 60, bodyY: 15 },
  airN:    { ...REST_POSE, rShoulder:  80, rElbow: -30, lShoulder: -30 },
  airF:    { ...REST_POSE, rShoulder:  60, rElbow:   0, bodyLean:  20, lShoulder: -40, squishX: 1.15 },
  airB:    { ...REST_POSE, lShoulder: 110, lElbow: -20, bodyLean: -15, rShoulder:  30 },
  airU:    { ...REST_POSE, rShoulder: -140, lShoulder: -130, bodyY: -10 },
  airD:    { ...REST_POSE, rShoulder:  40, lShoulder:  40, bodyLean: 10, lKnee: 40, rKnee: 40, bodyY: 12 },
  sig:     { ...REST_POSE, rShoulder: -160, lShoulder: -160, rElbow:  50, lElbow:  50, bodyLean: -22, bodyY: -18, squishY: 1.35 },
  shield:  { ...REST_POSE, lShoulder:  45, rShoulder:  45, bodyLean: -10, lKnee: 20, rKnee: 20 },
  dodge:   { ...REST_POSE, bodyLean:  40, lShoulder: -70, rShoulder:  70, lKnee: 50, rKnee: 50, squishX: 0.65, squishY: 1.35 },
  hitStun: { ...REST_POSE, bodyLean: -25, lShoulder:  60, rShoulder:  60, lKnee: -20, rKnee: -20 },
  ko:      { ...REST_POSE, bodyLean:  40, lShoulder:  80, rShoulder:  80, lHip:  30, rHip: -30, lKnee: 20, rKnee: 20 },
  shield_break: { ...REST_POSE, bodyLean: -30, lShoulder: 90, rShoulder: -90, lKnee: -30, rKnee: -30, bodyY: 15 },
};

// ── Drawing utilities ─────────────────────────────────────────────────────

function toRad(deg) { return deg * Math.PI / 180; }

function limbEndpoint(x, y, length, angleDeg) {
  const rad = toRad(angleDeg);
  return { x: x + Math.sin(rad) * length, y: y + Math.cos(rad) * length };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

// ── Aura effect for heavy / signature attacks ─────────────────────────────

function drawAura(ctx, auraColor, frame) {
  const alpha = 0.5 + Math.sin(frame * 0.3) * 0.3;
  const size  = 40  + Math.sin(frame * 0.2) * 8;
  ctx.save();
  const grad = ctx.createRadialGradient(0, -55, 5, 0, -55, size);
  grad.addColorStop(0, auraColor + 'CC');
  grad.addColorStop(1, auraColor + '00');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, -55, size * 0.7, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Chibi shoe drawing ────────────────────────────────────────────────────
// x, y = center bottom of shoe, isFront = slightly larger
function _drawChibiShoe(ctx, x, y, palette, data, isFront) {
  const sw = isFront ? 26 : 23;   // shoe width
  const sh = isFront ? 14 : 13;   // shoe height
  const sx = x - sw * 0.4;        // shoe left edge (toe forward)

  ctx.save();
  // Black outline
  ctx.beginPath();
  ctx.moveTo(sx - 2, y - 2);
  ctx.lineTo(sx + sw + 2, y - 2);
  ctx.quadraticCurveTo(sx + sw + 6, y - 2, sx + sw + 6, y - sh * 0.5);
  ctx.quadraticCurveTo(sx + sw + 5, y - sh - 2, sx + sw * 0.55, y - sh - 2);
  ctx.lineTo(sx - 2, y - sh * 0.4 - 1);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  // Sole (white/rubber strip along bottom)
  ctx.beginPath();
  ctx.moveTo(sx, y);
  ctx.lineTo(sx + sw + 3, y);
  ctx.quadraticCurveTo(sx + sw + 5, y, sx + sw + 5, y - sh * 0.35);
  ctx.lineTo(sx + sw * 0.6, y - sh * 0.35);
  ctx.lineTo(sx, y - sh * 0.2);
  ctx.closePath();
  ctx.fillStyle = palette.shoesAccent || '#F5F5F5';
  ctx.fill();

  // Upper shoe body
  ctx.beginPath();
  ctx.moveTo(sx, y - sh * 0.2);
  ctx.lineTo(sx + sw * 0.6, y - sh * 0.35);
  ctx.lineTo(sx + sw + 4, y - sh * 0.35);
  ctx.quadraticCurveTo(sx + sw + 4, y - sh, sx + sw * 0.55, y - sh);
  ctx.lineTo(sx, y - sh * 0.55);
  ctx.closePath();
  ctx.fillStyle = palette.shoes || '#222';
  ctx.fill();

  // White side panel (outer side of shoe)
  const panelStyle = data?.features?.shoeStyle;
  if (panelStyle === 'nike_dunk' || panelStyle === 'jordan1') {
    ctx.beginPath();
    ctx.ellipse(sx + sw * 0.55, y - sh * 0.65, sw * 0.22, sh * 0.22, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = palette.shoesAccent || '#F5F5F5';
    ctx.fill();

    // Nike swoosh curve
    ctx.save();
    ctx.strokeStyle = palette.accent || '#fff';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + sw * 0.28, y - sh * 0.55);
    ctx.quadraticCurveTo(sx + sw * 0.55, y - sh * 0.8, sx + sw * 0.78, y - sh * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  // Laces area (subtle lines near ankle)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const lx = sx + sw * 0.18 + i * sw * 0.12;
    ctx.beginPath();
    ctx.moveTo(lx, y - sh * 0.6);
    ctx.lineTo(lx, y - sh * 0.95);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Chibi leg drawing ─────────────────────────────────────────────────────
// Draws one cargo-pant leg as a thick rounded rectangle with knee bend
// hipX/hipY = top of leg, kneeAngleDeg = pose knee angle, length = visual leg length
function _drawChibiLeg(ctx, hipX, hipY, upperAngle, lowerAngle, palette) {
  const upperLen = 30;
  const lowerLen = 28;
  const lw = 18; // leg width

  const knee = limbEndpoint(hipX, hipY, upperLen, upperAngle);
  const foot = limbEndpoint(knee.x, knee.y, lowerLen, lowerAngle);

  // Draw upper leg
  _drawThickLimb(ctx, hipX, hipY, knee.x, knee.y, lw, lw - 1, palette.outfit2 || '#222');
  // Draw lower leg
  _drawThickLimb(ctx, knee.x, knee.y, foot.x, foot.y, lw - 1, lw - 2, palette.outfit2 || '#222');

  // Cargo pocket on the outer side at knee level
  ctx.save();
  const pocketX = knee.x + 3;
  const pocketY = knee.y - 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  // Pocket outline
  roundRect(ctx, pocketX - 7, pocketY - 7, 11, 10, 2);
  ctx.strokeStyle = palette.outfit2 ? _darken(palette.outfit2, 0.18) : '#111';
  ctx.fillStyle = palette.outfit2 ? _darken(palette.outfit2, 0.1) : '#1a1a1a';
  ctx.fill();
  ctx.stroke();
  // Pocket stitching
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(pocketX - 6, pocketY - 1);
  ctx.lineTo(pocketX + 3, pocketY - 1);
  ctx.stroke();
  ctx.restore();

  return foot;
}

// Draw a thick rounded-rectangle limb segment (cel-shaded)
function _drawThickLimb(ctx, x1, y1, x2, y2, w1, w2, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny =  dx / len;
  const ow1 = w1 / 2 + 2;
  const ow2 = w2 / 2 + 2;
  const hw1 = w1 / 2;
  const hw2 = w2 / 2;
  const a1 = Math.atan2(ny, nx);
  const a2 = Math.atan2(-ny, -nx);

  // Black outline
  ctx.beginPath();
  ctx.moveTo(x1 + nx * ow1, y1 + ny * ow1);
  ctx.lineTo(x2 + nx * ow2, y2 + ny * ow2);
  ctx.arc(x2, y2, ow2, a1, a1 + Math.PI);
  ctx.lineTo(x1 - nx * ow1, y1 - ny * ow1);
  ctx.arc(x1, y1, ow1, a2, a2 + Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  // Main color
  ctx.beginPath();
  ctx.moveTo(x1 + nx * hw1, y1 + ny * hw1);
  ctx.lineTo(x2 + nx * hw2, y2 + ny * hw2);
  ctx.arc(x2, y2, hw2, a1, a1 + Math.PI);
  ctx.lineTo(x1 - nx * hw1, y1 - ny * hw1);
  ctx.arc(x1, y1, hw1, a2, a2 + Math.PI);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Cel highlight
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1 + nx * hw1, y1 + ny * hw1);
  ctx.lineTo(x2 + nx * hw2, y2 + ny * hw2);
  ctx.arc(x2, y2, hw2, a1, a1 + Math.PI);
  ctx.lineTo(x1 - nx * hw1, y1 - ny * hw1);
  ctx.arc(x1, y1, hw1, a2, a2 + Math.PI);
  ctx.closePath();
  ctx.clip();
  const hlGrad = ctx.createLinearGradient(x1 + nx * hw1, y1, x1 - nx * hw1, y1);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
  hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  hlGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = hlGrad;
  ctx.fillRect(Math.min(x1, x2) - w1, Math.min(y1, y2) - w1, Math.abs(dx) + w1 * 2, Math.abs(dy) + w1 * 2);
  ctx.restore();
}

// Color utility: darken a hex color by factor (0-1)
function _darken(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = 1 - factor;
  return `rgb(${Math.floor(r * d)},${Math.floor(g * d)},${Math.floor(b * d)})`;
}

// ── Chibi arm drawing ─────────────────────────────────────────────────────
function _drawChibiArm(ctx, shoulderX, shoulderY, upperAngle, elbowOffset, palette) {
  const upperLen = 22;
  const lowerLen = 18;
  const upperW = 14;
  const lowerW = 11;

  const elbow = limbEndpoint(shoulderX, shoulderY, upperLen, upperAngle);
  const hand  = limbEndpoint(elbow.x, elbow.y, lowerLen, upperAngle + elbowOffset);

  // Upper arm (sleeve = outfit1)
  _drawThickLimb(ctx, shoulderX, shoulderY, elbow.x, elbow.y, upperW, upperW - 1, palette.outfit1 || '#888');
  // Forearm (skin)
  _drawThickLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, lowerW, lowerW - 1, palette.skin || '#C68642');
  // Hand circle
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 7.5, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();

  return hand;
}

// ── Chibi torso drawing ───────────────────────────────────────────────────
function _drawChibiTorso(ctx, lean, palette, data) {
  ctx.save();
  ctx.rotate(lean);

  const tw  = 60;  // shoulder width
  const bw  = 44;  // hip width
  const th  = 48;  // torso height
  const tx  = -tw / 2;
  const ty  = -th - 8;  // torso top (relative to hip joint at y=0 -> shifted up)

  const hoodieStyle = data?.features?.hoodieStyle || 'pullover';
  const hasUndershirt = !!data?.features?.hasUndershirt;
  const hasInner = !!data?.features?.hasInnerHoodie;

  // Black outline (trapezoid shape)
  ctx.beginPath();
  ctx.moveTo(tx - 2, ty + th + 2);
  ctx.lineTo(-bw / 2 - 2, ty + th + 2);
  ctx.lineTo(tx - 2, ty - 2);
  ctx.lineTo(-tx + 2, ty - 2);
  ctx.lineTo(bw / 2 + 2, ty + th + 2);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  // White undershirt peek strip at hem
  if (hasUndershirt) {
    ctx.beginPath();
    ctx.moveTo(-bw / 2, ty + th - 2);
    ctx.lineTo(bw / 2, ty + th - 2);
    ctx.lineTo(bw / 2 + 1, ty + th + 4);
    ctx.lineTo(-bw / 2 - 1, ty + th + 4);
    ctx.closePath();
    ctx.fillStyle = palette.undertop || '#F0F0F0';
    ctx.fill();
  }

  // Inner hoodie layer (shown through zip gap)
  if (hasInner && hoodieStyle === 'zip') {
    // Draw full trapezoid in inner color, clipped to left+right panels
    ctx.save();
    // Left panel clip
    ctx.beginPath();
    ctx.moveTo(tx, ty + th);
    ctx.lineTo(-bw / 2, ty + th);
    ctx.lineTo(tx, ty);
    ctx.lineTo(-4, ty);
    ctx.lineTo(-4, ty + th);
    ctx.closePath();
    ctx.fillStyle = palette.innerLayer || '#222';
    ctx.fill();
    // Right panel clip
    ctx.beginPath();
    ctx.moveTo(4, ty);
    ctx.lineTo(-tx, ty);
    ctx.lineTo(bw / 2, ty + th);
    ctx.lineTo(4, ty + th);
    ctx.closePath();
    ctx.fillStyle = palette.innerLayer || '#222';
    ctx.fill();
    ctx.restore();
  } else if (hasInner) {
    // Full inner for non-zip
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty + th - 2);
    ctx.lineTo(-bw / 2 + 2, ty + th - 2);
    ctx.lineTo(tx + 2, ty + 2);
    ctx.lineTo(-tx - 2, ty + 2);
    ctx.lineTo(bw / 2 - 2, ty + th - 2);
    ctx.closePath();
    ctx.fillStyle = palette.innerLayer || '#222';
    ctx.fill();
  }

  // Main torso trapezoid
  if (hoodieStyle === 'zip' && hasInner) {
    // Left outer panel
    ctx.beginPath();
    ctx.moveTo(tx, ty + th);
    ctx.lineTo(-bw / 2, ty + th);
    ctx.lineTo(tx, ty);
    ctx.lineTo(-4, ty);
    ctx.lineTo(-4, ty + th);
    ctx.closePath();
    ctx.fillStyle = palette.outfit1 || '#888';
    ctx.fill();
    // Right outer panel
    ctx.beginPath();
    ctx.moveTo(4, ty);
    ctx.lineTo(-tx, ty);
    ctx.lineTo(bw / 2, ty + th);
    ctx.lineTo(4, ty + th);
    ctx.closePath();
    ctx.fillStyle = palette.outfit1 || '#888';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(tx, ty + th);
    ctx.lineTo(-bw / 2, ty + th);
    ctx.lineTo(tx, ty);
    ctx.lineTo(-tx, ty);
    ctx.lineTo(bw / 2, ty + th);
    ctx.closePath();
    ctx.fillStyle = palette.outfit1 || '#888';
    ctx.fill();
  }

  // Cel-shading gradient on torso
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tx, ty + th);
  ctx.lineTo(-bw / 2, ty + th);
  ctx.lineTo(tx, ty);
  ctx.lineTo(-tx, ty);
  ctx.lineTo(bw / 2, ty + th);
  ctx.closePath();
  ctx.clip();
  const torsoHL = ctx.createLinearGradient(tx, ty, -tx, ty + th * 0.6);
  torsoHL.addColorStop(0, 'rgba(255,255,255,0.2)');
  torsoHL.addColorStop(0.35, 'rgba(255,255,255,0.07)');
  torsoHL.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = torsoHL;
  ctx.fillRect(tx - 5, ty - 5, tw + 20, th + 10);
  ctx.restore();

  // Hoodie style details
  if (hoodieStyle === 'pullover') {
    // Kangaroo pocket outline
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, -16, ty + th * 0.52, 32, 18, 3);
    ctx.stroke();
    // Drawstrings
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, ty + 4);
    ctx.lineTo(-6, ty + 20);
    ctx.moveTo(5, ty + 4);
    ctx.lineTo(6, ty + 20);
    ctx.stroke();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(-6, ty + 21, 1.5, 0, Math.PI * 2);
    ctx.arc(6, ty + 21, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Logo mark
    if (data?.features?.hasHoodieLogo) {
      ctx.fillStyle = palette.accent || '#FFFFFF';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, ty + 14, 7, 2.5, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if (hoodieStyle === 'zip') {
    // Vertical zipper
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, ty + 2);
    ctx.lineTo(0, ty + th - 3);
    ctx.stroke();
    // Zipper teeth
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 0.5;
    for (let zy = ty + 5; zy < ty + th - 3; zy += 3) {
      ctx.beginPath();
      ctx.moveTo(-1.2, zy);
      ctx.lineTo(1.2, zy);
      ctx.stroke();
    }
    // Pull tab
    ctx.fillStyle = '#C0C0C0';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.8;
    roundRect(ctx, -2, ty + 7, 4, 6, 1.5);
    ctx.fill();
    ctx.stroke();
  } else if (hoodieStyle === 'tee') {
    // Round neckline
    ctx.beginPath();
    ctx.moveTo(-10, ty + 2);
    ctx.quadraticCurveTo(0, ty + 12, 10, ty + 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Collar neckline for hoodie styles
  if (hoodieStyle !== 'tee') {
    ctx.beginPath();
    ctx.moveTo(-9, ty + 2);
    ctx.quadraticCurveTo(0, ty + 9, 9, ty + 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Pant chain
  if (data?.features?.hasPantChain) {
    drawPantChain(ctx, palette.chain || '#C8C8C8');
  }

  ctx.restore();

  return { ty, th, tw };
}

// Pants chain hanging from hip
function drawPantChain(ctx, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.bezierCurveTo(-14, 2, -12, 12, -2, 12);
  ctx.bezierCurveTo(6, 12, 8, 2, 3, -6);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const lx = -3 + t * 6 + Math.sin(t * Math.PI) * (-5);
    const ly = -6 + Math.sin(t * Math.PI) * 18;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(lx, ly, 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ── Per-character hair drawers ────────────────────────────────────────────
// All hair functions now operate in head-local space at the new chibi head scale
// Head center is at origin when these are called.

function drawHairCurly(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  const clusters = [
    [-8, -26, 16], [8, -28, 15], [-18, -20, 13], [18, -20, 13],
    [-2, -34, 14], [0, -18,  12], [-12, -15, 10], [12, -15, 10],
    [-22, -12, 9], [22, -12, 9],
  ];
  for (const [cx, cy, r] of clusters) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHairStraightBangs(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  // Back dome
  ctx.beginPath();
  ctx.ellipse(0, -24, 27, 24, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Bangs strip
  ctx.beginPath();
  ctx.moveTo(-27, -22);
  ctx.quadraticCurveTo(-12, -44, 27, -22);
  ctx.quadraticCurveTo(12, -10, -27, -22);
  ctx.fill();
  ctx.stroke();
  // Side lock
  ctx.beginPath();
  ctx.moveTo(24, -26);
  ctx.lineTo(27, 6);
  ctx.lineTo(17, 6);
  ctx.lineTo(18, -24);
  ctx.fill();
}

function drawHairSpiky(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  const spikes = [
    [-22, -26, -26, -46, -12, -28],
    [-10, -30, -10, -50,   4, -32],
    [  4, -32,   8, -52,  18, -32],
    [ 16, -28,  22, -46,  26, -26],
  ];
  for (const [sx, sy, px, py, ex, ey] of spikes) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(px, py, ex, ey);
    ctx.lineTo(ex - 2, sy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(1, -24, 24, 16, 0, Math.PI, 0);
  ctx.fill();
}

function drawHairWavy(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -24, 26, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, -36);
    ctx.quadraticCurveTo(i * 14 + 5, -26, i * 10, -18);
    ctx.lineWidth = 5;
    ctx.strokeStyle = hairColor;
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
  }
}

function drawHairMediumSweep(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -24, 26, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, -26);
  ctx.quadraticCurveTo(-6, -40, 18, -26);
  ctx.lineTo(18, -18);
  ctx.quadraticCurveTo(-4, -30, -24, -20);
  ctx.closePath();
  ctx.fill();
}

function drawHairStraightSide(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -24, 26, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, -28);
  ctx.lineTo(5, -44);
  ctx.lineTo(27, -28);
  ctx.lineTo(24, -18);
  ctx.lineTo(3, -28);
  ctx.lineTo(-26, -22);
  ctx.closePath();
  ctx.fill();
}

// Big puffy spiky natural (Matteen / Pratik)
function drawHairSpikyNatural(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  // Large base puff
  ctx.beginPath();
  ctx.ellipse(0, -26, 30, 26, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  const spikes = [
    [-20, -38, 11],
    [-8,  -46, 13],
    [5,   -48, 13],
    [18,  -40, 12],
    [-26, -30, 10],
    [26,  -30, 10],
  ];
  for (const [cx, cy, r] of spikes) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Front bang band over forehead
  ctx.beginPath();
  ctx.moveTo(-22, -18);
  ctx.quadraticCurveTo(-10, -12, 0, -16);
  ctx.quadraticCurveTo(12, -12, 22, -18);
  ctx.lineTo(24, -26);
  ctx.lineTo(-24, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHairSpikyBrown(ctx, _skin, hairColor) {
  drawHairSpiky(ctx, _skin, hairColor);
}

function drawHairShortMessy(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -22, 26, 20, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  const tufts = [
    [-14, -34, 9],
    [-3,  -38, 10],
    [12,  -34, 9],
    [-22, -26, 8],
    [22,  -26, 8],
  ];
  for (const [cx, cy, r] of tufts) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHairShortNeat(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -22, 26, 20, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Clean swept front section
  ctx.beginPath();
  ctx.moveTo(-24, -20);
  ctx.quadraticCurveTo(-5, -34, 22, -22);
  ctx.lineTo(24, -16);
  ctx.quadraticCurveTo(2, -26, -24, -16);
  ctx.closePath();
  ctx.fill();
}

function drawHairLongWavy(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20, 30, 26, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Long side strands
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 26, -26);
    ctx.quadraticCurveTo(side * 34, -4, side * 28, 16);
    ctx.lineTo(side * 18, 12);
    ctx.quadraticCurveTo(side * 24, -2, side * 16, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Wavy fringe
  ctx.beginPath();
  ctx.moveTo(-26, -24);
  ctx.quadraticCurveTo(-12, -12, 0, -16);
  ctx.quadraticCurveTo(12, -12, 26, -24);
  ctx.lineTo(26, -12);
  ctx.quadraticCurveTo(0, -2, -26, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ── Per-character accessory drawers ───────────────────────────────────────

function drawGlasses(ctx) {
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(180,220,255,0.35)';
  // Left lens
  ctx.beginPath();
  roundRect(ctx, -20, -14, 16, 12, 2);
  ctx.fill(); ctx.stroke();
  // Right lens
  ctx.beginPath();
  roundRect(ctx, 4, -14, 16, 12, 2);
  ctx.fill(); ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(-4, -8); ctx.lineTo(4, -8);
  ctx.stroke();
  // Temples
  ctx.beginPath();
  ctx.moveTo(-20, -9); ctx.lineTo(-27, -12);
  ctx.moveTo( 20, -9); ctx.lineTo( 27, -12);
  ctx.stroke();
}

function drawBandana(ctx, color1 = '#111', color2 = '#fff') {
  ctx.fillStyle = color1;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -22);
  ctx.quadraticCurveTo(0, -16, 26, -22);
  ctx.quadraticCurveTo(26, -12, 0, -9);
  ctx.quadraticCurveTo(-26, -12, -26, -22);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Pattern dots / lines
  ctx.strokeStyle = color2;
  ctx.lineWidth = 1;
  for (let i = -14; i <= 14; i += 7) {
    ctx.beginPath();
    ctx.moveTo(i, -20);
    ctx.lineTo(i + 2, -12);
    ctx.stroke();
  }
  // Knot at back
  ctx.fillStyle = color1;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(26, -18, 6, 5, 0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
}

function drawNoseRing(ctx) {
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -1, 4, Math.PI * 0.8, Math.PI * 0.2, true);
  ctx.stroke();
}

function drawEarrings(ctx) {
  ctx.fillStyle = '#C0C0C0';
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 24, 0, 3.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}

function drawChain(ctx) {
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 8, 10, -Math.PI * 0.7, Math.PI * 1.7);
  ctx.stroke();
}

// Hood UP over the head (Arthur)
function drawHoodUp(ctx, hoodieColor) {
  ctx.save();
  ctx.fillStyle = hoodieColor || '#1A1A1A';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-30, 6);
  ctx.bezierCurveTo(-38, -24, -26, -52, 0, -52);
  ctx.bezierCurveTo(26, -52, 38, -24, 30, 6);
  ctx.lineTo(24, 4);
  ctx.bezierCurveTo(26, -20, 16, -40, 0, -40);
  ctx.bezierCurveTo(-16, -40, -26, -20, -24, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Shadow inside hood opening
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -16, 22, 26, 0, 0, Math.PI * 2);
  ctx.clip();
  const shade = ctx.createRadialGradient(0, -26, 5, 0, -26, 28);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(-30, -50, 60, 60);
  ctx.restore();
  ctx.restore();
}

function drawMustache(ctx, _headY, color = '#0A0A0A') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, 2);
  ctx.quadraticCurveTo(-4, 5, 0, 4);
  ctx.quadraticCurveTo(4, 5, 8, 2);
  ctx.quadraticCurveTo(4, 8, 0, 7);
  ctx.quadraticCurveTo(-4, 8, -8, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGoatee(ctx, _headY, color = '#0A0A0A') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.quadraticCurveTo(0, 20, 5, 12);
  ctx.quadraticCurveTo(3, 14, 0, 13);
  ctx.quadraticCurveTo(-3, 14, -5, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBrowPiercing(ctx, _headY) {
  ctx.save();
  ctx.fillStyle = '#D8D8D8';
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-14, -16, 2, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── Face drawing ──────────────────────────────────────────────────────────

function _drawFace(ctx, state, palette, data) {
  // headY is now 0 in head-local space; we pass in the translated coords
  const isHit = state === STATE.HIT_STUN || state === STATE.KO_LAUNCH;
  const isAttacking = [
    STATE.LIGHT_NEUTRAL, STATE.LIGHT_SIDE, STATE.LIGHT_UP,
    STATE.HEAVY_SIDE, STATE.SIGNATURE,
  ].includes(state);

  if (isHit) {
    // X eyes
    for (const sx of [-10, 10]) {
      ctx.save();
      ctx.translate(sx, -6);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, -5); ctx.lineTo(5,  5);
      ctx.moveTo( 5, -5); ctx.lineTo(-5, 5);
      ctx.stroke();
      ctx.restore();
    }
    // Open mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 8, 6, 0, Math.PI);
    ctx.stroke();
  } else if (isAttacking) {
    // Squinting determined eyes
    for (const sx of [-10, 10]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(sx, -6, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette?.eye || '#3A2510';
      ctx.beginPath();
      ctx.ellipse(sx + 1, -6, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(sx + 1.2, -6, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Furrowed brow
      ctx.beginPath();
      const browOff = sx < 0 ? 4 : -4;
      ctx.moveTo(sx - 7, -14);
      ctx.lineTo(sx + browOff, -16);
      ctx.strokeStyle = palette?.hair || '#111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // Gritted teeth
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    roundRect(ctx, -7, 5, 14, 7, 2);
    ctx.fill();
    ctx.stroke();
    for (let t = -5; t <= 5; t += 5) {
      ctx.beginPath();
      ctx.moveTo(t, 5); ctx.lineTo(t, 12);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else {
    // Normal chibi eyes — large with sclera, iris, pupil, highlight
    for (const sx of [-10, 10]) {
      // Eye white
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(sx, -6, 7.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Iris
      ctx.fillStyle = palette?.eye || '#3A2510';
      ctx.beginPath();
      ctx.ellipse(sx + 1, -5, 5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(sx + 1.2, -4.5, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight sparkle
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx + 3.5, -7.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 1.5, -5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Upper eyelid
      ctx.beginPath();
      ctx.moveTo(sx - 7, -7);
      ctx.quadraticCurveTo(sx, -11, sx + 7, -7);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Eyebrows
    for (const sx of [-10, 10]) {
      ctx.beginPath();
      ctx.moveTo(sx - 7, -16);
      ctx.quadraticCurveTo(sx, -18, sx + 7, -16);
      ctx.strokeStyle = palette?.hair || '#111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Subtle nose dot
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(0, 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth smile
    const wide = data?.features?.hasSmile ? 9 : 6;
    const drop = data?.features?.hasSmile ? 12 : 9;
    ctx.beginPath();
    ctx.moveTo(-wide, 8);
    ctx.quadraticCurveTo(0, 8 + drop * 0.5, wide, 8);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

// ── Hair style map ────────────────────────────────────────────────────────

function _getHairFn(style) {
  const map = {
    curly:          drawHairCurly,
    straight_bangs: drawHairStraightBangs,
    spiky:          drawHairSpiky,
    spiky_natural:  drawHairSpikyNatural,
    spiky_brown:    drawHairSpikyBrown,
    short_messy:    drawHairShortMessy,
    short_neat:     drawHairShortNeat,
    long_wavy:      drawHairLongWavy,
    wavy:           drawHairWavy,
    medium_sweep:   drawHairMediumSweep,
    straight_side:  drawHairStraightSide,
    medium_brown:   drawHairMediumSweep,
  };
  return map[style] || drawHairMediumSweep;
}

// ── Pose selector ─────────────────────────────────────────────────────────

function _getPose(state, stateFrame, gameFrame) {
  const walkCycle = Math.floor(gameFrame / 6) % 2;
  const runCycle  = Math.floor(gameFrame / 4) % 2;
  const idleBreath = Math.sin(gameFrame * 0.05) * 1.5;

  switch (state) {
    case STATE.IDLE:
      return { ...POSES.idle, bodyY: idleBreath };

    case STATE.WALK:
      return walkCycle === 0 ? POSES.walk1 : POSES.walk2;

    case STATE.RUN:
      return runCycle === 0 ? POSES.run1 : POSES.run2;

    case STATE.JUMP_RISE:
    case STATE.DOUBLE_JUMP:
      return POSES.jumpRise;

    case STATE.JUMP_PEAK:
      return POSES.jumpPeak;

    case STATE.JUMP_FALL:
      return POSES.jumpFall;

    case STATE.LIGHT_NEUTRAL:
      return stateFrame < 4 ? POSES.lightN : POSES.lightN2;

    case STATE.LIGHT_SIDE:
      return POSES.lightS;

    case STATE.LIGHT_UP:
      return POSES.lightU;

    case STATE.LIGHT_DOWN:
      return POSES.lightD;

    case STATE.HEAVY_SIDE:
      return POSES.heavyS;

    case STATE.HEAVY_UP:
      return POSES.heavyU;

    case STATE.HEAVY_DOWN:
      return POSES.heavyD;

    case STATE.AIR_NEUTRAL:
      return POSES.airN;

    case STATE.AIR_FORWARD:
      return POSES.airF;

    case STATE.AIR_BACK:
      return POSES.airB;

    case STATE.AIR_UP:
      return POSES.airU;

    case STATE.AIR_DOWN:
      return POSES.airD;

    case STATE.SIGNATURE:
      return POSES.sig;

    case STATE.SHIELD:
      return POSES.shield;

    case STATE.SPOT_DODGE:
    case STATE.DODGE_ROLL_L:
    case STATE.DODGE_ROLL_R:
      return POSES.dodge;

    case STATE.HIT_STUN:
      return POSES.hitStun;

    case STATE.KO_LAUNCH: {
      const spin = gameFrame * 12;
      return { ...POSES.ko, bodyLean: spin };
    }

    case STATE.SHIELD_BREAK:
      return POSES.shield_break;

    case STATE.LEDGE_HANG:
      return {
        ...POSES.idle,
        lShoulder: -130, rShoulder: -130,
        lKnee: 40, rKnee: 40,
        bodyLean: -15,
      };

    case STATE.RESPAWN: {
      const glow = Math.sin(gameFrame * 0.1) * 0.3 + 0.7;
      return { ...POSES.idle, squishX: glow, squishY: glow };
    }

    case STATE.DASH:
      return { ...POSES.run1 };

    case STATE.WAVEDASH:
      return { ...POSES.idle, bodyLean: 20, lKnee: 25, rKnee: 25 };

    case STATE.GRAB:
      return { ...POSES.lightS, rShoulder: 70, rElbow: -10 };

    case STATE.PARRY:
      return { ...POSES.shield, bodyLean: -20, squishX: 1.15, squishY: 0.85 };

    default:
      return POSES.idle;
  }
}

// ── Debug hitbox overlay ──────────────────────────────────────────────────

function _drawDebugHitboxes(ctx, fighter) {
  const { x, y, facingRight, activeHitboxes, movePhase } = fighter;
  const color =
    movePhase === 'active'   ? 'rgba(255,0,0,0.5)'    :
    movePhase === 'startup'  ? 'rgba(255,255,0,0.5)'  :
                               'rgba(0,100,255,0.5)';

  ctx.save();
  ctx.lineWidth = 2;

  ctx.strokeStyle = color;
  for (const hb of activeHitboxes) {
    const hbx = x + (facingRight ? hb.x : -(hb.x + hb.w));
    const hby = y + hb.y - hb.h;
    ctx.strokeRect(hbx, hby, hb.w, hb.h);
  }

  ctx.strokeStyle = 'rgba(0,255,0,0.4)';
  for (const hurt of (fighter.hurtboxes || [])) {
    const hx = x + (facingRight ? hurt.x : -(hurt.x + hurt.w));
    const hy = y + hurt.y - hurt.h;
    ctx.strokeRect(hx, hy, hurt.w, hurt.h);
  }

  ctx.restore();
}

export function drawDebugBoxes(ctx, fighter) {
  if (!window.DEBUG_HITBOXES) return;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#00FF00';
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 1;
  for (const hurt of (fighter.hurtboxes || [{ x: -18, y: -130, w: 36, h: 130 }])) {
    const wx = fighter.x + (fighter.facingRight ? hurt.x : -(hurt.x + hurt.w));
    const wy = fighter.y + hurt.y;
    ctx.fillRect(wx, wy, hurt.w, hurt.h);
    ctx.strokeRect(wx, wy, hurt.w, hurt.h);
  }
  ctx.restore();

  if (fighter.activeHitboxes && fighter.activeHitboxes.length > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FF0000';
    ctx.strokeStyle = '#FF4400';
    ctx.lineWidth = 2;
    for (const hb of fighter.activeHitboxes) {
      const wx = fighter.x + (fighter.facingRight ? hb.x : -(hb.x + hb.w));
      const wy = fighter.y + hb.y;
      ctx.fillRect(wx, wy, hb.w, hb.h);
      ctx.strokeRect(wx, wy, hb.w, hb.h);
    }
    ctx.restore();

    if (fighter.moveDef) {
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.textAlign = 'center';
      ctx.fillText(fighter.moveDef.name || '?', fighter.x, fighter.y - 145);
      ctx.restore();
    }
  }

  ctx.save();
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fighter.x, fighter.y - 60);
  ctx.lineTo(fighter.x + fighter.vx * 3, fighter.y - 60 + fighter.vy * 3);
  ctx.stroke();
  ctx.restore();
}

// ── Main character draw function ──────────────────────────────────────────

export function drawCharacter(ctx, fighter, gameFrame) {
  const { x, y, facingRight, state, stateFrame, palette, data } = fighter;

  if (!palette) return;

  const pose = _getPose(state, stateFrame, gameFrame);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.82, 0.82); // character size
  if (!facingRight) ctx.scale(-1, 1);
  ctx.scale(pose.squishX, pose.squishY);
  ctx.translate(0, pose.bodyY);

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = C.SHADOW_ALPHA;
  ctx.scale(1, 0.3);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30 * pose.squishX, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Heavy / signature aura
  if (fighter.isHeavyAttacking) {
    drawAura(ctx, palette.aura || '#FF8C00', gameFrame);
  }

  // Invincibility flash — skip drawing every other 4-frame block
  const invFlash = fighter.invincible > 0 && Math.floor(gameFrame / 4) % 2 === 0;
  if (invFlash) {
    ctx.save();
    ctx.globalAlpha = 0.4;
  }

  const lean = toRad(pose.bodyLean);

  // ── BACK LEG ──
  {
    const hipX = -8;
    const hipY = -10;
    const upperAngle = pose.lHip + pose.bodyLean;
    const lowerAngle = upperAngle + pose.lKnee * 0.7;
    const foot = _drawChibiLeg(ctx, hipX, hipY, upperAngle, lowerAngle, palette);
    _drawChibiShoe(ctx, foot.x, foot.y, palette, data, false);
  }

  // ── BACK ARM ──
  {
    const shoulderX = -14;
    const shoulderY = -62;
    _drawChibiArm(ctx, shoulderX, shoulderY, pose.lShoulder + pose.bodyLean, pose.lElbow, palette);
  }

  // ── TORSO ──
  ctx.save();
  ctx.translate(0, -10);
  const { ty, th } = _drawChibiTorso(ctx, lean, palette, data);
  ctx.restore();

  // ── FRONT LEG ──
  {
    const hipX = 8;
    const hipY = -10;
    const upperAngle = pose.rHip + pose.bodyLean;
    const lowerAngle = upperAngle + pose.rKnee * 0.7;
    const foot = _drawChibiLeg(ctx, hipX, hipY, upperAngle, lowerAngle, palette);
    _drawChibiShoe(ctx, foot.x, foot.y, palette, data, true);
  }

  // ── FRONT ARM ──
  let fHandEnd = { x: 0, y: -40 };
  {
    const shoulderX = 14;
    const shoulderY = -62;
    fHandEnd = _drawChibiArm(ctx, shoulderX, shoulderY, pose.rShoulder + pose.bodyLean, pose.rElbow, palette);
  }

  // Weapon held indicator
  if (fighter.currentWeapon) {
    const hw = fighter.currentWeapon;
    ctx.save();
    ctx.globalAlpha = 0.8;
    const wGlow = ctx.createRadialGradient(fHandEnd.x, fHandEnd.y, 2, fHandEnd.x, fHandEnd.y, 20);
    wGlow.addColorStop(0, hw.def.glowColor + 'CC');
    wGlow.addColorStop(1, hw.def.glowColor + '00');
    ctx.fillStyle = wGlow;
    ctx.beginPath();
    ctx.arc(fHandEnd.x, fHandEnd.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Attack slash trail
  if (fighter.isHeavyAttacking && fighter.stateFrame < 12) {
    const trailAlpha = (1 - fighter.stateFrame / 12) * 0.6;
    ctx.save();
    ctx.globalAlpha = trailAlpha;
    const trailLength = 60;
    const trailGrad = ctx.createLinearGradient(-trailLength, -80, trailLength, -80);
    const auraC = palette.aura || '#FF8C00';
    trailGrad.addColorStop(0, auraC + '00');
    trailGrad.addColorStop(0.5, auraC + 'DD');
    trailGrad.addColorStop(1, auraC + '00');
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-trailLength, -80);
    ctx.quadraticCurveTo(0, -100, trailLength, -80);
    ctx.stroke();
    ctx.restore();
  }

  // ── NECK ──
  ctx.save();
  ctx.rotate(lean * 0.5);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, -70, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.beginPath();
  ctx.ellipse(0, -70, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── HEAD ──
  // Head center at y = -122 for chibi proportions
  const headY = -122;
  ctx.save();
  ctx.rotate(lean * 0.45 + toRad(pose.headNod));
  ctx.translate(0, headY);

  // Head outline
  ctx.beginPath();
  ctx.ellipse(0, 0, 23, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Skin base
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();

  // Cel-shading highlight on head
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 24, 0, 0, Math.PI * 2);
  ctx.clip();
  const headHL = ctx.createRadialGradient(-9, -10, 0, 0, 0, 24);
  headHL.addColorStop(0, 'rgba(255,255,255,0.38)');
  headHL.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  headHL.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = headHL;
  ctx.fillRect(-26, -28, 52, 56);
  ctx.restore();

  // Ear (right side, slightly forward)
  ctx.beginPath();
  ctx.arc(20, 0, 8, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner ear
  ctx.beginPath();
  ctx.arc(20, 0, 5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Face (drawn in head-local coords — headY is 0 here)
  _drawFace(ctx, state, palette, data);

  // Hair
  const hoodUp = !!data?.features?.hasHoodUp;
  if (!hoodUp) {
    const hairFn = _getHairFn(data?.features?.hairStyle || 'medium_sweep');
    hairFn(ctx, palette.skin, palette.hair || '#111');
  } else {
    // Bangs peeking under the hood
    ctx.fillStyle = palette.hair || '#111';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.quadraticCurveTo(-5, -18, 7, -14);
    ctx.quadraticCurveTo(14, -12, 16, -10);
    ctx.lineTo(10, -6);
    ctx.quadraticCurveTo(-2, -10, -16, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Hood up over head
  if (hoodUp) {
    drawHoodUp(ctx, palette.outfit1);
  }

  // Accessories
  if (data?.features?.hasGlasses)       drawGlasses(ctx);
  if (data?.features?.hasBandana)       drawBandana(ctx, palette.bandana1, palette.bandana2);
  if (data?.features?.hasNoseRing)      drawNoseRing(ctx);
  if (data?.features?.hasEarrings)      drawEarrings(ctx);
  if (data?.features?.hasChain)         drawChain(ctx);
  if (data?.features?.hasBrowPiercing)  drawBrowPiercing(ctx, 0);
  if (data?.features?.hasMustache)      drawMustache(ctx, 0, palette.facialHair || palette.hair);
  if (data?.features?.hasGoatee)        drawGoatee(ctx, 0, palette.facialHair || palette.hair);

  ctx.restore(); // head translate + rotation

  // Shield bubble
  if (fighter.isShielding && fighter.shieldHP > 0) {
    const sSize = lerp(C.SHIELD_SIZE_MIN, C.SHIELD_SIZE_MAX, fighter.shieldHP / 100);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const sGrad = ctx.createRadialGradient(0, -65, 5, 0, -65, sSize);
    const auraHex = palette.aura || '#00BFFF';
    sGrad.addColorStop(0, auraHex + '88');
    sGrad.addColorStop(1, auraHex + '11');
    ctx.fillStyle = sGrad;
    ctx.strokeStyle = auraHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -65, sSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (invFlash) ctx.restore(); // invincibility alpha restore

  ctx.restore(); // main transform

  if (typeof window !== 'undefined' && window.DEBUG_HITBOXES && fighter.activeHitboxes?.length > 0) {
    _drawDebugHitboxes(ctx, fighter);
  }
}

// ── Portrait drawing (HUD / character select) ─────────────────────────────

export function drawPortrait(ctx, charData, cx, cy, size = 50) {
  const p = charData.palette;
  const features = charData.features || {};
  ctx.save();
  ctx.translate(cx, cy);
  // Portrait shows head + top of hoodie; scale so head fills most of the portrait box
  const scale = size / 60;
  ctx.scale(scale, scale);

  // Top of hoodie peeking at bottom — simplified trapezoid
  const tw = 44;
  const bw = 34;
  const hoodieTy = 30;
  const hoodieH = 22;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, hoodieTy + hoodieH);
  ctx.lineTo(-bw / 2, hoodieTy + hoodieH);
  ctx.lineTo(-tw / 2, hoodieTy);
  ctx.lineTo(tw / 2, hoodieTy);
  ctx.lineTo(bw / 2, hoodieTy + hoodieH);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 1, hoodieTy + hoodieH);
  ctx.lineTo(-bw / 2 + 1, hoodieTy + hoodieH);
  ctx.lineTo(-tw / 2 + 1, hoodieTy + 1);
  ctx.lineTo(tw / 2 - 1, hoodieTy + 1);
  ctx.lineTo(bw / 2 - 1, hoodieTy + hoodieH);
  ctx.closePath();
  ctx.fillStyle = p?.outfit1 || '#444';
  ctx.fill();

  // Neck
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 22, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p?.skin || '#C68642';
  ctx.beginPath();
  ctx.ellipse(0, 22, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head outline
  ctx.beginPath();
  ctx.ellipse(0, 0, 23, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Skin base
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = p?.skin || '#C68642';
  ctx.fill();

  // Cel highlight on head
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 24, 0, 0, Math.PI * 2);
  ctx.clip();
  const headHL = ctx.createRadialGradient(-9, -10, 0, 0, 0, 24);
  headHL.addColorStop(0, 'rgba(255,255,255,0.35)');
  headHL.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = headHL;
  ctx.fillRect(-26, -28, 52, 56);
  ctx.restore();

  // Ear
  ctx.beginPath();
  ctx.arc(20, 0, 8, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fillStyle = p?.skin || '#C68642';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hair (or hood)
  const hoodUp = !!features.hasHoodUp;
  if (!hoodUp) {
    const hairFn = _getHairFn(features.hairStyle || 'medium_sweep');
    hairFn(ctx, p?.skin, p?.hair || '#111');
  }

  // Eyes (simplified but with sclera + iris)
  for (const sx of [-10, 10]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(sx, -6, 7, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = p?.eye || '#3A2510';
    ctx.beginPath();
    ctx.ellipse(sx + 1, -5, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + 1.2, -4.5, 2.8, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx + 3, -7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyelid
    ctx.beginPath();
    ctx.moveTo(sx - 7, -7);
    ctx.quadraticCurveTo(sx, -11, sx + 7, -7);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Eyebrows
  for (const sx of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(sx - 7, -16);
    ctx.quadraticCurveTo(sx, -18, sx + 7, -16);
    ctx.strokeStyle = p?.hair || '#111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Smile
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.quadraticCurveTo(0, 12, 6, 8);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Hood over head
  if (hoodUp) drawHoodUp(ctx, p?.outfit1);

  // Accessories
  if (features.hasGlasses)       drawGlasses(ctx);
  if (features.hasBandana)       drawBandana(ctx, p?.bandana1, p?.bandana2);
  if (features.hasNoseRing)      drawNoseRing(ctx);
  if (features.hasEarrings)      drawEarrings(ctx);
  if (features.hasBrowPiercing)  drawBrowPiercing(ctx, 0);
  if (features.hasMustache)      drawMustache(ctx, 0, p?.facialHair || p?.hair);
  if (features.hasGoatee)        drawGoatee(ctx, 0, p?.facialHair || p?.hair);

  ctx.restore();
}
