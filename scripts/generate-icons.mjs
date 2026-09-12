// Generates PWA/app icons as PNGs with zero dependencies (pure Node + zlib).
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public', 'icons')

const CRT_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRT_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function inDumbbell(n, m) {
  if (n >= 0.24 && n <= 0.76 && m >= 0.465 && m <= 0.535) return true
  if (n >= 0.3 && n <= 0.35 && m >= 0.36 && m <= 0.64) return true
  if (n >= 0.65 && n <= 0.7 && m >= 0.36 && m <= 0.64) return true
  if (n >= 0.2 && n <= 0.24 && m >= 0.42 && m <= 0.58) return true
  if (n >= 0.76 && n <= 0.8 && m >= 0.42 && m <= 0.58) return true
  return false
}

const BG = [16, 20, 24, 255]
const FG = [214, 251, 228, 255]

function render(size) {
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = (x + 0.5) / size
      const m = (y + 0.5) / size
      const c = inDumbbell(n, m) ? FG : BG
      const i = (y * size + x) * 4
      rgba[i] = c[0]
      rgba[i + 1] = c[1]
      rgba[i + 2] = c[2]
      rgba[i + 3] = c[3]
    }
  }
  return encodePng(size, rgba)
}

mkdirSync(OUT, { recursive: true })
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon' : `icon-${size}`
  writeFileSync(path.join(OUT, `${name}.png`), render(size))
  console.log(`wrote public/icons/${name}.png`)
}