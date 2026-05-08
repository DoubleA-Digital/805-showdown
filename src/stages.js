import { C } from './constants.js';

function makePlatform(x, y, w, h = 20, passThrough = false, style = 'wood') {
  return { x, y, w, h, passThrough, style };
}

export const STAGES = {

  // ── 1. SVHS CLASSROOM ────────────────────────────────────────────────────
  classroom: {
    name: 'CLASSROOM BRAWL',
    subname: 'Simi Valley High',
    bgColors: ['#F5E8C8', '#E8D5A0'],
    lightColor: '#FFD700',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),
      makePlatform(160, 455, 220, 18, true, 'wood'),
      makePlatform(900, 455, 220, 18, true, 'wood'),
      makePlatform(490, 355, 300, 18, true, 'wood'),
      makePlatform(55, 335, 120, 18, true, 'wood'),
      makePlatform(1105, 335, 120, 18, true, 'wood'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [{ x: 640, y: 600 }, { x: 270, y: 455 }, { x: 1010, y: 455 }],
    ambientColor: '#FFD700',
    ambientType: 'dust',
    draw(ctx, frame) {
      ctx.save();

      // Cream walls
      ctx.fillStyle = '#EAD9A8';
      ctx.fillRect(0, 0, 1280, 720);

      // Fluorescent ceiling lights (flickery)
      for (const lx of [160, 460, 760, 1060]) {
        const on = Math.sin(frame * 0.15 + lx) > -0.93;
        ctx.fillStyle = on ? '#FFFDE4' : '#D8D0B0';
        ctx.fillRect(lx, 0, 180, 14);
        if (on) {
          ctx.save();
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = '#FFFF88';
          ctx.fillRect(lx, 0, 180, 620);
          ctx.restore();
        }
      }

      // Whiteboard
      ctx.fillStyle = '#F6F6F0';
      ctx.strokeStyle = '#AAAAAA';
      ctx.lineWidth = 3;
      ctx.fillRect(180, 55, 920, 210);
      ctx.strokeRect(180, 55, 920, 210);
      // Tray
      ctx.fillStyle = '#999';
      ctx.fillRect(180, 263, 920, 8);
      // Board text
      ctx.fillStyle = '#1A55AA';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('f(x) = mx + b', 220, 105);
      ctx.fillText('Quiz Friday — Study!', 700, 105);
      ctx.fillStyle = '#1A8844';
      ctx.font = 'bold 28px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('THE 805 SHOWDOWN', 640, 158);
      ctx.fillStyle = '#CC2222';
      ctx.font = '17px Arial';
      ctx.fillText('No fighting in class. — Mr. Henderson', 640, 200);
      ctx.fillStyle = '#555';
      ctx.font = '13px Arial';
      ctx.fillText('Period 3 · AP Physics · Rm 214', 640, 235);

      // Marker tray items
      for (let m = 0; m < 5; m++) {
        const mx = 220 + m * 50;
        const cols = ['#CC2222','#1A55AA','#1A8844','#111','#CC5500'];
        ctx.fillStyle = cols[m];
        ctx.fillRect(mx, 264, 30, 7);
      }

      // Windows (left wall)
      for (const wy of [60, 220]) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, wy, 65, 130);
        ctx.strokeStyle = '#BBB';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, wy, 65, 130);
        // Panes
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#CCC';
        ctx.beginPath();
        ctx.moveTo(32, wy); ctx.lineTo(32, wy + 130);
        ctx.moveTo(0, wy + 65); ctx.lineTo(65, wy + 65);
        ctx.stroke();
        // CA mountains in window
        ctx.fillStyle = '#8899BB';
        ctx.beginPath();
        ctx.moveTo(0, wy + 125);
        ctx.lineTo(18, wy + 80);
        ctx.lineTo(35, wy + 98);
        ctx.lineTo(50, wy + 72);
        ctx.lineTo(65, wy + 110);
        ctx.lineTo(65, wy + 130);
        ctx.lineTo(0, wy + 130);
        ctx.fill();
      }

      // SVHS banner across top
      ctx.fillStyle = '#003366';
      ctx.fillRect(195, 18, 890, 32);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SIMI VALLEY HIGH SCHOOL  ·  HOME OF THE ROYAL RANGERS  ·  805', 640, 40);

      // American flag (top right)
      for (let s = 0; s < 13; s++) {
        ctx.fillStyle = s % 2 === 0 ? '#B22234' : '#FFFFFF';
        ctx.fillRect(1215, 55 + s * 9, 60, 9);
      }
      ctx.fillStyle = '#3C3B6E';
      ctx.fillRect(1215, 55, 24, 60);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(1213, 55); ctx.lineTo(1213, 120); ctx.stroke();

      // Background desks
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 2; row++) {
          const dx = 180 + col * 195, dy = 320 + row * 110;
          ctx.fillStyle = '#C8A870'; ctx.fillRect(dx, dy, 72, 46);
          ctx.strokeStyle = '#8B6940'; ctx.lineWidth = 1.5;
          ctx.strokeRect(dx, dy, 72, 46);
          // Book on desk
          ctx.fillStyle = '#CC3333'; ctx.fillRect(dx + 8, dy + 5, 22, 30);
          ctx.strokeStyle = '#881111'; ctx.lineWidth = 1; ctx.strokeRect(dx + 8, dy + 5, 22, 30);
          // Chair
          ctx.fillStyle = '#5A3A1A';
          ctx.fillRect(dx + 4, dy + 46, 64, 5);
          ctx.fillRect(dx + 10, dy + 51, 10, 22);
          ctx.fillRect(dx + 52, dy + 51, 10, 22);
        }
      }

      // Teacher's desk (front)
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(500, 295, 280, 55);
      ctx.strokeStyle = '#5A4010'; ctx.lineWidth = 2;
      ctx.strokeRect(500, 295, 280, 55);
      ctx.fillStyle = '#AA8822';
      ctx.font = '13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('MR. HENDERSON', 640, 327);

      // Tile floor
      for (let tx = 0; tx < 1280; tx += 64) {
        for (let ty = 575; ty < 720; ty += 48) {
          const dark = ((tx / 64 + ty / 48) % 2 === 0);
          ctx.fillStyle = dark ? '#D0BB88' : '#E8D4A0';
          ctx.fillRect(tx, ty, 64, 48);
          ctx.strokeStyle = '#B89A60'; ctx.lineWidth = 0.5;
          ctx.strokeRect(tx, ty, 64, 48);
        }
      }

      this._drawPlatforms(ctx, this.platforms, frame);
      ctx.restore();
    },
    _drawPlatforms(ctx, plats, frame) { for (const p of plats) _drawPlatform(ctx, p, frame); },
    getAmbientParticles(frame) {
      if (frame % 12 !== 0) return [];
      return [{ x: Math.random() * 1280, y: Math.random() * 400 + 80, color: 'rgba(255,240,180,0.12)' }];
    },
  },

  // ── 2. STARBUCKS BATHROOM ─────────────────────────────────────────────────
  starbucks: {
    name: 'SBUX BATHROOM',
    subname: 'Green & Questionable',
    bgColors: ['#00704A', '#004F35'],
    lightColor: '#00CC66',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),
      makePlatform(155, 458, 210, 18, true, 'metal'),
      makePlatform(915, 458, 210, 18, true, 'metal'),
      makePlatform(490, 356, 300, 18, true, 'metal'),
      makePlatform(50, 334, 125, 18, true, 'metal'),
      makePlatform(1105, 334, 125, 18, true, 'metal'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [{ x: 640, y: 600 }, { x: 260, y: 458 }, { x: 1020, y: 458 }],
    ambientColor: '#00AA66',
    ambientType: 'dust',
    draw(ctx, frame) {
      ctx.save();

      // Dark green walls
      ctx.fillStyle = '#00704A';
      ctx.fillRect(0, 0, 1280, 720);

      // Wall tile grid
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
      }

      // Large mirror at back
      ctx.fillStyle = '#0A1A22';
      ctx.strokeStyle = '#BBBBBB'; ctx.lineWidth = 5;
      ctx.fillRect(360, 70, 560, 230);
      ctx.strokeRect(360, 70, 560, 230);
      // Reflection highlight
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(365, 75); ctx.lineTo(580, 75); ctx.lineTo(395, 200); ctx.closePath();
      ctx.fill();
      ctx.restore();
      // "MIRROR" ghost text
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 90px Arial'; ctx.textAlign = 'center';
      ctx.fillText('MIRROR', 640, 210);
      ctx.restore();

      // Starbucks siren logo (left)
      ctx.save();
      ctx.translate(120, 210);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00704A';
      ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 56, Math.sin(a) * 56, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, -5, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00704A';
      ctx.beginPath(); ctx.arc(0, -5, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
      ctx.fillText('STARBUCKS COFFEE', 0, 86);
      ctx.restore();

      // Counter / vanity
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(300, 308, 680, 44);
      ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2;
      ctx.strokeRect(300, 308, 680, 44);
      // Counter legs
      for (const lx of [320, 560, 760, 960]) {
        ctx.fillStyle = '#AAAAAA'; ctx.fillRect(lx, 352, 10, 260);
      }
      // Sinks
      for (const sx of [430, 640, 850]) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.ellipse(sx, 322, 42, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#BBBBBB'; ctx.lineWidth = 2; ctx.stroke();
        // Drain
        ctx.fillStyle = '#999';
        ctx.beginPath(); ctx.arc(sx, 322, 6, 0, Math.PI * 2); ctx.fill();
        // Faucet
        ctx.strokeStyle = '#888'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx, 308); ctx.lineTo(sx, 296); ctx.lineTo(sx + 12, 291);
        ctx.stroke();
        // Drip animation
        const drip = (frame * 2.5 + sx) % 40;
        if (drip < 30) {
          ctx.fillStyle = 'rgba(150,220,255,0.55)';
          ctx.beginPath(); ctx.arc(sx + 12, 291 + drip, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Starbucks cups on counter
      for (const cx of [370, 730]) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(cx - 11, 308); ctx.lineTo(cx + 11, 308);
        ctx.lineTo(cx + 9, 277); ctx.lineTo(cx - 9, 277);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#00704A'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#00704A';
        ctx.beginPath();
        ctx.moveTo(cx - 11, 306); ctx.lineTo(cx + 11, 306);
        ctx.lineTo(cx + 10, 292); ctx.lineTo(cx - 10, 292);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath(); ctx.ellipse(cx, 277, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
        // Name on cup
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
        ctx.fillText('805', cx, 300);
      }

      // Paper towel dispenser
      ctx.fillStyle = '#D0D0D0';
      ctx.fillRect(1120, 190, 88, 130);
      ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.strokeRect(1120, 190, 88, 130);
      ctx.fillStyle = '#444'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
      ctx.fillText('PAPER', 1164, 255); ctx.fillText('TOWELS', 1164, 268);
      // Slot
      ctx.fillStyle = '#888'; ctx.fillRect(1130, 315, 68, 5);

      // Hand dryer
      ctx.fillStyle = '#BBBBBB'; ctx.fillRect(1120, 340, 88, 65);
      ctx.strokeRect(1120, 340, 88, 65);
      ctx.fillStyle = '#333'; ctx.fillText('XLERATOR', 1164, 378);
      // Airflow lines (animated)
      if (frame % 3 < 2) {
        ctx.strokeStyle = 'rgba(200,240,255,0.5)'; ctx.lineWidth = 2;
        for (let al = 0; al < 3; al++) {
          const ay = 400 + al * 8 + (frame * 2 % 10);
          ctx.beginPath(); ctx.moveTo(1130, ay); ctx.lineTo(1200, ay + 5); ctx.stroke();
        }
      }

      // Signs
      ctx.fillStyle = '#004433';
      ctx.fillRect(440, 268, 400, 32);
      ctx.strokeStyle = '#00AA66'; ctx.lineWidth = 2; ctx.strokeRect(440, 268, 400, 32);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('EMPLOYEES MUST WASH HANDS (PLEASE)', 640, 288);

      // Toilet stall doors (right side)
      for (const sx of [1000, 1060]) {
        ctx.fillStyle = '#005535';
        ctx.fillRect(sx, 200, 55, 200);
        ctx.strokeStyle = '#003322'; ctx.lineWidth = 3; ctx.strokeRect(sx, 200, 55, 200);
        ctx.fillStyle = '#004428'; ctx.fillRect(sx + 4, 200, 47, 196);
        ctx.fillStyle = '#888'; ctx.fillRect(sx + 44, 295, 8, 3);
      }

      // Checkerboard tile floor
      for (let tx = 0; tx < 1280; tx += 40) {
        for (let ty = 575; ty < 720; ty += 40) {
          ctx.fillStyle = ((tx / 40 + ty / 40) % 2 === 0) ? '#111111' : '#EEEEEE';
          ctx.fillRect(tx, ty, 40, 40);
        }
      }

      // Baseboard trim
      ctx.fillStyle = '#004F35'; ctx.fillRect(0, 572, 1280, 8);

      this._drawPlatforms(ctx, this.platforms, frame);
      ctx.restore();
    },
    _drawPlatforms(ctx, plats, frame) { for (const p of plats) _drawPlatform(ctx, p, frame); },
    getAmbientParticles(frame) {
      if (frame % 8 !== 0) return [];
      return [{ x: Math.random() * 1280, y: 300 + Math.random() * 300, color: 'rgba(0,200,100,0.06)' }];
    },
  },

  // ── 3. SVHS FOOTBALL FIELD ───────────────────────────────────────────────
  football: {
    name: 'ROYAL RANGERS FIELD',
    subname: 'Simi Valley, CA · 805',
    bgColors: ['#4A8FE0', '#87CEEB'],
    lightColor: '#FFD700',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'sand'),
      makePlatform(145, 458, 225, 18, true, 'metal'),
      makePlatform(910, 458, 225, 18, true, 'metal'),
      makePlatform(490, 355, 300, 18, true, 'metal'),
      makePlatform(45, 330, 130, 18, true, 'metal'),
      makePlatform(1105, 330, 130, 18, true, 'metal'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [{ x: 640, y: 600 }, { x: 258, y: 458 }, { x: 1022, y: 458 }],
    ambientColor: '#FFD700',
    ambientType: 'petals',
    draw(ctx, frame) {
      ctx.save();

      // Sky
      const skyG = ctx.createLinearGradient(0, 0, 0, 300);
      skyG.addColorStop(0, '#3A7FD0'); skyG.addColorStop(1, '#87CEEB');
      ctx.fillStyle = skyG; ctx.fillRect(0, 0, 1280, 300);

      // Simi Valley mountains
      const mData = [
        [0,255,220,155],[150,235,260,175],[360,215,200,185],
        [510,228,190,172],[640,208,230,192],[820,222,205,178],
        [990,238,195,162],[1130,248,165,152],
      ];
      for (const [mx, my, mw, mh] of mData) {
        ctx.fillStyle = '#7A8EA8';
        ctx.beginPath();
        ctx.moveTo(mx, my + mh);
        ctx.lineTo(mx + mw * 0.38, my);
        ctx.lineTo(mx + mw, my + mh);
        ctx.fill();
        // Snow cap
        if (mh > 170) {
          ctx.fillStyle = '#E8EEFF';
          ctx.beginPath();
          ctx.moveTo(mx + mw * 0.38, my);
          ctx.lineTo(mx + mw * 0.28, my + 28);
          ctx.lineTo(mx + mw * 0.48, my + 28);
          ctx.closePath(); ctx.fill();
        }
      }

      // Bleachers left
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = `hsl(220,10%,${38 + s * 3}%)`;
        ctx.fillRect(0, 285 + s * 28, 140, 28);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        ctx.strokeRect(0, 285 + s * 28, 140, 28);
      }
      // Crowd silhouettes left
      for (let c = 0; c < 14; c++) {
        const cx = 6 + c * 10, cy = 288 + (c % 6) * 28;
        ctx.fillStyle = ['#CC2222','#002266','#FFFFFF','#004400'][c % 4];
        ctx.beginPath(); ctx.arc(cx, cy, 5, Math.PI, 0); ctx.fill();
        ctx.fillRect(cx - 4, cy, 8, 9);
      }

      // Bleachers right
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = `hsl(220,10%,${38 + s * 3}%)`;
        ctx.fillRect(1140, 285 + s * 28, 140, 28);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        ctx.strokeRect(1140, 285 + s * 28, 140, 28);
      }
      for (let c = 0; c < 14; c++) {
        const cx = 1146 + c * 10, cy = 288 + (c % 6) * 28;
        ctx.fillStyle = ['#CC2222','#002266','#FFFFFF','#004400'][c % 4];
        ctx.beginPath(); ctx.arc(cx, cy, 5, Math.PI, 0); ctx.fill();
        ctx.fillRect(cx - 4, cy, 8, 9);
      }

      // Scoreboard
      ctx.fillStyle = '#111111';
      ctx.fillRect(468, 52, 344, 128);
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
      ctx.strokeRect(468, 52, 344, 128);
      ctx.fillStyle = '#880000'; ctx.fillRect(474, 58, 160, 58);
      ctx.fillStyle = '#000066'; ctx.fillRect(646, 58, 160, 58);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 42px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('14', 554, 100); ctx.fillText('21', 726, 100);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px Arial';
      ctx.fillText('SVHS ROYAL RANGERS', 640, 140);
      ctx.fillStyle = '#FFD700'; ctx.font = '11px Arial';
      ctx.fillText('805 SHOWDOWN · 4TH QTR · 2:47', 640, 158);
      // Scoreboard blinky lights
      const sb = 0.55 + Math.sin(frame * 0.09) * 0.2;
      ctx.save(); ctx.globalAlpha = sb; ctx.fillStyle = '#FFD700';
      for (let d = 0; d < 10; d++) {
        const a = (d / 10) * Math.PI * 2 + frame * 0.025;
        ctx.beginPath();
        ctx.arc(640 + Math.cos(a) * 178, 116 + Math.sin(a) * 70, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Field (green turf)
      const fieldG = ctx.createLinearGradient(0, 445, 0, 650);
      fieldG.addColorStop(0, '#2E7D32'); fieldG.addColorStop(0.5, '#388E3C'); fieldG.addColorStop(1, '#1B5E20');
      ctx.fillStyle = fieldG; ctx.fillRect(0, 445, 1280, 200);

      // Turf stripe pattern
      for (let s = 0; s < 10; s++) {
        if (s % 2 === 0) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(s * 128, 445, 128, 200); }
      }

      // Yard lines
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
      for (let yl = 0; yl <= 1280; yl += 128) {
        ctx.beginPath(); ctx.moveTo(yl, 445); ctx.lineTo(yl, 645); ctx.stroke();
      }
      // Yard numbers
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
      const nums = ['G','10','20','30','40','50','40','30','20','10','G'];
      for (let i = 0; i < nums.length; i++) ctx.fillText(nums[i], 64 + i * 128, 508);

      // End zone text
      ctx.save(); ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 52px "Arial Black", Arial'; ctx.textAlign = 'center';
      ctx.fillText('805', 64, 582);
      ctx.fillStyle = '#003366'; ctx.font = 'bold 18px Arial';
      ctx.fillText('SVHS', 64, 610);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 52px "Arial Black", Arial';
      ctx.fillText('805', 1216, 582);
      ctx.fillStyle = '#003366'; ctx.font = 'bold 18px Arial';
      ctx.fillText('SVHS', 1216, 610);
      ctx.restore();

      // Goal posts (yellow)
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      // Left post
      ctx.beginPath();
      ctx.moveTo(65, 445); ctx.lineTo(65, 350);
      ctx.moveTo(65, 400); ctx.lineTo(28, 400);
      ctx.moveTo(65, 400); ctx.lineTo(102, 400);
      ctx.stroke();
      // Right post
      ctx.beginPath();
      ctx.moveTo(1215, 445); ctx.lineTo(1215, 350);
      ctx.moveTo(1215, 400); ctx.lineTo(1178, 400);
      ctx.moveTo(1215, 400); ctx.lineTo(1252, 400);
      ctx.stroke();

      // Bouncing cheerleader silhouettes
      const bmc = Math.abs(Math.sin(frame * 0.1)) * 8;
      ctx.fillStyle = '#CC2222';
      for (let c = 0; c < 6; c++) {
        const bx = 120 + c * 170, by = 436 - bmc * (c % 2 === 0 ? 1 : 0.6);
        ctx.beginPath(); ctx.arc(bx, by, 9, Math.PI, 0); ctx.fill();
        ctx.fillRect(bx - 7, by, 14, 12);
      }

      this._drawPlatforms(ctx, this.platforms, frame);
      ctx.restore();
    },
    _drawPlatforms(ctx, plats, frame) { for (const p of plats) _drawPlatform(ctx, p, frame); },
    getAmbientParticles(frame) {
      if (frame % 5 !== 0) return [];
      return [{ x: Math.random() * 1280, y: 420 + Math.random() * 180, color: 'rgba(255,215,50,0.28)' }];
    },
  },

  // ── 4. SVHS PARKING LOT ──────────────────────────────────────────────────
  parking: {
    name: 'STUDENT PARKING',
    subname: 'SVHS Lot B · 805',
    bgColors: ['#87CEEB', '#5BA3E0'],
    lightColor: '#FFEE88',
    platforms: [
      makePlatform(0, 600, 1280, 40, false, 'concrete'),
      makePlatform(155, 455, 210, 18, true, 'metal'),
      makePlatform(915, 455, 210, 18, true, 'metal'),
      makePlatform(490, 353, 300, 18, true, 'metal'),
      makePlatform(50, 330, 130, 18, true, 'metal'),
      makePlatform(1100, 330, 130, 18, true, 'metal'),
    ],
    spawnPoints: [{ x: 420, y: 540 }, { x: 860, y: 540 }],
    weaponSpawnPoints: [{ x: 640, y: 600 }, { x: 260, y: 455 }, { x: 1020, y: 455 }],
    ambientColor: '#FFEE88',
    ambientType: 'dust',
    draw(ctx, frame) {
      ctx.save();

      // California sky
      const skyG = ctx.createLinearGradient(0, 0, 0, 270);
      skyG.addColorStop(0, '#3E9FE0'); skyG.addColorStop(1, '#87CEEB');
      ctx.fillStyle = skyG; ctx.fillRect(0, 0, 1280, 270);

      // Clouds
      for (let c = 0; c < 4; c++) {
        const cx = ((frame * 0.12 + c * 330) % 1400) - 100, cy = 55 + c * 38;
        ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 85, 22, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 60, cy - 10, 60, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 35, cy - 6, 55, 16, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }

      // SVHS building silhouette
      ctx.fillStyle = '#C8A870';
      ctx.fillRect(280, 140, 720, 320);
      // Building windows
      for (let wr = 0; wr < 3; wr++) {
        for (let wc = 0; wc < 8; wc++) {
          const wx = 318 + wc * 78, wy = 165 + wr * 72;
          const litIdx = (wr * 8 + wc + Math.floor(frame / 180)) % 12;
          ctx.fillStyle = litIdx < 2 ? '#EEDD88' : '#A8C8E8';
          ctx.fillRect(wx, wy, 52, 46);
          ctx.strokeStyle = '#A07040'; ctx.lineWidth = 1.5;
          ctx.strokeRect(wx, wy, 52, 46);
        }
      }
      // Building header
      ctx.fillStyle = '#003366'; ctx.fillRect(295, 148, 690, 30);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 17px "Arial Black", Arial';
      ctx.textAlign = 'center'; ctx.fillText('SIMI VALLEY HIGH SCHOOL', 640, 168);
      // Main entrance doors
      ctx.fillStyle = '#443322';
      ctx.fillRect(600, 358, 80, 102);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.strokeRect(600, 358, 80, 102);
      ctx.fillStyle = '#2A2010'; ctx.fillRect(604, 362, 34, 96);
      ctx.fillRect(642, 362, 34, 96);
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(620, 412); ctx.lineTo(630, 412);
      ctx.moveTo(650, 412); ctx.lineTo(660, 412);
      ctx.stroke();
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px "Arial Black", Arial'; ctx.textAlign = 'center';
      ctx.fillText('805', 640, 354);

      // Asphalt
      ctx.fillStyle = '#2A2A2A'; ctx.fillRect(0, 455, 1280, 200);

      // Parking lines
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
      for (let px = 55; px < 1230; px += 82) {
        ctx.beginPath(); ctx.moveTo(px, 455); ctx.lineTo(px, 600); ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(30, 455); ctx.lineTo(1250, 455);
      ctx.moveTo(30, 600); ctx.lineTo(1250, 600);
      ctx.stroke();

      // "STUDENT PARKING" painted on asphalt
      ctx.save(); ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 26px "Arial Black", Arial'; ctx.textAlign = 'center';
      ctx.fillText('STUDENT PARKING — LOT B', 640, 548);
      ctx.restore();

      // Parked cars
      const carCols = ['#BB2222','#2233BB','#228833','#999999','#AA6622','#111111','#CC8800'];
      for (let ci = 0; ci < 6; ci++) {
        const cx = 55 + ci * 205, cy = 457;
        ctx.fillStyle = carCols[ci % carCols.length];
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx + 2, cy, 152, 56, 7);
        else ctx.rect(cx + 2, cy, 152, 56);
        ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        // Windshield
        ctx.fillStyle = 'rgba(160,210,255,0.55)';
        ctx.fillRect(cx + 28, cy + 6, 96, 26);
        // Wheels
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 56, 13, 0, Math.PI * 2);
        ctx.arc(cx + 128, cy + 56, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 56, 6, 0, Math.PI * 2);
        ctx.arc(cx + 128, cy + 56, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Speed bumps
      for (const sbx of [245, 640, 1035]) {
        ctx.fillStyle = '#FFE000';
        ctx.fillRect(sbx - 45, 593, 90, 10);
        ctx.fillStyle = '#111111';
        for (let s = 0; s < 6; s++) ctx.fillRect(sbx - 45 + s * 15, 593, 8, 10);
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
        ctx.strokeRect(sbx - 45, 593, 90, 10);
      }

      // Palm trees
      for (const ptx of [18, 1262]) {
        ctx.strokeStyle = '#8B6A2A'; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ptx, 600);
        ctx.bezierCurveTo(ptx + 5, 500, ptx - 4, 415, ptx + 8, 330);
        ctx.stroke();
        for (let l = 0; l < 7; l++) {
          const la = (l / 7) * Math.PI * 2 + Math.sin(frame * 0.018) * 0.08;
          ctx.strokeStyle = '#2E7D32'; ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(ptx + 8, 330);
          ctx.quadraticCurveTo(
            ptx + 8 + Math.cos(la) * 38, 330 + Math.sin(la) * 20,
            ptx + 8 + Math.cos(la) * 75, 330 + Math.sin(la) * 44 + 14
          );
          ctx.stroke();
        }
      }

      // Lamp posts
      for (const lpx of [200, 500, 800, 1080]) {
        ctx.strokeStyle = '#777'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(lpx, 600); ctx.lineTo(lpx, 355); ctx.lineTo(lpx + 28, 342); ctx.stroke();
        const gp = 0.45 + Math.sin(frame * 0.035 + lpx) * 0.1;
        ctx.save(); ctx.globalAlpha = gp;
        const lg = ctx.createRadialGradient(lpx + 28, 342, 4, lpx + 28, 342, 75);
        lg.addColorStop(0, 'rgba(255,240,140,0.85)'); lg.addColorStop(1, 'rgba(255,240,140,0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(lpx + 28, 342, 75, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#FFE080';
        ctx.beginPath(); ctx.arc(lpx + 28, 342, 8, 0, Math.PI * 2); ctx.fill();
      }

      // Sign: NO PARKING STAFF ONLY
      ctx.fillStyle = '#CC2222';
      ctx.fillRect(585, 365, 210, 30);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(585, 365, 210, 30);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('NO PARKING — STAFF ONLY', 690, 385);

      // Sign: LOT B
      ctx.fillStyle = '#003366';
      ctx.fillRect(890, 365, 110, 30);
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.strokeRect(890, 365, 110, 30);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
      ctx.fillText('LOT B · SVHS', 945, 385);

      this._drawPlatforms(ctx, this.platforms, frame);
      ctx.restore();
    },
    _drawPlatforms(ctx, plats, frame) { for (const p of plats) _drawPlatform(ctx, p, frame); },
    getAmbientParticles(frame) {
      if (frame % 7 !== 0) return [];
      return [{ x: Math.random() * 1280, y: 380 + Math.random() * 220, color: 'rgba(255,240,100,0.14)' }];
    },
  },
};

// ── Platform renderer ────────────────────────────────────────────────────────

function _drawPlatform(ctx, plat, frame) {
  const { x, y, w, h, passThrough, style } = plat;

  ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
  ctx.save();

  if (style === 'concrete' || style === 'sand') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    if (style === 'sand') { g.addColorStop(0, '#D4A850'); g.addColorStop(1, '#A87830'); }
    else { g.addColorStop(0, '#555566'); g.addColorStop(1, '#333344'); }
    ctx.fillStyle = g; ctx.strokeStyle = '#888899'; ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = style === 'sand' ? '#E8C870' : '#666677';
    ctx.fillRect(x, y, w, 3);

  } else if (style === 'metal') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#8899AA'); g.addColorStop(0.4, '#667788'); g.addColorStop(1, '#445566');
    ctx.fillStyle = g; ctx.strokeStyle = '#AABBCC'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4); else ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,220,240,0.3)'; ctx.lineWidth = 1;
    for (let px = x + 20; px < x + w; px += 20) {
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
    }
    ctx.fillStyle = '#AAC0D0'; ctx.fillRect(x, y, w, 2);

  } else if (style === 'wood') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#8B5A2B'); g.addColorStop(1, '#5C3A15');
    ctx.fillStyle = g; ctx.strokeStyle = '#6B4520'; ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * w / 4, y);
      ctx.bezierCurveTo(x + i * w / 4 + 10, y + h / 3, x + i * w / 4 - 5, y + h * 2 / 3, x + i * w / 4 + 5, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = '#A06828'; ctx.fillRect(x, y, w, 3);

  } else if (style === 'cloud') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = 'rgba(200,220,255,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath();
    const bumps = Math.ceil(w / 30);
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h);
    for (let ci = bumps - 1; ci >= 0; ci--) {
      ctx.arc(x + (ci + 0.5) * (w / bumps), y + 4, 14, 0, Math.PI, true);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000'; ctx.fillRect(x + 4, y + h + 2, w, 5);
  ctx.restore();
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

  if (passThrough) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
}

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
  ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(fighter.x, shadowY, 20 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.restore();
}

export const STAGE_LIST = Object.keys(STAGES);
export function getStage(name) { return STAGES[name] || STAGES.classroom; }
