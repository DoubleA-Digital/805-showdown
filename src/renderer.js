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
  run2:    { ...REST_POSE, bodyLean: 18, lShoulder:  55, rShoulder: -70, lHip: -30, lKnee:  8, rHip:  40, rKnee: 25 },
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

function drawOutlined(ctx, drawFn, fillColor, strokeColor = '#000', lineW = C.OUTLINE_THICK) {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineW;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawFn();
  ctx.stroke();
  ctx.fillStyle = fillColor;
  drawFn();
  ctx.fill();
}

// Draws a filled, outlined capsule between two points with tapered radii
// Returns the end point { x, y }
function drawTaperedLimb(ctx, x1, y1, x2, y2, r1, r2, fillColor, doHighlight = true) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const outR1 = r1 + 2.5, outR2 = r2 + 2.5;
  const a1 = Math.atan2(ny, nx);
  const a2 = Math.atan2(-ny, -nx);

  // Outline pass (black, slightly larger)
  ctx.beginPath();
  ctx.moveTo(x1 + nx * outR1, y1 + ny * outR1);
  ctx.lineTo(x2 + nx * outR2, y2 + ny * outR2);
  ctx.arc(x2, y2, outR2, a1, a1 + Math.PI);
  ctx.lineTo(x1 - nx * outR1, y1 - ny * outR1);
  ctx.arc(x1, y1, outR1, a2, a2 + Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  // Main color fill
  ctx.beginPath();
  ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
  ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
  ctx.arc(x2, y2, r2, a1, a1 + Math.PI);
  ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
  ctx.arc(x1, y1, r1, a2, a2 + Math.PI);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Cel highlight streak (top/upper edge)
  if (doHighlight) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1 + nx * r1 * 0.5, y1 + ny * r1 * 0.5);
    ctx.lineTo(x2 + nx * r2 * 0.5, y2 + ny * r2 * 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = Math.max(1.2, Math.min(r1, r2) * 0.55);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  return { x: x2, y: y2 };
}

// ── Aura effect for heavy / signature attacks ─────────────────────────────

function drawAura(ctx, auraColor, frame) {
  const alpha = 0.5 + Math.sin(frame * 0.3) * 0.3;
  const size  = 40  + Math.sin(frame * 0.2) * 8;
  ctx.save();
  const grad = ctx.createRadialGradient(0, -35, 5, 0, -35, size);
  grad.addColorStop(0, auraColor + 'CC');
  grad.addColorStop(1, auraColor + '00');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, -35, size * 0.7, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Per-character hair drawers ────────────────────────────────────────────

function drawHairCurly(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  const clusters = [
    [-6, -20, 13], [6, -22, 12], [-14, -16, 10], [14, -16, 10],
    [-2, -26, 11], [0, -14,  9], [-10, -12,  8], [10, -12,  8],
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
  // Back of head
  ctx.beginPath();
  ctx.ellipse(0, -20, 22, 20, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Bangs strip
  ctx.beginPath();
  ctx.moveTo(-22, -18);
  ctx.quadraticCurveTo(-10, -36, 22, -18);
  ctx.quadraticCurveTo(10, -8, -22, -18);
  ctx.fill();
  ctx.stroke();
  // Side lock
  ctx.beginPath();
  ctx.moveTo(20, -22);
  ctx.lineTo(22, 5);
  ctx.lineTo(14, 5);
  ctx.lineTo(16, -20);
  ctx.fill();
}

function drawHairSpiky(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  const spikes = [
    [-18, -22, -22, -38, -10, -24],
    [ -8, -26,  -8, -42,   2, -28],
    [  2, -28,   6, -44,  14, -28],
    [ 12, -24,  18, -38,  20, -22],
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
  // Base hair cap
  ctx.beginPath();
  ctx.ellipse(1, -20, 20, 14, 0, Math.PI, 0);
  ctx.fill();
}

function drawHairWavy(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20, 22, 18, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Wavy front locks
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, -30);
    ctx.quadraticCurveTo(i * 12 + 4, -22, i * 8, -16);
    ctx.lineWidth = 4;
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
  ctx.ellipse(0, -20, 22, 18, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Swept front section
  ctx.beginPath();
  ctx.moveTo(-20, -22);
  ctx.quadraticCurveTo(-5, -34, 15, -22);
  ctx.lineTo(15, -16);
  ctx.quadraticCurveTo(-2, -26, -20, -18);
  ctx.closePath();
  ctx.fill();
}

function drawHairStraightSide(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20, 22, 18, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Side part with longer section
  ctx.beginPath();
  ctx.moveTo(-20, -24);
  ctx.lineTo(4, -36);
  ctx.lineTo(22, -24);
  ctx.lineTo(20, -16);
  ctx.lineTo(2, -24);
  ctx.lineTo(-22, -20);
  ctx.closePath();
  ctx.fill();
}

function drawHairMohawk(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  // Left base
  ctx.beginPath();
  ctx.moveTo(-22, -14);
  ctx.lineTo(-18, -26);
  ctx.lineTo(-4, -24);
  ctx.lineTo(-4, -14);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Right base
  ctx.beginPath();
  ctx.moveTo(22, -14);
  ctx.lineTo(18, -26);
  ctx.lineTo(4, -24);
  ctx.lineTo(4, -14);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Center spike
  ctx.beginPath();
  ctx.moveTo(-5, -28);
  ctx.lineTo(0, -46);
  ctx.lineTo(5, -28);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Wider spike body
  ctx.beginPath();
  ctx.moveTo(-7, -24);
  ctx.lineTo(-1, -42);
  ctx.lineTo(1, -42);
  ctx.lineTo(7, -24);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawHairMediumBrown(ctx, _skin, hairColor) {
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(2, -20, 22, 18, 0.05, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Longer side strands
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -18);
    ctx.quadraticCurveTo(side * 26, -4, side * 22, 6);
    ctx.lineTo(side * 16, 4);
    ctx.quadraticCurveTo(side * 18, -4, side * 14, -16);
    ctx.closePath();
    ctx.fill();
  }
}

// ── Per-character accessory drawers ───────────────────────────────────────

function drawGlasses(ctx) {
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(180,220,255,0.35)';
  // Left lens
  ctx.beginPath();
  roundRect(ctx, -18, -12, 14, 10, 2);
  ctx.fill(); ctx.stroke();
  // Right lens
  ctx.beginPath();
  roundRect(ctx, 4, -12, 14, 10, 2);
  ctx.fill(); ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(-4, -7); ctx.lineTo(4, -7);
  ctx.stroke();
  // Temples
  ctx.beginPath();
  ctx.moveTo(-18, -8); ctx.lineTo(-24, -10);
  ctx.moveTo( 18, -8); ctx.lineTo( 24, -10);
  ctx.stroke();
}

function drawBandana(ctx, color1 = '#111', color2 = '#fff') {
  ctx.fillStyle = color1;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, -18);
  ctx.quadraticCurveTo(0, -14, 22, -18);
  ctx.quadraticCurveTo(22, -10, 0, -8);
  ctx.quadraticCurveTo(-22, -10, -22, -18);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Pattern lines
  ctx.strokeStyle = color2;
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -16);
    ctx.lineTo(i + 2, -10);
    ctx.stroke();
  }
  // Knot at back
  ctx.fillStyle = color1;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(22, -15, 5, 4, 0.3, 0, Math.PI * 2);
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
    ctx.arc(side * 22, 0, 3, 0, Math.PI * 2);
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

// ── Main character draw function ──────────────────────────────────────────

export function drawCharacter(ctx, fighter, gameFrame) {
  const { x, y, facingRight, state, stateFrame, palette, data } = fighter;

  if (!palette) return;

  const pose = _getPose(state, stateFrame, gameFrame);

  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);
  ctx.scale(pose.squishX, pose.squishY);
  ctx.translate(0, pose.bodyY);

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = C.SHADOW_ALPHA;
  ctx.scale(1, 0.3);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 * pose.squishX, 8, 0, 0, Math.PI * 2);
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

  // === Body parts — back to front ===
  const lean = toRad(pose.bodyLean);
  const th = C.TORSO_H;

  // Back leg
  const backHipPt = { x: -7, y: -8 };
  const bKneeAng  = pose.lHip + pose.bodyLean;
  const bKneeEnd  = limbEndpoint(backHipPt.x, backHipPt.y, C.LEG_UPPER, bKneeAng);
  drawTaperedLimb(ctx, backHipPt.x, backHipPt.y, bKneeEnd.x, bKneeEnd.y, 9, 7, palette.outfit2 || '#333');
  const bFootEnd = limbEndpoint(bKneeEnd.x, bKneeEnd.y, C.LEG_LOWER, bKneeAng + pose.lKnee * 0.7);
  drawTaperedLimb(ctx, bKneeEnd.x, bKneeEnd.y, bFootEnd.x, bFootEnd.y, 7, 5, palette.shoes || '#222');
  // Foot cap
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(bFootEnd.x + 3, bFootEnd.y, 8, 5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bFootEnd.x + 3, bFootEnd.y, 7, 4, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = palette.shoes || '#222';
  ctx.fill();
  ctx.restore();

  // Back arm
  const backShoulderPt = { x: -10, y: -35 };
  const bElbowEnd = limbEndpoint(backShoulderPt.x, backShoulderPt.y, C.ARM_UPPER, pose.lShoulder + pose.bodyLean);
  drawTaperedLimb(ctx, backShoulderPt.x, backShoulderPt.y, bElbowEnd.x, bElbowEnd.y, 8, 6, palette.outfit1 || '#888');
  const bHandEnd = limbEndpoint(bElbowEnd.x, bElbowEnd.y, C.ARM_LOWER, pose.lShoulder + pose.lElbow + pose.bodyLean);
  drawTaperedLimb(ctx, bElbowEnd.x, bElbowEnd.y, bHandEnd.x, bHandEnd.y, 6, 5, palette.skin || '#C68642');
  // Back hand
  ctx.save();
  ctx.beginPath();
  ctx.arc(bHandEnd.x, bHandEnd.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bHandEnd.x, bHandEnd.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();
  ctx.restore();

  // Torso
  ctx.save();
  ctx.rotate(lean);

  const tw = C.TORSO_W + 4;
  const torsoTop = -th - 8;

  // Outer outline
  ctx.beginPath();
  ctx.roundRect(-tw/2 - 2, torsoTop - 2, tw + 4, th + 4, 8);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Main torso fill
  ctx.beginPath();
  ctx.roundRect(-tw/2, torsoTop, tw, th, 6);
  ctx.fillStyle = palette.outfit1 || '#888';
  ctx.fill();

  // Cel highlight
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-tw/2, torsoTop, tw, th, 6);
  ctx.clip();
  const torsoHighlight = ctx.createLinearGradient(-tw/2, torsoTop, tw/2, torsoTop + th * 0.5);
  torsoHighlight.addColorStop(0, 'rgba(255,255,255,0.22)');
  torsoHighlight.addColorStop(0.4, 'rgba(255,255,255,0.08)');
  torsoHighlight.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = torsoHighlight;
  ctx.beginPath();
  ctx.roundRect(-tw/2, torsoTop, tw, th, 6);
  ctx.fill();
  ctx.restore();

  // Collar / neckline detail
  ctx.beginPath();
  ctx.moveTo(-8, torsoTop + 2);
  ctx.quadraticCurveTo(0, torsoTop + 8, 8, torsoTop + 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Per-character outfit detail
  if (data?.name) _drawOutfitDetail(ctx, data.name.toLowerCase(), palette, torsoTop, tw, th);

  ctx.restore();

  // Front leg
  const frontHipPt = { x: 7, y: -8 };
  const fKneeAng   = pose.rHip + pose.bodyLean;
  const fKneeEnd   = limbEndpoint(frontHipPt.x, frontHipPt.y, C.LEG_UPPER, fKneeAng);
  drawTaperedLimb(ctx, frontHipPt.x, frontHipPt.y, fKneeEnd.x, fKneeEnd.y, 10, 8, palette.outfit2 || '#333');
  const fFootEnd = limbEndpoint(fKneeEnd.x, fKneeEnd.y, C.LEG_LOWER, fKneeAng + pose.rKnee * 0.7);
  drawTaperedLimb(ctx, fKneeEnd.x, fKneeEnd.y, fFootEnd.x, fFootEnd.y, 8, 6, palette.shoes || '#222');
  // Foot cap
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(fFootEnd.x + 3, fFootEnd.y, 9, 5.5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(fFootEnd.x + 3, fFootEnd.y, 8, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = palette.shoes || '#222';
  ctx.fill();
  ctx.restore();

  // Front arm
  const frontShoulderPt = { x: 10, y: -35 };
  const fElbowEnd = limbEndpoint(frontShoulderPt.x, frontShoulderPt.y, C.ARM_UPPER, pose.rShoulder + pose.bodyLean);
  drawTaperedLimb(ctx, frontShoulderPt.x, frontShoulderPt.y, fElbowEnd.x, fElbowEnd.y, 9, 7, palette.outfit1 || '#888');
  const fHandEnd = limbEndpoint(fElbowEnd.x, fElbowEnd.y, C.ARM_LOWER, pose.rShoulder + pose.rElbow + pose.bodyLean);
  drawTaperedLimb(ctx, fElbowEnd.x, fElbowEnd.y, fHandEnd.x, fHandEnd.y, 7, 5, palette.skin || '#C68642');
  // Front hand (fist)
  ctx.save();
  ctx.beginPath();
  ctx.arc(fHandEnd.x, fHandEnd.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fHandEnd.x, fHandEnd.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();
  ctx.restore();

  // Draw held weapon indicator
  if (fighter.currentWeapon) {
    const hw = fighter.currentWeapon;
    ctx.save();
    const wEnd = limbEndpoint(fElbowEnd.x, fElbowEnd.y, C.ARM_LOWER, pose.rShoulder + pose.rElbow + pose.bodyLean);
    ctx.globalAlpha = 0.8;
    const wGlow = ctx.createRadialGradient(wEnd.x, wEnd.y, 2, wEnd.x, wEnd.y, 18);
    wGlow.addColorStop(0, hw.def.glowColor + 'CC');
    wGlow.addColorStop(1, hw.def.glowColor + '00');
    ctx.fillStyle = wGlow;
    ctx.beginPath();
    ctx.arc(wEnd.x, wEnd.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Attack slash trail effect
  if (fighter.isHeavyAttacking && fighter.stateFrame < 12) {
    const trailAlpha = (1 - fighter.stateFrame / 12) * 0.6;
    ctx.save();
    ctx.globalAlpha = trailAlpha;
    const trailLength = 55;
    const trailGrad = ctx.createLinearGradient(-trailLength, -50, trailLength, -50);
    const auraC = palette.aura || '#FF8C00';
    trailGrad.addColorStop(0, auraC + '00');
    trailGrad.addColorStop(0.5, auraC + 'DD');
    trailGrad.addColorStop(1, auraC + '00');
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-trailLength, -50);
    ctx.quadraticCurveTo(0, -70, trailLength, -50);
    ctx.stroke();
    ctx.restore();
  }

  // Head
  const headY = -(th + 8) - C.HEAD_RADIUS - 2 + pose.bodyY * 0.3;
  ctx.save();
  ctx.rotate(lean * 0.5 + toRad(pose.headNod));

  const hr = C.HEAD_RADIUS;

  // Outer black outline
  ctx.beginPath();
  ctx.ellipse(0, headY, hr + 3, hr * 1.05 + 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Skin base
  ctx.beginPath();
  ctx.ellipse(0, headY, hr, hr * 1.05, 0, 0, Math.PI * 2);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();

  // Cel-shading: top highlight
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, headY, hr, hr * 1.05, 0, 0, Math.PI * 2);
  ctx.clip();
  const headHighlight = ctx.createRadialGradient(-hr*0.3, headY - hr*0.4, 0, 0, headY, hr);
  headHighlight.addColorStop(0, 'rgba(255,255,255,0.35)');
  headHighlight.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  headHighlight.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = headHighlight;
  ctx.fillRect(-hr - 5, headY - hr - 5, (hr + 5) * 2, (hr * 1.05 + 5) * 2);
  ctx.restore();

  // Ear
  ctx.beginPath();
  ctx.arc(hr - 4, headY, 7, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fillStyle = palette.skin || '#C68642';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hr - 4, headY, 7, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner ear
  ctx.beginPath();
  ctx.arc(hr - 4, headY, 4, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Face
  _drawFace(ctx, headY, state, palette);

  // Hair
  const hairFn = _getHairFn(data?.features?.hairStyle || 'medium_sweep');
  ctx.save();
  ctx.translate(0, headY);
  hairFn(ctx, palette.skin, palette.hair || '#111');

  // Accessories
  if (data?.features?.hasGlasses)  drawGlasses(ctx);
  if (data?.features?.hasBandana)  drawBandana(ctx, palette.bandana1, palette.bandana2);
  if (data?.features?.hasNoseRing) drawNoseRing(ctx);
  if (data?.features?.hasEarrings) drawEarrings(ctx);
  if (data?.features?.hasChain)    drawChain(ctx);
  ctx.restore(); // hair + accessories

  ctx.restore(); // head rotation

  // Shield bubble
  if (fighter.isShielding && fighter.shieldHP > 0) {
    const sSize = lerp(C.SHIELD_SIZE_MIN, C.SHIELD_SIZE_MAX, fighter.shieldHP / 100);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const sGrad = ctx.createRadialGradient(0, -35, 5, 0, -35, sSize);
    const auraHex = palette.aura || '#00BFFF';
    sGrad.addColorStop(0, auraHex + '88');
    sGrad.addColorStop(1, auraHex + '11');
    ctx.fillStyle = sGrad;
    ctx.strokeStyle = auraHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -35, sSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (invFlash) ctx.restore(); // invincibility alpha restore

  ctx.restore(); // main transform

  // Debug hitbox overlay
  if (typeof window !== 'undefined' && window.DEBUG_HITBOXES && fighter.activeHitboxes?.length > 0) {
    _drawDebugHitboxes(ctx, fighter);
  }
}

// ── Face drawing ──────────────────────────────────────────────────────────

function _drawFace(ctx, headY, state, palette) {
  const isHit = state === STATE.HIT_STUN || state === STATE.KO_LAUNCH;
  const isAttacking = [
    STATE.LIGHT_NEUTRAL, STATE.LIGHT_SIDE, STATE.LIGHT_UP,
    STATE.HEAVY_SIDE, STATE.SIGNATURE,
  ].includes(state);

  if (isHit) {
    // X eyes
    for (const sx of [-8, 8]) {
      ctx.save();
      ctx.translate(sx, headY - 5);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -4); ctx.lineTo(4,  4);
      ctx.moveTo( 4, -4); ctx.lineTo(-4, 4);
      ctx.stroke();
      ctx.restore();
    }
  } else if (isAttacking) {
    // Determined, squinting eyes
    for (const sx of [-8, 8]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(sx, headY - 5, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette?.eye || '#3A2510';
      ctx.beginPath();
      ctx.ellipse(sx + 1, headY - 5, 4, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(sx + 1.2, headY - 5, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brow furrow
      ctx.beginPath();
      const browOff = sx < 0 ? 3 : -3;
      ctx.moveTo(sx - 6, headY - 11);
      ctx.lineTo(sx + browOff, headY - 13);
      ctx.strokeStyle = palette?.hair || '#111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // Gritted teeth
    ctx.beginPath();
    ctx.moveTo(-6, headY + 4);
    ctx.lineTo(6, headY + 4);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let t = -4; t <= 4; t += 4) {
      ctx.beginPath();
      ctx.moveTo(t, headY + 4);
      ctx.lineTo(t, headY + 7);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else {
    // Detailed eyes with whites, iris, pupil, and highlight
    for (const sx of [-8, 8]) {
      // Eye white
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(sx, headY - 5, 6.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Iris (colored)
      ctx.fillStyle = palette?.eye || '#3A2510';
      ctx.beginPath();
      ctx.ellipse(sx + 1, headY - 4, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(sx + 1.2, headY - 3.8, 2.8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight sparkle (top-right of eye)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx + 3, headY - 6.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 1.5, headY - 4.5, 1, 0, Math.PI * 2);
      ctx.fill();

      // Upper eyelid line
      ctx.beginPath();
      ctx.moveTo(sx - 6, headY - 6);
      ctx.quadraticCurveTo(sx, headY - 9, sx + 6, headY - 6);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Eyebrows
    for (const sx of [-8, 8]) {
      ctx.beginPath();
      ctx.moveTo(sx - 6, headY - 13);
      ctx.quadraticCurveTo(sx, headY - 15, sx + 6, headY - 13);
      ctx.strokeStyle = palette?.hair || '#111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Slight mouth (small satisfied smile)
    ctx.beginPath();
    ctx.moveTo(-5, headY + 5);
    ctx.quadraticCurveTo(0, headY + 8, 5, headY + 5);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Mouth for hit state
  if (isHit) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, headY + 6, 5, 0, Math.PI);
    ctx.stroke();
  }
}

// ── Per-character outfit chest details ────────────────────────────────────

function _drawOutfitDetail(ctx, charName, palette, torsoTop, tw, th) {
  ctx.save();
  switch (charName) {
    case 'ram':
      // Gold chain arc on white tee
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, torsoTop + th * 0.36, 8, -Math.PI * 0.65, Math.PI * 1.65); ctx.stroke();
      // Chain links
      ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.arc(i * 3.5, torsoTop + th * 0.36 + 7, 2, 0, Math.PI * 2); ctx.stroke();
      }
      break;

    case 'arthur':
      // Hoodie drawstring cords
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, torsoTop + 4); ctx.lineTo(-5, torsoTop + 20);
      ctx.moveTo(3, torsoTop + 4); ctx.lineTo(5, torsoTop + 20);
      ctx.stroke();
      // Front kangaroo pocket
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-12, torsoTop + th * 0.52, 24, 14, 3); ctx.fill(); ctx.stroke();
      break;

    case 'matteen':
      // Leather jacket lapels (V-shape opening)
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 2, torsoTop + 1);
      ctx.lineTo(0, torsoTop + th * 0.44);
      ctx.lineTo(-tw / 2 + 2, torsoTop + th * 0.52);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tw / 2 - 2, torsoTop + 1);
      ctx.lineTo(0, torsoTop + th * 0.44);
      ctx.lineTo(tw / 2 - 2, torsoTop + th * 0.52);
      ctx.closePath(); ctx.fill();
      // Red accent stripe across left shoulder
      ctx.fillStyle = '#CC2222';
      ctx.fillRect(-tw / 2, torsoTop, tw, 4);
      // Center button row
      ctx.fillStyle = '#333'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      for (let b = 0; b < 3; b++) {
        ctx.beginPath(); ctx.arc(0, torsoTop + th * 0.55 + b * 6, 1.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      break;

    case 'ajay':
      // Flannel plaid crosshatch on red
      ctx.save();
      ctx.beginPath(); ctx.roundRect(-tw / 2, torsoTop, tw, th, 6); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1;
      for (let px = -tw / 2; px < tw / 2; px += 6) {
        ctx.beginPath(); ctx.moveTo(px, torsoTop); ctx.lineTo(px, torsoTop + th); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
      for (let py = torsoTop; py < torsoTop + th; py += 8) {
        ctx.beginPath(); ctx.moveTo(-tw / 2, py); ctx.lineTo(tw / 2, py); ctx.stroke();
      }
      ctx.restore();
      break;

    case 'cameron':
      // SANTOS text on chest
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 6px "Arial Black", Arial';
      ctx.textAlign = 'center'; ctx.fillText('SANTOS', 0, torsoTop + th * 0.3);
      // Front hoodie pocket
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-13, torsoTop + th * 0.52, 26, 14, 3); ctx.fill(); ctx.stroke();
      break;

    case 'aarush':
      // Kangaroo pocket with divider
      ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-14, torsoTop + th * 0.48, 28, 17, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, torsoTop + th * 0.48); ctx.lineTo(0, torsoTop + th * 0.48 + 17); ctx.stroke();
      break;

    case 'pratik':
      // Vintage graphic circle print on dark tee
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, torsoTop + th * 0.38, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = 'bold 5px Arial'; ctx.textAlign = 'center';
      ctx.fillText('805', 0, torsoTop + th * 0.41);
      break;

    case 'mathew':
      // Track jacket center zipper
      ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(0, torsoTop + 3); ctx.lineTo(0, torsoTop + th - 4); ctx.stroke();
      ctx.setLineDash([]);
      // Side color stripes
      ctx.fillStyle = palette.aura || '#FFE000'; ctx.globalAlpha = 0.45;
      ctx.fillRect(tw / 2 - 7, torsoTop + 4, 5, th - 8);
      ctx.fillRect(-tw / 2 + 2, torsoTop + 4, 5, th - 8);
      ctx.globalAlpha = 1;
      break;

    case 'harshith':
      // Oversized hoodie front pocket
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-15, torsoTop + th * 0.5, 30, 16, 3); ctx.fill(); ctx.stroke();
      // Gold chain hint
      ctx.strokeStyle = 'rgba(255,215,0,0.45)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, torsoTop + th * 0.26, 7, -Math.PI * 0.6, Math.PI * 1.6); ctx.stroke();
      break;

    default:
      break;
  }
  ctx.restore();
}

// ── Hair style map ────────────────────────────────────────────────────────

function _getHairFn(style) {
  const map = {
    curly:          drawHairCurly,
    straight_bangs: drawHairStraightBangs,
    spiky:          drawHairSpiky,
    wavy:           drawHairWavy,
    medium_sweep:   drawHairMediumSweep,
    straight_side:  drawHairStraightSide,
    mohawk:         drawHairMohawk,
    medium_brown:   drawHairMediumBrown,
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
      // Spinning tumble
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

  // Active hitboxes
  ctx.strokeStyle = color;
  for (const hb of activeHitboxes) {
    const hbx = x + (facingRight ? hb.x : -(hb.x + hb.w));
    const hby = y + hb.y - hb.h;
    ctx.strokeRect(hbx, hby, hb.w, hb.h);
  }

  // Hurtboxes
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

  // Draw hurtbox (green, semi-transparent)
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#00FF00';
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 1;
  for (const hurt of (fighter.hurtboxes || [{ x: -18, y: -75, w: 36, h: 75 }])) {
    const wx = fighter.x + (fighter.facingRight ? hurt.x : -(hurt.x + hurt.w));
    const wy = fighter.y + hurt.y;
    ctx.fillRect(wx, wy, hurt.w, hurt.h);
    ctx.strokeRect(wx, wy, hurt.w, hurt.h);
  }
  ctx.restore();

  // Draw active hitboxes (red, semi-transparent)
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

    // Label active move
    if (fighter.moveDef) {
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.textAlign = 'center';
      ctx.fillText(fighter.moveDef.name || '?', fighter.x, fighter.y - 95);
      ctx.restore();
    }
  }

  // Draw velocity vector
  ctx.save();
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fighter.x, fighter.y - 40);
  ctx.lineTo(fighter.x + fighter.vx * 3, fighter.y - 40 + fighter.vy * 3);
  ctx.stroke();
  ctx.restore();
}

// ── Portrait drawing (HUD / character select) ─────────────────────────────

export function drawPortrait(ctx, charData, cx, cy, size = 50) {
  const p = charData.palette;
  ctx.save();
  ctx.translate(cx, cy);
  const scale = size / 80;
  ctx.scale(scale, scale);

  // Head
  ctx.fillStyle = p?.skin || '#C68642';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 32, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Hair
  const hairFn = _getHairFn(charData.features?.hairStyle || 'medium_sweep');
  hairFn(ctx, p?.skin, p?.hair);

  // Eyes
  ctx.fillStyle = '#fff';
  for (const sx of [-9, 9]) {
    ctx.beginPath();
    ctx.ellipse(sx, -6, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p?.eye || '#3A2510';
    ctx.beginPath();
    ctx.ellipse(sx + 1, -5, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Accessories
  if (charData.features?.hasGlasses)  drawGlasses(ctx);
  if (charData.features?.hasBandana)  drawBandana(ctx, p?.bandana1, p?.bandana2);
  if (charData.features?.hasNoseRing) drawNoseRing(ctx);
  if (charData.features?.hasEarrings) drawEarrings(ctx);

  ctx.restore();
}
