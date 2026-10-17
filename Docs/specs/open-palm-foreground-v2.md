# 單手向鏡頭張開手掌：前景透視文字修訂

日期：2026-10-17。使用者已核准實作，完成本機驗證後另授權 commit／push；本批以 `codex/open-palm-foreground-v2` 分支交付，保留暫不部署的範圍。

## 範圍與結果

保留 `one-hand-open-palm-camera` ID 與「單手向鏡頭張開手掌」名稱，僅替換 `poseComposerOptions.js` 中的 `en`、`desc` 和 `meta.compositionModifierEn`。原動作英文追加至既有 `legacyPromptAliases`，供舊 Markdown／Prompt 還原。

從置中遮擋鏡頭 80–90% 改為單手前伸張掌、以近遠距離差放大前景手掌、偏離臉部而不遮五官，手掌經手腕與透視前臂自然連接肩膀。取消完整五指必須入鏡及指尖不得裁切的要求；不另強制裁切。

不改鏡頭焦段、拍攝角度、景別、服裝、表情、頭部、姿勢、支撐、左右手選擇、對焦或景深。沿用原可見性、姿勢適用範圍、隨機池、道具互斥、指定動作接管及取消恢復規則；蹲姿與躺姿選單仍不開放此項。

## 核准來源

`en`：

```text
one arm extended toward the camera, with an open palm facing the lens and five fingers naturally spread and slightly relaxed
```

`compositionModifierEn`：

```text
The extended hand is much closer to the lens than her face, making it appear noticeably larger in the foreground through near-to-far perspective. Position the hand to one side of her face, leaving her facial features unobstructed. Maintain a recognizable open-palm silhouette and a believable connection from the palm through the wrist and foreshortened forearm to her shoulder.
```

`desc`：

> 單手向鏡頭前伸，掌心朝向鏡頭，五指自然分開並略微放鬆。手掌比臉部更靠近鏡頭，在前景形成明顯的大小差異；手掌位於臉部一側，不遮住五官，並保留手掌經手腕、前臂連接至肩膀的自然關係。

## 輸出與相容性

- 沿用共用 canonical pose 和 composition modifier 組裝；四主輸出與既有 GPT 胸上路徑使用同一來源，renderer 邏輯不改。
- 雙人與全身角色照排除、較緊景別的既有投影及其他手勢保持原行為。本批不處理其他姿勢或攝影選項的既有相容性問題。
- 已存 Prompt 原文不重寫；由選值重新生成時才使用新文案。原兩條英文 aliases 保留，再加入本次被替換的完整動作英文。
- 公開輸出契約版本更新為 `1.59.0`；不改 storage schema、lock ID、欄位名稱或選項順序。代表案例保留原 fixture ID 與 seed，更新手掌預期並補 Nano Banana／GPT 胸上覆蓋。

## 驗證紀錄

- 聚焦手部／相容性／Saved Cards 測試 116/116；歷史輸出矩陣 131/131。先更新預期確認舊文案失敗，再替換來源確認通過。
- Node 22.22.3：完整前端 1636/1636、Prompt Quality 721/721、lint 通過；production build 通過，僅保留既有大型 chunk 提示。
- 同 seed `200 / prompt-quality-baseline` 的 strict audit 前後報告逐字相同：0 blockers、22 項既有 diagnostics。
- 137 組固定案例、822 份六輸出前後比對：所有選值及選項規則相同；60 份變動輸出僅包含核准的兩段文字替換，其餘 762 份逐字相同。記錄 `/tmp/palm-snapshot-result.json`。
- 歷史 baseline JSON 不重錄；以 test-only `openPalmTestSupport.js` 精確反轉核准文字及新增 alias 後比對原快照，新版文字另由未套用反轉的回歸測試驗證。沒有新增 runtime renderer 邏輯。
- `python3 scripts/sync_to_json.py --check`、Python 2/2、文件連結及 `git diff --check` 通過。知識庫來源未改，無須重生資料。
- 隔離 Chromium：`http://127.0.0.1:5175/Virtual_Photography_Studio/`，桌面 1440×1000／手機 390×900。從既有手勢切換至張掌、六輸出、Copy Gpt、清為全無、Saved Cards 套用與 reload 通過；原鏡頭／角度／服裝／表情／頭部選值保留，蹲姿既有隱藏規則維持。
- 五工作區 navigation smoke 與截圖檢視通過：Prompt 工作台、角色建模、動作姿勢、場景建模、Saved Cards。無 console warning/error、page error、破圖或 document 橫向溢出；手機十張角色圖卡另以逐張捲動與 decode 確認完成延遲載入。輸出 textarea 的內部捲動維持。
- 瀏覽器結果 `/tmp/palm-qa/results.json`；腳本 `/tmp/palm-browser.mjs`；主要截圖 `/tmp/palm-qa/{1440,390}-selection.png`、`/tmp/palm-qa/{1440,390}-output.png`、`/tmp/palm-qa/{1440,390}-workspace-{0..4}.png`。
- 工具環境紀錄：預設 npm 實際啟用 Node 25，觸發既有測試報表格式斷言；改以明確 Node 22 執行後全數通過。Playwright 在初始「全無」狀態的原生 select 直接選取受停用判定限制；未改動產品控制項，主要選取流程由既有有效手勢起始驗證，目標選項的清除及收藏還原另完成驗證。
- 原有 37 個未提交／未追蹤檔案以 SHA-256 核對未變，含已修改的 current state、Krea、Functions 文件及參考圖；不納入本批提交。Git 交付限本批 16 個相關檔案，不合併 main 或觸發 Pages 部署。

外部生成模型的實際出圖效果另行驗收，不由程式或瀏覽器測試代替。
