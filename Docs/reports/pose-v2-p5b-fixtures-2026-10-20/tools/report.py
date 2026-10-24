import json, collections, os
P = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(P, 'stage2.json')))
AB = {'poseBaseId': 'poseBaseId', 'poseOrientationId': 'poseOrientationId', 'poseArrangementId': 'poseArrangementId', 'poseHandId': 'poseHandId',
      'posePropId': 'posePropId', 'poseHeadId': 'poseHeadId', 'poseAnchorId': 'poseAnchorId', 'poseId': 'poseId', 'specialActionId': 'specialActionId'}
leg = lambda r: '<br>'.join(f'{k}={v}' for k, v in r['legacy'].items()) or '—'
def sugg(r):
    s = r.get('suggest') or {}
    if r['cls'] == 'A':
        if r['source'].startswith('representative'):
            return '刪除舊欄位即可（實測：不加 captureStyle 時 6 輸出與 selection 皆相同；加 captureStyle=mirror 則 selection 多 captureStyleId）'
        return '刪除舊欄位（固定組人物位置已管理姿勢）'
    if r['cls'] == 'C': return '刪除 fixture（主題無新功能對應）'
    if r['cls'] == 'D': return '不動'
    parts = []
    if s.get('specifiedActionId'): parts.append(f"specifiedActionId={s['specifiedActionId']}")
    if s.get('captureStyleId'): parts.append(f"captureStyleId={s['captureStyleId']}")
    if s.get('gazeId'): parts.append(f"gazeId={s['gazeId']}")
    if not parts: parts.append('清空舊欄位（不設指定動作）')
    return '；'.join(parts) + (f"。{s['note']}" if s.get('note') else '')
def runres(r):
    if r['cls'] == 'A': return '6 輸出逐字相同' + (f"；selection 差異：{','.join(r['aSelectionDiff'])}" if r['aSelectionDiff'] else '；selection 相同')
    if r['cls'] == 'B':
        t = '改寫後變動：' + ','.join(r['bOutputDiff'])
        if r.get('bActionApplied'): t += f"；動作生效={r['bActionApplied']}"
        if r.get('altAnyOutputDiff') is not None: t += f"；改用 any 變動：{','.join(r['altAnyOutputDiff'])}"
        return t
    if r['cls'] == 'C': return '清空舊欄位後變動：' + ','.join(r['aOutputDiff'] or [])
    return '—'

# ---- baseline membership ----
def src(prefix): return [r for r in rows if r['source'].startswith(prefix)]
SCENE = src('sceneIntegratedAssemblyFixtures')
scene_by = {r['id']: r for r in SCENE}
HIST_AGG = {
    'fullCamera': src('zImageFullBodyCameraFixtures'), 'upperScene': src('zImageUpperSceneFixtures'), 'ambient': src('ambientLightFixtures.js#AMBIENT_MATRIX'),
    'upperExtension': src('zImageUpperSceneExtensionFixtures'), 'sceneDetail': src('zImageSceneDetailPriorityFixtures'), 'visibility': src('gptSceneVisibilityFixtures'),
    'camera': src('gptCameraSpatialFixtures'), 'worm': src('closeWormEyeFixtures'),
}
AMB_EX = src('ambientLightFixtures.js#AMBIENT_EXCLUDED')
DIR_IDS = [i for i in scene_by if not i.startswith(('R16', 'R17'))]
REP = src('representativePromptFixtures'); MJN = src('midjourneyNaturalFixtures'); NANO = src('nanoBananaFixtures'); FAC = src('nanoBananaFacialFeaturesFixtures')
BASELINES = [
    ('sceneIntegratedAssemblyBaseline.json', '逐案（45 cases）', SCENE),
    ('sceneDirectionalZImageExpected.json', '逐案（35 cases，不含 R16/R17）', [scene_by[i] for i in DIR_IDS]),
    ('sceneIntegratedMidjourneyExpected.json', '逐案（35 cases，不含 R16/R17）', [scene_by[i] for i in DIR_IDS]),
    ('zImageOnLocationBaseline.json', '逐案（57 cases）', src('zImageOnLocationFixtures')),
    ('zImageUpperSceneBaseline.json', '整批雜湊（230）', HIST_AGG['upperScene']),
    ('zImageFullBodyCameraBaseline.json', '整批雜湊（431）', HIST_AGG['fullCamera']),
    ('zImageUpperSceneExtensionBaseline.json', '整批雜湊（930）', HIST_AGG['upperExtension']),
    ('zImageSceneDetailPriorityBaseline.json', '整批雜湊（1430）', HIST_AGG['sceneDetail']),
    ('ambientLightBaseline.json', '整批雜湊（720）＋excluded 10', HIST_AGG['ambient'] + AMB_EX),
    ('gptSceneVisibilityBaseline.json', '整批雜湊（5614）', HIST_AGG['visibility']),
    ('gptCameraSpatialBaseline.json', '整批雜湊（6320）', HIST_AGG['camera']),
    ('closeWormEyeBaseline.json', '整批雜湊（6370）', HIST_AGG['worm']),
    ('midjourneyNaturalProtectedBaseline.json', '逐案（986）', REP + MJN),
    ('midjourneyBodyPreservationBaseline.json', '逐案（986）', REP + MJN),
    ('nanoBananaProtectedBaseline.json', '逐案（382）', NANO),
    ('nanoBananaFacialFeaturesProtectedBaseline.json', '逐案（1078）', NANO + FAC),
    ('midjourneyNaturalMirrorProtected.json', '逐案（8，engineMirrorSelfieProp.test.js 內嵌）', src('engineMirrorSelfieProp')),
    ('midjourneyNaturalCatalogProtected.json', 'body 60 逐案＋bandage/tie 各 1 整批', src('bodyTypeCatalog.test') + [{'cls': 'D'}, {'cls': 'D'}]),
]
hist_groups = [(f'scene:{r["id"]}', [r]) for r in SCENE] + [(f'ambient-excluded:{r["id"]}', [r]) for r in AMB_EX] + list(HIST_AGG.items())
cnt = lambda rs: collections.Counter(r['cls'] for r in rs)
fmt = lambda c: ' / '.join(str(c.get(k, 0)) for k in 'ABCD')

bl_rows = []
for name, kind, rs in BASELINES:
    c = cnt(rs); regen = c.get('B', 0) + c.get('C', 0) > 0
    bl_rows.append({'baseline': name, 'kind': kind, 'total': len(rs), 'A': c.get('A', 0), 'B': c.get('B', 0), 'C': c.get('C', 0), 'D': c.get('D', 0),
                    'needsRegen': regen, 'changedEntries': c.get('B', 0) + c.get('C', 0)})
hg = collections.Counter('regen' if any(r['cls'] in 'BC' for r in rs) else 'keep' for _, rs in hist_groups)
hist_detail = {g: dict(cnt(rs)) for g, rs in hist_groups}
UNAFFECTED = ['bandagePastiesBaseline.json', 'minimalCoverageWardrobeBaseline.json', 'midjourneyNaturalMinimalProtected.json', 'bodyTypeLegacyFixtures.json',
              'gptSceneVisibilityLegacyScenes.json', 'specifiedActionsV1Sources.json', 'midjourneyNaturalAccepted.json']

src_rows = []
for s in sorted(set(r['source'] for r in rows)):
    c = cnt([r for r in rows if r['source'] == s]); src_rows.append((s, sum(c.values()), c))

# ---- JSON ----
json.dump({'generatedBy': 'scratchpad/p5b/harness.mjs + stage2.mjs + report.py', 'repoHead': '316cb64',
           'method': '每列以原輸入與改寫後輸入、同 seed 實跑 generatePrompts，比較 GPT/Z/MJ/Nano/胸上/全身角色圖 6 輸出逐字；A=只刪舊欄位（頭→gazeId、自拍→captureStyleId 對映）後 6 輸出逐字相同；B/C 為判斷，B 另以建議改寫實跑',
           'baselines': bl_rows, 'historicalProtectedGroups': {'regen': hg['regen'], 'keep': hg['keep'], 'detail': hist_detail},
           'unaffectedBaselines': UNAFFECTED, 'sources': [{'source': s, 'total': n, **{k: c.get(k, 0) for k in 'ABCD'}} for s, n, c in src_rows],
           'sourceBaselines': {r['source']: r['baselines'] for r in rows},
           'rows': [{k: v for k, v in r.items() if k not in ('baselines',) and v not in (None, [], {}) and not (k == 'aSelectionDiff' and r['cls'] != 'A')} for r in rows]}, open(os.path.join(P, 'fixtures.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

# ---- Markdown ----
L = []
w = L.append
w('# P5b 舊自由組合 fixture 處理清單（唯讀調查，repo 316cb64）\n')
w('- 產生方式：`scratchpad/p5b/harness.mjs`（收集 fixture、實跑 A 改寫）→ `stage2.mjs`（B/C 判斷、B 改寫實跑）→ `report.py`。在 `webapp/` 執行 `node <scratchpad>/p5b/stage2.mjs && python3 <scratchpad>/p5b/report.py` 可重現。')
w('- 「啟用」＝實體化後（byZh 解析、基底全無）舊欄位值不是空／none／全無。舊欄位：poseBaseId、poseOrientationId、poseArrangementId、poseHandId、posePropId、poseHeadId、poseAnchorId、poseId、specialActionId。')
w('- A 判定＝**實跑**：刪掉全部舊欄位，頭部屬 GAZE_HEADS 可對映值時設 gazeId、自拍手／鏡子（含舊手部鏡子 id）設 captureStyleId，同 seed 比 6 輸出逐字。B/C 為人工判斷；B 列另以「建議改寫」實跑，記錄哪些輸出改變、指定動作是否生效。')
w('- 6 輸出縮寫：GPT=grokPrompt、Z=zImagePrompt、MJ=midjourneyPrompt、Nano=nanoBananaPrompt、胸上=chest-up-portrait、全身角色圖=full-body-character。全身角色圖在所有列都不變（舊姿勢不進該輸出）。')
w('- 範圍限制：只逐列列出 *Fixtures.js 模組、凍結基準 JSON，以及兩個餵基準的內嵌 fixture（engineMirrorSelfieProp.test.js 的 8 組、bodyTypeCatalog.test.js 的 60 組）。其餘測試檔內嵌的舊欄位用例只列在最後的檔案層級表（not_stated 逐案分類）。\n')
w('## 1. 基準檔統計（A / B / C / D）\n')
w('| 基準 | 型態 | 總數 | A | B | C | D | 需重產 |'); w('|---|---|---|---|---|---|---|---|')
for b in bl_rows:
    w(f"| {b['baseline']} | {b['kind']} | {b['total']} | {b['A']} | {b['B']} | {b['C']} | {b['D']} | {'是（變動 ' + str(b['changedEntries']) + '）' if b['needsRegen'] else '否'} |")
w(f"| midjourneyNaturalHistoricalProtected.json | 63 組（每組一個雜湊） | 63 組 | — | — | — | — | 是：{hg['regen']} 組需重產、{hg['keep']} 組不變 |")
w('\n只有 A 與 D、全部處理後**完全不需要重產**的基準：' + '、'.join(UNAFFECTED) + '（其測試檔／fixture 沒有任何舊欄位鎖定，grep 為 0）；上表 18 個基準＋Historical 全部需要重產或刪列。\n')
w('### midjourneyNaturalHistoricalProtected 各組\n')
w('| 組 | A/B/C/D | 處理 |'); w('|---|---|---|')
for g, rs in hist_groups:
    c = cnt(rs); w(f"| {g} | {fmt(c)} | {'重產' if c.get('B',0) else ('刪組' if c.get('C',0) and len(rs)==1 else ('重產' if c.get('C',0) else '不變'))} |")
w('\n## 2. 來源統計\n')
w('| 來源 | 總數 | A | B | C | D |'); w('|---|---|---|---|---|---|')
for s, n, c in src_rows: w(f"| {s} | {n} | {c.get('A',0)} | {c.get('B',0)} | {c.get('C',0)} | {c.get('D',0)} |")
w('\n## 3. 逐列清單（非矩陣來源）\n')
w('| 來源 | id | 啟用的舊欄位與值 | 分類 | 原本測的主題 | 建議處理 | 實跑結果 |'); w('|---|---|---|---|---|---|---|')
INDIV = ('sceneIntegrated', 'zImageOnLocation', 'representative', 'compositionVisibility', 'fixedFraming', 'aiPromptLength', 'engineMirror', 'nanoBananaFixtures')
for r in rows:
    if r['source'].startswith(INDIV) and r['cls'] != 'D':
        w(f"| {r['source'].split('#')[0]} | {r['id']} | {leg(r)} | {r['cls']} | {r.get('topic') or ''} | {sugg(r)} | {runres(r)} |")
w('\nD（未啟用舊欄位，不動）列：')
for pre in INDIV:
    ids = [r['id'] for r in rows if r['source'].startswith(pre) and r['cls'] == 'D']
    if ids: w(f"- {pre}：{len(ids)} 個：{', '.join(ids)}")
w('\n## 4. 分組清單（矩陣與大批來源；逐 id 見 fixtures.json）\n')
w('| 來源 | 分類 | 啟用的舊欄位與值 | 主題 | 建議處理 | 列數 | 實跑結果（變動輸出：列數） | 例 id |'); w('|---|---|---|---|---|---|---|---|')
grp = collections.OrderedDict()
for r in rows:
    if r['source'].startswith(INDIV) or r['cls'] == 'D' and not r['source'].startswith(('midjourneyNatural', 'nanoBananaFacial', 'bodyType')): continue
    if r['cls'] == 'D': key = (r['source'], 'D', '—', '', '不動')
    else: key = (r['source'], r['cls'], leg(r), r.get('topic') or '', sugg(r))
    grp.setdefault(key, []).append(r)
for (s, c, lg, tp, sg), rs in grp.items():
    dist = collections.Counter(','.join((r.get('bOutputDiff') if c == 'B' else r.get('aOutputDiff')) or []) for r in rs)
    w(f"| {s.split('#')[0]} | {c} | {lg} | {tp} | {sg} | {len(rs)} | {'; '.join(f'{k or chr(8212)}:{v}' for k, v in dist.items())} | {rs[0]['id']} |")
w('\n各矩陣 D 列（未啟用）數：' + '；'.join(f"{s.split('#')[0]} {sum(1 for r in rows if r['source']==s and r['cls']=='D')}" for s, _, _ in src_rows if s.split('#')[0].startswith(('zImage', 'ambient', 'gpt', 'closeWorm'))) + '（皆為 R16-duo／R16-fixed／R16-character-card 衍生的排除列）。\n')
open(os.path.join(P, 'fixtures.md'), 'w').write('\n'.join(L) + '\n' + open(os.path.join(P, 'appendix.md')).read())
print('\n'.join(f"{b['baseline']}: {b['total']} A{b['A']} B{b['B']} C{b['C']} D{b['D']} regen={b['needsRegen']}" for b in bl_rows))
print('hist', hg)
