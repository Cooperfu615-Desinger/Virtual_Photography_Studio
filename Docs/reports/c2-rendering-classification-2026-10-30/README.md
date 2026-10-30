# C2 成像診斷分類與結案盤點驗收

2026-10-30開始，2026-10-31完成本機驗收；待使用者驗收。未stage／commit／push。

基準main `2fa8fe65226903141597ab74b044a0102a6f8ca7`。本批只新增一條成像來源10–24詞診斷規則，修正指南中相機profile仍公開的過時說明，補充必要歷史銜接與清單；所有公開英文、ID、metadata、順序、alias、舊映射、renderer與收藏流程保持。

## 結果

25筆來源均15–24詞，全部保留，不新增alias或超長例外。診斷變化為：

| 狀態 | 前 | 後 |
| --- | ---: | ---: |
| under | 22 | 22 |
| over | 70 | 70 |
| within | 660 | 685 |
| unclassified | 106 | 81 |

38筆既有例外完全保持。before.json於修改policy前記錄，after.json與它只有25筆range／status及兩個summary值不同；來源指紋與其他欄位保持。

公開filmId為25筆成像加全無；八個舊相機profile不公開，舊filmId／cameraSystemId兩條遷移路徑保持，明確filmId優先權亦保持。回歸驗證八個原有目標，而不是以新推測取代映射。

## 結案盤點的重要更正

完整清單位於 `scripts/lib/c2ClosureInventory.json`，所有173筆under／over／unclassified有ID、來源SHA、理由與處置狀態。

- 38筆已具指紋例外：35筆over＋3筆未分類穿法。
- 7筆有既有批次審閱：5筆套裝＋2筆腰鍊；有review不等於另加policy例外。
- 78筆一般未分類修飾項，加上前述3筆穿法共81筆；八種類別有維護責任說明，不套用完整衣物的下限。
- 50筆診斷候選：28筆over、22筆under，沒有本輪C2逐筆語意審閱依據，保留原文並明列待審。

先前「成像分類後即可C2結案」的推估不夠完整：20筆套裝尾句審閱並不涵蓋全部套裝；不能把所有over或既有A2顏色整理當作本輪字數審閱。這批完成分類與盤點，沒有宣稱50筆語意問題已解決，也沒有宣稱全目錄C2內容已全面結案。後續可分批審閱，或由使用者決定列為非阻斷待辦後轉C5。

## 驗收

| 檢查 | 證據 |
| --- | --- |
| 完整Python | python.log，59/59，包括唯一rule差異、精確25列差異、唯讀性、歷史函式原文及清單完整性 |
| 聚焦回歸 | focused.log，9/9；含新反轉安全與八相機相容、原C2場景光學5項及Phase4反轉2項 |
| 原644組固定來源比較 | 包含於聚焦及前端測試；沿用前批before.json.gz，未重錄 |
| 原90組固定構圖／角色卡 | history-modes.log；15模式通過，48組差異是前批三筆英文核准差異，不是本批新增Prompt差異 |
| 前端全套 | tests.log，2066/2066，0失敗／0略過 |
| lint | lint.log，通過 |
| 唯讀sync／schema／歷史ID | sync-check.log，1050 ID／8生成物保持 |
| 來源與封存保護 | protection.json，固定Git逐位元檢查4401檔，含2765份舊報告、70份knowledge_base及501份既有webapp/src，全部保持 |
| 其他工作目錄 | other-worktrees.json，20工作目錄／140未提交檔保持 |

## 歷史銜接與驗收限制

只在隔離副本反轉本批policy及三個必要銜接檔，完整前後SHA與Git原文在c2RenderingClassificationPatches.json。兩個Python歷史測試只加decorator，原函式正文與斷言逐字保留；它們仍驗證當時25筆未分類及當時policy。現行政策另由新測試驗證，不刪舊斷言、不中途覆寫正式policy。

既有C2場景回放入口先反轉本批再走原歷史層。正式checkout、連結及可識別本批狀態中的未知混合來源被拒絕，先驗證後寫入暫存檔，錯誤不造成部分還原。歷史原patches、baseline與報告均未改。此次驗證必要銜接及原644／90比較；更早完整歷史鏈沿用2fa8fe65封存通過證據，不宣稱此次重跑整條鏈。

本批沒有產品資料或UI變更；來源位元組保護與完整測試提供驗收依據，沒有重新build、Prompt Quality、strict抽樣、瀏覽器或生圖。前批原生下拉popup未直接完成滑鼠驗收、未生成模型影像的限制繼續保留，不將其改標為已通過。

## 重跑

根目錄使用Node22及 `REGISTRY_BASE_COMMIT=2fa8fe65226903141597ab74b044a0102a6f8ca7`。

- `python3 -B -m unittest discover -s scripts/tests`
- `python3 -B scripts/sync_to_json.py --check --report-json`
- `python3 -B scripts/c2_rendering_classification_protection.py`（本批提交前保護檢查）
- `node --test webapp/src/lib/engine/c2RenderingClassification.test.js webapp/src/lib/engine/c2SceneOptics.test.js webapp/src/lib/engine/phase4History.test.js`
- `node scripts/c2_scene_optics_modes.mjs`
- webapp內 `npm test`、`npm run lint`

[規格與逐筆清單](../../specs/c2-rendering-classification-v1.md) · [決策](../../decisions/2026-10-30-c2-rendering-classification.md)

其他C類、PAGE2舊匯入、J12、P5b未併入。保留原始log尾端空白，不為diff-check改寫證據。

## 使用者驗收與交付授權（2026-10-31）

Cooper已確認本批驗收通過，授權限定提交並推送規範、診斷政策、清單、測試、歷史銜接與驗收證據。上文及acceptance.json的待驗收／未提交狀態是本機驗收當時快照，保留原紀錄；CI與部署須另核對本次提交的實際結果。50筆待審內容另批處理，先不進入C5；PAGE2舊匯入、J12、P5b及瀏覽器限制保持。
