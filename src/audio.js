// Web Audio API sound system — all sounds synthesized, no asset files needed

export class AudioManager {
  constructor() {
    try {
      this.actx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.actx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.actx.destination);
      this.enabled = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.actx?.state === 'suspended') this.actx.resume();
  }

  _tone({ freq = 440, freq2 = freq, type = 'square', dur = 0.12, vol = 0.3, attack = 0.004 } = {}) {
    if (!this.enabled) return;
    this._resume();
    const osc = this.actx.createOscillator();
    const g = this.actx.createGain();
    osc.connect(g); g.connect(this.master);
    osc.type = type;
    const t = this.actx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    if (freq2 !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.06, vol = 0.25, lo = 400, hi = lo, q = 1, attack = 0.002 } = {}) {
    if (!this.enabled) return;
    this._resume();
    const bufLen = Math.ceil(this.actx.sampleRate * (dur + 0.05));
    const buf = this.actx.createBuffer(1, bufLen, this.actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const src = this.actx.createBufferSource();
    src.buffer = buf;
    const f = this.actx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = lo; f.Q.value = q;
    const g = this.actx.createGain();
    src.connect(f); f.connect(g); g.connect(this.master);
    const t = this.actx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(t); src.stop(t + dur + 0.06);
  }

  jump() {
    this._tone({ freq: 230, freq2: 460, type: 'sine', dur: 0.13, vol: 0.28, attack: 0.003 });
  }

  doubleJump() {
    this._tone({ freq: 320, freq2: 640, type: 'sine', dur: 0.10, vol: 0.32 });
    this._tone({ freq: 480, freq2: 900, type: 'sine', dur: 0.08, vol: 0.22 });
  }

  land() {
    this._noise({ dur: 0.055, vol: 0.38, lo: 280, q: 0.6 });
  }

  dodge() {
    this._noise({ dur: 0.07, vol: 0.28, lo: 2200, hi: 3000, q: 2.5 });
    this._tone({ freq: 420, freq2: 620, type: 'sine', dur: 0.07, vol: 0.14 });
  }

  hitLight() {
    this._noise({ dur: 0.045, vol: 0.45, lo: 1400, q: 1.2 });
    this._tone({ freq: 200, freq2: 90, type: 'square', dur: 0.07, vol: 0.22 });
  }

  hitHeavy() {
    this._noise({ dur: 0.10, vol: 0.65, lo: 380, q: 0.5 });
    this._tone({ freq: 110, freq2: 45, type: 'sawtooth', dur: 0.16, vol: 0.42 });
  }

  hitSig() {
    this._noise({ dur: 0.14, vol: 0.80, lo: 180, q: 0.3 });
    this._tone({ freq: 88, freq2: 32, type: 'sawtooth', dur: 0.22, vol: 0.52 });
    this._tone({ freq: 660, freq2: 220, type: 'square', dur: 0.16, vol: 0.32 });
  }

  ko() {
    this._noise({ dur: 0.35, vol: 0.75, lo: 140, q: 0.2 });
    this._tone({ freq: 220, freq2: 55, type: 'sine', dur: 0.45, vol: 0.55 });
  }

  signature() {
    this._noise({ dur: 0.10, vol: 0.55, lo: 480, q: 0.9 });
    this._tone({ freq: 160, freq2: 420, type: 'square', dur: 0.09, vol: 0.40 });
    this._tone({ freq: 320, freq2: 160, type: 'sawtooth', dur: 0.22, vol: 0.32 });
  }

  winFanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone({ freq: f, freq2: f, type: 'sine', dur: 0.3, vol: 0.38 }), i * 120);
    });
  }
}
