// Only these four reviewed garment identities retain their authored structure,
// fabric and fit details, including the in-place replacement with X-shaped pasties.
// The actual descriptions remain authored in the knowledge-base Markdown.
const TOP_SOURCE = /\b(?:small-cup lace bra top|two separate X-shaped adhesive pasties|small-triangle string bikini top|string bikini top with ultra-minimal fabric)\b/i;
const BOTTOM_SOURCE = /\b(?:narrow-front lace G-string bottoms|narrow-front string thong bikini bottoms)\b/i;

export function isMinimalCoverageTop(item) {
  return TOP_SOURCE.test(item?.en || '');
}

export function isMinimalCoverageGarmentSource(source) {
  return TOP_SOURCE.test(source) || BOTTOM_SOURCE.test(source);
}
