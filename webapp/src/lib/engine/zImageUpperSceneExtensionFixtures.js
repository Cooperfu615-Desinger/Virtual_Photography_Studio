// Approved extension fixtures, independent of runtime source records.
import { upperSceneFixture, UPPER_SCENE_ANGLES, UPPER_SCENE_MATRIX, UPPER_SCENE_EXCLUDED, UPPER_SCENE_CONTROLS } from './zImageUpperSceneFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

export const UPPER_SCENE_EXTENSION_CASES = [
  [
    "室內：精品飯店房間",
    "an upper curtain track, the wall-to-ceiling junction"
  ],
  [
    "室內：現代高樓公寓客廳",
    "the upper window frame, an adjacent ceiling edge"
  ],
  [
    "室內：臥室窗邊",
    "the curtain rail and top of the window frame"
  ],
  [
    "室內：更衣室 / 試衣間",
    "the curtain track overhead"
  ],
  [
    "室內：電梯內",
    "the top of the elevator doors, the cabin ceiling edge"
  ],
  [
    "室內：木造圖書館閱讀桌旁",
    "the upper tiers of nearby wooden bookshelves"
  ],
  [
    "室內：木造圖書館書車旁",
    "the upper tiers of nearby wooden bookshelves"
  ],
  [
    "室內：木造圖書館借書台前",
    "the upper tiers of nearby wooden bookshelves"
  ],
  [
    "戶外：日本住宅外樓梯間",
    "the underside of the landing above, steel supports"
  ],
  [
    "室內：廢棄水泥工廠生鏽控制室",
    "cable bundles along the wall-to-ceiling junction"
  ],
  [
    "室內：廢棄水泥工廠機具堆放區",
    "steel beams overhead"
  ],
  [
    "室內：地下排洪道積水牆角",
    "the concrete ceiling meeting the stained wall"
  ],
  [
    "戶外：霧感森林步道",
    "overlapping branches and foliage overhead"
  ],
  [
    "戶外：森林營地帳篷營火",
    "branches and foliage above the tree trunks"
  ]
];
export const UPPER_SCENE_EXTENSION_MATRIX = UPPER_SCENE_EXTENSION_CASES.flatMap(([location]) => UPPER_SCENE_ANGLES.flatMap((angle) =>
  ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)', '全身鏡頭 (Full Body Shot)']
    .map((framing) => upperSceneFixture(location, angle, framing))));
export const UPPER_SCENE_EXTENSION_EXCLUDED = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter((f) => f.excluded)
  .flatMap((f) => UPPER_SCENE_EXTENSION_CASES.map(([location]) => ({
    ...f, id: `extension/${f.id}/${location}`,
    locks: { ...f.locks, locationId: { byZh: location }, angleId: { byZh: '腰部高度鏡頭' } },
  })));
export const UPPER_SCENE_EXTENSION_REGRESSION = [
  ...UPPER_SCENE_EXTENSION_MATRIX, ...UPPER_SCENE_EXTENSION_EXCLUDED,
  ...UPPER_SCENE_MATRIX, ...UPPER_SCENE_EXCLUDED, ...UPPER_SCENE_CONTROLS,
];
