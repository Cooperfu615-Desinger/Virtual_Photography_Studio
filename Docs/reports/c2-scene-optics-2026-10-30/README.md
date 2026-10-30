# C2 場景／光學：三筆微調、必要細節保留

狀態：本機自動驗收與完整歷史回放通過；桌手機資料／操作流程通過，原生下拉選單滑鼠驗收限制保留，待使用者驗收。未 stage／commit／push／部署。

可信基準為 main `dabef0172ddf35c569632956c5bd7fed3e8c2c8b`，開工時本機與遠端一致。實際 main 工作目錄為 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`；原專案路徑與其他工作目錄均未修改。

## 結果與範圍

| 來源 | 精簡 | 詞數 |
| --- | --- | --- |
| 重散景光斑 | 移除已由高光圓盤及離焦表達的 `optical blur balls` | 19→16 |
| 鏡頭光斑 Lens Flare | `streaking flare artifacts from` 改為 `streaking flare from`；保留前段 artifacts | 19→18 |
| 戶外：大阪道頓堀心齋橋河道 | 移除已由 iconic billboard signage 表達的 `famous advertisement boards` | 31→28 |

29筆長來源為27場景、頭部主導近景與前景遮擋散景。28筆整筆保留，道頓堀只刪重複看板詞；另兩筆光學原本在一般範圍，審閱聯集31筆。逐筆理由見[規格](../../specs/c2-scene-optics-v1.md)及 `scripts/lib/c2SceneOpticsReview.json`。

保留原10筆例外，追加28筆具ID、完整英文指紋、基準commit及理由的必要例外，共38筆；仍顯示over，不放寬分類區間。25筆相機／底片未分類保持。純色、漸層、多色塊、人潮與其他空間結構各自保留責任。

三筆完整舊英文追加至 `legacyPromptAliases`。兩來源類別原先尚未宣告此欄位，因此只在schema及field_mapping的欄位／完整路徑／陣列元素路徑補上既有alias契約，不改parser或收藏格式。中文、ID、desc、semantic、排序、可見性、隨機池及renderer保持。兩筆隱藏折射仍restore-only。

## 當前驗收

| 檢查 | 結果與證據 |
| --- | --- |
| 修改前基準 | `before.json.gz`；正式來源修改前排他建立644組，未重錄。SHA見protection.json |
| 本批比較 | `acceptance-final.log`，644組通過；382組出現核准文字差異，其餘保持。包含六景別、四角度、三成像組合、單雙人、29長來源、19光學 |
| 固定構圖／角色卡 | `modes.log`，15模式×三筆×單雙人共90組；48組有核准文字差異，選值／RNG保持 |
| 聚焦回歸 | `focused-final.log`，7/7：本批5項及歷史反轉負例2項；新舊英文、Markdown、結構化優先、舊原文、隱藏選項與精確反轉 |
| 前端全套 | `tests-final.log`，2064/2064 |
| Prompt品質 | `quality.log`，853/853 |
| Python／目錄工具 | `python-final.log`，55/55；`catalog-tools-final.log`，32/32 |
| schema／同步／歷史ID | `catalog-final.log`、`sync-check-final.log`：1050 ID、8生成物，strict通過 |
| lint／build／正式初始化 | `lint.log`、`build.log`、`bundle.log`通過；既有大型chunk提示保持 |
| 同seed稽核 | `audit-before.log`／`audit-after.log`位元組完全相同；200筆prompt-quality-baseline、0 blocker，17筆既有診斷保持 |
| 資產 | `assets.log`，207檔通過 |
| 桌手機流程 | `browser/results.json`：1440×1000、390×900，各三選值、六輸出、場景搜尋與空結果／Escape、新儲存與三舊卡套用；原生選單限制見下文 |
| 工作區 | `workspaces/results.json`：1440×1000、390×1000，現行六工作區共12項通過；無console／page error、壞圖、意外document溢位 |

固定比較保護四主及適用衍生輸出、有效選值、normalize、RNG呼叫數和原收藏序列化。只允許三處精確字串替換，未以較寬比較接受投影或語意變動。90組為獨立補充驗收，不另計入2064項npm test。

## 中間失敗與修正

第一次同步因光學與城市場景缺少alias schema而拒絕，生成資料保持原狀，因此第一次比較顯示來源尚未更新；補上兩類別的欄位宣告後同步通過。首次目錄檢查另發現field_mapping的巢狀paths缺宣告，已同步補齊，最終strict／32工具／55 Python通過。

首次前端全套2064項中，舊Phase4負例比對錯誤訊息的 `mixed` 字樣失敗；新反轉工具已保留既有語意用字，拒絕條件及比較沒有放寬。重跑聚焦7項與前端2064項全數通過。`source-gates.json`、`frontend-gates.json`及非final的首次log保留中間失敗；最終結果以本表、`source-final.json`及`acceptance.json`為準。

## 歷史與保護

新歷史入口 `node scripts/c2_scene_optics_history.mjs /tmp/c2-scene-optics-history` 在隔離暫存副本精確反轉11個既有非文件變更檔，對照固定Git原文與SHA，再執行原套裝1440組及腰鍊／C3／C4／B3／PAGE2／Phase4／A2／A1／A5鏈。舊套裝測試原斷言在反轉副本執行；未知或混合來源、正式checkout、符號連結拒絕。必要既有DLL背景反轉沿用原工具，正式DLL功能不改。

完整歷史鏈通過，見history.log。58份回放證據另存history/；log採無損gzip，原始與封存SHA及位元組數見history/artifact-index.json。前批套裝1440組、腰鍊360組及完整後續鏈原樣通過。原封存與基準不重錄、不覆寫。

最終保護檢查：2647份既有報告／registry／核心renderer檔位元組保持；20個其他工作目錄、140份既有未提交檔的狀態與SHA保持。見protection.json與other-worktrees-protection.json。本機HEAD及遠端main仍為dabef017；索引空白，未stage。

## 瀏覽器限制

使用隔離Chromium及本機正式build，沒有操作使用者Chrome收藏或外部模型。桌手機三筆狀態與輸出通過；道頓堀以搜尋面板實際點選。重散景原生下拉操作逾時後，兩尺寸皆使用程式化change fallback驗證下游，原生popup滑鼠操作未完成，不能以本次通過覆蓋既有原生選單限制。Lens Flare的selectOption成功，亦不等同原生popup滑鼠操作。

保存與重載維持舊卡公開原文、ID、日期與原選值；既有正規化補入10個預設欄位，逐項記錄於browser/results.json。畫面已目視檢查，無本批造成的裁切或溢位；未生成圖片，不宣稱模型影像品質等價。5175本次預覽服務已停止。

## 重跑

Node22、既有node_modules；根目錄指定 `REGISTRY_BASE_COMMIT=dabef0172ddf35c569632956c5bd7fed3e8c2c8b`。

- `node --test webapp/src/lib/engine/c2SceneOptics.test.js webapp/src/lib/engine/phase4History.test.js`
- `node scripts/c2_scene_optics_acceptance.mjs`（不得再次--record）
- `node scripts/c2_scene_optics_modes.mjs`
- `node scripts/c2_scene_optics_history.mjs /tmp/c2-scene-optics-history`
- `python3 scripts/c2_scene_optics_protection.py`
- 同步、Python、catalog strict／目錄工具及public assets；webapp的test／test:prompt-quality／lint／build／audit:prompts:strict；根目錄check_prompt_bundle。
- 啟動5175正式preview，PLAYWRIGHT_MODULE指向既有Playwright；執行scripts/c2_scene_optics_browser.mjs及scripts/check_production_browser.mjs。

原始log保留工具尾端空白與空行，不為空白檢查改寫證據。相機／底片未分類、其他C類、PAGE2舊匯入、J12與P5b未併入。未授權提交或部署，CI／線上部署不屬本次驗收。

## 使用者驗收與交付授權

Cooper已確認本批驗收通過，授權只提交並推送本批資料、alias、規格、保留理由、例外、回歸案例、歷史回放與驗收證據。上文及acceptance.json中的未提交／待驗收狀態為本機驗收當時快照，原始證據保留；本次交付仍保留原生popup操作及未生圖限制。CI與部署須核對本次提交的實際作業結果，不能以本機驗收代替。
