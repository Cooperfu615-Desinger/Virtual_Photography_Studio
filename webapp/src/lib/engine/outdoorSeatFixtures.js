import { createHash } from 'node:crypto';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorSeatingModel } from './indoorSeating.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

/** Existing indoor behavior: both unspecified and the first effective manual seat,
 * every scene/action/framing, including all seven outputs and random draw counts. */
export function indoorSeatingRegressionRows() {
  const locations=getSceneDependentOptions([], {subjectCount:'1',sceneAttributeId:'indoor'}).locationOptions.filter(o=>o.zh!=='全無' && !o.zh.includes('日本 Lawson 便利商店'));
  const actions=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(o=>o.family==='sitting');
  const controls=getLockControls(), rows={};
  for(const location of locations) for(const action of actions) {
    const model=indoorSeatingModel({subjectCount:'1',locationId:location.id,specifiedActionId:action.id},location,controls);
    const values=['',...(model.options?.[0]?[model.options[0].id]:[])];
    const hash=createHash('sha256');
    for(const framing of seatFramings) for(const id of values) {
      const {prompt,cards,draws}=seatFixture(location.zh,action.zh,framing,id?{indoorSeatId:id}:{});
      const {id:ignoredId,date:ignoredDate,...stable}=prompt;
      if(!ignoredId || !ignoredDate || cards.length!==7) throw new Error('Invalid regression fixture');
      hash.update(JSON.stringify({stable,cards,draws}));
    }
    rows[location.id+'/'+action.id]={samples:seatFramings.length*values.length,sha256:hash.digest('hex')};
  }
  return rows;
}
