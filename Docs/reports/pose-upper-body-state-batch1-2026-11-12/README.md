# 指定動作中景／胸上基本姿態：第一批

日期：2026-11-12。基準：原專案目錄的 main `682c919562c280d9192de94f569023b4e29a0e55`；本輪已透過 GitHub 即時核對遠端一致。

狀態：第一批實作、自動驗證及桌機／手機瀏覽器驗收已完成，保留下述既有畫面問題與操作驗證限制。使用者已授權接續 commit／push，交付範圍為本批 58 個檔案。下方驗證與 preservation 計數記錄提交前狀態。第二批尚未實作。

## 行為與範圍

依 [核准規格](../../specs/pose-upper-body-state-v1.md)，六個原本缺少上身片段的坐姿在中景／胸上保留 `She is seated.`；寬膝低蹲姿保留 `She is squatting. Her torso inclines gently forward.`。軀幹前傾取自完整動作原句，不新增腿腳、家具、承重或相機事實。

四主輸出及 GPT 胸上衍生共用投影；頭部主導近景的既有省略另以來源標記保護。完整 canonical 來源、全身／牛仔主輸出、Grok Imagine、自然站姿全身角色照、其他動作、隨機順序及儲存欄位維持原契約。第二批六個已有片段的動作尚未修改。

產品程式只涉及 `specifiedActions.js`、`engine.js` 的來源標記排除，以及 public contract `1.66.0`。其餘程式差異為新回歸測試、品質入口、版本核對與歷史回放。

## 變更檔案

- 產品：`webapp/src/lib/engine/specifiedActions.js`、`webapp/src/lib/engine.js`、`webapp/src/lib/engine/promptOutputContracts.js`。
- 固定案例：`webapp/src/lib/engine/specifiedActionUpperBodyStateFixtures.js`、`specifiedActionUpperBodyState.test.js`、`upperBodyStateBaselineRevisionTestSupport.js`；品質入口 `webapp/package.json`。
- 既有測試隨核准行為更新：`gazeGesture.test.js`、`promptOutputContracts.test.js`、`indoorSeatBaseline.test.js`、`outdoorSeatBaseline.test.js`、`outdoorLeanBaseline.test.js`，以及 `webapp/src/lib/engineBlackTieShirt.test.js`。
- 歷史回放：`scripts/lib/poseUpperBodyStateHistory.json`、`poseUpperBodyStateHistoricalReplay.mjs` 與其測試、`scripts/lib/lawsonSceneHistoricalReplay.mjs`、`scripts/dump_pre_lawson_outputs.mjs`。
- 規格與證據：`Docs/specs/pose-upper-body-state-v1.md`、坐跪姿／蹲姿既有規格的日期附註，以及本報告、固定前後證據與隔離驗收工具。沒有修改既有 baseline JSON。

## 固定證據

- 修改行為前先新增 focused tests，確認六項測試因缺少核准片段而失敗。
- [before.json.gz](before.json.gz)：修改前 281 組案例／1,953 份實際輸出之雜湊，含全部景別、一般場景、巴黎鐵塔 PAGE3 匯入、手勢／頭部、固定位置／雙人接管、所有非目標動作。來源 SHA 與基準 commit 一併封存，檔案只建立一次。
- 新測試比較選值、完整 structured source、摘要與 RNG，非核准輸出要求逐字雜湊一致；新姿態只保留一次，畫外腿腳與未選家具不得出現。另驗證匯入／選姿勢的兩種順序、合成收藏原文保護與明確重新生成。
- [baseline-revision.json.gz](baseline-revision.json.gz)：獨立記錄 10 個室內坐姿案例、498 個室內坐姿彙總列、426 個坐姿／倚靠保護列的核准 before／after 差異；每列均限第一批動作，原 samples／選值／來源與不受影響輸出維持。原本三組 baseline JSON 未改寫，非目標列仍與原值逐筆比較，並檢查原有順序與案例覆蓋。
- 新增精確 test-only inverse，先還原本批已審閱的 runtime／測試入口，再進入既有歷史鏈。未知或額外變更的 bytes 不套用逆轉；原歷史 seals、目錄、舊輸出與來源歸檔保留。

## 自動驗證

驗證使用既有快取 Node `22.23.3`；不安裝依賴、不修改環境設定。最初系統 Node `25.8.2` 的修改前完整測試為 2,271／2,273，兩項失敗涉及 runner 的預設 reporter 格式與子程序；其失敗紀錄先於本批行為修改。Node 22 的 runner／契約聚焦驗證 131／131 通過。

| 檢查 | 結果 |
| --- | --- |
| 初步 focused action／gesture／source tests | 47／47 通過 |
| 新固定案例與 revision 護欄 | 7／7 通過；281 組／1,953 份輸出 |
| 精確 inverse 與 Lawson 回放 | 2／2 通過 |
| 完整前端測試 | Node 22：2,280／2,280 通過 |
| Prompt Quality | Node 22：935／935 通過 |
| ESLint | 通過 |
| Production build | 通過，保留大型 chunk 提示 |
| 同種子 strict audit | 前後均 200 筆、`prompt-quality-baseline`；0 blocking、24 diagnostic |
| 預覽資料隔離 | `tools/preview-isolation.test.mjs`：1／1 通過 |
| `git diff --check` | 通過 |

機器可讀結果與 log 雜湊見 [validation.json](validation.json)；完整測試、品質、lint／build、前後 audit 與預覽啟動失敗紀錄保存在 `validation-logs/`。前後 audit 的報告正文逐字相同，只有 npm 的命令標頭不同。

## 瀏覽器驗收

使用者啟動隔離預覽後，在 `http://127.0.0.1:5175/Virtual_Photography_Studio/` 完成桌面 1440×1000、手機 390×900 驗收。原本由受限終端啟動 listener 的 `EPERM`／`ERR_CONNECTION_REFUSED` 缺口已解除；先前失敗 log 保留。

| 工作區／流程 | 實際檢查與結果 |
| --- | --- |
| Prompt 工作台 | PAGE3 巴黎鐵塔實際套用；桌機六坐姿中景、手機六坐姿胸上皆保留一次 seated 身分，頭部／鎖骨手勢保留；寬膝蹲中景與胸上保留 squatting／軀幹前傾 |
| 景別排除 | 全身、牛仔主輸出保留完整伸腿坐姿；頭部主導近景維持省略；Grok Imagine 保留完整動作，全身角色照維持自然站姿 |
| Saved Cards | 四筆合成收藏；中景蹲、胸上蹲及胸上坐姿還原、詳情展開、同分頁 reload；中景可見前臂，胸上省略該手勢，頭部／視線保留 |
| DLL_PIC Pro | 逐一切換七組來源並核對顯示文字；生成按鈕因無金鑰停用，任務／歷史為隔離空狀態，未加入任務或生成 |
| 角色建模、場景建模 | 桌機／手機載入、角色縮圖及選取狀態、巴黎地點與場景輸出正常 |
| DLL_VIDEO Pro | 桌機／手機空歷史、未選圖片、未登入及停用生成狀態正常，未上傳或生成 |
| 全六工作區 | 兩尺寸皆無 document 橫向溢位、破圖或新增 console error／warning、uncaught page error；保留面板內捲動，驗收後還原 viewport |

逐項 DOM 觀察與來源文字見 [browser/observations.json](browser/observations.json)；六工作區的兩尺寸截圖保存於 `browser/`。主要結果：[桌機坐姿輸出](browser/desktop-paris-seated.png)、[手機坐姿輸出](browser/mobile-paris-seated.png)、[手機姿勢選單](browser/mobile-pose-picker.png)。初次切換到新分頁的原生 1709×1090 觀察也保留於 JSON，正式六工作區驗收使用明確的 1440×1000／390×900。

交付核對已修正 `validation.json` 的截圖尺寸讀取錯誤。原始截圖檔名為 `.png`，實際內容為 JPEG，檔名、圖片 bytes 與雜湊均保留。JSON 逐張記錄實際格式與影像尺寸，與 DOM 驗收 viewport 分別保存。

驗證設定使用記憶體收藏／選值、停用 Firebase，並為 DLL 圖片／影片的 IndexedDB 加上每個合成分頁獨立的隨機命名空間；不列出真實資料庫。設定載入與模擬 reload／資料隔離檢查通過。真實 localStorage／sessionStorage 不讀取、不改寫，未登入真實帳號。

仍保留兩項限制：

- 390px 姿勢選單的既有縮圖寬 72px，但 mobile grid 欄寬 56px、間距 10px，與文字重疊 6px；[截圖](browser/mobile-pose-picker.png)已保存。`SpecifiedActionPicker.jsx` 與 `specifiedActionPicker.css` 均與起始 HEAD 逐 byte 相同，本批未修改 UI／CSS。
- 瀏覽器操作工具無法改變原生下拉選單值；改用合成 Saved Cards 透過產品的還原入口驗證對應手勢／頭部／視線。複製按鈕有 `Gpt copied`／`AI copied` 成功提示，但工具的 clipboard read 未確認到複製後文字，因此不宣稱實際剪貼簿內容已驗證；未輸出或保存私人剪貼簿內容。七組文字另由 DLL 來源切換及固定回歸案例核對。

可用下列命令重開相同隔離預覽：

```sh
cd /Users/cooperfu/Projects/Virtual_Photography_Studio/webapp
npm run dev -- --config ../Docs/reports/pose-upper-body-state-batch1-2026-11-12/tools/preview.config.mjs --host 127.0.0.1 --port 5175 --strictPort
```

此設定只作用於這個測試 server，原 Vite 設定與環境檔不變。新分頁初始為中景＋雙腿自然伸展，PAGE3 預設巴黎鐵塔，Saved Cards 提供四筆合成卡；同一分頁 reload 透過 window.name 保留合成狀態。外部圖像模型品質未測試，沒有付費生成。

## 其他保留內容

`Docs/current_project_state.md`、`Docs/session_onboarding.md` 的既有 11/12 修改原樣保留；H3、原有 100 個未追蹤檔案、共用 `.git`、其他 worktree、環境設定及 MOSS Saved Cards C／D 均未搬移或帶入本批。
