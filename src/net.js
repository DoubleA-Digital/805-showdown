// PeerJS wrapper for 2-player online mode
// Host creates a room → gets a 6-char code
// Guest enters that code → P2P WebRTC connection

export class NetManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.connected = false;
    this.code = null;
    this.status = 'idle'; // idle | creating | waiting | joining | connected | error
    this.errorMsg = null;

    this.onReady      = null; // host: peer open, code assigned
    this.onConnect    = null; // opponent connected
    this.onData       = null; // message received
    this.onDisconnect = null;
    this.onError      = null;
  }

  _randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }

  createGame() {
    this.isHost = true;
    this.code = this._randomCode();
    this.status = 'creating';

    this.peer = new Peer('805SD-' + this.code, { debug: 0 });

    this.peer.on('open', () => {
      this.status = 'waiting';
      this.onReady?.(this.code);
    });

    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this._wire();
    });

    this.peer.on('error', (err) => {
      this.status = 'error';
      this.errorMsg = err.type || String(err);
      this.onError?.(this.errorMsg);
    });
  }

  joinGame(code) {
    this.isHost = false;
    this.code = code.toUpperCase().replace(/\s/g, '').slice(0, 6);
    this.status = 'joining';

    this.peer = new Peer({ debug: 0 });

    this.peer.on('open', () => {
      this.conn = this.peer.connect('805SD-' + this.code, { reliable: true });
      this._wire();
    });

    this.peer.on('error', (err) => {
      this.status = 'error';
      this.errorMsg = err.type || String(err);
      this.onError?.(this.errorMsg);
    });
  }

  _wire() {
    this.conn.on('open', () => {
      this.status = 'connected';
      this.connected = true;
      this.onConnect?.();
    });
    this.conn.on('data', (d) => this.onData?.(d));
    this.conn.on('close', () => {
      this.connected = false;
      this.status = 'idle';
      this.onDisconnect?.();
    });
    this.conn.on('error', (err) => {
      this.status = 'error';
      this.errorMsg = String(err);
      this.onError?.(this.errorMsg);
    });
  }

  send(data) {
    if (this.connected && this.conn) {
      try { this.conn.send(data); } catch (_) {}
    }
  }

  destroy() {
    this.connected = false;
    try { this.conn?.close(); } catch (_) {}
    try { this.peer?.destroy(); } catch (_) {}
    this.conn = null;
    this.peer = null;
    this.status = 'idle';
    this.code = null;
  }
}
