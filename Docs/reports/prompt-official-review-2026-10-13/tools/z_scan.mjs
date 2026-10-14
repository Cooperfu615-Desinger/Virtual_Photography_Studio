// Read-only: generate audit-plan prompts (same plan/seed as audit:prompts), measure zImagePrompt with real Qwen BPE, scan format patterns.
import fs from 'node:fs';
const REPO = '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const { createPromptAuditPlan } = await import(REPO + '/scripts/validate_prompt_logic.mjs');
const E = await import(REPO + '/webapp/src/lib/engine.js');
const { tokenize, CHAT_TEMPLATE_OVERHEAD } = await import('./qwen_bpe.mjs');
const { estimateZImagePromptTokens, countZImagePromptWords } = await import(REPO + '/webapp/src/lib/engine/zImageTurboPromptContract.js');
const count = Number(process.argv[2] || 200), seed = process.argv[3] || 'prompt-quality-baseline';
const rows = [];
for (const sc of createPromptAuditPlan(count, seed)) {
  if (!sc.count) continue;
  const ps = E.generatePrompts(sc.count, { ...E.createEmptyLocks(), ...sc.locks }, [], { random: E.createSeededRandom(sc.seed) });
  ps.forEach((p, i) => rows.push({ mode: sc.id, idx: i, z: p.zImagePrompt || '' }));
}
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };
const stats = (a) => ({ n: a.length, avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), median: pct(a, 0.5), p90: pct(a, 0.9), p95: pct(a, 0.95), max: Math.max(...a) });
const PAT = {
  sheWearsComma: /\bShe wears,/g,
  wearsColonLike: /\bwears\s*[,:;]/g,
  doubleSpace: / {2,}/g,
  spaceBeforePunct: / [,.;:]/g,
  doublePunct: /[,.]{2,}|,\s*\./g,
  negation: /\b(not|no|without|never|avoid|don't)\b/gi,
  subjectiveAdj: /\b(seductive|stunning|beautiful|gorgeous|sexy|alluring|charming|elegant)\b/gi,
  qualityTag: /\b(8k|4k|masterpiece|best quality|ultra[- ]detailed|highly detailed|hyper[- ]?realistic)\b/gi,
  controlLang: /\b(selection|selected|locked|lock|preserve|fallback|guard|integrity|priority|must|should|ensure|keep)\b/gi,
  quotedText: /"[^"]+"/g,
  measurement: /\b\d+\s*[–-]\s*\d+\s*[–-]\s*\d+\s*cm\b/g,
};
const hits = Object.fromEntries(Object.keys(PAT).map((k) => [k, { prompts: 0, examples: new Map() }]));
const out = [];
for (const r of rows) {
  const toks = tokenize(r.z).length;
  r.tokens = toks; r.withTemplate = toks + CHAT_TEMPLATE_OVERHEAD; r.est = estimateZImagePromptTokens(r.z); r.words = countZImagePromptWords(r.z);
  // longest comma chain in a sentence
  r.maxCommas = Math.max(0, ...r.z.split(/(?<=\.)\s+|\n+/).map((s) => (s.match(/,/g) || []).length));
  for (const [k, re] of Object.entries(PAT)) {
    const m = r.z.match(re); if (m && m.length) { hits[k].prompts++; for (const x of m) hits[k].examples.set(x.toLowerCase(), (hits[k].examples.get(x.toLowerCase()) || 0) + 1); }
  }
  // truncated tail if 512 cap
  if (r.withTemplate > 512) {
    const t = tokenize(r.z); const keep = 512 - CHAT_TEMPLATE_OVERHEAD; r.lostTail = t.slice(keep).join('').replace(/Ġ/g, ' ').replace(/Ċ/g, '\n').slice(0, 160);
  }
}
const byMode = {};
for (const r of rows) (byMode[r.mode] ||= []).push(r);
const report = {
  plan: { count, seed, prompts: rows.length },
  tokenizer: 'Qwen2Tokenizer vocab/merges from local Qwen3-TTS cache (Qwen 151,643 BPE); template overhead ' + CHAT_TEMPLATE_OVERHEAD,
  overall: { words: stats(rows.map((r) => r.words)), qwenTokens: stats(rows.map((r) => r.tokens)), projectEstimate: stats(rows.map((r) => r.est)), ratioRealOverEst: +(rows.reduce((a, r) => a + r.tokens, 0) / rows.reduce((a, r) => a + r.est, 0)).toFixed(3), maxCommasInSentence: stats(rows.map((r) => r.maxCommas)) },
  over512WithTemplate: rows.filter((r) => r.withTemplate > 512).length,
  over480Real: rows.filter((r) => r.tokens > 480).length,
  byMode: Object.fromEntries(Object.entries(byMode).map(([k, a]) => [k, { n: a.length, qwenTokens: stats(a.map((r) => r.tokens)), over512: a.filter((r) => r.withTemplate > 512).length }])),
  patterns: Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, { prompts: v.prompts, top: [...v.examples.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12) }])),
  truncatedTails: rows.filter((r) => r.lostTail).slice(0, 8).map((r) => ({ mode: r.mode, idx: r.idx, tokens: r.tokens, lostTailStart: r.lostTail })),
};
fs.writeFileSync(process.argv[4] || 'z_scan_report.json', JSON.stringify(report, null, 2));
fs.writeFileSync((process.argv[4] || 'z_scan_report.json').replace(/\.json$/, '_prompts.txt'), rows.map((r) => `### ${r.mode}#${r.idx} tokens=${r.tokens} est=${r.est} words=${r.words}\n${r.z}\n`).join('\n'));
console.log(JSON.stringify({ ...report, patterns: undefined, truncatedTails: report.truncatedTails.length }, null, 1));
