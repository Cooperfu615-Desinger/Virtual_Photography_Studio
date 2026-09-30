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
  Object.freeze({
    id: 'amateur-selfies',
    label: '素人失敗自拍',
    description: '保持人物、服裝與場景一致，自由呈現不完美的素人自拍與隨手寫真，四張 9:16。',
    text: 'Create a series of imperfect amateur smartphone selfies. Keep the same person, outfit, and setting described above; freely vary poses and camera angles. Generate 4 separate 9:16 photographs, not a collage, with no added text.',
  }),
  Object.freeze({
    id: 'everyday-snapshots',
    label: '日常生活照',
    description: '保持人物、服裝與場景一致，自由變化生活活動、自然表情、姿勢與拍攝角度，四張 9:16。',
    text: 'Create a series of casual everyday snapshots with natural expressions. Keep the same person, outfit, and setting described above; freely vary activities, poses, and camera angles. Generate 4 separate 9:16 photographs, not a collage, with no added text.',
  }),
]);

export function appendPromptInstruction(original, templateId) {
  const template = PROMPT_APPENDICES.find(({ id }) => id === templateId);
  if (!template || !original?.trim()) return original;
  return `${original}\n\n${template.text}`;
}
