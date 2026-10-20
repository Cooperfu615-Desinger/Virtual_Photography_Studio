// Lying library P3 (Docs/specs/pose-library-lying-v1.md §2–§3, Cooper 2026-10-19).
// Scenes carry a reviewed `lyingSurface` ({ type, en }) copied verbatim from their
// own English; lying actions place the subject on it. Lying actions also use a
// dedicated camera menu instead of the standing-based angle and orbit.

export const LYING_CAMERA_OPTIONS = Object.freeze([
  Object.freeze({ id: 'none', zh: '全無', en: '' }),
  Object.freeze({ id: 'random', zh: '隨機', en: '', meta: Object.freeze({ tags: Object.freeze(['random']) }) }),
  Object.freeze({ id: 'lying-overhead', zh: '正上方俯拍', en: 'shot from directly overhead, the camera looking straight down at her' }),
  Object.freeze({ id: 'lying-high-side', zh: '斜上方俯拍', en: 'shot from a high angle beside her, looking down across her body' }),
  Object.freeze({ id: 'lying-surface-level', zh: '貼地平視', en: 'shot from surface level beside her, the lens at the height of the surface she lies on' }),
  Object.freeze({ id: 'lying-from-head', zh: '從頭頂方向', en: 'shot from above her head, looking along her body toward her feet' }),
  Object.freeze({ id: 'lying-from-feet', zh: '從腳底方向', en: 'shot from beyond her feet, looking along her body toward her head',
    meta: Object.freeze({ caution: true }) }),
]);

const CONCRETE_LYING_CAMERAS = LYING_CAMERA_OPTIONS.filter(option => option.en);

export const isLyingAction = action => action?.family === 'lying';

/** 隨機 draws one camera with a single random() call; 全無 or unknown ids write nothing. */
export function resolveLyingCamera(id, random = Math.random) {
  if (id === 'random') return CONCRETE_LYING_CAMERAS[Math.min(CONCRETE_LYING_CAMERAS.length - 1, Math.floor(random() * CONCRETE_LYING_CAMERAS.length))];
  return CONCRETE_LYING_CAMERAS.find(option => option.id === id) || null;
}

/** Random draws: the scene must offer a lying surface; pillow-led actions need a bed. */
export function lyingActionFitsScene(action, location) {
  const surface = location?.lyingSurface;
  if (!isLyingAction(action) || !surface?.en) return false;
  return action.scene?.support !== 'bed' || surface.type === 'bed';
}

/** The surface phrase to insert for a lying action, or '' when the scene has none or
 * the reviewed action text already names its own ground (v1 actions). */
export function lyingSurfaceFor(action, location) {
  const surface = location?.lyingSurface?.en;
  if (!isLyingAction(action) || !surface || /\bon the ground\b/i.test(action.en || '')) return '';
  return surface;
}

const LYING_LEAD = /^(She lies on her (?:left |right )?(?:side|stomach|back))\b/;

/** "She lies on her side with …" → "She lies on her side on the {surface} with …". */
export function withLyingSurface(text, surface) {
  if (!surface || typeof text !== 'string') return text;
  return text.replace(LYING_LEAD, `$1 on the ${surface}`);
}
