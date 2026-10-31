// C7 v1: reviewed default-catalog IDs only. Do not infer time from color,
// natural/window tags, photographer style, or arbitrary imported text.
const NIGHT_PARTY_ID = 'locations:生活感室內-indoor-lifestyle:室內-夜間家庭派對:2';
const DAYLIGHT_IDS = new Set([
  'camera:環境光條件-ambient-light-conditions:室內窗邊日光:19',
  'camera:環境光條件-ambient-light-conditions:室內清晨冷白日光:20',
  'camera:環境光條件-ambient-light-conditions:室內午後柔亮日光:21',
  'camera:環境光條件-ambient-light-conditions:室內陰影日光:22',
  'camera:環境光條件-ambient-light-conditions:室內陰雨昏暗天光:23',
  'camera:環境光條件-ambient-light-conditions:室內黃昏微暖餘光:24',
]);

export function nightPartyAllowsRandomAmbient(location, lighting) {
  return location?.id !== NIGHT_PARTY_ID || !DAYLIGHT_IDS.has(lighting?.id);
}
