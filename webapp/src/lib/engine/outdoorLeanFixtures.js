import { createHash } from 'node:crypto';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorLeaningModel } from './indoorLeaning.js';
import { indoorSeatingModel } from './indoorSeating.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

export function outdoorLeanProtectedRows() {
  const controls=getLockControls(),rows={};
  const locations=attribute=>getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:attribute}).locationOptions.filter(o=>o.zh!=='全無' && !o.zh.includes('日本 Lawson 便利商店'));
  const lean=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>['specified-standing-back-lean','specified-standing-shoulder-lean'].includes(o.id));
  // Only the separately added adjustable cat pose is outside this original seal.
  const sit=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>o.family==='sitting'
    && o.id!=='specified-sitting-low-aloof-cats-adjustable-angle');
  for(const [prefix,places,actions,model,key] of [
    ['indoor-lean',locations('indoor'),lean,indoorLeaningModel,'indoorLeanId'],
    ['outdoor-seat',locations('outdoor'),sit,indoorSeatingModel,'indoorSeatId'],
  ]) for(const place of places) for(const action of actions) {
    const m=model({subjectCount:'1',locationId:place.id,specifiedActionId:action.id},place,controls);
    // Every indoor leaning choice; the first effective outdoor seat (or unspecified).
    // Existing outdoor menu/wording tests cover all other sitting choices.
    const values=prefix==='indoor-lean'?['',...m.options.map(o=>o.id)]:[m.options?.[0]?.id||''];
    const hash=createHash('sha256');
    for(const framing of seatFramings) for(const id of values) {
      const {prompt,cards,draws}=seatFixture(place.zh,action.zh,framing,id?{[key]:id}:{});
      const {id:runtimeId,date:runtimeDate,...stable}=prompt;
      if(!runtimeId||!runtimeDate||cards.length!==7)throw new Error('Invalid preservation fixture');
      hash.update(JSON.stringify({stable,cards,draws}));
    }
    rows[prefix+'/'+place.id+'/'+action.id]={samples:seatFramings.length*values.length,sha256:hash.digest('hex')};
  }
  return rows;
}
