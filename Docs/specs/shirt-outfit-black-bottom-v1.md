# 開扣襯衫套裝固定黑色下身 v1

日期：2026-10-20。使用者已驗收實際 Prompt，授權僅提交／推送本批；不合併 main 或手動部署。

## 核准範圍

只調整「開扣短袖襯衫熱褲」與「開扣長袖襯衫包臀裙」。熱褲／包臀迷你裙固定黑色，套裝主色只作用於襯衫布料。其他套裝、穿搭規則、參考圖、ID、排序與隨機池保持原狀。

- Authored English 分別使用 `skin-tight ultra-short black hot pants` 與 `tight black bodycon mini skirt`。襯衫既有袖長、棉質、領子、開扣、門襟張力與皺褶來源保留。
- Metadata 使用 `colorMode: primary`、`colorTargets.primary: [shirt_fabric]` 及限定兩項的 `shirtBlackBottom` 標記。普通與進階色票均只修飾上衣；選全無時不指定上衣顏色，下身仍是黑色。
- 舊對比色／鎖定色資料保留相容儲存，但不對這兩套生效。完整造型配色僅描述 shirt palette，不再宣稱整套改色。現有 UI 自動只顯示套裝主色，沒有新增下身控制。
- 主 MJ 單品名稱規則新增兩套例外：保留可見襯衫的有效主色，以及 `black hot pants`／`black bodycon mini skirt`。不加入開扣、張力與版型長文。其他套裝仍沿用原名稱投影。
- 胸上／頭部裁切、閉合外套遮蔽與雙人 A/B 歸屬沿用共同解析結果，不重新加入隱藏服裝。全身角色照依原完整穿搭投影。
- GPT、Z-Image、Nano Banana、胸上、全身共享更正後的來源；不改寫其格式、姿勢、場景或成像契約。Z 保留原有短句濃縮，只增加固定黑色。
- 兩套舊完整英文保存在 `legacyPromptAliases`，原 ID、參考圖與 Saved Cards 選值不變。既有收藏文字不批次改寫；重新生成才套用新規則。

## 修改位置與驗證設計

- `knowledge_base/wardrobe_and_styling.md`、`knowledge_base/outfit_preset_metadata.json` → `scripts/sync_to_json.py` → `webapp/src/data/database.json`。
- `webapp/src/lib/engine.js`：指定部位配色、完整造型配色邊界、兩套主 MJ 名稱例外、Z 短句。
- `shirtBlackBottom.test.js`：兩套／所有色票、隨機色、對比及鎖定色、完整造型配色、雙人、固定構圖、裁切、閉合外套、舊英文匯入與 Saved Cards。
- 修改前擷取 `shirtBlackBottomProtected.json`：其他 81 套 × 2 色 × 3 景別，共 486 組；六輸出、selection、structured、summary、summaryFields 逐字雜湊對照，基準未由新版重生。
- `shirtBlackBottomLegacy.json` 保存修改前兩筆來源；歷史主 MJ 基準只對這兩套使用原目錄輸入，所有其他即時資料照舊比對，不覆寫歷史快照。當前黑色下身行為由獨立專項測試覆蓋。
- Public contract `1.62.0` 與 `SHIRT_BLACK_BOTTOM_CONTRACT`；MJ compatibility 註明限定例外。

實際完成驗證與瀏覽器紀錄見下方完成紀錄。外部模型的出圖結果仍由使用者確認。

## 本機完成紀錄

2026-10-20，Node 22.22.3；工作目錄 HEAD `e9e7745`（detached HEAD）。

| 檢查 | 結果 |
| --- | --- |
| 套裝專項 | 8/8，包含 486 組其他套裝的修改前逐字基準 |
| 完整前端 | 1702/1702 |
| Prompt Quality | 746/746 |
| lint／build／diff-check | 通過；Vite 既有大型 chunk 提示保留 |
| KB | sync、sync --check、Python 2/2、207 個公開資產檢查通過 |
| 同 seed strict audit | `200 / prompt-quality-baseline`，前後 0 blockers／22 diagnostics；只增加預期配色字數 |
| 瀏覽器 | 23 項通過，1440×1000／390×900；14 張最終截圖已檢視 |

瀏覽器以隔離 Chromium 檢查兩套紅／白／黑／全無色、主色欄位、MJ 實際複製、胸上／全身來源、Saved Card 六輸出套用及 reload、手機換色，以及 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards 導覽。無 console/page error、破圖或 document 橫向溢位。沒有送出外部生圖或接觸使用者原本瀏覽器收藏。

標準 5175 已由 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio/webapp` 使用，未停止／替換其服務。此次已確認改用本工作目錄的 `http://127.0.0.1:5176/Virtual_Photography_Studio/`，5176 留供本機查看。最初對 5175 的舊版檢查不計入完成結果。

證據：`/tmp/vps-shirt-suite-final.log`、`/tmp/vps-shirt-quality.log`、`/tmp/vps-shirt-lint-final.log`、`/tmp/vps-shirt-build-final.log`、`/tmp/vps-shirt-black-before.log`、`/tmp/vps-shirt-black-after.log`；瀏覽器 `/tmp/vps-shirt-browser/results.json`、同目錄 14 張最終截圖與 `actual-prompts.json`（兩套各六輸出）。該目錄的 `error.png` 是前期驗證選擇器／舊服務診斷，並非最終狀態。

本次未 stage、commit、push 或部署。既有未追蹤文件與參考素材保留；實際外部圖像效果待使用者確認。

## 使用者驗收與 Git 交付授權

2026-10-20 使用者確認上述實際 Prompt，授權 commit／push，且明確限定本次兩套襯衫套裝。上方未提交註記是驗證當下狀態。由已驗證的 `e9e7745` 建立 `codex/shirt-black-bottom`，只提交本次 22 個資料、程式、測試與文件檔案；另一工作目錄的 main 與其他未追蹤內容維持原樣。遠端結果以交付時的 SHA 核對為準。
