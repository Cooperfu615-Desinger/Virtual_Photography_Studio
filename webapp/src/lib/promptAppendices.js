// Optional display/copy actions only. Never feed these back into source generation.
export const PROMPT_APPENDICES = Object.freeze([
  Object.freeze({
    id: 'four-free-variations',
    label: '四張自由變化',
    description: '保持人物、服裝與風格一致，自由變化姿勢、構圖與拍攝角度。',
    text: 'Please generate four variations on the same theme. All four images should have different compositions, poses, and camera angles. Please generate them all at once as multiple options for comparison, rather than creating them one by one in sequence. Keep the character, art style, and clothing consistent; make significant variations in composition, pose, and camera angle. Return four separate images, not a single four-panel collage.',
  }),
  Object.freeze({
    id: 'four-camera-views',
    label: '四張多機位',
    description: '第一張沿用原始角度，其餘三張變換機位，維持人物姿勢與場景。',
    text: `Please generate four separate photographs of the same moment.

For the first photograph, follow the original prompt’s camera angle and composition.

For photographs 2–4, freely choose three other clearly different camera viewpoints. All four photographs must have distinct viewing angles, with no repeated or nearly identical viewpoints. Changing only the crop, zoom, or image tilt does not count as a different viewpoint.

Keep the same character, clothing, accessories, pose, expression, head direction, scene, lighting, and visual style across all four photographs. Keep the person and the physical arrangement of the scene unchanged; move only the camera. The person must not turn or adjust their pose to face each camera.

For photographs 2–4, override only the original camera viewpoint and adjust the framing as needed. Allow perspective, visible background, and natural cropping to change with the camera position.

Generate all four photographs together for comparison, as four separate images, not a collage. Keep the cameras outside the frame.`,
  }),
]);

export function appendPromptInstruction(original, templateId) {
  const template = PROMPT_APPENDICES.find(({ id }) => id === templateId);
  if (!template || !original?.trim()) return original;
  return `${original}\n\n${template.text}`;
}
