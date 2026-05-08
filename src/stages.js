import { C } from './constants.js';

// ── Platform definition ────────────────────────────────────────────────────
// passThrough: can be jumped through from below

function makePlatform(x, y, w, h = 20, passThrough = false, style = 'wood') {
  return { x, y, w, h, passThrough, style };
}

// ── Stage definitions ──────────────────────────────────────────────────────

export const STAGES = {
  downtown: {
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
      // Platforms
      this._drawPlatforms(ctx, this.platforms, frame);
      // Ambient particles: city light particles
      // (particles drawn by EffectManager)
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
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, 600 - b.h, b.w, b.h);
        // Windows
        ctx.fillStyle = 'rgba(255,220,100,0.15)';
        for (let wy = 600 - b.h + 10; wy < 590; wy += 18) {
          for (let wx = b.x + 6; wx < b.x + b.w - 10; wx += 14) {
            if (Math.sin(wx * 7 + wy * 3 + frame * 0.002) > 0.3) {
              ctx.fillRect(wx, wy, 8, 10);
            }
          }
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
      // AC units etc.
      for (const x of [50, 200, 400, 700, 900, 1100]) {
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(x, 565, 50, 35);
        ctx.strokeStyle = '#4A4A5A';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 565, 50, 35);
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

      this._drawPlatforms(ctx, this.platforms, frame);
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

      // Palm trees
      for (const px of [60, 1220]) {
        ctx.strokeStyle = '#6B4A1A';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, 600);
        ctx.quadraticCurveTo(px + 10, 480, px + 20, 380);
        ctx.stroke();
        // Leaves
        for (let l = 0; l < 6; l++) {
          const la = (l / 6) * Math.PI * 2 + frame * 0.01;
          ctx.strokeStyle = '#228B22';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(px + 20, 380);
          ctx.quadraticCurveTo(
            px + 20 + Math.cos(la) * 40, 380 + Math.sin(la) * 20,
            px + 20 + Math.cos(la) * 80, 380 + Math.sin(la) * 40 + 10
          );
          ctx.stroke();
        }
      }

      this._drawPlatforms(ctx, this.platforms, frame);
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
      ctx.fillStyle = '#1A1A2A';
      // Punching bags
      for (const bx of [100, 1180]) {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx - 15, 480, 30, 80, 10);
        } else {
          ctx.rect(bx - 15, 480, 30, 80);
        }
        ctx.fill();
        ctx.strokeStyle = '#2A2A3A';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Chain
        ctx.strokeStyle = '#3A3A4A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, 480);
        ctx.lineTo(bx, 440);
        ctx.stroke();
      }
      // Barbell rack
      ctx.fillStyle = '#2A2A3A';
      ctx.fillRect(560, 550, 160, 50);
      ctx.strokeStyle = '#3A3A4A';
      ctx.lineWidth = 2;
      ctx.strokeRect(560, 550, 160, 50);

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

      this._drawPlatforms(ctx, this.platforms, frame);
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
};

// ── Platform renderer ─────────────────────────────────────────────────────

function _drawPlatform(ctx, plat, frame) {
  const { x, y, w, h, passThrough, style } = plat;

  // Glow rim (so platforms are always readable)
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 8;

  ctx.save();

  if (style === 'concrete' || style === 'sand') {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (style === 'sand') {
      grad.addColorStop(0, '#D4A850');
      grad.addColorStop(1, '#A87830');
    } else {
      grad.addColorStop(0, '#555566');
      grad.addColorStop(1, '#333344');
    }
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#888899';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    // Top edge highlight
    ctx.fillStyle = style === 'sand' ? '#E8C870' : '#666677';
    ctx.fillRect(x, y, w, 3);

  } else if (style === 'metal') {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#8899AA');
    grad.addColorStop(0.4, '#667788');
    grad.addColorStop(1, '#445566');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#AABBCC';
    ctx.lineWidth = 2;
    // Rounded rectangle
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, 4);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();
    // Metal plate lines
    ctx.strokeStyle = 'rgba(200,220,240,0.3)';
    ctx.lineWidth = 1;
    for (let px2 = x + 20; px2 < x + w; px2 += 20) {
      ctx.beginPath();
      ctx.moveTo(px2, y);
      ctx.lineTo(px2, y + h);
      ctx.stroke();
    }
    // Top edge bright highlight
    ctx.fillStyle = '#AAC0D0';
    ctx.fillRect(x, y, w, 2);

  } else if (style === 'wood') {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#8B5A2B');
    grad.addColorStop(1, '#5C3A15');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#6B4520';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    // Wood grain
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let wgi = 0; wgi < 5; wgi++) {
      ctx.beginPath();
      ctx.moveTo(x + wgi * w / 4, y);
      ctx.bezierCurveTo(
        x + wgi * w / 4 + 10, y + h / 3,
        x + wgi * w / 4 - 5, y + h * 2 / 3,
        x + wgi * w / 4 + 5, y + h
      );
      ctx.stroke();
    }
    // Top highlight
    ctx.fillStyle = '#A06828';
    ctx.fillRect(x, y, w, 3);

  } else if (style === 'cloud') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = 'rgba(200,220,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const cloudBumps = Math.ceil(w / 30);
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    for (let ci = cloudBumps - 1; ci >= 0; ci--) {
      const cx2 = x + (ci + 0.5) * (w / cloudBumps);
      ctx.arc(cx2, y + 4, 14, 0, Math.PI, true);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Drop shadow below platform
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 4, y + h + 2, w, 5);

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Pass-through indicator (dotted top edge)
  if (passThrough) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
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
