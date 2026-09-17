'use strict';
// Minimal read-only ZIP reader (no npm dependency) — just enough to read a .pptx
// (which is a standard ZIP/OPC package): list entries, read one entry as a Buffer.
// Supports STORED (0) and DEFLATE (8), which covers every pptx produced by
// PowerPoint or LibreOffice.
const fs = require('fs');
const zlib = require('zlib');

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

function findEOCD(buf) {
  const max = Math.min(buf.length, 65557); // max comment length (65535) + record size (22)
  for (let i = buf.length - 22; i >= buf.length - max && i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error('not a zip file (End Of Central Directory not found)');
}

/** @returns {{ entries: Map<string,{offset:number,compSize:number,size:number,method:number}>, read(name):Buffer, names():string[] }} */
function openZip(filePath) {
  const buf = fs.readFileSync(filePath);
  const eocd = findEOCD(buf);
  const cdEntries = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);

  const entries = new Map();
  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(cdOffset) !== CEN_SIG) throw new Error(`corrupt zip central directory at entry ${i}`);
    const method = buf.readUInt16LE(cdOffset + 10);
    const compSize = buf.readUInt32LE(cdOffset + 20);
    const size = buf.readUInt32LE(cdOffset + 24);
    const nameLen = buf.readUInt16LE(cdOffset + 28);
    const extraLen = buf.readUInt16LE(cdOffset + 30);
    const commentLen = buf.readUInt16LE(cdOffset + 32);
    const localOffset = buf.readUInt32LE(cdOffset + 42);
    const name = buf.toString('utf8', cdOffset + 46, cdOffset + 46 + nameLen);
    entries.set(name, { offset: localOffset, compSize, size, method });
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  function read(name) {
    const e = entries.get(name);
    if (!e) return null;
    if (buf.readUInt32LE(e.offset) !== LOC_SIG) throw new Error(`corrupt zip local header for ${name}`);
    const nameLen = buf.readUInt16LE(e.offset + 26);
    const extraLen = buf.readUInt16LE(e.offset + 28);
    const dataStart = e.offset + 30 + nameLen + extraLen;
    const raw = buf.subarray(dataStart, dataStart + e.compSize);
    if (e.method === 0) return Buffer.from(raw);
    if (e.method === 8) return zlib.inflateRawSync(raw);
    throw new Error(`unsupported zip compression method ${e.method} for ${name}`);
  }

  return { entries, read, names: () => [...entries.keys()] };
}

module.exports = { openZip };
