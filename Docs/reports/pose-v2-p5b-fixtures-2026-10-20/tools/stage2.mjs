// Stage 2: B/C judgement, B-rewrite real runs, per-baseline aggregation.
import { writeFileSync } from 'node:fs';
const P = new URL('.', import.meta.url).pathname;
process.argv[2] = P + 'stage1.json';
const H = await import('./harness.mjs');
const { rows, run, diffOutputs, diffSelection, stripLegacy } = H;

const SIT = 'specified-sitting-side-fold-back-support';
const KNEEL = 'specified-kneeling-wide-hands-front';
const SIDE = 'specified-lying-left-side-forearm';
const SUPINE = 'specified-lying-supine-raised-crossed-legs';
const PRONE = 'specified-lying-prone-forearms-crossed-ankles';

const T = {
  scene: '場景整合組裝（Z 開場拼裝／MJ）', upper: '低機位上方場景補述', fullCam: '全身相機群組／光學／環繞', ext: '上方場景擴充', detail: '低機位場景細節優先',
  ambient: '環境光描述', vis: 'GPT 場景／光線可見度投影', camera: 'GPT 構圖相機空間', worm: '近距離蟲眼（中景／牛仔）',
};
const topicOfSource = s => s.startsWith('zImageUpperSceneFixtures') ? T.upper : s.startsWith('zImageFullBody') ? T.fullCam : s.startsWith('zImageUpperSceneExt') ? T.ext
  : s.startsWith('zImageSceneDetail') ? T.detail : s.startsWith('ambient') ? T.ambient : s.startsWith('gptSceneVis') ? T.vis : s.startsWith('gptCamera') ? T.camera
  : s.startsWith('closeWorm') ? T.worm : '';

const NONE_NOTE = '動作庫沒有站姿／蹲姿的一般動作：建議清空舊欄位（姿勢＝全無）；替代：specifiedActionId=any（任意，會輸出 candid mid-movement 句）';
const B = (s, topic) => ({ cls: 'B', topic, suggest: s });
const C = topic => ({ cls: 'C', topic });

// Per-base-fixture judgement for scene-integrated R-series (also used for derived copies).
function sceneRule(id) {
  const r = id.replace(/^historical-/, '');
  if (/^R01/.test(r)) return B({ captureStyleId: 'selfie', note: '保留自拍拍攝方式；蹲姿無對應動作且自拍與指定動作互斥，蹲姿與牆面支撐、仰頭一併移除' }, '低機位蹲姿自拍的場景整合組裝（自拍動作搬入拍攝情境）');
  if (/^R02/.test(r)) return B({ captureStyleId: 'selfie', note: '自拍與指定動作互斥，跪姿移除' }, '高機位跪姿自拍的場景整合組裝');
  if (/^R03/.test(r)) return C('與 R01 同 seed 的單變數比較：有無牆面支撐錨點（poseAnchorId）');
  if (/^R04-standing/.test(r)) return B({ note: NONE_NOTE }, '站姿基準的場景整合組裝');
  if (/^R04-sitting/.test(r)) return B({ specifiedActionId: SIT }, '坐姿基準的場景整合組裝');
  if (/^R05/.test(r)) return C('蹲姿手肘撐膝（squatting-hands-forward）手部支撐');
  if (/^R06/.test(r)) return B({ captureStyleId: 'mirror', note: '舊手部鏡子自拍→拍攝方式「鏡子自拍」；跪姿移除' }, '鏡子自拍的場景整合組裝');
  if (/^R07/.test(r)) return B({ captureStyleId: 'companion', note: '跪姿移除' }, '男友視角自拍的場景整合組裝');
  if (/^R08/.test(r)) return B({ captureStyleId: 'selfie', note: '跪姿移除' }, '裁切（全身→五官）下的場景整合組裝');
  if (/^R09/.test(r)) return B({ note: NONE_NOTE }, '環繞角度／半臉裁切下的場景整合組裝');
  if (/^R10/.test(r)) return C('單手向鏡頭張開手掌（舊手部動作的遮擋）');
  if (/^R1[1-3]|^R15|^R18/.test(r)) return B({ note: NONE_NOTE }, '服裝／場景／光學／衍生輸出隔離／可見文字的場景整合組裝');
  if (/^R14/.test(r)) return B({ note: NONE_NOTE + '；牆面支撐錨點移除' }, 'MJ 成像與場景整合');
  if (/^R16-special/.test(r)) return B({ note: NONE_NOTE }, '排除模式：特殊角色（skeleton）不進場景整合');
  if (/^R17/.test(r)) return C('排除模式：仰躺 surface-led（床面／水中／清澈海面錨點）不進場景整合；P5b 刪除水域／錨點／躺姿片語後此路徑不存在');
  if (/^R19/.test(r)) return B({ specifiedActionId: 'random', gazeId: 'random', note: '舊欄位全隨機→指定動作隨機＋視線隨機' }, '隨機姿勢下的場景整合組裝');
  return null;
}
function signatureRule(lg, source) {
  const topic = topicOfSource(source);
  const keys = Object.keys(lg).sort().join(',');
  const b = lg.poseBaseId;
  const simple = ['poseArrangementId,poseBaseId', 'poseBaseId', 'poseArrangementId,poseBaseId,poseOrientationId'].includes(keys);
  if (b === 'lying' && lg.poseOrientationId === 'lying-supine' && /surface|water|sea/.test(lg.poseAnchorId || '')) return sceneRule('R17');
  if (!simple) return null;
  if (b === 'standing') return B({ note: NONE_NOTE }, topic);
  if (b === 'sitting') return B({ specifiedActionId: SIT }, topic);
  if (b === 'kneeling') return B({ specifiedActionId: KNEEL }, topic);
  if (b === 'squatting') return B({ note: NONE_NOTE }, topic + '（蹲姿相機分組）');
  if (b === 'lying' && lg.poseOrientationId === 'lying-side') return B({ specifiedActionId: SIDE }, topic + '（側躺相機分組）');
  return null;
}
const REP = {
  'gpt-standalone-body-omission': B({ note: NONE_NOTE }, 'GPT 省略獨立體態來源'),
  'shibuya-moving-crowds': B({ note: NONE_NOTE }, '澀谷低機位人潮場景'),
  'whirly-lollipop-mouth': C('舊道具：螺旋棒棒糖在嘴前'),
  'kneeling-support-hands-palms-planted-ground': B({ specifiedActionId: 'specified-kneeling-all-fours-palms' }, '四足跪姿雙掌撐地在裁切前的支撐解析'),
  'kneeling-support-hands-elbows-planted-ground': B({ specifiedActionId: 'specified-kneeling-all-fours-forearms' }, '四足跪姿雙肘撐地在裁切前的支撐解析'),
  'heart-gesture-both-hands-heart-near-face': C('舊手部：雙手比心（新手勢清單無對應）'),
  'heart-gesture-one-hand-finger-heart': C('舊手部：單手指愛心'),
  'bathroom-vanity-generic-reflection': B({ specifiedActionId: SIT }, '浴室洗手台場景與鏡面反射'),
  'normal-single': B({ note: NONE_NOTE }, '一般單人分件服裝'),
  'upper-garment-adjustment': C('舊手部：調整上衣'),
  'upper-garment-lift-underbust': C('舊手部：上衣撩至下胸'),
  'hands-cover-breasts': C('舊手部：雙手遮胸'),
  'outerwear-shoulders-down-wide-open': C('舊手部：拉開外套落肩'),
  'standing-pelvis-back-curve': C('舊肢體變化：骨盆後推曲線＋手＋頭'),
  'open-palm-lens-occlusion': C('舊手部：張開手掌遮鏡頭'),
  'restored-companion-selfie': B({ captureStyleId: 'companion', gazeId: 'gaze-camera', note: '坐姿移除（自拍與指定動作互斥）' }, '還原的男友視角自拍'),
  'neutral-upward-waist-adjustment': C('舊手部：向上拉腰頭'),
  'squatting-forward-elbows-on-knees': C('舊肢體變化：前傾蹲手肘撐膝'),
  'lying-prone-upper-propped': B({ specifiedActionId: PRONE }, '趴躺上身撐起的共用幾何'),
  'supine-medium-water-overhead-arms': C('仰躺水中 surface-led＋雙手上舉（無對應）'),
  'normal-single-ai-compression-source-retention': B({ specifiedActionId: SIT, gazeId: 'gaze-camera' }, 'AI 壓縮保留構圖／表情／成像錨點'),
  'z-image-turbo-strict-side-real-generation': B({ note: NONE_NOTE + '；舊手（握腰頭）與頭（看手）無對應' }, 'Z-Image 高機位嚴格側面幾何'),
  'pose-composer-canonical': C('Pose Composer canonical 句型（坐＋鏡子道具＋頭＋絲絨扶手椅坐具）'),
  'pose-composer-squatting-hand': C('蹲姿專屬手部動作來源可追溯'),
  'pose-composer-half-reclining-b2': C('半躺＋自然支撐（不點名支撐物）'),
  'pose-composer-random-selfie-orbit': C('隨機手部的服裝相容與自拍環繞不覆寫'),
  'special-outfit': B({ note: NONE_NOTE }, '特殊套裝'),
  'fixed-composition': B({ note: NONE_NOTE }, '固定組合保留分件服裝'),
};
for (const id of ['carriage-fixed-japan-carriage-bench-front', 'carriage-fixed-japan-carriage-side-aisle', 'carriage-fixed-japan-carriage-rush-hour'])
  REP[id] = B({ note: '固定場景未選人物位置時舊站姿生效；建議清空（由場景管理姿勢）' }, '日本車廂固定組：裁切、相機位置與窗景');
for (const id of ['station-fixed-nyc-subway-bench-platform', 'station-fixed-london-tube-arriving-platform', 'station-fixed-yamanote-platform-advertising'])
  REP[id] = B({ note: '固定場景未選人物位置時舊站姿生效；建議清空（由場景管理姿勢）' }, '車站固定組：軸線、人物朝向與鏡頭');
const ONLOC = {
  'bedroom-eye': B({ specifiedActionId: SIT, note: '手動坐具「坐在床上」與撥髮手無對應；指定坐姿為地面坐，會失去床' }, 'Z on-location：臥室＋手動坐具（床）'),
  'bedroom-worm': B({ specifiedActionId: SIT, note: '同上' }, 'Z on-location：臥室蟲眼＋手動坐具（床）'),
  'park-eye': B({ specifiedActionId: SIT, note: '手動坐具「坐在長椅」無對應；會失去長椅' }, 'Z on-location：廢棄公園＋手動坐具（長椅）'),
  'park-worm': B({ specifiedActionId: SIT, note: '同上' }, 'Z on-location：公園蟲眼＋手動坐具（長椅）'),
  'carriage-1': B({ note: '固定組未選人物位置，清空舊坐姿由場景管理' }, 'Z on-location：車廂側走道固定組'),
  'carriage-2': B({ note: '同上' }, 'Z on-location：車廂尖峰固定組'),
  'no-scene': B({ specifiedActionId: SIT, note: '床坐具移除' }, 'Z on-location：無場景時不組開場'),
  'no-lights': B({ specifiedActionId: SIT, note: '床坐具移除' }, 'Z on-location：無光線'),
  'subject-light-only': B({ specifiedActionId: SIT, note: '床坐具移除' }, 'Z on-location：只有主體光'),
  'park-bed-not-replaced': C('手動坐具（床）在公園場景不被替換'),
};
const NANO = {
  'canonical:standing': B({ note: NONE_NOTE }, 'Nano canonical pose：站姿'),
  'canonical:sitting-mirror': B({ captureStyleId: 'mirror', note: '坐姿、翹腿、床坐具移除' }, 'Nano canonical pose：坐床鏡子自拍'),
  'supine:lying-bed-surface': B({ specifiedActionId: SUPINE, note: '新仰躺動作只限地面（supineGroundOnly），床面不保留' }, 'Nano canonical pose：仰躺床面'),
  'supine:lying-tatami-surface': C('Nano canonical pose：仰躺榻榻米表面錨點'),
  'supine:lying-dry-bathtub': C('Nano canonical pose：仰躺乾浴缸表面錨點'),
};
const COMP = {
  'head-shoulders-pose-scene-pressure': B({ note: NONE_NOTE + '；涵蓋 dress/scene 的斷言保留，pose/anchor 斷言刪除' }, '頭肩裁切下洋裝／姿勢／錨點／場景投影'),
  'chest-up-visible-pose-fragments': C('胸上裁切可見的舊姿勢片段（道具塗口紅、前傾、牆面支撐）'),
  'medium-pose-base-fallback': C('中景時舊姿勢基底回退（手摸下巴、鏡面立方台）'),
  'cowboy-pose-without-foot-action': C('牛仔裁切去掉腳部動作（一腳點地）'),
  'medium-hidden-lower-hand-action': C('中景隱藏下腹手部動作'),
  'full-body-complete-composition': B({ note: NONE_NOTE + '；涵蓋 separates/scene 保留，pose/anchor 斷言刪除' }, '全身完整構圖（分件、場景、姿勢、錨點）'),
};
const MIRROR = {
  'mirror:standing:牛仔中景 (Cowboy Shot)': B({ captureStyleId: 'mirror', note: '站姿與仰頭移除' }, '鏡子自拍道具（站姿、浴室、背面高位）'),
  'untouched:selfie-natural-right-arm:牛仔中景 (Cowboy Shot)': B({ captureStyleId: 'selfie', note: '站姿與仰頭移除' }, '一般自拍不被鏡子邏輯改動'),
  'untouched:scroll:牛仔中景 (Cowboy Shot)': C('舊道具：滑手機不被鏡子邏輯改動'),
};

function judge(r) {
  if (r.cls === 'A' || r.cls === 'D') return null;
  const s = r.source; const id = r.id;
  if (s.startsWith('representative')) return REP[id] || null;
  if (s.startsWith('zImageOnLocation')) return id.startsWith('historical-') ? sceneRule(id) : ONLOC[id] || null;
  if (s.startsWith('sceneIntegrated')) return sceneRule(id);
  if (s.startsWith('nanoBananaFixtures')) return NANO[id] || null;
  if (s.startsWith('nanoBananaFacial')) { const m = id.match(/^facial:pose:([^:]+):/); const k = m?.[1] === 'standing' ? 'canonical:standing' : m?.[1] === 'mirror' ? 'canonical:sitting-mirror' : `supine:${m?.[1]}`; return NANO[k] || null; }
  if (s.startsWith('composition')) return COMP[id] || null;
  if (s.startsWith('engineMirror')) return MIRROR[id] || C('鏡子道具×坐姿／躺姿（含床面錨點）組合；鏡子自拍與指定動作互斥，新功能無法表達');
  if (s.startsWith('bodyTypeCatalog')) return B({ note: NONE_NOTE }, '體態目錄 60 組非體態位元組不變');
  if (s.startsWith('fixedFramingDerived') && id === 'chest-up-normal-separates-pose-scene-imaging') return B({ note: NONE_NOTE + '；手摸下巴、頭傾、牆面支撐無對應' }, '胸上衍生輸出：分件／姿勢／場景／成像');
  if (s.startsWith('fixedFramingDerived')) return B({ note: '固定組合；清空舊站姿' }, '胸上衍生輸出：固定組合場景來源');
  if (s.startsWith('fixedFramingPrompt')) return B({ note: NONE_NOTE }, '半臉裁切分件服裝');
  if (s.startsWith('aiPromptLength')) return B({ specifiedActionId: 'specified-sitting-raised-right-knee', note: '用子句最長的坐姿動作維持長度壓力；舊手／頭／牆面支撐無對應' }, 'AI 長度預算：canonical pose 壓力');
  // matrices: inherit from the R-series base (excluded copies) or the pose signature
  const base = id.match(/(R\d\d-[a-z-]+\d?)/)?.[1];
  if (r.excluded && base) return sceneRule(base);
  return signatureRule(r.legacy, s);
}

function applySuggest(locks, sg) {
  const l = stripLegacy(locks);
  if (sg.specifiedActionId) l.specifiedActionId = sg.specifiedActionId;
  if (sg.gazeId) l.gazeId = sg.gazeId;
  if (sg.captureStyleId) l.captureStyleId = sg.captureStyleId;
  return l;
}
let unjudged = 0;
for (const r of rows) {
  r.topic = r.cls === 'A' ? '' : undefined;
  if (r.cls === 'X') {
    const j = judge(r);
    if (!j) { r.cls = 'not_stated'; unjudged += 1; continue; }
    r.cls = j.cls; r.topic = j.topic; r.suggest = j.suggest;
    if (j.cls === 'B') {
      const orig = run(r.locks, r.seed, r.runtimeOptions);
      const after = run(applySuggest(r.locks, j.suggest), r.seed, r.runtimeOptions);
      r.bOutputDiff = diffOutputs(orig, after);
      r.bActionApplied = j.suggest.specifiedActionId ? (after.selection?.specifiedActionId || 'none') : undefined;
      r.bError = after.error || null;
      if (j.suggest.note && j.suggest.note.startsWith('動作庫沒有站姿') && /^(sceneIntegrated|representative)/.test(r.source)) {
        const alt = run(applySuggest(r.locks, { specifiedActionId: 'any' }), r.seed, r.runtimeOptions);
        r.altAnyOutputDiff = diffOutputs(orig, alt);
      }
    }
  }
}
console.error('unjudged', unjudged);
const out = rows.map(({ fixture, mat, locks, ...r }) => ({
  source: r.source, id: r.id, baselines: r.baselines, seed: r.seed, legacy: r.legacy, cls: r.cls, topic: r.topic || undefined,
  suggest: r.suggest, mapping: r.mapping, aOutputDiff: r.aOutputDiff, aSelectionDiff: r.aSelectionDiff,
  bOutputDiff: r.bOutputDiff, bActionApplied: r.bActionApplied, bError: r.bError || undefined, altAnyOutputDiff: r.altAnyOutputDiff,
  excluded: fixture?.excluded || undefined,
}));
writeFileSync(P + 'stage2.json', JSON.stringify(out));
