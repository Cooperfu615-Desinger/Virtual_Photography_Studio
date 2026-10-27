# A2 第二批：40 筆套裝控制語驗收

2026-10-27，本機實作與範圍內驗收完成；未 stage、commit、push 或部署，沒有本批新 CI。一般 Markdown 的既有文字推測限制明列於下方，不宣稱精確還原全部選值。

## 基準、範圍與結果

- 工作目錄：`/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，分支 `main`。
- 固定 Git／歷史 ID 基準：`048a2348869c9348d18f4e0b71d4ceed92c69232`；遠端 main 最後核對相同。原專案目錄的其他分支與所有既有未提交工作保留。
- [規格](../../specs/wardrobe-control-a2-outfits-v1.md)／[40 筆逐筆責任決策](../../decisions/2026-10-27-a2-outfits-control-language.md)。40 筆 en 只刪除已審查的控制子句，前文尾端追加至 top-level legacyPromptAliases；名稱、desc、ID、原 metadata、semantic、順序與圖片保持。
- 21 筆通用配色保持；19 筆原英文解析責任移至 29 個有序綁定，保留目標字句、consumed flags、fallback、材質省略、固定色及原對比色重疊。共用 builder 只有窄接線，壓縮器、收藏解析器、UI、隨機選值及影片功能不變。
- 其餘 18 套裝、全無、24 連身、特殊穿搭、角色卡與其餘分類未改。特殊穿搭 1 筆、runtime 配色句、其他 Phase 4 與 P5b 不在本批。

## 驗收結果

| 驗證 | 結果與證據 |
| --- | --- |
| 修改前基準 | 固定 Git 原件、逐筆 review、2,241 份 tracked 雜湊、其他 20 工作目錄／140 檔、200 同 seed audit；聚焦來源／輸出／alias 三測試在改產品前均失敗，見 logs/focused-before.log.gz |
| 新聚焦回歸 | 84／84，包含全景別五配色、舊 ID／原文 alias、29 綁定對照舊 parser、固定色特殊情況、反向回放反例 |
| 獨立 oracle | 8,611 案、264 份保護來源、0 核准外差異；六輸出全文、structured、summary、selection／RNG 比較，見 acceptance/acceptance.json.gz |
| 收藏與抓拍 | 40 舊 JSON／40 舊 Markdown、舊抓拍快照保持、明確新匯入採新來源、重抽保持快照；完整原文見 acceptance/baseline-and-saved.json.gz |
| 前端完整測試 | 1,867／1,867，0 skip／fail |
| Prompt Quality | 771／771，0 skip／fail |
| Python／目錄工具 | 43／43、32／32；新 schema 接受正確綁定、拒絕錯誤角色／空 target／控制句／未知欄位／非布林標記／其他分類 |
| 資料完整性 | sync --check、1,050 歷史 ID／strict、schema／field mapping、資產檢查通過，registry base 為上述完整 SHA |
| Audit | 200／prompt-quality-baseline，0 blocker／18 既有診斷；排除 runtime promptId 後，所有 findings 逐項相同，見 audit-comparison.json |
| Lint／Build | 通過；既有大 bundle 提示仍存在，未為本批改打包策略 |
| 歷史回放 | A2 第一批原 3,545 案、A1 原 1,273 案及四批 A5 原工具通過；全套測試中的 A～E 封存檢查通過，舊證據未重錄，見 history/ 及 logs/history.log.gz |
| 瀏覽器 | 48 項／28 張，桌面與手機六工作區、五套代表款、實際色票切換與全無、六輸出複製、收藏還原及抓拍匯入；0 errors／0 外部 POST，見 browser/results.json |
| 工作區保護 | 其他 20 工作目錄 HEAD／完整 status／140 檔 SHA256 保持；原歷史報告與基準保持，見 protection.json |

oracle 從固定 Git 取出原 engine，19 筆在舊 builder 還原原控制子句並用原 parser 解析色票，僅清除未解析的控制子句；材質模式將原 strip 命中的整句清除。沒有呼叫新 helper 計算 expected。21 筆只套已審查的來源刪句；雙人既有 `:a`／`:b` 後綴與已匯入舊快照分別處理。矩陣包含所有主色／對比色色票（含材質）、固定色方案、完整造型／上下配色、所有景別、雙人、固定車廂、外套開合及未改路徑。

## 保留的限制與後續決策

1. **舊 Markdown 不等價於 JSON 精確還原。** 21 筆通用套裝原先無法由渲染後文字認回，現在能認回原 ID；其中 8 筆在舊版就因 `tailored`／`layered` 等子字串被推測出 red。套裝重新辨識後，這個錯誤推測會轉到套裝主色／對比色，不能稱為已修正。精確差異在 [Markdown recovery fixture](../../../scripts/lib/a2OutfitMarkdownRecoveryReview.json)；原公開 Prompt 字串仍保持。本批沒有更動解析器，建議後續獨立修正文字色票辨識及／或補齊 Markdown 完整選值保存；需要精確還原時使用 JSON。
2. 粉紅哥德兔耳的 cross decorations 對比色與金屬 locked 範圍原本重疊；網狀蕾絲套裝的 locked metadata 在 primary 模式不啟用。本批保留，不擅自重設配色責任。
3. 全部驗證為本機邏輯／瀏覽器驗收；未進行付費出圖，未評估外部模型實際材質／顏色生成品質，也沒有本批提交或 CI。

## 畫面檢視

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。使用全新隔離瀏覽器 storage、阻擋外部 POST，不改使用者收藏，也未停止原有 5175 服務。

1440×1000 與 390×900 檢視 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、DLL_VIDEO Pro、Saved Cards。五套代表款為鏈條緞面、粉紅哥德兔耳、網狀蕾絲、素色緞面旗袍、短版運動T；涵蓋無色、雙色、材質色、固定金色及 primary-only 對比色靜默。額外實際點選主色白色／全無，確認對比色與固定金色不被連動更改。

無意外水平溢位、破圖、裁切或控制項互蓋；手機維持既有縱向長頁與各輸出框內捲動。複製與套用提示為短暫 toast。桌手機畫面與輸出已人工檢視；代表畫面：[桌面主色全無](browser/1440-color-picker-none.png)、[手機主色全無](browser/390-color-picker-none.png)、[桌面抓拍新匯入](browser/1440-capture-reimport.png)、[手機六工作區中的影片頁](browser/390-video-integration.png)。

## 重跑方式

從上述 main 工作目錄，Node 22，可信 registry base 使用完整 SHA。先完成聚焦及目錄檢查，再跑前端完整 gate、獨立 oracle／歷史回放與瀏覽器。

```bash
export REGISTRY_BASE_COMMIT=048a2348869c9348d18f4e0b71d4ceed92c69232
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
python3 scripts/check_public_assets.py
node --test webapp/src/lib/engine/outfitControlLanguage.test.js webapp/src/lib/engineOutfitPresetDressCleanup.test.js webapp/src/lib/enginePromptPipeline.test.js
npm --prefix webapp test
npm --prefix webapp run test:prompt-quality
npm --prefix webapp run lint
npm --prefix webapp run build
node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict --json
node scripts/wardrobe_control_a2_outfits_acceptance.mjs /tmp/a2-outfits-check
node scripts/wardrobe_control_a2_outfits_history.mjs /tmp/a2-outfits-history
node scripts/wardrobe_control_a2_outfits_browser.mjs /tmp/a2-outfits-browser /tmp/a2-outfits-check/baseline-and-saved.json.gz
```

瀏覽器工具需要可用的 Playwright（本機以 PLAYWRIGHT_MODULE 指定安裝路徑）及 5175 服務。歷史工具需要完整 Git 物件，會在隔離副本精確反向還原，不能重新錄製舊封存來消除差異。未修改 CI 設定；新回歸已加入既有 npm test 與 test:prompt-quality，schema 反例由 Python discover 執行。
