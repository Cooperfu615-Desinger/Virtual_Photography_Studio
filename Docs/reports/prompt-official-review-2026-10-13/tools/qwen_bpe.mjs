// Minimal Qwen2/Qwen3 byte-level BPE token counter (vocab.json + merges.txt).
import fs from 'node:fs';
const DIR = process.env.QWEN_TOK_DIR;
const vocab = JSON.parse(fs.readFileSync(DIR + '/vocab.json', 'utf8'));
const merges = fs.readFileSync(DIR + '/merges.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#version'));
const ranks = new Map(merges.map((m, i) => [m, i]));
const bs = []; for (let i = 33; i <= 126; i++) bs.push(i); for (let i = 161; i <= 172; i++) bs.push(i); for (let i = 174; i <= 255; i++) bs.push(i);
const cs = bs.slice(); let n = 0; for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n); n++; }
const b2u = new Map(bs.map((b, i) => [b, String.fromCodePoint(cs[i])]));
const PAT = /(?:'[sS]|'[tT]|'[rR][eE]|'[vV][eE]|'[mM]|'[lL][lL]|'[dD])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;
const cache = new Map();
function bpe(word) {
  if (cache.has(word)) return cache.get(word);
  let parts = Array.from(word);
  while (parts.length > 1) {
    let best = -1, bestRank = Infinity;
    for (let i = 0; i < parts.length - 1; i++) { const r = ranks.get(parts[i] + ' ' + parts[i + 1]); if (r !== undefined && r < bestRank) { bestRank = r; best = i; } }
    if (best < 0) break;
    const a = parts[best], b = parts[best + 1]; const next = [];
    for (let i = 0; i < parts.length; i++) { if (i < parts.length - 1 && parts[i] === a && parts[i + 1] === b) { next.push(a + b); i++; } else next.push(parts[i]); }
    parts = next;
  }
  cache.set(word, parts); return parts;
}
export function tokenize(text) {
  const out = [];
  for (const m of String(text).normalize('NFC').matchAll(PAT)) {
    const u = Array.from(Buffer.from(m[0], 'utf8')).map((b) => b2u.get(b)).join('');
    for (const p of bpe(u)) { if (!(p in vocab)) throw new Error('OOV ' + p); out.push(p); }
  }
  return out;
}
export const CHAT_TEMPLATE_OVERHEAD = 8; // <|im_start|>user\n ... <|im_end|>\n<|im_start|>assistant\n (approx; specials counted as 1 each)
