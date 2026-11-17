# 室內坐姿第三階段 A 驗證紀錄

日期：2026-11-17。分支：`main`；實作基準 `fd3f3bb14e15ec556021791bdda71b8fe8d8731f`，開工時 fetch 核對與遠端一致。

本報告與 metrics 保存提交前的本機驗證快照。使用者隨後已核准只提交並推送本次十個檔案，並查核 CI／部署；下方「未提交／未部署」及 delivery 欄位保留量測當時狀態，實際交付結果以本批提交對應的 GitHub Actions 為準。

## 成果與範圍

完成 [第三階段 A 規格](../../specs/indoor-seating-verification-phase3a.md) 的逐案例驗證對照、獨立期望與故障注入。全部為新增測試／測試資料／文件；沒有修改任何原測試、斷言或正式程式。

- 原室內坐姿 83 場景 × 14 動作 × 十景別：1,162 列、18,480 個案例，全部保留且原完整矩陣通過。每個案例有固定 seed、規則連結及 `legacy-required` 標記。
- 目前 84 場景 × 15 動作：1,260 個獨立規則格，檢查全部 14 種座位、空字串、省略值及未知值；另有八種 owner 排除與四組收藏還原再生成。
- 21 組代表族、380 個固定結果：核對七輸出全文 hash、絕對 RNG 次數、selection、structured、summary、summaryFields、card metadata 及完整穩定 Prompt。
- 固定結果來自已接受 commit 的隔離 archive。19 個歷史列先對照不可變 baseline 與三份已核准 before/after revision，不以目前工作區重錄基準。

## 故障偵測結果

14／14 個真實來源修改均由新測試的指定斷言捕捉，未修改副本的控制組也全部通過。語法／匯入／程序錯誤不算成功偵測。

| 故障群 | 數量 | 新測試 | 原驗證對照 |
| --- | ---: | --- | --- |
| 床邊／床上、未選自動選擇、座位順序、榻榻米、床場景地板、座位相容 | 6 | 全部捕捉 | 指定歷史列全部捕捉 |
| GPT 共同漏字、額外 RNG、structured 遺失、摘要遺失、G7 重複、胸上不當加入椅子 | 6 | 全部捕捉 | 指定歷史列全部捕捉 |
| 移除雙人 owner 排除 | 1 | 直接 owner 斷言捕捉 | 單人歷史列不會偵測；不宣稱其他原專項的偵測結果 |
| 還原時遺失座位 | 1 | 還原再生成捕捉 | 原 Saved Card 四項測試完整執行並因值斷言失敗；生成矩陣不會偵測 |

故障對照每次重放對應原矩陣列，沒有每個故障重跑全部 18,480 組；正常完整 gate 仍保留全部原矩陣。故障只寫系統暫存副本，每次用新程序執行、還原來源，結束後清除。正式 source 與原期望資料均未被注入。

## 本機驗證

Node `v22.22.3`。完整測試與 Prompt Quality 分開執行、固定 concurrency 4，未並跑另一個完整 gate 或 build。下表時間採 Node test runner 的 `duration_ms`，不是 CI 時間，也不是整棵程序樹的記憶體峰值。

| 驗證 | 結果 | 時間 |
| --- | --- | ---: |
| 新獨立驗證，單獨執行 | 6／6 | 3.272 秒 |
| 故障注入與正常控制組，單獨執行 | 15／15 | 10.833 秒 |
| 新測試＋原模型／Prompt／restore 專項 | 32／32 | 11.823 秒 |
| `npm test -- --test-concurrency=4` | 2,358／2,358，零失敗、零略過 | 289.118 秒 |
| `npm run test:prompt-quality -- --test-concurrency=4` | 960／960，零失敗、零略過 | 197.628 秒 |
| 最終新增兩份測試重跑 | 21／21 | 10.000 秒 |
| `npm run lint` | 通過 | — |
| `npm run build` | 通過；保留既有大分包提醒 | Vite 3.26 秒 |
| `git diff --check`、新增檔案空白與文件連結檢查 | 通過 | — |
| 既有測試名稱與出現次數 | 原 2,337 項全部保留，新增 21 項 | — |
| 原檔案與未提交內容保護 | 109 個原 dirty 檔案 SHA256 相同；原測試及 production source 無修改 | — |

lint 首輪指出新測試 helper 的未使用解構變數；改為複製 metadata 後移除文字欄位，完整 hash 結果不變。此純測試整理後，重跑全部 21 項新增驗證與故障測試並通過，再完成 lint／build；原完整 gate 的時間為整理前紀錄。最終專項與 lint 曾並行，不拿該專項時間作效能比較。

這次增加驗證工作，沒有實作新的加速或案例縮減。前一批本機完整量測是 295.49 秒的外層 wall time；不能拿不同計時口徑與單輪波動宣稱本次效能提升。本輪不另量測 RSS，也不將進度列的單程序 RSS 當成整套峰值。

## 保留界線與後續

380 個固定結果中，270 個與舊矩陣完全重疊，80 個補查原場景／動作的非首選座位，30 個屬 Lawson／可調角度貓群後增範圍。固定結果涵蓋 11 場景、13 動作、十景別及全部 14 手動支撐，但不是全矩陣的等價替代。

原 `單腿屈起・單掌後撐`、`低坐貓群冷淡氛圍` 的完整歷史輸出與所有未見證交互案例均繼續保留；Markdown／ZIP／狀態切換／休眠鎖仍依原專項驗證。14 種故障全捕捉只代表這批故障類型，不能推論所有未測錯誤都等效。

CI workflow、package scripts、runner、Prompt Quality 固定清單與門檻均未修改；新 `.test.js` 由原完整測試 glob 自動納入。沒有 stage、commit、push、CI 執行或部署。沒有產品／UI 變更，因此不啟動本機預覽、瀏覽器或外部模型生成。

最後核對時另出現兩張 `generated_images/` 未追蹤圖片，不是本次操作產生；保持原樣並記錄於 metrics 的範圍外清單。本次驗收範圍只有十個新增測試／資料／文件檔案，原 109 個未提交檔案內容仍相同。

## 檔案與證據

- 規則、逐案例映射及期望：[indoorSeatVerificationSupport.js](../../../webapp/src/lib/engine/indoorSeatVerificationSupport.js)、[Expectations](../../../webapp/src/lib/engine/indoorSeatVerificationExpectations.json)、[Witnesses](../../../webapp/src/lib/engine/indoorSeatVerificationWitnesses.json)、[Ledger](../../../webapp/src/lib/engine/indoorSeatVerificationLedger.json)。
- 測試：[indoorSeatVerification.test.js](../../../webapp/src/lib/engine/indoorSeatVerification.test.js)、[indoorSeatMutation.test.js](../../../webapp/src/lib/engine/indoorSeatMutation.test.js)、[隔離探針](../../../webapp/src/lib/engine/indoorSeatMutationProbe.js)。
- [結構化驗證紀錄](metrics.json)：測試計數、實際時間、21 項新增名稱、14 個故障分類、工作區保護與限制。
- 本機暫存紀錄 `/tmp/vps-seat-phase3a/`：`oracle-first.log`、`mutation-first.log`、`focused.log`、`focused-final.log`、`full.log`、`quality.log`、`preservation.json`、`dirty-before.json`、`lint.log`、`build.log`。這些是本機證據，不是已發布的 CI artifact。
