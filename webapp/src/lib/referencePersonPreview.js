// Runtime-only renderers keyed by the shared resolved source. Object spreads used
// by live MJ settings retain this key; JSON, Saved Cards and imports do not.
const renderers = new WeakMap();
export const REFERENCE_PERSON_INSTRUCTION = 'Use the attached reference image as the source for the adult person’s identity, face, body proportions, skin, hair, makeup, clothing, colors, materials, footwear and accessories. Preserve that person and outfit while following the expression, pose, scene, lighting and camera directions below. Do not copy the reference image’s background, pose or framing. For any gesture involving clothing or accessories, perform it only if the relevant item exists in the reference image; otherwise use a natural relaxed hand position without adding the item.';

export function registerReferencePersonPreview(prompt, render) {
  renderers.set(prompt.structured, render);
}

export function hasReferencePersonPreview(prompt) {
  return Boolean(prompt?.structured && renderers.has(prompt.structured));
}

export function getReferencePersonPreview(prompt) {
  return (prompt?.structured && renderers.get(prompt.structured)?.(prompt)) || prompt;
}
