# C4 第一批：道具與手勢中文顯示 v1

2026-10-29，基準 main `c5b0d4cdd9189da8bb0524c5a76a0de0a0fdb52c`。只修改中文名稱／說明，不 commit／push。

## 修訂及用途

| ID | 修改 | 用途及可見性 |
| --- | --- | --- |
| hand-hold-fuji-x100v | 名稱由「手持單眼 FUJI X-100V 相機」改為「手持 FUJIFILM X100V 相機」 | 現行 B 區道具可選；英文與原說明不變。 |
| one-hand-support-chin | 名稱仍為「單手托下巴」，補說明：一手輕托下巴，指尖位於下顎下方，另一手沿身體或支撐面自然放鬆。 | Pose Composer 資料中的 active 手勢，仍受原景別／面部可見性／基底條件約束。不是宣稱目前 B 區直接使用此 ID。 |
| one-hand-chin-other-down | 名稱改為「單手托下巴（舊版）」，補說明：舊版手勢，僅保留既有選值還原：一手托住下巴，另一手沿身體或支撐面自然放鬆。 | 經 deprecatedPoseHand 包裝，保持 uiHidden／deprecated 及原相容路徑，不重新加入選單。 |

現行 B 區手勢由指定動作／gazeGesture 的 `support-chin` 提供；其名稱、英文及行為完全不改。本批不更動新舊系統的接管、隱藏或遷移政策。兩個 poseHandId 不是現行 UI 同時可選的重複按鈕。

## 保護契約

- 僅三筆 zh／desc 改動；所有英文、ID、meta、投影、順序、選值、隨機政策不變。
- 允許新生成的中文摘要／選單與來源說明呈現核准名稱；英文公開輸出不得變化。
- 已保存收藏的原文不批次重寫；讀取／序列化沿用既有程式，舊 ID 保持解析，不合併兩個手勢。
- 舊測試的相機中文名稱斷言更新；新增固定案例及精確 inverse，在隔離歷史回放中移除本批改動，舊基準不重錄。
- 其他 C 類、PAGE2 舊匯入、J12、P5b 排除。不修改資料庫或引擎組裝規則。

## 驗收

修改前固定 90 組（三個目標 × 五種姿勢 × 六種景別），比較英文主／衍生輸出、selection、RNG 呼叫次數及收藏公開原文。新回歸確認名稱、說明與舊版隱藏；完整前端／品質／lint／build、catalog strict、固定 seed strict audit、正式產物初始化、桌手機操作與工作區 smoke。

`node scripts/c4_labels_acceptance.mjs` 只讀固定基準；`--record` 僅於本批修改前使用，後續禁止重錄掩蓋差異。基準在 `Docs/reports/c4-labels-2026-10-29/before.json.gz`。可重跑 `node --test webapp/src/lib/engine/c4Labels.test.js`。

交付補記：Cooper 已確認本批驗收通過，授權限定 commit／push；上方未提交為驗收時點紀錄。瀏覽器原生下拉操作限制仍保留，實際 CI／部署結果另行核對。
