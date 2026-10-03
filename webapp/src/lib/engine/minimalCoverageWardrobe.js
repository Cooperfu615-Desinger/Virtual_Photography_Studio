// Only these four new garment identities own the reviewed fit details.
// The actual descriptions remain authored in the knowledge-base Markdown.
const TOP_SOURCE = /\b(?:small-cup lace bra top|small-triangle string bikini top)\b/i;
const BOTTOM_SOURCE = /\b(?:narrow-front lace G-string bottoms|narrow-front string thong bikini bottoms)\b/i;

export function isMinimalCoverageTop(item) {
  return TOP_SOURCE.test(item?.en || '');
}

export function isMinimalCoverageGarmentSource(source) {
  return TOP_SOURCE.test(source) || BOTTOM_SOURCE.test(source);
}
