import { C } from './constants.js';
import { drawPortrait } from './renderer.js';

export class HUD {
  constructor() {
    this.damageFlashTimer = { p1: 0, p2: 0 };
    this.damageScale = { p1: 1, p2: 1 };
    this.stockLostAnim = { p1: 0, p2: 0 };
    this.prevStocks = { p1: C.STOCKS, p2: C.STOCKS };
    this.hitRumble = { p1: 0, p2: 0 };
  }

  notifyDamage(player) {
    this.damageFlashTimer[player] = 22;
    this.hitRumble[player] = 8;
  }

  update(stocks) {
    for (const p of ['p1', 'p2']) {
      if (this.damageFlashTimer[p] > 0) this.damageFlashTimer[p]--;
      if (this.hitRumble[p] > 0) this.hitRumble[p]--;
      if (stocks && this.prevStocks[p] > stocks[p]) {
        this.stockLostAnim[p] = 30;
        this.prevStocks[p] = stocks[p];
      }
      if (this.stockLostAnim[p] > 0) this.stockLostAnim[p]--;
    }
  }

  draw(ctx, p1, p2, timer, stocks) {
    this._drawHUDBar(ctx);
    this._drawPlayerPanel(ctx, p1, 'p1', 30, stocks.p1);
    this._drawPlayerPanel(ctx, p2, 'p2', C.W - 30, stocks.p2);
    this._drawTimer(ctx, timer);
  }

  _drawHUDBar(ctx) {
    // Dark gradient bar at bottom
    ctx.save();
    const barGrad = ctx.createLinearGradient(0, 628, 0, 720);
    barGrad.addColorStop(0, 'rgba(0,0,0,0)');
    barGrad.addColorStop(0.25, 'rgba(5,5,20,0.92)');
    barGrad.addColorStop(1, 'rgba(5,5,20,0.98)');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 628, C.W, 92);

    // Decorative center line
    ctx.strokeStyle = 'rgba(255,200,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(C.W / 2 - 80, 632);
    ctx.lineTo(C.W / 2 + 80, 632);
    ctx.stroke();
    ctx.restore();
  }

  _drawPlayerPanel(ctx, fighter, player, anchorX, stocksLeft) {
    const isP1 = player === 'p1';
    const flash = this.damageFlashTimer[player] > 0;
    const flashT = this.damageFlashTimer[player] / 22;
    const rumble = this.hitRumble[player] > 0 ? (Math.random() - 0.5) * 3 : 0;
    const aura = fighter.palette?.aura || '#FF8C00';
    const pColor = isP1 ? '#4488FF' : '#FF4444';

    ctx.save();
    ctx.translate(isP1 ? 0 : rumble, rumble);

    // === Panel Background ===
    const panelW = 320;
    const panelH = 80;
    const panelX = isP1 ? anchorX : anchorX - panelW;
    const panelY = 634;

    // Panel backdrop
    ctx.save();
    ctx.globalAlpha = 0.85;
    const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
    if (isP1) {
      panelGrad.addColorStop(0, '#0A0A25');
      panelGrad.addColorStop(1, 'rgba(10,10,35,0)');
    } else {
      panelGrad.addColorStop(0, 'rgba(35,10,10,0)');
      panelGrad.addColorStop(1, '#250A0A');
    }
    ctx.fillStyle = panelGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(panelX, panelY, panelW, panelH, [8, isP1 ? 8 : 0, isP1 ? 0 : 8, 8]);
    else ctx.rect(panelX, panelY, panelW, panelH);
    ctx.fill();
    ctx.restore();

    // Player color accent bar
    ctx.save();
    ctx.fillStyle = pColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(isP1 ? panelX : panelX + panelW - 4, panelY, 4, panelH);
    ctx.restore();

    // === Portrait Circle ===
    const portraitX = isP1 ? panelX + 42 : panelX + panelW - 42;
    const portraitY = panelY + panelH / 2;
    const pRadius = 33;

    // Aura glow behind portrait
    ctx.save();
    ctx.globalAlpha = 0.4 + flashT * 0.3;
    const pGlow = ctx.createRadialGradient(portraitX, portraitY, 5, portraitX, portraitY, pRadius + 12);
    pGlow.addColorStop(0, aura + 'AA');
    pGlow.addColorStop(1, aura + '00');
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, pRadius + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Portrait circle bg
    ctx.save();
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, pRadius + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, pRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();

    // Clip and draw portrait
    ctx.save();
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, pRadius, 0, Math.PI * 2);
    ctx.clip();
    if (typeof drawPortrait === 'function') {
      drawPortrait(ctx, fighter, portraitX, portraitY, pRadius);
    }
    ctx.restore();

    // Portrait ring
    ctx.beginPath();
    ctx.arc(portraitX, portraitY, pRadius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = flash ? '#FF4444' : pColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // === Name Tag ===
    const textX = isP1 ? portraitX + pRadius + 12 : portraitX - pRadius - 12;
    const textAnchor = isP1 ? 'left' : 'right';

    ctx.font = 'bold 11px "Arial Black", Arial';
    ctx.textAlign = textAnchor;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = pColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText((fighter.name || 'PLAYER').toUpperCase(), textX, panelY + 16);
    ctx.fillText((fighter.name || 'PLAYER').toUpperCase(), textX, panelY + 16);

    // === Damage Percentage ===
    const dmg = Math.floor(fighter.damage || 0);
    const pct = `${dmg}%`;
    // Color based on damage level
    let dmgColor = '#FFFFFF';
    if (dmg > 150) dmgColor = '#FF2222';
    else if (dmg > 100) dmgColor = '#FF8800';
    else if (dmg > 50) dmgColor = '#FFDD00';
    if (flash) dmgColor = '#FF2222';

    const dmgFontSize = flash ? 52 : 46;
    ctx.font = `900 ${dmgFontSize}px "Arial Black", Arial`;
    ctx.textAlign = textAnchor;
    // Shadow for depth
    ctx.save();
    ctx.shadowColor = dmgColor;
    ctx.shadowBlur = flash ? 20 : 8;
    ctx.fillStyle = dmgColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(pct, textX + (isP1 ? 0 : 0), panelY + 60);
    ctx.fillText(pct, textX + (isP1 ? 0 : 0), panelY + 60);
    ctx.restore();

    // === Stock Icons ===
    const stockY = panelY + panelH + 8;
    const stockSpacing = 20;
    const totalStockW = C.STOCKS * stockSpacing;
    const stockStartX = isP1 ? panelX + 8 : panelX + panelW - 8 - totalStockW;

    for (let i = 0; i < C.STOCKS; i++) {
      const sx = stockStartX + i * stockSpacing + 8;
      const alive = i < stocksLeft;
      const isLast = stocksLeft === 1 && alive;
      const pulse = isLast ? (0.7 + Math.sin(Date.now() * 0.008) * 0.3) : 1;

      if (alive) {
        // Glowing orb stock
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = aura;
        ctx.shadowBlur = isLast ? 14 : 6;
        // Outer glow
        ctx.beginPath();
        ctx.arc(sx, stockY - 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        // Orb fill
        const orbGrad = ctx.createRadialGradient(sx - 2, stockY - 4, 1, sx, stockY - 2, 8);
        orbGrad.addColorStop(0, lightenColor(aura, 60));
        orbGrad.addColorStop(0.5, aura);
        orbGrad.addColorStop(1, darkenColor(aura, 40));
        ctx.beginPath();
        ctx.arc(sx, stockY - 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();
        // Shine
        ctx.beginPath();
        ctx.arc(sx - 2, stockY - 5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
        ctx.restore();
      } else {
        // Lost stock: dark cracked orb
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(sx, stockY - 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Crack lines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - 2, stockY - 7); ctx.lineTo(sx + 3, stockY + 3);
        ctx.moveTo(sx - 4, stockY - 2); ctx.lineTo(sx + 2, stockY + 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // === Weapon Indicator ===
    if (fighter.currentWeapon) {
      const weaponY = panelY - 20;
      ctx.save();
      ctx.globalAlpha = 0.9;
      // Weapon name badge
      const wName = fighter.currentWeapon.def.name;
      ctx.font = 'bold 12px "Arial Black"';
      const wW = ctx.measureText(wName).width + 20;
      const wX = isP1 ? panelX + 4 : panelX + panelW - wW - 4;
      // Badge bg
      ctx.fillStyle = fighter.currentWeapon.def.glowColor;
      ctx.globalAlpha = 0.25;
      if (ctx.roundRect) ctx.roundRect(wX, weaponY - 14, wW, 18, 4);
      else ctx.rect(wX, weaponY - 14, wW, 18);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Text
      ctx.textAlign = 'center';
      ctx.fillStyle = fighter.currentWeapon.def.glowColor;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(`⚔ ${wName}`, wX + wW / 2, weaponY);
      ctx.fillText(`⚔ ${wName}`, wX + wW / 2, weaponY);
      ctx.restore();
    }

    // === Shield Bar ===
    if (fighter.isShielding && fighter.shieldHP > 0) {
      const pct2 = fighter.shieldHP / C.SHIELD_MAX;
      const barX = isP1 ? textX : textX - 100;
      const barY = panelY + 68;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, 100, 6);
      const shieldGrad = ctx.createLinearGradient(barX, barY, barX + 100, barY);
      shieldGrad.addColorStop(0, `hsl(${200 + pct2 * 40}, 90%, 65%)`);
      shieldGrad.addColorStop(1, `hsl(${140 * pct2}, 90%, 50%)`);
      ctx.fillStyle = shieldGrad;
      ctx.fillRect(barX, barY, 100 * pct2, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, 100, 6);
    }

    ctx.restore();
  }

  _drawTimer(ctx, timer) {
    if (timer === null || timer === undefined) return;
    const secs = Math.ceil(timer / C.FPS);
    const urgent = secs <= 10;

    // Timer backdrop at top-center
    const timerX = C.W / 2;
    const timerY = 38;

    // Dark circle backdrop
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(timerX, timerY, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#050510';
    ctx.fill();
    ctx.strokeStyle = urgent ? '#FF3030' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = urgent ? 2.5 : 1.5;
    if (urgent) {
      ctx.shadowColor = '#FF3030';
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.restore();

    // Time digits
    const txt = secs > 0 ? String(secs) : '0';
    ctx.save();
    if (urgent) {
      ctx.shadowColor = '#FF3030';
      ctx.shadowBlur = 15;
    }
    ctx.font = `900 32px "Arial Black", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(txt, timerX, timerY);
    ctx.fillStyle = urgent ? '#FF3030' : '#fff';
    ctx.fillText(txt, timerX, timerY);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}

// Color utility helpers
function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}
