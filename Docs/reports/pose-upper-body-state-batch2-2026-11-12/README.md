# 指定動作中景與胸上基本姿態第二批

2026-11-12。基準為 main `28200431b85cc49c18900489938f8ae0e8c4e0be`，使用者核准本批實作、驗證後 commit／push。規則與修改前證據已先提交於 `6a6b1b6d`，正式規格見[第二批規格](../../specs/pose-upper-body-state-batch2-v1.md)。

三個坐姿為微微前傾、隨性癱坐與開闊自信坐姿，三個蹲姿為自然蹲姿、收攏低蹲姿與身體前傾蹲姿。只在原有上身片段之前補上 `She is seated.` 或 `She is squatting.`，原片段逐字保留。Public output contract 為 `1.67.0`。

## 來源與相容

`specifiedActions.js` 提供核准的基本身分與原有軀幹描述，`engine.js` 共用投影只在來源明確標記的頭部主導近景使用原片段。中景與明確胸上、GPT 胸上衍生採新片段。全身、牛仔、完整動作、Grok Imagine 與自然站姿全身角色照沿用現行用途。

原動作 ID、名稱、說明、clauses、順序、驗收狀態、隨機資格、解析選值與 RNG 保留。手勢原有的中景片段、胸上省略、頭部與視線均有回歸案例。觀察模式、雙人及固定人物位置遵守原接管。收藏保存的公開原文保持逐字，明確還原並重新生成後才採新投影。

## 固定證據與歷史

- [before.json.gz](before.json.gz) 在修改 runtime 前擷取，包含 269 組、1,871 份實際輸出。涵蓋六個目標、全部 11 個景別選項、一般／巴黎匯入、手勢與頭部、接管模式及全部非目標動作。修改前新增測試確認為 5 項失敗、1 項通過。
- 新測試比較同 seed 的七輸出、解析選值、structured 來源、摘要與 RNG，只允許核准投影新增姿態前綴。頭部主導近景的既有文字逐字比對。第一批、跪姿與五個躺姿均有保護。
- [baseline-revision.json.gz](baseline-revision.json.gz) 獨立記錄本批 10 個 indoorSeat、249 個 indoorSeating、213 個 outdoorLean 列的核准 before／after 差異，與第一批列完全不重疊。舊 baseline JSON、第一批 seal 及其兩份 gzip 證據保留。
- 新增第二批精確 inverse，封存 10 個既有來源與測試入口。第一批測試入口在隔離副本還原本批差異後，執行原始 7 個子測試與完整斷言。新固定案例則驗證目前引擎的第二批變更與其餘動作保護。
- 既有蹲姿測試原本禁止所有 `squat` 字樣，已更新為要求核准的基本蹲姿身分，同時保留畫外下半身與手勢省略檢查。

## 驗證結果

| 檢查 | 結果 |
|---|---|
| 第二批聚焦 | 6／6 通過，269 組／1,871 份輸出 |
| 收藏與匯入 | 66 張合成卡，全部景別的 favorites／Markdown／ZIP、公開七輸出、套用及重新生成通過 |
| 第二批 inverse 與 revision 護欄 | 2／2 通過 |
| 第一批 inverse 與原始第一批測試 | 10／10 通過 |
| 既有手勢測試 | 34／34 通過 |
| 完整前端測試 | 2,286／2,286 通過 |
| Prompt Quality | 941／941 通過 |
| ESLint／build／bundle 載入 | 通過，保留既有大型 chunk 提示 |
| 同 seed strict audit | 前後 200 筆、`prompt-quality-baseline`，報告正文相同，0 blocking、24 既有 diagnostic |
| `git diff --check` | 通過 |

完整測試第一輪偵測到上述舊蹲姿預期後，修正該檢查並完整重跑。此處完整測試數字取自最終成功輪次。驗證 log 以 gzip 保存於 `validation-logs/`，原始正文雜湊記錄在 [validation.json](validation.json)。

## 桌面與手機

本機 5175 已有使用者啟動的第一批預覽，本批另使用 `http://127.0.0.1:5176/Virtual_Photography_Studio/`。桌面 1440×1000、手機 390×900 各驗證六個目標 × 中景／胸上，共 24 個狀態，逐一核對七組輸出、原軀幹片段、保存的動作／景別與同分頁重新整理。

另外操作巴黎 PAGE3 場景匯入、第一批坐姿與側躺保護案例、Saved Cards 詳情及套用、DLL 七個來源切換，以及六個工作區。未發現新增 console error、uncaught page error、破圖、document 橫向溢位或外部寫入請求。逐項紀錄見 [observations.json](browser/observations.json)。

截圖以實際 PNG 保存並核對像素尺寸。[桌面坐姿](browser/desktop-seated.png)、[桌面蹲姿](browser/desktop-squatting.png)、[手機坐姿](browser/mobile-seated.png)、[手機蹲姿](browser/mobile-squatting.png)、[桌面 DLL](browser/desktop-dll.png)、[手機 DLL](browser/mobile-dll.png)。

預覽設定只使用合成選值、16 張合成收藏、記憶體 local/session storage、每個合成分頁獨立的 IndexedDB 命名空間與停用的 Firebase。還原後等待該動作及景別保存完成，再執行重新整理。驗收腳本已按現行 DLL 控制器調整選擇器，原生控制項自動捲動受限時，使用先檢查啟用狀態的公開按鈕事件完成來源切換。產品程式與 CSS 未因這些工具限制調整。

可使用以下設定重開本批合成預覽。

```sh
cd /Users/cooperfu/Projects/Virtual_Photography_Studio/webapp
npm run dev -- --config ../Docs/reports/pose-upper-body-state-batch2-2026-11-12/tools/preview.config.mjs --host 127.0.0.1 --port 5176 --strictPort
```

## 保留內容與限制

其他 session 的兩份文件修改及 100 份研究／參考檔，連同舊 baseline 與 seal JSON，共 143 個已記錄檔案均核對雜湊保留。本批沒有目錄 JSON 或儲存格式遷移。原有 5175 預覽服務保留。

第一批已記錄的手機姿勢縮圖重疊列為既有問題。此次逐一比較七組顯示文字與 DLL 來源，實際剪貼簿內容未重測。外部圖像模型品質仍由使用者實測，驗證期間沒有付費生成。

提交沿用本次交付的 `[skip ci]`，適用於 commit／push 到 main，略過連動的 CI／Pages 部署。
