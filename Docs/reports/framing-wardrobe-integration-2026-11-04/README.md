# 構圖景別穿搭保留：main 整合驗收

日期：2026-11-04。工作分支 `codex/framing-wardrobe-integration`，基底 `8cfeac421f15e1849ab86e2a1c270bbbec6392ee`。原交付分支 `codex/framing-wardrobe-retention`／`7812e17d192595eba4da141602e6658c9f38d3ad` 保持不變。

## 範圍與結果

本批依使用者授權，把原構圖景別功能帶到最新 main 的隔離 worktree，解決衝突、整合回歸並補驗瀏覽器。不合併 main、不部署；本批未 stage、commit 或 push。主專案其他 session 的修改未搬入。

六個公開景別在四個主輸出、胸上特寫與全身角色照中保留有效穿搭，明確全無不補替代衣物。套裝／角色卡／閉合外套與既有配色優先權保持；姿勢、場景與相機仍各自投影。外部模型出圖不作本次完成門檻。

## 衝突與整合修正

七個文字衝突：`Docs/current_project_state.md`、`webapp/package.json`、`nanoBananaPrompt.test.js`、`zImageUpperScene.test.js`、`promptOutputContracts.js`、`midjourneyNaturalPrompt.test.js`、`shirtBlackBottom.test.js`。保留 main 新增契約、測試與目前狀態，再納入本功能。公開輸出版本由 1.63.0 更新至 1.64.0，避免兩分支各自使用 1.63.0 而混淆。

整合驗證找到並處理：

- 閉合外套下的洋裝配色片段含有 dress 字樣，被誤認為可保留的下身身份；先排除 upper/main dress area 片段，維持完全閉合外套的既有隱藏規則。`chestDressRegion.test.js` 與保留測試驗證。
- 舊手勢測試用整份胸上輸出禁止 waist，誤傷應保留的腰鏈；限縮為姿勢區塊，仍要求臉部與頭髮手勢存在。
- main 新增的歷史來源回放要求精確位元組。新增測試專用 `framingWardrobeIntegrationReplay.mjs` 與精確差異資料，還原至本次 main 基底後才進入既有回放鏈；拒絕未審核引擎及直接修改 Git checkout。B3 部分來源偵測先通過前置還原，避免漏判 package.json。原凍結基準未改寫。
- Z 現場拍攝的排除案例只驗證該測試承諾的 Z 輸出，避免對不在該案例斷言中的其他衍生文字套用過時逆向片段。其餘完整輸出測試與保留測試保持。

## 固定條件與稽核

[比對程式](compare.mjs) 使用同一 seed `framing-main-integration-v1`，非測試欄位明確全無，固定單品／蕾絲套裝／特殊穿搭／Hinata／閉合外套／全無六種案例 × 六景別，共 36 案、216 份整合後輸出。確認有效衣物存在、全無無替代內容、選定來源一致；比較 GPT 的 Image Type、Composition、Pose and Composition、Scene、Lighting、Camera Look 區塊，未設定的區塊依空值比較。具體輸入與前後文字見 [fixed-comparison.json](fixed-comparison.json)。更廣泛的非穿搭與歷史契約由完整回歸覆蓋。

重跑方式（基底目錄須由上述 main commit 匯出）：

```sh
node Docs/reports/framing-wardrobe-integration-2026-11-04/compare.mjs BASELINE_ROOT INTEGRATION_ROOT OUTPUT_JSON
```

200 案同 seed `prompt-quality-baseline` strict audit：修改前後皆 0 blocking；診斷由 18 降至 17（衣物組合 15→14，近似重複 3 不變）。近景補齊解析會改變部分隨機抽樣，不把診斷減少當成額外改善，也未為此修改目錄。

## 自動化驗證

使用與 CI 相同主版本 Node 22（本機 22.22.3），不使用預設 Node 25／NODE_OPTIONS reporter override。

- main 基底 Prompt Quality：853/853。
- 整合版完整測試：2,112/2,112；Prompt Quality：864/864。
- lint、build、固定比對、同 seed strict audit 通過。build 仍有既有大型 chunk 提醒。
- 未更動 catalog JSON、知識庫、同步生成物、Functions、UI/CSS、部署流程或使用者資料契約，因此未擴大執行資料同步或 Functions 檢查。

## 瀏覽器證據

本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，背景 in-app browser；桌面 1440×1000、手機 390×900。這是整合版的新證據，不將舊版 Chrome 無痕驗收冒充本版驗收。

- 六景別 × 六輸出：網狀蕾絲套裝均保留短裙與長靴；全部全無後均無衣物替代、赤腳或裸露指令。
- 建立本次測試收藏 `#4JKOXI`，套用後六份文字完全一致；既存卡片未套用、修改或刪除。
- 重新載入後六份穿搭均保留，胸上與全身文字完全相同；四主輸出僅左右留白方向重抽，左右字詞正規化後完全一致。此為 UI 草稿隨機重生觀察，不宣稱重載六份原文完全一致；Saved Cards 套用的原文檢查另列。
- 胸上複製顯示 copied，剪貼簿 676 字元與畫面完全一致。首輪剪貼簿讀取曾為空，最終已成功讀回核實。
- DLL 胸上來源選取後比例固定 4:5 且停用比例控制。未按生成、未登入、未執行付費作業。
- 六個現行工作區（Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards）均完成桌面／手機切換與畫面檢視；文件寬等於可用寬（1425／375），破圖 0，console warning/error 0。正常文字框、面板與頁面垂直捲動保留。
- 本輪只操作工作草稿及新增的測試收藏；此瀏覽器已有舊收藏，未清除其儲存空間或改寫既存卡片。沒有雲端或真實帳號操作。

完整文字斷言、還原與畫面尺寸：[browser/evidence.json](browser/evidence.json)。截圖見同一 browser 目錄，`desktop-prompt.png`、`desktop-output.png`、`mobile-prompt.png` 及各工作區截圖。

## 保護與交付界線

共享主專案的 1,387 個檔案雜湊及 Git 狀態與交付前快照一致；原獨立分支保持乾淨。未將 H3、音訊／嘴型、動作庫實驗、Grok 第七輸出或其他 session 文件納入。本分支新增 main 已存在的功能不是混入其他未提交工作；差異基底為指定 main commit。

收尾時已唯讀核對遠端：main 仍為 `8cfeac42`，原交付分支仍為 `7812e17d`。本驗收只適用上述基底與本機整合內容。日後 main 若前進，需要再次核對合併差異；本機通過不等於已提交、遠端 CI、main 合併或部署。
