// Public phone actions share the issued selfie IDs; legacy capture choices stay readable.
export const PHONE_SELFIE_ID = 'selfie-natural-right-arm';
export const PHONE_MIRROR_ID = 'selfie-mirror-phone-visible';
export const COMPANION_ORBIT_ID = 'camera:拍攝方位-orbit-angle:companion-view';
export const isPhoneProp = id => [PHONE_SELFIE_ID, PHONE_MIRROR_ID].includes(id);
const BASIC_STANDING = ['natural','one-leg-weight','crossed-legs','narrow-side','feet-together-soft-knees','wide-weight-shift','bent-leg-lift','forward-lean','pelvis-back-curve','back-lean','shoulder-lean'];
export function phoneCaptureStatus(locks = {}, action = null) {
 const selected = isPhoneProp(locks.propId);
 let reason = '';
 if(selected){
  if(locks.subjectCount !== '1' || locks.captureMode === 'observation')reason='手機自拍限一般單人拍攝。';
  else if(locks.orbitId === COMPANION_ORBIT_ID)reason='男友／閨蜜視角由他人拍攝，手機自拍暫不套用；更換環繞角度後生效。';
  else if(action && !(action.hands?.mode === 'free' && (['sitting','kneeling'].includes(action.family) || BASIC_STANDING.some(key=>action.id===`specified-standing-${key}`))))reason='此姿勢有固定手部或承重需求，手機自拍暫不套用；選擇自然站姿、坐姿或一般跪姿後生效。';
 }
 return {selected,active:selected&&!reason,reason};
}
export function migratePhoneCaptureLocks(locks = {}) {
 const style=locks.captureStyleId;
 const phone = style === 'selfie' ? PHONE_SELFIE_ID : style === 'mirror' ? PHONE_MIRROR_ID : '';
 const empty = value => !value || value === 'none' || /:全無:0$/.test(value);
 if(phone && (empty(locks.propId) || locks.propId===phone)) return {...locks,propId:phone,captureStyleId:'standard'};
 if(style==='companion' && (empty(locks.orbitId)||locks.orbitId===COMPANION_ORBIT_ID))return {...locks,orbitId:COMPANION_ORBIT_ID,captureStyleId:'standard'};
 return locks;
}
