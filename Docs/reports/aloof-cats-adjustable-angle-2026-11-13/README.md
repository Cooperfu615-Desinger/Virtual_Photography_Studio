# 低坐貓群冷淡氛圍・角度可調：驗證紀錄

2026-11-13；main 基準 `f4cf8a81ee6ff5d27dda56c4b7ab38665530c82c`，Node 22.22.3。規格見 [v1](../../specs/aloof-cats-adjustable-angle-v1.md)。

## 完成範圍

新增 `specified-sitting-low-aloof-cats-adjustable-angle`，在坐姿選單中與原版並存。保留低坐地面、鬆放雙腿、微傾軀幹、自然靠腿的手臂、小貓及疏離冷淡情緒；移除新項完整／上身／臉部來源的固定向上注視，視線與頭部沿用現行選項。俯仰依 E 區及景別規則選擇，環繞仍限前方相容範圍。側／背面暫停並保存選值，返回相容鏡位恢復。

新項維持 fixed 手部、pending 手動試用，不加入隨機。坐地接觸沿用現行 84 室內＋72 戶外場景，不轉為椅子或床上坐姿。原版 ID、舊卡對應、完整英文、裁切來源、相機限制與隨機資格保持。

## 來源與檔案

- `webapp/src/lib/engine/specifiedActions.js`：獨立新項、可選的 `meta.cameraOrbit` 與共用相機相容判斷；只有新項帶入此 metadata，原項資料形狀不變。
- `webapp/src/lib/engine/indoorSeating.js`：新 ID 納入固定坐地處理。
- `aloofCatsAdjustableCamera.test.js`：新舊 ID、視線／頭部、鏡位、裁切、手部、場景、收藏／Markdown／ZIP 及接管模式。
- 室內／戶外坐姿測試增加第 15 筆與第 5 個坐地項目；新項明確沿用原貓群姿勢的已審閱坐地規則，舊文件表格保持。
- 三個舊矩陣 fixture 僅排除本批新 ID，B3 測試另核對原清單仍涵蓋所有其他動作。新增 13 檔精確 hash inverse，保留全部原 seals 與 baseline，不重錄舊測試。
- 新規格及本驗證目錄。兩份原有 dirty 文件 `Docs/current_project_state.md`／`Docs/session_onboarding.md` 與既有研究檔案不在修改範圍。

## 自動驗證

- 功能專項 10／10：全部 angle／orbit 相容判斷、三角度 × 五視線、頭部與隨機視線、六公開景別、手機／手勢、全身角色照、三張合成卡的七輸出與選值往返。
- [固定條件對照](unchanged-comparison.json)：1,076 組原版／既有動作／固定種子隨機，共 7,532 份公開輸出，selection、摘要及 RNG 呼叫數皆完全一致。[修改前封存](before.json.gz)保留原案例及原文。
- [表面清單](surfaces.json)：156／156 現行場景的完整 Grok Imagine 來源保留低坐、貓與冷淡情緒，地面／榻榻米／草地／沙地／平台等接觸正確。
- [嚴格稽核前](audit-before.txt)／[後](audit-after.txt)：相同 200 筆、seed `prompt-quality-baseline`，報告逐位元一致，0 blocking、24 既有 diagnostic。
- 原室內坐姿 18,480 samples、原戶外坐姿／室內倚靠 14,310 samples、B3 source／scenario 3 項與新舊歷史鏈 7 項通過；舊歷史案例的順序與覆蓋保持。
- Python 60／60、catalog JSON 只讀同步檢查及 207 個公開資產通過。正式 catalog 沒有改動，沒有重新生成資料。
- lint／build 通過；建置仍有既有 chunk 大小提示。

| 最終檢查 | 結果 |
| --- | --- |
| 完整前端，並行度 2 | 2,303／2,303，無跳過 |
| Prompt Quality，並行度 2，含新功能測試 | 958／958，無跳過 |
| 功能專項／坐姿表格及表面專項 | 10／10、10／10 |
| lint／build／diff-check | 通過 |
| Python／公開資產 | 60／60、207 檔 |
| 200 筆同 seed strict audit | 修改前後逐位元一致，0 blocking、24 既有 diagnostic |

結果與來源雜湊見 [validation.json](validation.json)。第一輪完整回歸曾因新增項被列入原 14 姿勢歷史清單而失敗；改以明確新 ID 隔離歷史案例，並在 current tests／功能專項驗證新項後，以上完整套件已重新執行全部通過。原 baseline／seals 未重錄。

## 瀏覽器

由目前 main 啟動 5175，確認主預覽頁可正常載入；為隔離舊 origin 的收藏與設定，實際互動使用同一來源的全新 39947 origin。使用 IAB，桌面 1440×1000、手機 390×900，結束後重設臨時 viewport。原生 AX 操作並讀回實際選值與七份 Prompt；沒有 DOM 注入或改寫頁面內部狀態。

已確認新舊選項相鄰並存、名稱與說明換行、未驗收標記、固定手部／表情、視線低頭及看向遠方、下巴微收、高位／平視／地面高度、原版暫停及高位恢復、新版側面暫停及正面恢復。一張合成收藏經儲存、套用及頁面重載後，新 ID、低頭、下巴微收、牛仔中景、地面機位與正面皆保持。

桌手機六工作區逐一導覽，標題及內容載入正常，未發現 document 橫向溢位或破圖；console error／warn 為 0。頁內有意的垂直捲動保持。[瀏覽器檢查](browser.json)。

- [桌面新舊選項](desktop-options.png)
- [桌面可調視線／頭部](desktop-controls.png)
- [手機姿勢說明](mobile-pose.png)
- [手機可調視線](mobile-controls.png)

## 既有問題與驗收限制

額外執行的其他歷史 helper 為 14／15；唯一失敗是 `skirtUnderlayerHistoricalReplay.test.mjs` 將整條歷史 union 路徑數固定為 5。本批後為 67；[未修改 HEAD 的獨立重現](preexisting-history-failure.log)已證實基準為 59，原測試在本批前就失敗。此檔不在目前前端完整套件中，未為降低診斷數而修改它。

半臉／全臉特寫依既有規則只保留情緒片段，不新增獨立視線句；選值保留，退出裁切後恢復。Grok Imagine 保留完整來源，全身角色照維持自然站姿、9:16。純完整英文回填可分辨新舊來源；只有裁切片段不能保證反推出完整選值。

專用主體在 UI 中不能選一般姿勢；若程式直接送入 skeleton 與指定動作 ID，原版與新版都會保留貓，屬原有程式路徑，本批沒有改動。雙人、固定場景位置及觀察式抓拍則已用新項與取消動作的七輸出逐字比對，保持原接管結果。

測試全部使用合成資料，沒有操作真實收藏、登入帳號或呼叫付費生成。外部模型的坐姿、貓與鏡位呈現仍待使用者試圖驗收。本批未 stage／commit／push 或部署。
