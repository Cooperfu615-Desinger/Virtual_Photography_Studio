// Shared by catalog migration, selection resolution and PAGE1 option availability.
export const ACCESSORY_CATEGORIES = { headphones: '耳機 (Headphones)', faceCovering: '口鼻遮擋 (Face Coverings)' };
export const accessoryNoneId = (slot) => `wardrobe:${slot}:none`;
export const isConcreteAccessory = (value) => Boolean(value && value !== 'none' && !/:全無:|:none$/.test(value));
export const isHeadWornAudio = (item) => /戴在頭上/.test(item?.zh || item || '');
export const blocksHeadWornAudio = (item) => /帽|皇冠|兔耳髮箍|女僕頭飾|頭巾/.test(item?.zh || item || '');
export function movedAccessorySlot(item) {
  const label = item?.zh || item || '';
  if (/耳機/.test(label)) return 'headphones';
  if (/口罩|防毒面具/.test(label)) return 'faceCovering';
  return null;
}
export function splitAccessoryCatalog(wardrobe) {
  const category = '頭部配件 (Head Accessories)';
  const original = wardrobe[category] || [];
  for (const [slot, target] of Object.entries(ACCESSORY_CATEGORIES)) {
    wardrobe[target] = [{ id: accessoryNoneId(slot), zh: '全無', en: '', meta: { tags: ['none'], accessorySlot: slot } },
      ...original.filter((item) => movedAccessorySlot(item) === slot).map((item) => ({ ...item, category: target, meta: { ...item.meta, accessorySlot: slot, legacyPromptAliases: [...(item.meta?.legacyPromptAliases || []), ...(item.zh === '有線耳機' ? ['wired earphones with visible cable, lightweight in-ear audio accessory', projectAudioForFraming([{ ...item, meta: { accessorySlot: 'headphones' } }], { framing: { meta: { visibility: 'portrait' } } })[0].en] : [])] } }))];
  }
  wardrobe[category] = original.filter((item) => !movedAccessorySlot(item));
}
export function migrateAccessoryLocks(locks, controls) {
  for (const suffix of ['', 'A', 'B']) {
    const headKey = `headAccessory${suffix}Id`;
    const slot = movedAccessorySlot(locks[headKey]);
    if (!slot) continue;
    const target = `${slot}${suffix}Id`;
    if (!isConcreteAccessory(locks[target])) {
      locks[target] = locks[headKey];
      locks[`${slot}${suffix}ColorId`] = locks[`headAccessory${suffix}ColorId`] ?? 'none';
    }
    locks[headKey] = controls.find((c) => c.key === headKey)?.options.find((o) => o.zh === '全無')?.id || '';
    locks[`headAccessory${suffix}ColorId`] = 'none';
  }
  return locks;
}
export function normalizeAccessoryConflicts(locks, controls) {
  if (isConcreteAccessory(locks.faceCoveringId)) {
    for (const key of ['nosePiercingId', 'lipPiercingId']) locks[key] = controls.find((c) => c.key === key)?.options.find((o) => o.zh === '全無')?.id || '';
  }
  for (const suffix of ['', 'A', 'B']) {
    if (blocksHeadWornAudio(locks[`headAccessory${suffix}Id`]) && isHeadWornAudio(locks[`headphones${suffix}Id`])) locks[`headphones${suffix}Id`] = accessoryNoneId('headphones');
  }
  return locks;
}
export function prepareAccessoryControl(control, locks) {
  let reason = '';
  let blocked = () => false;
  const match = control.key.match(/^(headAccessory|headphones|faceCovering)([AB]?)Id$/);
  if (match) {
    const [, slot, suffix] = match;
    if (slot === 'headAccessory' && isHeadWornAudio(locks[`headphones${suffix}Id`])) {
      reason = '頭戴式耳機已啟用；帽子與硬式頭飾需先將耳機設為全無。'; blocked = blocksHeadWornAudio;
    }
    if (slot === 'headphones' && blocksHeadWornAudio(locks[`headAccessory${suffix}Id`])) {
      reason = '帽子或硬式頭飾已啟用；仍可選掛頸耳機或有線耳機。'; blocked = isHeadWornAudio;
    }
    if (slot === 'faceCovering' && !suffix && ['nosePiercingId', 'lipPiercingId'].some((key) => isConcreteAccessory(locks[key]))) {
      reason = '鼻部或唇部穿孔已啟用；請先將穿孔設為全無。'; blocked = (o) => isConcreteAccessory(o.id);
    }
  }
  if (['nosePiercingId', 'lipPiercingId'].includes(control.key) && isConcreteAccessory(locks.faceCoveringId)) {
    reason = '口鼻遮擋已啟用；請先將口鼻遮擋設為全無。'; blocked = (o) => isConcreteAccessory(o.id);
  }
  return reason ? { ...control, helpText: reason, options: control.options.map((o) => ({ ...o, disabled: Boolean(o.disabled || blocked(o)) })) } : control;
}
export function projectAudioForFraming(wardrobe, context) {
  const near = ['close', 'portrait', 'medium'].includes(context?.framing?.meta?.visibility);
  if (!near) return wardrobe;
  return wardrobe.map((item) => item.meta?.accessorySlot === 'headphones' && /有線耳機/.test(item.zh)
    ? { ...item, en: item.en.replace(/down along the torso toward either side of the waist or the hip, where it is tucked beneath the clothing and its end is concealed/, 'down along the visible torso and continuing beyond the lower frame edge') } : item);
}

export function accessoryRestoreNotices(selection = {}) {
  const covering = isConcreteAccessory(selection.faceCoveringId) || movedAccessorySlot(selection.headAccessoryId) === 'faceCovering';
  const piercing = ['nosePiercingId', 'lipPiercingId'].some((key) => isConcreteAccessory(selection[key]));
  return covering && piercing ? ['舊卡片同時含口鼻遮擋與穿孔；已保留口鼻遮擋並清除鼻部、唇部穿孔。'] : [];
}
