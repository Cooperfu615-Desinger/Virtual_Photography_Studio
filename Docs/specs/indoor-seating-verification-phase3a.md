# 室內坐姿第三階段 A：驗證對照與故障偵測

日期：2026-11-17。已核對開工時本機與遠端 `main`：`fd3f3bb14e15ec556021791bdda71b8fe8d8731f`。

## 範圍與完成條件

承接 [第一／二階段](test-execution-efficiency-v2.md)，補齊歷史案例對照、獨立期望與故障注入。這是新增證據，不是案例縮減：原案例、斷言、baseline、歷史 inverse、runner、package scripts、CI workflow 與門檻全部保留。正式 Prompt、目錄、UI、儲存與 DLL 行為不變。

完成條件：每個原案例可追溯至規則；固定期望由已核准版本建立；有效故障確實造成預期斷言失敗；未修改副本正常通過；原完整測試仍通過。初次實作不 stage、commit、push 或部署。

## 原案例驗證對照

機器可讀規則表：[indoorSeatVerificationLedger.json](../../webapp/src/lib/engine/indoorSeatVerificationLedger.json)。逐案例紀錄由 [historicalCoverageLedger](../../webapp/src/lib/engine/indoorSeatVerificationSupport.js) 唯讀建立；不另外存一份重複的 18,480 列 JSON。

每筆包含 `sceneId / actionId / frameId / seat` 組成的唯一 ID、原 seed、規則 ID、是否另有固定見證，以及 `replacement: legacy-required`。測試核對原 baseline 的全部列鍵、順序、每列數量及總數。它不只是抽樣比例表，也不會把有見證的案例標成可刪除。

| 原保護面 | 原驗證 | 新增對照／期望 | 本階段決定 |
| --- | --- | --- | --- |
| 83 場景 × 14 坐姿 × 10 景別 | `outdoorSeatBaseline.test.js` 的室內歷史矩陣 | 1,162 列、18,480 個唯一案例，逐列核對順序及數量 | 全保留 |
| 未指定座位與首個合法座位 | 11,620 未指定＋6,860 指定 | 獨立相容表推導座位狀態；不拿當前 runtime 的選單作期望 | 全保留 |
| 七輸出完整文字及景別差異 | 每列 hash 包含所有 cards／穩定 Prompt | 380 個固定完整文字 hash；分輸出報錯 | 全保留；僅部分案例重疊 |
| selection、structured、summary、summaryFields、cards metadata | 原完整穩定資料 hash | 分欄位 hash 加上完整 stable Prompt hash | 全保留 |
| RNG 消耗 | 原 hash 包含 draws | 固定絕對次數，避免前後同時多抽而關係測試仍通過 | 全保留 |
| 接觸對象、床邊／床上、榻榻米、床場景無地板 | 原模型、Prompt 與矩陣測試 | 固定動作原文、獨立座位規則、明列榻榻米場景；完整 G7 接觸文字一次且僅一次 | 全保留 |
| 所有座位候選、順序、無效／空值 | `indoorSeating.test.js`、第二階段試點 | 目前 84 × 15＝1,260 規則格；每格測 14 座位、空字串、省略值與未知值 | 加強，不取代 |
| 雙人、Observation、固定場景、匯入世界及專屬角色等排除 | 原特定模式測試 | 八種直接 owner 排除斷言；獨立故障注入 | 原專項保留 |
| 收藏、Markdown、ZIP、套用、休眠鎖 | `indoorSeatRestore.test.js` | 床邊／床上／榻榻米／坐墊四組實際還原再生成；故障時另跑原四項 restore 測試 | 原專項保留 |
| 後增 Lawson 與可調角度貓群 | 各原功能測試，不在舊 83 × 14 seal | 明確列入目前 84 × 15 規則與固定見證 | 不併入舊歷史 seal |

## 獨立期望與來源

- [indoorSeatVerificationExpectations.json](../../webapp/src/lib/engine/indoorSeatVerificationExpectations.json)：已審核 [室內坐姿規格](indoor-seating-v1.md)／[場景表](indoor-seating-scenes-v1.md) 的固定規則、永久 ID、座位順序、語句及十景別 seed。文件來源 SHA256 留作追溯；不在測試執行時讀取當前實作來重建期望。
- 榻榻米明列為日式和室與生活感日式榻榻米房間；不以待驗證 location 的 `lyingSurface` 當 oracle。Lawson 及後增動作另明列。
- 完整 canonical 動作文字固定於已接受版本；座位相容與接觸期望不呼叫待測的 `indoorSeatingModel`／`applyIndoorSeat`。
- [indoorSeatVerificationWitnesses.json](../../webapp/src/lib/engine/indoorSeatVerificationWitnesses.json)：從已接受 `fd3f3bb1` 的隔離 `git archive` 生成一次，沒有以未提交工作區輸出當標準答案。排除原有動態 ID／日期，其餘穩定資料保留。
- 建立見證前，先以不可變舊 baseline 加三份已核准 upper-body before/after revision 驗證 19 個歷史列。每份 revision 先核對原 `before`，再採用已核准 `after`。測試保留來源 hash、19 列 anchor 及實際逐列生成核對。

21 組見證族涵蓋全部 14 種手動支撐、床／榻榻米／普通地板的固定低坐，以及後增範圍；逐族執行十景別與有意義的未指定／指定狀態，共 380 個。實際涵蓋 11 個場景、13 個動作、十景別。其中 270 個與舊矩陣完全相同，80 個是舊場景／動作的非首個座位，30 個屬後增範圍。

這不等同於 18,480 個案例的完整替代。`單腿屈起・單掌後撐` 與 `低坐貓群冷淡氛圍` 目前有完整獨立規則檢查及原矩陣，但沒有新增固定輸出見證；其餘未見證交互組合也仍依原矩陣保護。

更新期望必須有新的行為核准與固定來源，記錄差異和來源 commit；不能把失敗的當前輸出直接重錄以通過測試。原 baseline／approved revision 永不在這組測試中寫入。

## 故障注入方法

[indoorSeatMutation.test.js](../../webapp/src/lib/engine/indoorSeatMutation.test.js) 只在系統暫存副本修改 production source。副本只複製執行需要的 source、package 與三份 revision，依賴以唯讀使用方式連結；不切分支、不改工作目錄程式、不寫 `.git`。

每一故障先驗證來源片段唯一匹配，逐一修改、啟動全新 Node 程序，最後還原副本。刪除 runner 共用快取環境，避免吃到先前成功結果。先跑所有未修改控制組與原 restore suite，確定探針自身有效。

只接受預期分類的 `AssertionError` 為成功偵測。語法錯誤、匯入失敗、程序超時、一般 runtime crash 不算抓到故障，會使測試失敗。原 restore suite 必須四項全部執行，且因值斷言而失敗。

| 注入錯誤 | 新獨立偵測 | 既有偵測對照 |
| --- | --- | --- |
| 床邊寫成床上 | 座位語句 | 對應歷史列 |
| 未選自動採首個座位 | 有效選擇 | 對應歷史列 |
| 候選順序反轉 | 完整選單順序 | 對應歷史列 |
| 榻榻米當普通地板 | 獨立場景語意 | 對應歷史列 |
| 純床低坐捏造地板 | 固定地面規則 | 對應歷史列 |
| 移除雙人排除 | owner 邊界 | 單人歷史列不會偵測；不得算成矩陣等效 |
| GPT 未指定／指定共同漏掉開頭 | GPT 完整文字 hash | 對應歷史列 |
| 共同多消耗一次 RNG | 絕對 draws | 對應歷史列 |
| structured 場景消失 | structured hash | 對應歷史列 |
| 摘要消失 | summary hash | 對應歷史列 |
| G7 全文重複 | G7 完整文字 hash | 對應歷史列 |
| 胸上 GPT 不當加入椅子 | 特定景別完整文字 hash | 對應歷史列 |
| 還原時丟掉座位 | 還原再生成 | 原 Saved Card restore suite；生成矩陣不負責 |
| 允許不相容座位 | 全候選相容表 | 對應歷史列 |

歷史對照採原演算法的指定列（每列 10／20 次生成），不是每個故障再跑完整 18,480 組。正常完整 gate 仍執行全部原案例。此結果僅證明這 14 種實際注入故障能被捕捉，不能推論任意 bug 的完全等價偵測率。

## 執行與後續決策

新增兩份 `.test.js` 由原 `npm test` glob 自動納入，沒有變更 CI 設定或測試門檻。原 Prompt Quality 固定清單不動，新驗證可獨立執行：

```sh
cd webapp
node --test src/lib/engine/indoorSeatVerification.test.js src/lib/engine/indoorSeatMutation.test.js
npm test -- --test-concurrency=4
npm run test:prompt-quality -- --test-concurrency=4
npm run lint
npm run build
```

本階段增加驗證工作，沒有承諾縮短完整 gate。具體結果見 [驗證報告](../reports/indoor-seat-phase3a-2026-11-17/README.md)。只有日後另行核准的階段，才評估規則等價類、未覆蓋動作／跨欄位交互、更多錯誤類別與多輪差異偵測，再討論歷史案例合併；本文件不授權任何退休或 CI 降門檻。
