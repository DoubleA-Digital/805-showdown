import { C } from './constants.js';

// ── Particle System ──────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.life = life; this.maxLife = life;
    this.gravity = gravity;
    this.alpha = 1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.96;
    this.life--;
    this.alpha = this.life / this.maxLife;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class StarParticle extends Particle {
  constructor(x, y, vx, vy, color, size, life) {
    super(x, y, vx, vy, color, size, life);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.3;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    this._drawStar(ctx, 0, 0, 5, this.size * this.alpha, this.size * 0.45 * this.alpha);
    ctx.restore();
    this.rotation += this.rotSpeed;
  }
  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Attack Trail ──────────────────────────────────────────────────────────────

// Sword/attack arc trail
class AttackTrail {
  constructor(x, y, vx, vy, color, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = 12;
    this.maxLife = 12;
    this.alpha = 1;
  }
  get alive() { return this.life > 0; }
  update() {
    this.x += this.vx * 0.5;
    this.y += this.vy * 0.5;
    this.life--;
    this.alpha = this.life / this.maxLife;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

// ── Hit Effect ────────────────────────────────────────────────────────────────

class HitEffect {
  constructor(x, y, type, power) {
    this.x = x; this.y = y; this.type = type; this.power = power;
    this.frame = 0;
    this.maxFrame = power === 'heavy' ? 18 : power === 'light' ? 12 : 22;
    this.scale = power === 'heavy' ? 1.6 : power === 'light' ? 1.0 : 2.0;
  }
  get alive() { return this.frame < this.maxFrame; }
  update() { this.frame++; }
  draw(ctx) {
    const t = this.frame / this.maxFrame;
    const s = this.scale * (1 - t * 0.4);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 1 - t;
    if (this.type === 'punch') this._drawBurst(ctx, s);
    else if (this.type === 'slash') this._drawSlash(ctx, s);
    else if (this.type === 'explosion') this._drawExplosion(ctx, s);
    else if (this.type === 'sparkle') this._drawSparkle(ctx, s);
    else this._drawBurst(ctx, s);
    ctx.restore();
  }
  _drawBurst(ctx, s) {
    // Outer ring flash
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 35 * s, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFE000';
    ctx.lineWidth = 4 * s;
    ctx.stroke();
    ctx.restore();

    // Directional rays (non-uniform, more organic)
    const rays = 10;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + this.frame * 0.05;
      const len = (22 + (i % 3) * 12) * s;
      const inner = 6 * s;
      ctx.save();
      ctx.strokeStyle = i % 2 === 0 ? '#FFE000' : '#FF8C00';
      ctx.lineWidth = (5 - (i % 3)) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
      ctx.restore();
    }

    // Core flash
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 18 * s);
    coreGrad.addColorStop(0, '#FFFFFF');
    coreGrad.addColorStop(0.3, '#FFE000');
    coreGrad.addColorStop(1, '#FF8C00AA');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  _drawSlash(ctx, s) {
    // Multiple arc slashes for depth
    const colors = ['#FF6666', '#FF2222', '#FFB0B0'];
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 6;
      ctx.save();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = (8 - i * 2) * s;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 8 * s;
      ctx.beginPath();
      ctx.moveTo(-38 * s + offset, -28 * s);
      ctx.quadraticCurveTo(0 + offset, -5 * s, 38 * s + offset, 28 * s);
      ctx.stroke();
      ctx.restore();
    }
    // Sparkle hits along the slash
    for (let i = 0; i < 5; i++) {
      const px = lerp(-38, 38, i / 4) * s;
      const py = lerp(-28, 28, i / 4) * s;
      ctx.beginPath();
      ctx.arc(px, py, (3 + i % 2 * 2) * s, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  }
  _drawExplosion(ctx, s) {
    // Outer shockwave ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, (38 + this.frame * 3) * s, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 3 * s;
    ctx.globalAlpha = Math.max(0, ctx.globalAlpha - 0.3);
    ctx.stroke();
    ctx.restore();

    // Jagged explosion shape
    const pts = 14;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const baseR = i % 2 === 0 ? 32 : 20;
      const r = (baseR + Math.sin(i * 2.3 + this.frame) * 6) * s;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const expGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 35 * s);
    expGrad.addColorStop(0, '#FFFFFF');
    expGrad.addColorStop(0.2, '#FFE000');
    expGrad.addColorStop(0.6, '#FF6600');
    expGrad.addColorStop(1, '#FF220000');
    ctx.fillStyle = expGrad;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }
  _drawSparkle(ctx, s) {
    const colors = ['#FF69B4', '#DD00FF', '#9B59B6', '#FFD700', '#00EEFF', '#FF4488'];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + this.frame * 0.08;
      const r = (26 + (i % 3) * 8) * s;
      const size = (6 + i % 3 * 3) * s;
      const c = colors[i % colors.length];
      ctx.save();
      ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
      // 4-point star
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const sa = j * Math.PI / 2 + this.frame * 0.1;
        const outer = size;
        const inner = size * 0.35;
        if (j === 0) ctx.moveTo(Math.cos(sa) * outer, Math.sin(sa) * outer);
        else ctx.lineTo(Math.cos(sa) * outer, Math.sin(sa) * outer);
        const sa2 = sa + Math.PI / 4;
        ctx.lineTo(Math.cos(sa2) * inner, Math.sin(sa2) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Center flash
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 10 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }
}

// ── Damage Number ─────────────────────────────────────────────────────────────

class DamageNumber {
  constructor(x, y, amount) {
    this.x = x; this.y = y;
    this.amount = `+${amount}%`;
    this.vy = -2.5;
    this.life = C.DAMAGE_NUM_DURATION;
    this.maxLife = this.life;
    this.scale = 1.4;
  }
  get alive() { return this.life > 0; }
  update() {
    this.y += this.vy;
    this.vy *= 0.95;
    this.life--;
    if (this.life > this.maxLife - 8) this.scale = 1.4 + (this.maxLife - this.life) * 0.05;
    else this.scale = Math.max(1.0, this.scale * 0.97);
  }
  draw(ctx) {
    const alpha = Math.min(1, this.life / (this.maxLife * 0.5));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    // Shadow
    ctx.font = `900 24px "Arial Black", Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(this.amount, 0, 0);
    // Gradient fill: white -> red
    const textGrad = ctx.createLinearGradient(0, -20, 0, 4);
    textGrad.addColorStop(0, '#FFFFFF');
    textGrad.addColorStop(0.4, '#FF6600');
    textGrad.addColorStop(1, '#FF2200');
    ctx.fillStyle = textGrad;
    ctx.fillText(this.amount, 0, 0);
    ctx.restore();
    ctx.restore();
  }
}

// ── Announcer Text ────────────────────────────────────────────────────────────

class AnnouncerText {
  constructor(text, color = '#FFE000', subtext = '') {
    this.text = text;
    this.subtext = subtext;
    this.color = color;
    this.life = C.ANNOUNCER_DURATION;
    this.maxLife = this.life;
    this.scaleX = 0.1;
    this.scaleY = 3.0;
  }
  get alive() { return this.life > 0; }
  update() {
    this.life--;
    const t = 1 - this.life / this.maxLife;
    // Slam in
    if (t < 0.15) {
      const p = t / 0.15;
      this.scaleX = 0.1 + p * 0.9;
      this.scaleY = 3.0 - p * 2.0;
    } else if (t < 0.7) {
      this.scaleX = 1.0;
      this.scaleY = 1.0;
    } else {
      // Fade out
      this.scaleX = 1.0;
      this.scaleY = 1.0;
    }
  }
  draw(ctx) {
    const alpha = this.life < 25 ? this.life / 25 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(640, 360);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.textAlign = 'center';
    ctx.font = `900 ${80}px "Arial Black", Arial`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.text, 0, 0);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
    if (this.subtext) {
      ctx.font = `bold 30px "Arial Black", Arial`;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.subtext, 0, 50);
      ctx.fillStyle = '#fff';
      ctx.fillText(this.subtext, 0, 50);
    }
    ctx.restore();
  }
}

// ── Screen Shake ──────────────────────────────────────────────────────────────

export class ScreenShake {
  constructor() { this.x = 0; this.y = 0; this.magnitude = 0; }
  add(mag) { this.magnitude = Math.max(this.magnitude, mag); }
  update() {
    if (this.magnitude < 0.1) { this.x = 0; this.y = 0; return; }
    this.x = (Math.random() - 0.5) * this.magnitude * 2;
    this.y = (Math.random() - 0.5) * this.magnitude * 2;
    this.magnitude *= C.SHAKE_DECAY;
  }
}

// ── Effect Manager ────────────────────────────────────────────────────────────

export class EffectManager {
  constructor() {
    this.particles = [];
    this.trails = [];
    this.hitEffects = [];
    this.damageNumbers = [];
    this.announcerTexts = [];
    this.shake = new ScreenShake();
    this.koFlash = 0;
  }

  spawnHitEffect(x, y, type, power) {
    this.hitEffects.push(new HitEffect(x, y, type, power));
    // Add particles
    const count = power === 'heavy' ? 16 : power === 'light' ? 6 : 24;
    const colors = power === 'heavy' ? ['#FF8C00', '#FFE000', '#FF4500'] :
                   power === 'light' ? ['#FFE000', '#FFF'] : ['#FF69B4', '#9B59B6', '#FFE000'];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.particles.push(new StarParticle(x, y,
        Math.cos(a) * spd, Math.sin(a) * spd,
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 6,
        20 + Math.random() * 20,
      ));
    }
    // Screen shake
    if (power === 'heavy') this.shake.add(C.SHAKE_HEAVY);
    else if (power === 'light') this.shake.add(C.SHAKE_LIGHT);
    else this.shake.add(C.SHAKE_SIG);
  }

  spawnDustPuff(x, y) {
    for (let i = 0; i < C.DUST_PARTICLES; i++) {
      const a = -Math.PI + Math.random() * Math.PI;
      this.particles.push(new Particle(x, y,
        Math.cos(a) * (1 + Math.random() * 2),
        Math.sin(a) * (1 + Math.random() * 1.5) - 1,
        `rgba(200,200,180,${0.5 + Math.random() * 0.4})`,
        4 + Math.random() * 4, 18 + Math.floor(Math.random() * 12), -0.04
      ));
    }
  }

  spawnProjectileTrail(x, y, color) {
    this.particles.push(new Particle(x, y,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      color, 5, 12,
    ));
  }

  spawnAttackTrail(x, y, vx, vy, color) {
    if (this.particles.length + this.trails.length >= C.PARTICLE_MAX) return;
    this.trails.push(new AttackTrail(x, y, vx, vy, color, 6));
  }

  spawnAmbient(x, y, color, count = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 0.5, -0.3 - Math.random() * 0.5,
        color, 2 + Math.random() * 3, 40 + Math.random() * 40, -0.01
      ));
    }
  }

  spawnDamageNumber(x, y, amount) {
    this.damageNumbers.push(new DamageNumber(x, y - 20, amount));
  }

  announce(text, color, subtext = '') {
    this.announcerTexts = [new AnnouncerText(text, color, subtext)];
  }

  triggerKOFlash() { this.koFlash = C.KO_FLASH_DURATION; }

  spawnKOParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      const colors = ['#FFE000', '#FF8C00', '#FF4500', '#fff', '#FFD700'];
      this.particles.push(new StarParticle(x, y,
        Math.cos(a) * spd, Math.sin(a) * spd - 4,
        colors[Math.floor(Math.random() * colors.length)],
        5 + Math.random() * 8, 40 + Math.random() * 30, 0.15
      ));
    }
    this.shake.add(C.SHAKE_SIG);
  }

  spawnConfetti(count = 80) {
    const colors = ['#FF8C00','#FFE000','#39FF14','#00BFFF','#FF69B4','#9B59B6','#DC143C'];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(
        Math.random() * 1280, -20,
        (Math.random() - 0.5) * 3,
        2 + Math.random() * 4,
        colors[Math.floor(Math.random() * colors.length)],
        6 + Math.random() * 6, 120 + Math.random() * 80, 0.05,
      ));
    }
  }

  update() {
    this.shake.update();
    this.particles = this.particles.filter(p => { p.update(); return p.life > 0; });
    if (this.particles.length > C.PARTICLE_MAX) {
      this.particles.splice(0, this.particles.length - C.PARTICLE_MAX);
    }
    for (const t of this.trails) t.update();
    this.trails = this.trails.filter(t => t.alive);
    this.hitEffects = this.hitEffects.filter(h => { h.update(); return h.alive; });
    this.damageNumbers = this.damageNumbers.filter(d => { d.update(); return d.alive; });
    this.announcerTexts = this.announcerTexts.filter(a => { a.update(); return a.alive; });
    if (this.koFlash > 0) this.koFlash--;
  }

  drawBelowFighters(ctx) {
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.trails) t.draw(ctx);
  }

  drawAboveFighters(ctx) {
    for (const h of this.hitEffects) h.draw(ctx);
    for (const d of this.damageNumbers) d.draw(ctx);
  }

  drawUI(ctx) {
    if (this.koFlash > 0) {
      ctx.save();
      const alpha = this.koFlash / C.KO_FLASH_DURATION * 0.7;
      const flashGrad = ctx.createRadialGradient(C.W/2, C.H/2, 0, C.W/2, C.H/2, C.W);
      flashGrad.addColorStop(0, `rgba(255,255,200,${alpha})`);
      flashGrad.addColorStop(0.4, `rgba(255,160,0,${alpha * 0.8})`);
      flashGrad.addColorStop(1, `rgba(255,60,0,${alpha * 0.4})`);
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, C.W, C.H);
      ctx.restore();
    }
    for (const a of this.announcerTexts) a.draw(ctx);
  }
}
