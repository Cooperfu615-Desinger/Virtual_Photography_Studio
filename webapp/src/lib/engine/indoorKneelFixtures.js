import { createHash } from 'node:crypto';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorLeaningModel } from './indoorLeaning.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';

export const kneelActions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action => action.family === 'kneeling' && action.hands.mode === 'free');
export function indoorKneelProtectedRows() {
  const controls = getLockControls(), rows = {};
  const places = attribute => getSceneDependentOptions([], { subjectCount:'1', sceneAttributeId:attribute }).locationOptions.filter(o => o.zh !== '全無');
  const allKneeling = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action => action.family === 'kneeling');
  const leans = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action => ['specified-standing-back-lean', 'specified-standing-shoulder-lean'].includes(action.id));
  for (const [prefix, locations, actions] of [
    ['indoor-kneel-unspecified', places('indoor'), kneelActions],
    ['indoor-fixed-kneel', places('indoor'), allKneeling.filter(action => action.hands.mode === 'fixed')],
    ['outdoor-kneel', places('outdoor'), allKneeling],
    ['outdoor-lean', places('outdoor'), leans],
  ]) for (const place of locations) for (const action of actions) {
    const values = prefix === 'outdoor-lean'
      ? ['', ...indoorLeaningModel({subjectCount:'1', locationId:place.id, specifiedActionId:action.id}, place, controls).options.map(o => o.id)] : [''];
    const hash = createHash('sha256');
    for (const framing of seatFramings) for (const value of values) {
      const {prompt, cards, draws} = seatFixture(place.zh, action.zh, framing, value ? {indoorLeanId:value} : {});
      const {id, date, ...stable} = prompt;
      if (!id || !date || cards.length !== 7) throw new Error('Invalid protected fixture');
      hash.update(JSON.stringify({stable, cards, draws}));
    }
    rows[prefix + '/' + place.id + '/' + action.id] = {samples:seatFramings.length * values.length, sha256:hash.digest('hex')};
  }
  return rows;
}
