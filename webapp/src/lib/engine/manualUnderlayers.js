// Manual underlayers reference existing wardrobe IDs, including their historical names.
import { midjourneyItemName } from './midjourneyNaturalPrompt.js';
import { bottomRiseConflict } from './bottomRiseCompatibility.js';
import { isFullyClosedOpening, closedInnerLayerIsVisible } from './outerwearClosure.js';
import { getSpecifiedAction } from './specifiedActions.js';
import { applicableGestureOptions, mouthHeldHemText } from './gazeGesture.js';

export const THIGH_RISE = Object.freeze({
  id: 'lowered-to-thighs', zh: '外褲褪至大腿',
  en: 'pulled down with the entire outer waistband resting at mid-thigh, halfway between her hips and knees',
  meta: { randomEligible: false },
});

const upper = {
  itemKey: 'topUnderlayerId', colorKey: 'topUnderlayerColorId', hostKey: 'topId', paletteKey: 'topColorId',
  ids: ['比基尼上身:30','運動型內衣:32','蕾絲胸罩:31','小三角細繩比基尼上身:44','小罩杯細帶蕾絲胸罩:43','創可貼造型胸貼:45']
    .map(id => 'wardrobe:上身-tops:' + id),
};
const lower = {
  itemKey: 'bottomUnderlayerId', colorKey: 'bottomUnderlayerColorId', hostKey: 'pantsId', paletteKey: 'bottomColorId',
  ids: ['比基尼下身:23','蕾絲丁字褲:8','蕾絲內褲:7','窄前片細繩蕾絲丁字褲:31','窄前片細繩比基尼下身:32']
    .map(id => 'wardrobe:褲裝-pants:' + id),
};
const slots = [upper, lower];
export const underlayerKeys = slots.flatMap(slot => [slot.itemKey, slot.colorKey]);
export const isRevealGesture = id => id === 'gesture-lift-hem-both' || id === 'gesture-hold-hem-teeth';
const options = (controls, key) => controls.find(c => c.key === key)?.options || [];
const selected = (controls, key, id) => options(controls, key).find(o => o.id === id);
function hasGarmentOwner(locks, controls, key) {
  if (locks[key] === 'random') return true;
  const item = selected(controls, key, locks[key]);
  return Boolean(item?.en && item.zh !== '全無');
}
const isWaistTrigger = id => ['ultra-low-rise','unbuttoned-slightly-unzipped', THIGH_RISE.id].includes(id);
export function normalizeUnderlayers(locks, controls) {
  const result = {};
  for (const slot of slots) {
    const id = locks[slot.itemKey];
    if (!slot.ids.includes(id) || !selected(controls, slot.hostKey,id)) continue;
    result[slot.itemKey] = id;
    const color = selected(controls, slot.paletteKey,locks[slot.colorKey]);
    if (color?.en && color.id !== 'none') result[slot.colorKey] = color.id;
  }
  return result;
}

function hostFits(item, slot, rise) {
  if (!item || item.zh === '全無' || slot.ids.includes(item.id)) return false;
  if (slot === upper) return item.zh !== '高領連身上衣';
  if (rise === THIGH_RISE.id) return !['wardrobe:褲裝-pants:丹寧吊帶長褲:25', 'wardrobe:褲裝-pants:丹寧吊帶短褲:26'].includes(item.id);
  if (rise !== 'unbuttoned-slightly-unzipped') return true;
  return !bottomRiseConflict(item,{id:rise}) && !['運動棉褲','超短運動短褲','真理褲','韻律緊身短褲','leggings'].includes(item.zh);
}

// Both the editor and generation use the same explicit triggers and garment owners.
export function underlayerField(locks, controls, trigger) {
  const top = trigger === 'gestureId';
  if (!top && trigger !== 'bottomRiseId') return null;
  if (top ? !isRevealGesture(locks.gestureId) : !isWaistTrigger(locks.bottomRiseId)) return null;
  if (locks.subjectCount !== '1' || locks.captureMode === 'observation'
    || [locks.characterProfileId,locks.specialSubjectId,locks.fixedCompositionSetId].some(id => id && id !== 'none')) return null;
  const owners = ['dressId', 'outfitPresetId', 'specialOutfitId'];
  if (!top) owners.push('skirtId');
  if (owners.some(key => hasGarmentOwner(locks, controls, key))) return null;
  const outerwear = selected(controls, 'outerwearId', locks.outerwearId);
  if (top && isFullyClosedOpening(locks.outerwearOpeningId) && outerwear?.zh !== '全無'
      && !closedInnerLayerIsVisible(outerwear)) return null;
  if (top && !applicableGestureOptions(getSpecifiedAction(locks,{cameraControls:controls})).some(option => option.id === locks.gestureId)) return null;
  const slot = top ? upper : lower;
  const hosts = options(controls,slot.hostKey).filter(item => hostFits(item, slot, locks.bottomRiseId));
  const host = selected(controls, slot.hostKey,locks[slot.hostKey]);
  if (host && !hosts.includes(host)) return null;
  const items = slot.ids.map(id => selected(controls, slot.hostKey,id)).filter(Boolean);
  const item = items.find(option => option.id === locks[slot.itemKey]);
  const colors = options(controls,slot.paletteKey).filter(option => option.en && option.id !== 'none');
  const color = colors.find(option => option.id === locks[slot.colorKey]);
  return { ...slot, host, hosts, items, colors, item, color };
}

export function prepareUnderlayerHosts(locks, controls, random) {
  for (const trigger of ['gestureId','bottomRiseId']) {
    const loweredPants = trigger === 'bottomRiseId' && locks.bottomRiseId === THIGH_RISE.id;
    if (trigger === 'bottomRiseId' && !loweredPants && !locks.bottomUnderlayerId) continue;
    const field = underlayerField(locks, controls, trigger);
    if (!field) {
      if (loweredPants) locks.bottomRiseId = 'none';
      if (trigger === 'gestureId' && isRevealGesture(locks.gestureId)) locks.gestureId = 'none';
      continue;
    }
    if (!field.host && field.hosts.length) locks[field.hostKey] = field.hosts[Math.floor(random()*field.hosts.length)].id;
  }
}

function lowerLayerVisibility(item, rise) {
  if (rise === 'unbuttoned-slightly-unzipped') return 'a glimpse of the inner fabric through the open waistband';
  const edge = {
    'wardrobe:褲裝-pants:蕾絲內褲:7': 'the upper edge of the briefs',
    'wardrobe:褲裝-pants:蕾絲丁字褲:8': 'the thin side straps',
  }[item.id] || 'the side ties';
  return edge + ' visible above the outer waistband';
}

export function attachUnderlayers(wardrobe, locks, controls, gestureId) {
  if (!locks.topUnderlayerId && !locks.bottomUnderlayerId) return wardrobe;
  const byHost = new Map();
  for (const trigger of ['gestureId','bottomRiseId']) {
    if (trigger === 'gestureId' && (!isRevealGesture(gestureId) || gestureId !== locks.gestureId)) continue;
    const field = underlayerField(locks, controls, trigger);
    if (!field?.item || !field.host) continue;
    if (trigger === 'bottomRiseId' && locks.bottomRiseId === THIGH_RISE.id) {
      byHost.set(field.host.id, { item: field.item, color: field.color, loweredOuter: true });
      continue;
    }
    const relation = trigger === 'gestureId' ? '' : lowerLayerVisibility(field.item, locks.bottomRiseId);
    byHost.set(field.host.id, { item: field.item, color: field.color, relation });
  }
  if (!byHost.size) return wardrobe;
  return wardrobe.map(item => byHost.has(item.id)
    ? {...item,meta:{...item.meta,underlayer:byHost.get(item.id)}} : item);
}

export function describeRevealGesture(gesture, item) {
  if (!gesture || !isRevealGesture(gesture.id) || !item) return gesture || null;
  const name = midjourneyItemName(item);
  if (gesture.id === 'gesture-hold-hem-teeth') return { ...gesture, en: mouthHeldHemText(name) };
  return { ...gesture, en: gesture.en + ', fully revealing the front of the ' + name + ' underneath' };
}
