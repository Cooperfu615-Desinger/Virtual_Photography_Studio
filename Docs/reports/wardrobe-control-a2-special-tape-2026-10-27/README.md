# A2 膠帶特殊穿搭控制語修正：本機驗收

日期：2026-10-27。可信 main：`3a18fc2c2529dce38782135638ffd67c38a62187`。實際 main 工作目錄：`/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。本報告保留提交前本機驗收證據。Cooper 已確認驗收通過並授權只提交／push 本批資料、文件、基準、回歸、回放與驗收工具；實際 Git／CI 結果另行回報。

狀態：本機完整驗收與歷史回放通過，已獲本批限定交付授權。

## 核准差異

僅 `wardrobe:特殊穿搭-special-outfits:紅色亮面膠帶束帶造型:90` 的英文刪除 `palette-controlled ` 及 `, tape color follows complete-look palette selection`。**不新增 red 或固定紅色**；原材質、貼附方式、綁帶走向、遮覆、下身、臀／大腿細節與單色造型描述保持。中文、desc、ID、有序 legacyIds、semantic、圖片、排序及其他 89 款特殊穿搭保持。

完整舊英文追加至 top-level `legacyPromptAliases`。該分類原 schema 尚未開放此既有欄位，因此只補特殊穿搭的 string-array 宣告及 field_mapping 的三處分類清單。由正式 catalog JSON 同步產出 `knowledge_base/wardrobe_and_styling.md` 與 `webapp/src/data/database.json`。

執行期引擎、renderer、UI、存檔 codec、共用色系句、package.json 及 CI workflow 未改。本批新增回歸由既有 npm test glob 與 CI 自動收錄。另更新原特殊穿搭測試中這兩段文字的預期；既有套裝與舊還原的 test-only 回放入口接上新逆轉層，未放寬原驗收。

[規格](../../specs/wardrobe-control-a2-special-tape-v1.md) · [決策](../../decisions/2026-10-27-a2-special-tape-control-language.md) · [精確審核資料](../../../scripts/lib/a2SpecialTapeReview.json)

## 驗收結果

| 項目 | 本批結果與證據 |
| --- | --- |
| 修改前基準與紅燈 | 保存 2,488 原追蹤檔、20 個其他工作目錄、140 份未提交檔及修改前 audit；新回歸先對舊資料失敗，見 `red.log.gz` |
| 單筆／相容回歸 | 25/25（本批 5＋原特殊穿搭 20）；回放銜接另 14/14，含 E 原雜湊檢查 |
| 固定 Git 獨立對照 | 1,321 組、729 組保護路徑、267 份正式程式／資料檔；核准外差異 0。六輸出、選值、structured、摘要及 RNG 比對，主 MJ 零文字變動 |
| 新舊存檔 | 10 份舊 JSON、30 組 Markdown（新快照、舊快照、無快照正文），原始全文 alias／既有 ID、雙人 A/B 歸屬；舊公開原文與抓拍來源快照保持 |
| Frontend | 1,929/1,929；Prompt Quality 818/818；lint、build 通過。既有 bundle 大小提示保留 |
| Catalog | 同步檢查、schema、1,050 歷史 ID、strict 完整性、43 Python、32 目錄工具測試通過；207 公開資產檢查通過 |
| 同種子 audit | 200 / `prompt-quality-baseline`，前後逐字一致：0 blocker、18 既有 diagnostic，不為降低診斷數修改其他項目 |
| Browser | 1440×1000、390×900；38 項操作，20 張原始截圖；0 console/page error、0 external POST、0 意外水平溢位；另有人工畫面複核 |
| 輸出路徑保護 | acceptance／history／browser 三工具均拒絕寫入其他歷史報告目錄 |
| 歷史回放 | 前四批 A2、A1、四批 A5 原 acceptance／history 全部通過；A～E 原封存、測試及 E expectedHash 保持，見 `history.log.gz`、`history/` |
| 歷史與其他工作保護 | 1,106 歷史檔、20 個其他工作目錄／140 份未提交檔保持；12 份原追蹤檔的修改均在 allowlist；索引為空 |

詳細機器結果：`acceptance/acceptance.json`、`acceptance/baseline-and-saved.json.gz`、`sync-check.json`、`browser/results.json`、`browser/visual-review.json`、`output-protection.json`、`protection.json`。完整執行記錄保存在本資料夾對應 `.log.gz` 中；audit 雜湊比對的是解壓後原始日誌。

固定案例涵蓋全無及九色系、全部景別、雙人 A/B、固定構圖、外套開合與景別、新舊抓拍、其餘特殊穿搭／套裝／連身／角色卡及 100 組固定種子隨機結果。瀏覽器涵蓋六輸出複製、舊卡原文、單張 Markdown 下載／ZIP 匯入、收藏重載、套用、明確重新匯入、抓拍重抽，以及 Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards 六工作區。

## 已知限制與後續邊界

1. **特殊穿搭套用收藏時會清除完整造型色系，為既有 main 行為。** `transitionPage1Locks` 的特殊穿搭接管分支會清除其他 wardrobe 控制，包含 `completeLookPaletteId`。固定 `3a18fc2` 原碼與本批九種非全無色系均重現；卡片保存及 Markdown 匯出仍保有色系。桌手機以黑紅、銀灰各確認：保存／匯出文字正確，套用後只產生既有色系句移除，五種輸出僅差既有色系句，MJ 保持。本批不修正此問題，建議列入下一批 runtime 配色分析，不能宣稱色系 UI 套用已修復。最初要求彩色卡片套用後逐字不變的瀏覽器斷言，揭露此問題；失敗畫面保留在 `diagnostics/`，最終工具改以固定 main 行為及精確色系差異驗收，沒有放寬本批控制語修正要求。
2. **無快照舊渲染正文並非完整選值快照。** 本筆舊渲染後文字有既存辨識限制；保持固定 main 的推論結果。原始完整英文 alias、JSON 與 PAGE1 快照則分別驗證 ID 與公開文字。不擴大舊 parser 範圍。
3. 新生成使用乾淨來源；舊 Saved Card 原文與已匯入人物快照保持，只有明確重新生成／重新匯入才更新。這是相容契約，不以舊資料仍含原控制語判定本批失敗。
4. runtime 配色句、其他 Phase 4 項目及 P5b 均未進入；本批不含影像模型出圖評估、Git 交付或新的遠端 CI 執行結果。

## 歷史回放方式

`a2SpecialTapeReplay.mjs` 在隔離副本先核對單筆完整內容、分類 ID／順序、source／database／Markdown 同步、兩份管理檔雜湊及兩份回放銜接檔雜湊；全部符合才寫入逆轉結果。未知字句、metadata、alias、缺漏／重排／重複 ID、混合版本或不完整檔案均拒絕。正式工作目錄禁止逆轉。E 的精簡副本使用 database 及回放檔專用逆轉。

新 history 工具先還原本批資料／工具，在隔離副本放入固定 Git 的操作文件（README 非執行期狀態），再執行未修改的前批 PAGE1 快照 acceptance／history，接續舊 Markdown 配色還原、40 套裝、連身批次、A1 及四批 A5 原工具。舊工具對檔案雜湊及輸出路徑的檢查仍在；所有 A～E 舊封存與舊 expectedHash 保持，沒有重錄基準。

## 重跑入口

使用 Node 22，已安裝的依賴及完整 Git 歷史：

```bash
export REGISTRY_BASE_COMMIT=3a18fc2c2529dce38782135638ffd67c38a62187
node --test webapp/src/lib/engine/specialTapeControlLanguage.test.js webapp/src/lib/engineSpecialOutfitCleanup.test.js
node scripts/wardrobe_control_a2_special_tape_acceptance.mjs /tmp/a2-special-tape-acceptance
node scripts/wardrobe_control_a2_special_tape_history.mjs /tmp/a2-special-tape-history
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
python3 scripts/check_public_assets.py
```

前端由 `webapp/` 執行 `npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`、`npm run audit:prompts:strict`。瀏覽器服務固定 5175，執行 `scripts/wardrobe_control_a2_special_tape_browser.mjs`；可用 `PLAYWRIGHT_MODULE` 指向既有 Playwright，不必安裝依賴。保護檢查入口為 `scripts/wardrobe_control_a2_special_tape_protection.py`，傳入本資料夾 `protection-before.json` 與新的輸出路徑。
