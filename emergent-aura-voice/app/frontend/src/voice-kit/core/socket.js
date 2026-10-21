import { reconnectDelay } from "./protocol";

const OPEN = 1;

/** JSON WebSocket with keep-alive pings and full-jitter reconnects. */
export class ReconnectingSocket {
  constructor(url, { onOpen, onMessage, onClose }) {
    Object.assign(this, { url, onOpen, onMessage, onClose });
    this.ws = null;
    this.attempt = 0;
    this.closed = false;
    this.retryTimer = 0;
    this.pingTimer = 0;
  }

  get isOpen() {
    return this.ws?.readyState === OPEN;
  }

  connect() {
    if (this.closed) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => this.send({ type: "ping" }), 20000);
      this.onOpen?.();
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch (err) {
        console.warn("[voice-kit] dropped malformed socket message", err);
        return;
      }
      this.onMessage?.(msg);
    };
    ws.onclose = () => {
      clearInterval(this.pingTimer);
      if (this.ws === ws) this.ws = null;
      this.onClose?.();
      if (!this.closed) this.retryTimer = setTimeout(() => this.connect(), reconnectDelay(this.attempt++));
    };
  }

  send(msg) {
    if (!this.isOpen) return false;
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  close() {
    this.closed = true;
    clearTimeout(this.retryTimer);
    clearInterval(this.pingTimer);
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }
}
