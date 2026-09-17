'use strict';
// Minimal RFC 6455 WebSocket framing — just enough for JSON text messages between
// this app and a browser on the venue LAN. No dependency, on purpose: the whole
// project ships with zero runtime deps and that is what makes it safe to hand to
// an operator on event day (nothing to install, nothing to go stale).
//
// Scope deliberately kept small:
//   - text + binary data frames, with continuation fragments reassembled
//   - ping/pong/close control frames
//   - server->client frames are never masked; client->server frames must be masked
const crypto = require('node:crypto');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const OP = { CONT: 0x0, TEXT: 0x1, BINARY: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xa };

/** Value for the `Sec-WebSocket-Accept` response header. */
function acceptKey(secWebSocketKey) {
  return crypto.createHash('sha1').update(String(secWebSocketKey) + GUID).digest('base64');
}

/** Encode one unmasked frame (server -> client). */
function encodeFrame(opcode, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || '', 'utf8');
  let header;
  if (body.length < 126) {
    header = Buffer.alloc(2);
    header[1] = body.length;
  } else if (body.length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(body.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(body.length), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode
  return Buffer.concat([header, body]);
}

const textFrame = (s) => encodeFrame(OP.TEXT, Buffer.from(String(s), 'utf8'));
const pongFrame = (payload) => encodeFrame(OP.PONG, payload);
const pingFrame = (payload) => encodeFrame(OP.PING, payload);
function closeFrame(code = 1000, reason = '') {
  const r = Buffer.from(String(reason), 'utf8');
  const b = Buffer.alloc(2 + r.length);
  b.writeUInt16BE(code, 0);
  r.copy(b, 2);
  return encodeFrame(OP.CLOSE, b);
}

/**
 * Streaming frame decoder. TCP gives us arbitrary chunks, so state lives here:
 * feed every chunk to push() and get back whole messages.
 */
class FrameReader {
  /** @param {number} maxMessageBytes refuse anything bigger — a browser control page sends tiny JSON */
  constructor(maxMessageBytes = 1 << 20) {
    this.buf = Buffer.alloc(0);
    this.max = maxMessageBytes;
    this.fragOp = 0;
    this.frag = [];
    this.fragBytes = 0;
  }

  /**
   * @param {Buffer} chunk
   * @returns {Array<{op:number, data:Buffer}>} complete messages and control frames, in order
   * @throws {Error} on protocol violations — the caller must close the socket
   */
  push(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : Buffer.from(chunk);
    const out = [];
    for (;;) {
      const f = this.#readFrame();
      if (!f) break;
      if (f.op === OP.CLOSE || f.op === OP.PING || f.op === OP.PONG) {
        if (!f.fin) throw new Error('fragmented control frame');
        out.push({ op: f.op, data: f.data });
        continue;
      }
      if (f.op === OP.CONT) {
        if (!this.fragOp) throw new Error('continuation frame without a start frame');
      } else {
        if (this.fragOp) throw new Error('new data frame while a fragmented message is open');
        this.fragOp = f.op;
      }
      this.frag.push(f.data);
      this.fragBytes += f.data.length;
      if (this.fragBytes > this.max) throw new Error(`message exceeds ${this.max} bytes`);
      if (f.fin) {
        out.push({ op: this.fragOp, data: Buffer.concat(this.frag) });
        this.fragOp = 0;
        this.frag = [];
        this.fragBytes = 0;
      }
    }
    return out;
  }

  #readFrame() {
    const b = this.buf;
    if (b.length < 2) return null;
    const fin = (b[0] & 0x80) !== 0;
    if (b[0] & 0x70) throw new Error('reserved bits set (no extensions negotiated)');
    const op = b[0] & 0x0f;
    const masked = (b[1] & 0x80) !== 0;
    if (!masked) throw new Error('client frame is not masked'); // RFC 6455 §5.1
    let len = b[1] & 0x7f;
    let offset = 2;
    if (len === 126) {
      if (b.length < offset + 2) return null;
      len = b.readUInt16BE(offset);
      offset += 2;
    } else if (len === 127) {
      if (b.length < offset + 8) return null;
      const big = b.readBigUInt64BE(offset);
      if (big > BigInt(this.max)) throw new Error(`frame exceeds ${this.max} bytes`);
      len = Number(big);
      offset += 8;
    }
    if (len > this.max) throw new Error(`frame exceeds ${this.max} bytes`);
    if (b.length < offset + 4 + len) return null;
    const mask = b.subarray(offset, offset + 4);
    offset += 4;
    const data = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) data[i] = b[offset + i] ^ mask[i & 3];
    this.buf = b.subarray(offset + len);
    return { fin, op, data };
  }
}

module.exports = { OP, GUID, acceptKey, encodeFrame, textFrame, pingFrame, pongFrame, closeFrame, FrameReader };
