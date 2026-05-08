import { C } from './constants.js';
import {
  drawArenaAtmosphere,
  drawArenaRunes,
  drawArenaMotesForStage,
  drawArenaVignette,
} from './ui_screens.js';

// ── Platform definition ────────────────────────────────────────────────────
// passThrough: can be jumped through from below

function makePlatform(x, y, w, h = 20, passThrough = false, style = 'wood') {
  return { x, y, w, h, passThrough, style };
}

// ── Background mute / vignette helper ──────────────────────────────────────
// Called after each stage paints its bg + scenery but before platforms draw.
// Pushes the background back so fighters and the playfield read clearly.
function _muteBackground(ctx, opts = {}) {
  const dim     = opts.dim     ?? 0.30;   // dark wash strength
  const tint    = opts.tint    ?? '#000022';
  const vignette = opts.vignette ?? 0.55; // edge darkening strength
  const desat   = opts.desat   ?? 0.18;   // gray wash
  ctx.save();
  // Dark wash
  ctx.globalAlpha = dim;
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 1280, 720);
  // Gray desaturation wash
  ctx.globalAlpha = desat;
  ctx.fillStyle = '#8B8B98';
  ctx.fillRect(0, 0, 1280, 720);
  // Vignette
  ctx.globalAlpha = 1;
  const vGrad = ctx.createRadialGradient(640, 360, 240, 640, 360, 760);
  vGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(0.6, `rgba(0,0,0,${vignette * 0.45})`);
  vGrad.addColorStop(1, `rgba(0,0,0,${vignette})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
}

// ── Stage definitions ──────────────────────────────────────────────────────

export const STAGES = {
  downtown: {
    key: 'downtown',
    name: '805 DOWNTOWN',
    subname: 'Thousand Oaks Night',
    bgColors: ['#0D0D1F', '#1A1A3A'],      // gradient
    lightColor: '#FF8C00',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),     // main ground
      makePlatform(200, 460, 280, 18, true, 'metal'),        // left platform
      makePlatform(800, 460, 280, 18, true, 'metal'),        // right platform
      makePlatform(490, 360, 300, 18, true, 'metal'),        // center-top platform
      makePlatform(80, 350, 140, 18, true, 'metal'),         // far left
      makePlatform(1060, 350, 140, 18, true, 'metal'),       // far right
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [
      { x: 640, y: 600 },   // center main ground
      { x: 340, y: 460 },   // center of left platform
      { x: 940, y: 460 },   // center of right platform
    ],
    ambientColor: '#FF8C00',
    ambientType: 'city_lights',
    draw(ctx, frame) {
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
      skyGrad.addColorStop(0, '#050510');
      skyGrad.addColorStop(0.5, '#0D0D2A');
      skyGrad.addColorStop(1, '#1A1230');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1280, 600);

      // Layer 1: Far buildings (slowest parallax, static)
      this._drawFarBuildings(ctx, frame);
      // Layer 2: Mid buildings with neon
      this._drawMidBuildings(ctx, frame);
      // Layer 3: Street details + ground
      this._drawStreet(ctx, frame);
      // Ambient atmospheric orbs
      ctx.save();
      const orbCount = 4;
      for (let i = 0; i < orbCount; i++) {
        const orbX = 150 + i * 280;
        const orbY = 250 + Math.sin(frame * 0.02 + i * 1.2) * 30;
        const orbSize = 60 + Math.sin(frame * 0.03 + i * 0.8) * 15;
        const orbAlpha = 0.06 + Math.sin(frame * 0.04 + i) * 0.02;
        ctx.globalAlpha = orbAlpha;
        const orbGrad = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, orbSize);
        const orbColors = ['#4488FF', '#FF8800', '#44FFAA', '#FF44BB'];
        orbGrad.addColorStop(0, orbColors[i % orbColors.length] + 'FF');
        orbGrad.addColorStop(1, orbColors[i % orbColors.length] + '00');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Mute background so fighters read clearly
      _muteBackground(ctx, { dim: 0.42, tint: '#05050F', desat: 0.22, vignette: 0.65 });
      // Arena atmosphere: light rays + soft glow halo around the main platform
      drawArenaAtmosphere(ctx, frame, this.key, 640, 600, 1280);
      // Platforms
      this._drawPlatforms(ctx, this.platforms, frame);
      // Glowing rune ring etched on the ground + slow floating motes + tinted vignette
      drawArenaRunes(ctx, frame, this.key, 640, 598, 360);
      drawArenaMotesForStage(ctx, frame, this.key);
      drawArenaVignette(ctx, this.key);
    },
    _drawFarBuildings(ctx, frame) {
      const buildings = [
        { x: 0,   w: 80,  h: 250, color: '#0A0A1A' },
        { x: 90,  w: 60,  h: 200, color: '#0D0D22' },
        { x: 160, w: 90,  h: 280, color: '#080818' },
        { x: 260, w: 70,  h: 220, color: '#0A0A1F' },
        { x: 340, w: 50,  h: 180, color: '#0C0C20' },
        { x: 400, w: 110, h: 300, color: '#080814' },
        { x: 520, w: 60,  h: 240, color: '#0A0A1C' },
        { x: 590, w: 80,  h: 200, color: '#0C0C22' },
        { x: 680, w: 100, h: 270, color: '#080818' },
        { x: 790, w: 70,  h: 230, color: '#0A0A1E' },
        { x: 870, w: 90,  h: 260, color: '#090916' },
        { x: 970, w: 60,  h: 200, color: '#0B0B20' },
        { x: 1040,w: 80,  h: 240, color: '#080818' },
        { x: 1130,w: 70,  h: 210, color: '#0A0A1F' },
        { x: 1210,w: 70,  h: 250, color: '#0C0C24' },
      ];
      for (const b of buildings) {
        // Body w/ vertical gradient for depth
        const bg = ctx.createLinearGradient(0, 600 - b.h, 0, 600);
        bg.addColorStop(0, b.color);
        bg.addColorStop(1, '#020208');
        ctx.fillStyle = bg;
        ctx.fillRect(b.x, 600 - b.h, b.w, b.h);
        // Right-side shadow strip
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(b.x + b.w - 4, 600 - b.h, 4, b.h);
        // Top edge highlight
        ctx.fillStyle = 'rgba(120,140,200,0.18)';
        ctx.fillRect(b.x, 600 - b.h, b.w, 1);
        // Windows with subtle frames
        for (let wy = 600 - b.h + 10; wy < 590; wy += 18) {
          for (let wx = b.x + 6; wx < b.x + b.w - 10; wx += 14) {
            const lit = Math.sin(wx * 7 + wy * 3 + frame * 0.002) > 0.3;
            // Frame
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(wx - 1, wy - 1, 10, 12);
            // Pane
            ctx.fillStyle = lit ? 'rgba(255,210,120,0.42)' : 'rgba(40,50,80,0.55)';
            ctx.fillRect(wx, wy, 8, 10);
            // Mullions
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(wx + 3, wy, 1, 10);
            ctx.fillRect(wx, wy + 4, 8, 1);
          }
        }
        // Roof antenna on tall buildings
        if (b.h > 260) {
          const ax = b.x + b.w * 0.7;
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ax, 600 - b.h);
          ctx.lineTo(ax, 600 - b.h - 24);
          ctx.stroke();
          ctx.fillStyle = '#FF3030';
          ctx.beginPath();
          ctx.arc(ax, 600 - b.h - 26, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    _drawMidBuildings(ctx, frame) {
      // Animated neon signs
      const signs = [
        { x: 80,  y: 350, text: '805', color: '#FF8C00' },
        { x: 500, y: 310, text: 'NEON', color: '#00BFFF' },
        { x: 900, y: 330, text: 'KING', color: '#FF3080' },
        { x: 1100,y: 360, text: 'GO',   color: '#39FF14' },
      ];
      for (const s of signs) {
        const flicker = Math.sin(frame * 0.08 + s.x) > -0.8;
        if (flicker) {
          ctx.save();
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = s.color;
          ctx.font = 'bold 20px "Arial Black", Arial';
          ctx.textAlign = 'left';
          ctx.fillText(s.text, s.x, s.y);
          ctx.restore();
        }
      }

      // Street lamps
      const lampX = [100, 300, 500, 700, 900, 1100];
      for (const lx of lampX) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lx, 600);
        ctx.lineTo(lx, 480);
        ctx.lineTo(lx + 30, 470);
        ctx.stroke();
        // Lamp glow
        ctx.save();
        const glowPulse = 0.6 + Math.sin(frame * 0.05 + lx) * 0.1;
        ctx.globalAlpha = glowPulse;
        const lampGrad = ctx.createRadialGradient(lx + 30, 470, 2, lx + 30, 470, 60);
        lampGrad.addColorStop(0, 'rgba(255,220,100,0.8)');
        lampGrad.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.fillStyle = lampGrad;
        ctx.beginPath();
        ctx.arc(lx + 30, 470, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Bulb
        ctx.fillStyle = '#FFE080';
        ctx.beginPath();
        ctx.arc(lx + 30, 470, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    _drawStreet(ctx, frame) {
      // Sidewalk
      ctx.fillStyle = '#1A1A2A';
      ctx.fillRect(0, 580, 1280, 20);
      // Road markings
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 3;
      ctx.setLineDash([40, 20]);
      ctx.beginPath();
      ctx.moveTo(0, 595);
      ctx.lineTo(1280, 595);
      ctx.stroke();
      ctx.setLineDash([]);

      // Moving car headlights in far background
      const carX = ((frame * 2) % 1400) - 100;
      ctx.fillStyle = '#FFE080';
      ctx.beginPath();
      ctx.arc(carX, 590, 6, 0, Math.PI * 2);
      ctx.arc(carX + 40, 590, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#FFE080';
      ctx.fillRect(carX, 580, 150, 10);
      ctx.restore();
    },
    _drawPlatforms(ctx, platforms, frame) {
      for (const plat of platforms) {
        _drawPlatform(ctx, plat, frame);
      }
    },
    getAmbientParticles(frame) {
      if (frame % 4 !== 0) return [];
      return [{
        x: Math.random() * 1280,
        y: 560 + Math.random() * 40,
        color: `hsla(${30 + Math.random() * 30}, 100%, 60%, 0.6)`,
      }];
    },
  },

  rooftop: {
    key: 'rooftop',
    name: 'ROOFTOP CLASH',
    subname: 'Oak Park High',
    bgColors: ['#1A3060', '#FF6B35'],
    lightColor: '#FF6B35',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),
      makePlatform(160, 460, 260, 18, true, 'metal'),
      makePlatform(860, 460, 260, 18, true, 'metal'),
      makePlatform(480, 355, 320, 18, true, 'metal'),
      makePlatform(60, 340, 120, 18, true, 'wood'),
      makePlatform(1100, 340, 120, 18, true, 'wood'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [
      { x: 640, y: 600 },   // center main ground
      { x: 290, y: 460 },   // center of left platform
      { x: 990, y: 460 },   // center of right platform
    ],
    ambientColor: '#FF6B35',
    ambientType: 'embers',
    draw(ctx, frame) {
      // Sunset sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
      skyGrad.addColorStop(0, '#1A3060');
      skyGrad.addColorStop(0.4, '#CC4422');
      skyGrad.addColorStop(0.7, '#FF8C44');
      skyGrad.addColorStop(1, '#FFB870');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1280, 600);

      // Sun
      ctx.save();
      const sunX = 640 + Math.sin(frame * 0.002) * 20;
      const sunY = 280;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 100);
      sunGrad.addColorStop(0, '#FFE080');
      sunGrad.addColorStop(0.3, '#FF8C00');
      sunGrad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant city silhouette
      ctx.fillStyle = '#111122';
      const cityH = [80, 120, 90, 140, 70, 100, 80, 60, 110, 130, 90, 75, 120, 85, 100];
      for (let i = 0; i < cityH.length; i++) {
        ctx.fillRect(i * 90, 600 - cityH[i], 85, cityH[i]);
      }

      // Rooftop details
      ctx.fillStyle = '#2A2A3A';
      ctx.fillRect(0, 590, 1280, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 590, 1280, 2);
      // AC units with vents, fan grilles, pipes
      for (const x of [50, 200, 400, 700, 900, 1100]) {
        // Body w/ gradient
        const acg = ctx.createLinearGradient(x, 565, x, 600);
        acg.addColorStop(0, '#4A4A58');
        acg.addColorStop(1, '#22232E');
        ctx.fillStyle = acg;
        ctx.fillRect(x, 565, 50, 35);
        // Outline
        ctx.strokeStyle = '#1A1A22';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, 565, 50, 35);
        // Top panel highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 1, 565, 48, 2);
        // Fan grille (animated)
        const fa = (frame * 0.1 + x * 0.01) % (Math.PI * 2);
        ctx.save();
        ctx.translate(x + 25, 583);
        ctx.fillStyle = '#101018';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3A3A48';
        ctx.lineWidth = 1;
        for (let r = 0; r < 4; r++) {
          ctx.save();
          ctx.rotate(fa + r * Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(8, 0);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = '#5A5A66';
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Side vents
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let v = 568; v < 595; v += 4) {
          ctx.fillRect(x + 2, v, 4, 1);
          ctx.fillRect(x + 44, v, 4, 1);
        }
      }
      // Vent pipes
      ctx.strokeStyle = '#3A3A44';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const px of [320, 600, 1000]) {
        ctx.beginPath();
        ctx.moveTo(px, 590);
        ctx.lineTo(px, 555);
        ctx.lineTo(px + 14, 545);
        ctx.stroke();
        ctx.fillStyle = '#202028';
        ctx.beginPath();
        ctx.arc(px + 14, 545, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clouds moving
      for (let c = 0; c < 4; c++) {
        const cx = ((frame * 0.3 + c * 320) % 1400) - 100;
        const cy = 80 + c * 30;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FFD0A0';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 80, 25, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 40, cy - 10, 60, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      _muteBackground(ctx, { dim: 0.40, tint: '#1A0E18', desat: 0.25, vignette: 0.60 });
      drawArenaAtmosphere(ctx, frame, this.key, 640, 600, 1280);
      this._drawPlatforms(ctx, this.platforms, frame);
      drawArenaRunes(ctx, frame, this.key, 640, 598, 360);
      drawArenaMotesForStage(ctx, frame, this.key);
      drawArenaVignette(ctx, this.key);
    },
    _drawPlatforms(ctx, platforms, frame) {
      for (const plat of platforms) {
        _drawPlatform(ctx, plat, frame);
      }
    },
    getAmbientParticles(frame) {
      if (frame % 3 !== 0) return [];
      return [{
        x: 200 + Math.random() * 880,
        y: 580 + Math.random() * 20,
        color: `rgba(255,${80 + Math.random() * 80},0,${0.4 + Math.random() * 0.4})`,
      }];
    },
  },

  beach: {
    key: 'beach',
    name: 'MALIBU BEACH',
    subname: '805 Coast',
    bgColors: ['#87CEEB', '#1E90FF'],
    lightColor: '#FFD700',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'sand'),
      makePlatform(180, 445, 240, 18, true, 'wood'),
      makePlatform(860, 445, 240, 18, true, 'wood'),
      makePlatform(490, 340, 300, 18, true, 'cloud'),
      makePlatform(100, 320, 120, 18, true, 'cloud'),
      makePlatform(1060, 320, 120, 18, true, 'cloud'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [
      { x: 640, y: 600 },   // center main ground
      { x: 300, y: 445 },   // center of left wood platform
      { x: 980, y: 445 },   // center of right wood platform
    ],
    ambientColor: '#FFD700',
    ambientType: 'petals',
    draw(ctx, frame) {
      // Ocean & sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
      skyGrad.addColorStop(0, '#5BA3E0');
      skyGrad.addColorStop(1, '#87CEEB');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1280, 400);

      // Ocean waves
      const oceanGrad = ctx.createLinearGradient(0, 350, 0, 600);
      oceanGrad.addColorStop(0, '#1E6FAF');
      oceanGrad.addColorStop(1, '#0A4A8A');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.moveTo(0, 370);
      for (let wx = 0; wx <= 1280; wx += 10) {
        ctx.lineTo(wx, 370 + Math.sin(wx * 0.02 + frame * 0.05) * 8);
      }
      ctx.lineTo(1280, 600);
      ctx.lineTo(0, 600);
      ctx.closePath();
      ctx.fill();

      // Wave foam
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let wx = 0; wx <= 1280; wx += 10) {
        const wy = 370 + Math.sin(wx * 0.02 + frame * 0.05) * 8;
        if (wx === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Sun rays
      ctx.save();
      const sunX = 640, sunY = 100;
      ctx.globalAlpha = 0.1 + Math.sin(frame * 0.03) * 0.05;
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + frame * 0.005;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(angle) * 400, sunY + Math.sin(angle) * 400);
        ctx.lineTo(sunX + Math.cos(angle + 0.1) * 400, sunY + Math.sin(angle + 0.1) * 400);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Sun
      ctx.fillStyle = '#FFE040';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      for (let c = 0; c < 3; c++) {
        const cx = ((frame * 0.2 + c * 430) % 1400) - 100;
        const cy = 80 + c * 40;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 50, cy - 15, 70, 25, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 30, cy - 10, 60, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sand foreground
      const sandGrad = ctx.createLinearGradient(0, 580, 0, 640);
      sandGrad.addColorStop(0, '#E8C87A');
      sandGrad.addColorStop(1, '#C8A850');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 580, 1280, 60);

      // Palm trees with textured trunks + detailed fronds
      for (const px of [60, 1220]) {
        // Trunk (segmented)
        ctx.save();
        ctx.strokeStyle = '#5C3F18';
        ctx.lineWidth = 13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, 600);
        ctx.quadraticCurveTo(px + 10, 480, px + 20, 380);
        ctx.stroke();
        // Trunk segment rings
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1.5;
        for (let ty = 590; ty > 390; ty -= 22) {
          const tprog = (600 - ty) / (600 - 380);
          const tx = px + tprog * 20;
          ctx.beginPath();
          ctx.moveTo(tx - 7, ty);
          ctx.quadraticCurveTo(tx, ty + 3, tx + 7, ty);
          ctx.stroke();
        }
        // Trunk highlight
        ctx.strokeStyle = 'rgba(255,210,150,0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px - 4, 595);
        ctx.quadraticCurveTo(px + 6, 480, px + 16, 385);
        ctx.stroke();
        ctx.restore();
        // Coconuts
        ctx.fillStyle = '#3A2410';
        for (const [cx0, cy0] of [[px + 18, 388], [px + 26, 392], [px + 14, 396]]) {
          ctx.beginPath();
          ctx.arc(cx0, cy0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(cx0 - 1.5, cy0 - 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3A2410';
        }
        // Fronds (8 frond clusters with leaflets)
        for (let l = 0; l < 8; l++) {
          const la = (l / 8) * Math.PI * 2 + frame * 0.008;
          const sway = Math.sin(frame * 0.04 + l) * 0.15;
          const dirX = Math.cos(la + sway);
          const dirY = Math.sin(la + sway) * 0.6 - 0.2;
          const rootX = px + 20;
          const rootY = 380;
          const tipX = rootX + dirX * 90;
          const tipY = rootY + dirY * 80 + 10;
          // Spine
          ctx.strokeStyle = '#1F5F1F';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(rootX, rootY);
          ctx.quadraticCurveTo(
            rootX + dirX * 45, rootY + dirY * 35 + 4,
            tipX, tipY
          );
          ctx.stroke();
          // Leaflets along the spine
          ctx.strokeStyle = '#2D8A2D';
          ctx.lineWidth = 2;
          for (let s = 0.15; s < 0.95; s += 0.12) {
            const ax = rootX + dirX * 90 * s;
            const ay = rootY + dirY * 80 * s + 10 * s;
            const perpX = -dirY;
            const perpY = dirX;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + perpX * 10, ay + perpY * 10);
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - perpX * 10, ay - perpY * 10);
            ctx.stroke();
          }
        }
      }

      _muteBackground(ctx, { dim: 0.38, tint: '#0D2030', desat: 0.32, vignette: 0.55 });
      drawArenaAtmosphere(ctx, frame, this.key, 640, 600, 1280);
      this._drawPlatforms(ctx, this.platforms, frame);
      drawArenaRunes(ctx, frame, this.key, 640, 598, 360);
      drawArenaMotesForStage(ctx, frame, this.key);
      drawArenaVignette(ctx, this.key);
    },
    _drawPlatforms(ctx, platforms, frame) {
      for (const plat of platforms) _drawPlatform(ctx, plat, frame);
    },
    getAmbientParticles(frame) {
      if (frame % 5 !== 0) return [];
      return [{
        x: Math.random() * 1280,
        y: 360 + Math.random() * 100,
        color: 'rgba(255,255,255,0.4)',
      }];
    },
  },

  gym: {
    key: 'gym',
    name: 'THE IRON GYM',
    subname: 'Late Night Grind',
    bgColors: ['#0A0A0A', '#1A1A1A'],
    lightColor: '#4444FF',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),
      makePlatform(140, 450, 280, 18, true, 'metal'),
      makePlatform(860, 450, 280, 18, true, 'metal'),
      makePlatform(480, 340, 320, 18, true, 'metal'),
      makePlatform(50, 330, 110, 18, true, 'metal'),
      makePlatform(1120, 330, 110, 18, true, 'metal'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [
      { x: 640, y: 600 },   // center main ground
      { x: 280, y: 450 },   // center of left metal platform
      { x: 1000, y: 450 },  // center of right metal platform
    ],
    ambientColor: '#4444FF',
    ambientType: 'dust',
    draw(ctx, frame) {
      // Dark gym background
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, 1280, 720);

      // Overhead lights with flicker
      const lights = [160, 400, 640, 880, 1120];
      for (const lx of lights) {
        const flicker = Math.sin(frame * 0.15 + lx * 0.01) > -0.9;
        if (flicker) {
          ctx.save();
          const lightAlpha = 0.5 + Math.sin(frame * 0.1 + lx) * 0.1;
          ctx.globalAlpha = lightAlpha;
          const lightGrad = ctx.createRadialGradient(lx, 0, 5, lx, 0, 250);
          lightGrad.addColorStop(0, 'rgba(200,220,255,0.9)');
          lightGrad.addColorStop(0.3, 'rgba(150,180,255,0.4)');
          lightGrad.addColorStop(1, 'rgba(100,150,255,0)');
          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.arc(lx, 0, 250, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          // Fixture
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(lx - 30, 0, 60, 8);
        }
      }

      // Equipment silhouettes
      // Punching bags w/ texture
      for (const bx of [100, 1180]) {
        // Body w/ vertical gradient
        const bagGrad = ctx.createLinearGradient(0, 480, 0, 560);
        bagGrad.addColorStop(0, '#2A2A36');
        bagGrad.addColorStop(0.5, '#1A1A24');
        bagGrad.addColorStop(1, '#0A0A12');
        ctx.fillStyle = bagGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx - 15, 480, 30, 80, 10);
        else ctx.rect(bx - 15, 480, 30, 80);
        ctx.fill();
        ctx.strokeStyle = '#3A3A4A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Stitch lines
        ctx.strokeStyle = 'rgba(180,180,200,0.18)';
        ctx.lineWidth = 1;
        for (let sy = 490; sy < 555; sy += 12) {
          ctx.beginPath();
          ctx.moveTo(bx - 13, sy);
          ctx.lineTo(bx + 13, sy);
          ctx.stroke();
        }
        // Vertical seam
        ctx.beginPath();
        ctx.moveTo(bx, 482);
        ctx.lineTo(bx, 558);
        ctx.stroke();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(bx - 12, 484, 4, 70);
        // Strap base
        ctx.fillStyle = '#3A2818';
        ctx.fillRect(bx - 14, 478, 28, 4);
        // Chain
        ctx.strokeStyle = '#5A5A66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, 478);
        ctx.lineTo(bx, 440);
        ctx.stroke();
        // Chain links
        for (let cy = 442; cy < 478; cy += 4) {
          ctx.beginPath();
          ctx.arc(bx, cy, 1.4, 0, Math.PI * 2);
          ctx.strokeStyle = '#7A7A88';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Ceiling mount
        ctx.fillStyle = '#222';
        ctx.fillRect(bx - 6, 437, 12, 4);
      }
      // Barbell rack with weight plates
      ctx.fillStyle = '#22232E';
      ctx.fillRect(560, 550, 160, 50);
      ctx.strokeStyle = '#3A3A4A';
      ctx.lineWidth = 2;
      ctx.strokeRect(560, 550, 160, 50);
      // Top edge highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(560, 550, 160, 1);
      // Barbell on top of rack
      ctx.strokeStyle = '#9FA8B6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(540, 548);
      ctx.lineTo(740, 548);
      ctx.stroke();
      // Plates
      const plateColors = ['#C0392B', '#2E86C1', '#27AE60', '#F1C40F'];
      for (let i = 0; i < 4; i++) {
        const px = 545 + i * 6;
        ctx.fillStyle = plateColors[i % plateColors.length];
        ctx.fillRect(px, 538, 4, 22);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, 538, 4, 22);
      }
      for (let i = 0; i < 4; i++) {
        const px = 715 + i * 6;
        ctx.fillStyle = plateColors[(i + 2) % plateColors.length];
        ctx.fillRect(px, 538, 4, 22);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(px, 538, 4, 22);
      }
      // Floor mat
      ctx.fillStyle = '#0D0D14';
      ctx.fillRect(540, 600, 200, 4);
      // Wall mirror reflecting some lights
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#3A4858';
      ctx.fillRect(820, 220, 200, 200);
      ctx.strokeStyle = '#22232E';
      ctx.lineWidth = 4;
      ctx.strokeRect(820, 220, 200, 200);
      ctx.fillStyle = 'rgba(180,200,255,0.2)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(830 + i * 5, 230 + i * 28, 30, 4);
      }
      ctx.restore();
      // Wall-mounted dumbbell rack
      ctx.fillStyle = '#22232E';
      ctx.fillRect(150, 300, 240, 70);
      ctx.strokeStyle = '#3A3A4A';
      ctx.lineWidth = 2;
      ctx.strokeRect(150, 300, 240, 70);
      // Dumbbell pairs
      for (let i = 0; i < 5; i++) {
        const dy = 314 + i * 12;
        ctx.fillStyle = '#1A1A22';
        ctx.fillRect(160, dy, 50, 6);
        ctx.fillRect(330, dy, 50, 6);
        // End caps
        ctx.fillStyle = '#3A3A48';
        ctx.fillRect(157, dy - 3, 8, 12);
        ctx.fillRect(207, dy - 3, 8, 12);
        ctx.fillRect(327, dy - 3, 8, 12);
        ctx.fillRect(377, dy - 3, 8, 12);
      }

      // Graffiti
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = 'bold 80px "Arial Black"';
      ctx.fillStyle = '#4444FF';
      ctx.fillText('805', 520, 530);
      ctx.fillStyle = '#FF8C00';
      ctx.font = 'bold 40px "Arial Black"';
      ctx.fillText('SHOWDOWN', 490, 575);
      ctx.restore();

      // Dust motes in light beams
      for (let i = 0; i < 3; i++) {
        const dx = (Math.sin(frame * 0.02 + i * 2) * 100 + lights[i + 1]);
        const dy = (Math.cos(frame * 0.015 + i * 1.5) * 100 + 200);
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#AAAAFF';
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      _muteBackground(ctx, { dim: 0.45, tint: '#020208', desat: 0.18, vignette: 0.70 });
      drawArenaAtmosphere(ctx, frame, this.key, 640, 600, 1280);
      this._drawPlatforms(ctx, this.platforms, frame);
      drawArenaRunes(ctx, frame, this.key, 640, 598, 360);
      drawArenaMotesForStage(ctx, frame, this.key);
      drawArenaVignette(ctx, this.key);
    },
    _drawPlatforms(ctx, platforms, frame) {
      for (const plat of platforms) _drawPlatform(ctx, plat, frame);
    },
    getAmbientParticles(frame) {
      if (frame % 6 !== 0) return [];
      return [{
        x: 200 + Math.random() * 880,
        y: 100 + Math.random() * 400,
        color: `rgba(180,180,255,0.2)`,
      }];
    },
  },

  classroom: {
    key: 'classroom',
    name: "MR. SMITH'S ROOM",
    subname: 'Period 4 Showdown',
    bgColors: ['#F4E5C2', '#D9B97E'],
    lightColor: '#FFD27A',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'wood'),     // floor
      makePlatform(160, 470, 260, 18, true, 'wood'),     // left desks row
      makePlatform(860, 470, 260, 18, true, 'wood'),     // right desks row
      makePlatform(490, 360, 300, 18, true, 'wood'),     // teacher's center desk
      makePlatform(60, 340, 110, 18, true, 'wood'),      // far left bookshelf
      makePlatform(1110, 340, 110, 18, true, 'wood'),    // far right bookshelf
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [
      { x: 640, y: 600 },
      { x: 290, y: 470 },
      { x: 990, y: 470 },
    ],
    ambientColor: '#FFE9A8',
    ambientType: 'dust',
    draw(ctx, frame) {
      // Wall — warm beige with gradient
      const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
      wallGrad.addColorStop(0, '#F0D9A0');
      wallGrad.addColorStop(0.55, '#E2BE7A');
      wallGrad.addColorStop(1, '#B8945A');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, 1280, 600);

      // Wainscoting band
      ctx.fillStyle = '#7A5A30';
      ctx.fillRect(0, 540, 1280, 8);
      ctx.fillStyle = '#A07840';
      ctx.fillRect(0, 548, 1280, 4);

      // Chalkboard (large dark green) at center
      this._drawChalkboard(ctx, frame);

      // Bulletin board (right side)
      this._drawBulletinBoard(ctx, 940, 80);

      // School flag (left side)
      this._drawFlag(ctx, 110, 90, frame);

      // Wall clock
      this._drawClock(ctx, 800, 110, frame);

      // Posters on the walls
      this._drawPoster(ctx, 200, 90, 110, 140, '#F5F0E0', 'PERIODIC\nTABLE');
      this._drawPoster(ctx, 1000, 320, 120, 90, '#FFFCDC', 'KEEP\nCALM &\nLEARN');

      // Student desk row drawn on the back wall (decorative, behind the platforms)
      this._drawDeskRow(ctx, 60, 620, 4);
      this._drawDeskRow(ctx, 850, 620, 4);

      // Mute the chalkboard/walls/decor so they don't compete with the fight
      _muteBackground(ctx, { dim: 0.42, tint: '#1A1208', desat: 0.30, vignette: 0.55 });

      // Arena atmosphere
      drawArenaAtmosphere(ctx, frame, this.key, 640, 600, 1280);

      // Mr. Smith standing in front of his desk (drawn AFTER mute so he stays visible)
      this._drawMrSmith(ctx, 640, 540, frame);

      // Floor — wooden boards
      const floorGrad = ctx.createLinearGradient(0, 580, 0, 640);
      floorGrad.addColorStop(0, '#A9743F');
      floorGrad.addColorStop(1, '#7A5226');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 580, 1280, 60);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let bx = 0; bx < 1280; bx += 80) {
        ctx.beginPath();
        ctx.moveTo(bx, 580);
        ctx.lineTo(bx, 640);
        ctx.stroke();
      }

      this._drawPlatforms(ctx, this.platforms, frame);
      drawArenaRunes(ctx, frame, this.key, 640, 598, 360);
      drawArenaMotesForStage(ctx, frame, this.key);
      drawArenaVignette(ctx, this.key);
    },
    _drawChalkboard(ctx, frame) {
      // Frame
      ctx.fillStyle = '#3A2410';
      ctx.fillRect(330, 80, 620, 230);
      ctx.strokeStyle = '#5C3A18';
      ctx.lineWidth = 4;
      ctx.strokeRect(330, 80, 620, 230);
      // Board
      const boardGrad = ctx.createLinearGradient(340, 90, 340, 300);
      boardGrad.addColorStop(0, '#1F3A28');
      boardGrad.addColorStop(1, '#13261A');
      ctx.fillStyle = boardGrad;
      ctx.fillRect(340, 90, 600, 210);
      // Chalk dust streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 12;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(360 + i * 90, 100 + Math.sin(i) * 6);
        ctx.lineTo(420 + i * 90, 280 - Math.cos(i) * 6);
        ctx.stroke();
      }
      // Chalk text
      ctx.font = 'bold 38px "Comic Sans MS", "Marker Felt", "Arial Black"';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('NO TALKING.', 640, 160);
      ctx.font = 'bold 28px "Comic Sans MS", "Marker Felt", Arial';
      ctx.fillStyle = '#FFEEAA';
      ctx.fillText('FIGHT IT OUT.', 640, 210);
      ctx.font = 'italic 18px Arial';
      ctx.fillStyle = '#CCC';
      ctx.fillText('— Mr. Smith', 640, 250);
      // Chalk tray
      ctx.fillStyle = '#5C3A18';
      ctx.fillRect(330, 305, 620, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(420, 308, 30, 4);
      ctx.fillRect(560, 308, 30, 4);
      ctx.fillStyle = '#FFE0E0';
      ctx.fillRect(700, 308, 22, 4);
    },
    _drawBulletinBoard(ctx, x, y) {
      ctx.fillStyle = '#9B7B45';
      ctx.fillRect(x, y, 240, 160);
      ctx.strokeStyle = '#5C3A18';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, 240, 160);
      // Cork texture
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 80; i++) {
        const px = x + 4 + Math.random() * 232;
        const py = y + 4 + Math.random() * 152;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      // Pinned notes
      const notes = [
        { ox: 18,  oy: 18,  c: '#FFE56B', t: 'A+' },
        { ox: 90,  oy: 30,  c: '#A7E6FF', t: 'HW' },
        { ox: 160, oy: 22,  c: '#FFB7B7', t: '!!' },
        { ox: 30,  oy: 90,  c: '#C6F2A7', t: 'Q1' },
        { ox: 110, oy: 100, c: '#FFE56B', t: '805' },
      ];
      for (const n of notes) {
        ctx.save();
        ctx.translate(x + n.ox + 22, y + n.oy + 22);
        ctx.rotate((Math.random() - 0.5) * 0.2);
        ctx.fillStyle = n.c;
        ctx.fillRect(-22, -22, 44, 44);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(n.t, 0, 4);
        // Push pin
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.arc(0, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    _drawFlag(ctx, x, y, frame) {
      // Pole
      ctx.fillStyle = '#777';
      ctx.fillRect(x, y, 4, 130);
      // Flag
      ctx.save();
      const wave = Math.sin(frame * 0.05) * 4;
      ctx.fillStyle = '#1F4ED8';
      ctx.fillRect(x + 4, y + 6, 30, 32);
      // Stripes
      ctx.fillStyle = '#CC2222';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 34, y + 6 + i * 20, 60 + wave, 8);
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 34, y + 14 + i * 20, 60 + wave, 6);
      // Stars dots
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 6; i++) {
        const sx = x + 8 + (i % 3) * 8;
        const sy = y + 12 + Math.floor(i / 3) * 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    _drawPoster(ctx, x, y, w, h, paperColor, label) {
      // Tape corners
      ctx.fillStyle = 'rgba(220,220,220,0.6)';
      ctx.fillRect(x - 4, y - 6, 16, 6);
      ctx.fillRect(x + w - 12, y - 6, 16, 6);
      // Paper w/ shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = paperColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      // Title text
      ctx.fillStyle = '#222';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const lines = label.split('\n');
      lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + 18 + i * 14));
      // Some scribbles
      ctx.strokeStyle = 'rgba(60,60,80,0.3)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 70 + i * 12);
        ctx.lineTo(x + w - 8, y + 70 + i * 12);
        ctx.stroke();
      }
    },
    _drawDeskRow(ctx, x, baseY, count) {
      for (let i = 0; i < count; i++) {
        const dx = x + i * 90;
        // Desk top
        ctx.fillStyle = '#C09060';
        ctx.fillRect(dx, baseY - 22, 70, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(dx, baseY - 16, 70, 2);
        ctx.fillStyle = 'rgba(255,220,170,0.4)';
        ctx.fillRect(dx + 2, baseY - 22, 66, 1);
        // Legs
        ctx.fillStyle = '#666';
        ctx.fillRect(dx + 4, baseY - 16, 3, 18);
        ctx.fillRect(dx + 63, baseY - 16, 3, 18);
        // Chair behind desk
        ctx.fillStyle = '#3A3A48';
        ctx.fillRect(dx + 22, baseY - 30, 28, 14);
        ctx.fillRect(dx + 22, baseY - 16, 28, 4);
        ctx.fillStyle = '#22232E';
        ctx.fillRect(dx + 24, baseY - 12, 3, 14);
        ctx.fillRect(dx + 45, baseY - 12, 3, 14);
        // Notebook on desk
        if (i % 2 === 0) {
          ctx.fillStyle = '#F5F5F0';
          ctx.fillRect(dx + 12, baseY - 21, 18, 3);
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(dx + 12, baseY - 21, 18, 3);
        }
      }
    },
    _drawClock(ctx, x, y, frame) {
      // Frame
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(x, y, 36, 0, Math.PI * 2);
      ctx.fill();
      // Face
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();
      // Tick marks
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26);
        ctx.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30);
        ctx.stroke();
      }
      // Hands
      const minA = (frame * 0.02) % (Math.PI * 2);
      const hourA = (frame * 0.0017) % (Math.PI * 2);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(hourA - Math.PI / 2) * 16, y + Math.sin(hourA - Math.PI / 2) * 16);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(minA - Math.PI / 2) * 24, y + Math.sin(minA - Math.PI / 2) * 24);
      ctx.stroke();
      // Center dot
      ctx.fillStyle = '#C00';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    },
    _drawMrSmith(ctx, cx, baseY, frame) {
      // Standing teacher figure in the background between the chalkboard and the floor.
      // Drawn at smaller scale so he reads as background not foreground.
      ctx.save();
      ctx.translate(cx, baseY);
      const breath = Math.sin(frame * 0.04) * 1.5;
      ctx.translate(0, breath);
      // Subtle drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 36, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pants
      ctx.fillStyle = '#2A2E40';
      ctx.fillRect(-18, -50, 36, 60);
      ctx.fillStyle = '#1A1E2A';
      ctx.fillRect(-18, -50, 36, 4);
      // Shoes
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.ellipse(-10, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(10, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belt
      ctx.fillStyle = '#1A1208';
      ctx.fillRect(-18, -52, 36, 4);
      ctx.fillStyle = '#C8A050';
      ctx.fillRect(-3, -52, 6, 4);
      // Dress shirt (tucked)
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.moveTo(-22, -110);
      ctx.lineTo(22, -110);
      ctx.lineTo(20, -50);
      ctx.lineTo(-20, -50);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Tie (red striped)
      ctx.fillStyle = '#A82020';
      ctx.beginPath();
      ctx.moveTo(-4, -108);
      ctx.lineTo(4, -108);
      ctx.lineTo(5, -64);
      ctx.lineTo(0, -56);
      ctx.lineTo(-5, -64);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5A0F0F';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Tie stripes
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let ty = -100; ty < -60; ty += 8) {
        ctx.beginPath();
        ctx.moveTo(-4, ty);
        ctx.lineTo(4, ty + 4);
        ctx.stroke();
      }
      // Arms
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.roundRect(-32, -108, 12, 60, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(20, -108, 12, 60, 4);
      ctx.fill();
      ctx.stroke();
      // Hands (one holding pointer/chalk)
      ctx.fillStyle = '#E6C29A';
      ctx.beginPath();
      ctx.arc(-26, -46, 6, 0, Math.PI * 2);
      ctx.arc(26, -46, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
      // Pointer stick
      ctx.strokeStyle = '#3A2410';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(26, -48);
      ctx.lineTo(60, -100);
      ctx.stroke();
      ctx.fillStyle = '#C8A050';
      ctx.beginPath();
      ctx.arc(60, -100, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillStyle = '#E6C29A';
      ctx.fillRect(-6, -118, 12, 12);
      // Head
      ctx.beginPath();
      ctx.ellipse(0, -130, 18, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#E6C29A';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Bald top with side hair (classic teacher)
      ctx.fillStyle = '#3A2A18';
      ctx.beginPath();
      ctx.arc(-15, -130, 6, 0, Math.PI * 2);
      ctx.arc(15, -130, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -144, 16, 5, 0, Math.PI, 0);
      ctx.fillStyle = '#3A2A18';
      ctx.fill();
      // Glasses
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = 'rgba(180,220,255,0.25)';
      ctx.beginPath();
      ctx.roundRect(-14, -135, 10, 8, 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(4, -135, 10, 8, 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -132); ctx.lineTo(4, -132);
      ctx.stroke();
      // Mustache
      ctx.fillStyle = '#3A2A18';
      ctx.beginPath();
      ctx.moveTo(-7, -122);
      ctx.quadraticCurveTo(0, -120, 7, -122);
      ctx.quadraticCurveTo(0, -118, -7, -122);
      ctx.fill();
      // Eyes (squinting wise teacher)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-12, -131); ctx.lineTo(-6, -131);
      ctx.moveTo(6, -131);   ctx.lineTo(12, -131);
      ctx.stroke();
      // Mouth (small frown — class is loud again)
      ctx.beginPath();
      ctx.moveTo(-4, -116);
      ctx.quadraticCurveTo(0, -114, 4, -116);
      ctx.stroke();
      // Name plate floating above
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-44, -178, 88, 18);
      ctx.strokeStyle = '#FFE56B';
      ctx.lineWidth = 1;
      ctx.strokeRect(-44, -178, 88, 18);
      ctx.fillStyle = '#FFE56B';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MR. SMITH', 0, -165);
      ctx.restore();
    },
    _drawPlatforms(ctx, platforms, frame) {
      for (const plat of platforms) _drawPlatform(ctx, plat, frame);
    },
    getAmbientParticles(frame) {
      if (frame % 8 !== 0) return [];
      return [{
        x: 200 + Math.random() * 880,
        y: 100 + Math.random() * 400,
        color: 'rgba(255,230,170,0.35)',
      }];
    },
  },
};

// ── Platform renderer ─────────────────────────────────────────────────────

function _roundedPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function _drawPlatform(ctx, plat, frame) {
  const { x, y, w, h, passThrough, style } = plat;

  ctx.save();

  // Drop shadow under platform (drawn first, soft)
  ctx.save();
  ctx.globalAlpha = 0.32;
  const shadowGrad = ctx.createLinearGradient(0, y + h, 0, y + h + 18);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 6, w * 0.48, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (style === 'concrete') {
    // Concrete with cracks, gravel speckles, and a cement seam
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#7A7A88');
    grad.addColorStop(0.35, '#56565F');
    grad.addColorStop(1, '#2A2A33');
    _roundedPath(ctx, x, y, w, h, 3);
    ctx.fillStyle = grad;
    ctx.fill();
    // Top-edge bright bevel
    ctx.fillStyle = '#A9AAB8';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 2, y, w - 4, 1);
    // Bottom dark bevel
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y + h - 2, w, 2);
    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.5;
    _roundedPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 3);
    ctx.stroke();
    // Cement seams (vertical breaks)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    for (let sx = x + 80; sx < x + w; sx += 120) {
      ctx.beginPath();
      ctx.moveTo(sx, y + 2);
      ctx.lineTo(sx + 1, y + h - 2);
      ctx.stroke();
    }
    // Hairline cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < Math.floor(w / 90); i++) {
      const cx0 = x + 30 + i * 110;
      ctx.beginPath();
      ctx.moveTo(cx0, y + 4);
      ctx.lineTo(cx0 + 6, y + 10);
      ctx.lineTo(cx0 - 2, y + 16);
      ctx.lineTo(cx0 + 4, y + h - 4);
      ctx.stroke();
    }
    // Speckle / gravel
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let i = 0; i < Math.floor(w / 6); i++) {
      const px = x + ((i * 53) % w);
      const py = y + 4 + ((i * 17) % (h - 6));
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < Math.floor(w / 12); i++) {
      const px = x + 3 + ((i * 71) % (w - 4));
      const py = y + 3 + ((i * 29) % (h - 6));
      ctx.fillRect(px, py, 1, 1);
    }

  } else if (style === 'sand') {
    // Sand with soft mounds, stones, shells, footprint dots
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#D9B576');
    grad.addColorStop(0.6, '#B68A4A');
    grad.addColorStop(1, '#7A5826');
    _roundedPath(ctx, x, y, w, h, 4);
    ctx.fillStyle = grad;
    ctx.fill();
    // Soft top mounds
    ctx.fillStyle = 'rgba(255,235,180,0.55)';
    for (let mx = x + 20; mx < x + w; mx += 60) {
      ctx.beginPath();
      ctx.ellipse(mx, y + 1, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Outline
    ctx.strokeStyle = 'rgba(60,40,15,0.55)';
    ctx.lineWidth = 1.5;
    _roundedPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 4);
    ctx.stroke();
    // Pebbles & shells
    for (let i = 0; i < Math.floor(w / 30); i++) {
      const px = x + 18 + ((i * 47) % (w - 30));
      const py = y + 5 + ((i * 13) % (h - 8));
      ctx.fillStyle = '#5C3D1A';
      ctx.beginPath();
      ctx.ellipse(px, py, 1.6, 1.1, (i * 0.7) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tiny dot speckles
    ctx.fillStyle = 'rgba(120,80,30,0.45)';
    for (let i = 0; i < Math.floor(w / 4); i++) {
      const px = x + ((i * 37) % w);
      const py = y + 3 + ((i * 11) % (h - 4));
      ctx.fillRect(px, py, 1, 1);
    }

  } else if (style === 'metal') {
    // Steel plate with rivets, panel seams, brushed sheen
    _roundedPath(ctx, x, y, w, h, 4);
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#B6BFCC');
    grad.addColorStop(0.18, '#7E8794');
    grad.addColorStop(0.55, '#4F5868');
    grad.addColorStop(1, '#262C38');
    ctx.fillStyle = grad;
    ctx.fill();
    // Brushed-metal vertical sheen
    ctx.save();
    _roundedPath(ctx, x, y, w, h, 4);
    ctx.clip();
    for (let bx = x; bx < x + w; bx += 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + ((bx * 13) % 7) / 200})`;
      ctx.fillRect(bx, y, 1, h);
    }
    ctx.restore();
    // Top bevel highlight
    ctx.fillStyle = '#D7DEE8';
    ctx.fillRect(x + 2, y, w - 4, 1);
    ctx.fillStyle = '#9FA8B6';
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
    // Bottom bevel shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    _roundedPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 4);
    ctx.stroke();
    // Panel seams
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1;
    for (let px = x + 40; px < x + w; px += 40) {
      ctx.beginPath();
      ctx.moveTo(px, y + 3);
      ctx.lineTo(px, y + h - 3);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(px + 1, y + 3);
      ctx.lineTo(px + 1, y + h - 3);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    }
    // Rivets along top + bottom
    for (let rx = x + 10; rx < x + w - 8; rx += 24) {
      // Top rivet
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(rx, y + 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C7D0DA';
      ctx.beginPath();
      ctx.arc(rx - 0.4, y + 3, 1, 0, Math.PI * 2);
      ctx.fill();
      // Bottom rivet
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(rx, y + h - 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7E8794';
      ctx.beginPath();
      ctx.arc(rx - 0.4, y + h - 4, 1, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (style === 'wood') {
    // Wood with plank seams, knots, grain swirls, end-cap shadow
    const plankCount = Math.max(2, Math.round(w / 90));
    const plankW = w / plankCount;
    _roundedPath(ctx, x, y, w, h, 3);
    // Base wood color
    ctx.fillStyle = '#7C4F22';
    ctx.fill();
    // Per-plank fills with slight hue variation
    for (let p = 0; p < plankCount; p++) {
      const pxStart = x + p * plankW;
      const tone = (p * 37) % 4;
      const grad = ctx.createLinearGradient(pxStart, y, pxStart, y + h);
      const baseTop = ['#A06A30', '#996428', '#8E5A22', '#A26E32'][tone];
      const baseBot = ['#5A3A14', '#503210', '#48280D', '#553415'][tone];
      grad.addColorStop(0, baseTop);
      grad.addColorStop(1, baseBot);
      ctx.fillStyle = grad;
      ctx.fillRect(pxStart, y, plankW, h);
      // Plank seam (dark)
      if (p > 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pxStart, y);
        ctx.lineTo(pxStart, y + h);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(pxStart + 1, y);
        ctx.lineTo(pxStart + 1, y + h);
        ctx.stroke();
      }
      // Wood grain swirls per plank
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.7;
      for (let g = 0; g < 3; g++) {
        const gy = y + 3 + g * (h / 3);
        ctx.beginPath();
        ctx.moveTo(pxStart + 4, gy);
        ctx.bezierCurveTo(
          pxStart + plankW * 0.3, gy + (g === 1 ? 3 : -2),
          pxStart + plankW * 0.7, gy + (g === 1 ? -3 : 2),
          pxStart + plankW - 4, gy
        );
        ctx.stroke();
      }
      // Knot
      if ((p * 31) % 3 === 0) {
        const kx = pxStart + plankW * 0.5;
        const ky = y + h * 0.55;
        ctx.fillStyle = 'rgba(40,20,5,0.55)';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 3, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 2, 1.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Top-edge highlight (sun-warmed wood)
    ctx.fillStyle = '#C68A40';
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = 'rgba(255,200,140,0.45)';
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
    // Bottom dark edge
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y + h - 2, w, 2);
    // Outer outline
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.5;
    _roundedPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 3);
    ctx.stroke();

  } else if (style === 'cloud') {
    // Cloud with multi-bump silhouette, soft shading, drift wisp
    const drift = Math.sin(frame * 0.02 + x * 0.01) * 1.5;
    ctx.save();
    ctx.translate(0, drift);
    const cloudBumps = Math.ceil(w / 26);
    // Outer outline (slightly larger, dark)
    ctx.fillStyle = 'rgba(140,160,200,0.9)';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h);
    ctx.lineTo(x + w + 2, y + h);
    for (let ci = cloudBumps - 1; ci >= 0; ci--) {
      const cx2 = x + (ci + 0.5) * (w / cloudBumps);
      ctx.arc(cx2, y + 5, 16, 0, Math.PI, true);
    }
    ctx.closePath();
    ctx.fill();
    // Main fill
    const cgrad = ctx.createLinearGradient(0, y - 6, 0, y + h);
    cgrad.addColorStop(0, '#FFFFFF');
    cgrad.addColorStop(1, '#D8E2F2');
    ctx.fillStyle = cgrad;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    for (let ci = cloudBumps - 1; ci >= 0; ci--) {
      const cx2 = x + (ci + 0.5) * (w / cloudBumps);
      ctx.arc(cx2, y + 5, 14, 0, Math.PI, true);
    }
    ctx.closePath();
    ctx.fill();
    // Top sparkle highlights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (let ci = 0; ci < cloudBumps; ci++) {
      const cx2 = x + (ci + 0.5) * (w / cloudBumps);
      ctx.beginPath();
      ctx.arc(cx2 - 2, y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Bottom shading
    ctx.fillStyle = 'rgba(60,80,120,0.35)';
    ctx.fillRect(x + 2, y + h - 4, w - 4, 4);
    ctx.restore();
  }

  // Pass-through hint (subtle bright top stripe rather than dotted)
  if (passThrough) {
    ctx.save();
    const ptGrad = ctx.createLinearGradient(x, y - 2, x, y + 4);
    ptGrad.addColorStop(0, 'rgba(255,255,255,0)');
    ptGrad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    ptGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ptGrad;
    ctx.fillRect(x, y - 2, w, 4);
    ctx.restore();
  }

  ctx.restore();
}

// Character drop shadow
export function drawCharacterShadow(ctx, fighter, platforms) {
  let shadowY = C.H;
  for (const plat of platforms) {
    if (fighter.x > plat.x && fighter.x < plat.x + plat.w && fighter.y <= plat.y) {
      if (plat.y < shadowY) shadowY = plat.y;
    }
  }
  if (shadowY === C.H) return;
  const dist = shadowY - fighter.y;
  if (dist > 300) return;
  const alpha = C.SHADOW_ALPHA * (1 - dist / 300);
  const scale = 1 - dist / 400;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(fighter.x, shadowY, 20 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const STAGE_LIST = Object.keys(STAGES);
export function getStage(name) { return STAGES[name] || STAGES.downtown; }
