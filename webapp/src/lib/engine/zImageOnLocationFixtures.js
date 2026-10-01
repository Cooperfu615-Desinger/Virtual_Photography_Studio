// Test-only deterministic inputs. Never imported by the runtime renderer.
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

const zh = (byZh) => ({ byZh });
const common = {
  subjectCount: '1', imageTypePresetId: 'photorealistic-photo',
  bodyTypeId: zh('性感曲線身形'), facialFeaturesId: zh('甜美可愛臉'),
  skinDetailsId: zh('柔霧細緻肌'), hairstyleId: zh('柔波：深側分'),
  hairStylingStateId: zh('濕髮分束'), hairColorId: zh('柔霧黑茶'),
  expressionId: zh('無辜清透'), poseBaseId: 'sitting',
  poseArrangementId: 'model-natural-body-arrangement',
  poseHandId: 'both-hands-gather-hair', poseHeadId: 'none',
  topId: zh('運動型內衣'), topFitId: 'tight', pantsId: zh('真理褲'),
  bottomRiseId: zh('超低腰'), framingId: zh('全身鏡頭 (Full Body Shot)'),
  angleId: zh('平視高度鏡頭'), orbitId: zh('正面 0 度'),
  lightingId: zh('室內黃昏微暖餘光'), lightDirectionId: zh('暖金黃昏色溫'),
  filmId: zh('富士 Provia 清透明亮'),
};
const create = (id, locks) => ({ id, seed: `z-on-location-v1-${id}`, locks: { ...common, ...locks } });
const tests = [
  create('bedroom-eye', { sceneAttributeId: 'indoor', locationId: zh('室內：女高生房間'), poseAnchorId: 'sitting-bed' }),
  create('bedroom-worm', { sceneAttributeId: 'indoor', locationId: zh('室內：女高生房間'), poseAnchorId: 'sitting-bed', angleId: zh('蟲眼視角鏡頭') }),
  create('park-eye', { sceneAttributeId: 'outdoor', locationId: zh('戶外：雜草叢生的廢棄公園'), poseAnchorId: 'sitting-bench', lightingId: zh('黃昏夕陽') }),
  create('park-worm', { sceneAttributeId: 'outdoor', locationId: zh('戶外：雜草叢生的廢棄公園'), poseAnchorId: 'sitting-bench', lightingId: zh('黃昏夕陽'), angleId: zh('蟲眼視角鏡頭') }),
  ...['japan-carriage-bench-front', 'japan-carriage-side-aisle', 'japan-carriage-rush-hour'].map((id, i) => create(`carriage-${i}`, {
    fixedCompositionSetId: id,
    fixedSetPositionId: i === 0 ? 'carriage-bench-relaxed' : 'none',
    fixedSetBackgroundStateId: 'carriage-window-coastal',
  })),
  create('no-scene', { locationId: zh('全無'), sceneAttributeId: 'none', poseAnchorId: 'sitting-bed' }),
  create('no-pose', { locationId: zh('室內：女高生房間'), poseBaseId: 'none', poseArrangementId: 'none', poseHandId: 'none', poseAnchorId: 'none' }),
  create('no-lights', { locationId: zh('室內：女高生房間'), poseAnchorId: 'sitting-bed', lightingId: zh('全無'), lightDirectionId: zh('全無') }),
  create('subject-light-only', { locationId: zh('室內：女高生房間'), poseAnchorId: 'sitting-bed', lightingId: zh('全無') }),
  create('park-bed-not-replaced', { sceneAttributeId: 'outdoor', locationId: zh('戶外：雜草叢生的廢棄公園'), poseAnchorId: 'sitting-bed', lightingId: zh('黃昏夕陽') }),
];
export const Z_IMAGE_ON_LOCATION_FIXTURES = Object.freeze([
  ...tests,
  ...SCENE_INTEGRATED_ASSEMBLY_FIXTURES.map((fixture) => ({ ...fixture, id: `historical-${fixture.id}` })),
]);
