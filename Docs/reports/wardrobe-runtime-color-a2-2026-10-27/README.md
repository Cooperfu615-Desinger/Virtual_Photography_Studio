# A2 runtime 配色句：順序 2＋3 驗收

2026-10-27，本機驗收完成；尚未 stage／commit／push，沒有本批新 CI。可信基準、本機 main 與最後唯讀核對的 origin/main 均為 `bd31bd34f0bfa8986193a6048fe1a69a265e3668`。

## 結果

三種共用 runtime 配色句改為視覺描述：

| 類別 | 新描述例子 | 保護範圍 |
| --- | --- | --- |
| 完整造型 | `outfit palette: black-and-red street color family` | 原九個 palette.en 全文，包含多色／dark accent balance |
| 通用套裝主／次色 | `primary garment in light blue, secondary garment in white` | 顏色、材質 prefix/detail、角色責任；detail-only 圖樣用 with |
| 連身上下區域 | `dress palette from top to bottom: upper/main dress area …, lower hem or skirt area …` | 原上／下區域、順序與裁切可見性 |

原 `target set to color`、固定色／飾邊、材質消費、襯衫固定黑色下身、`shirt palette inspired by …` 保持。Z 原完整色系縮寫政策及 AI 精簡政策保持；AI/MJ 在全部對照案例逐字不變。沒有修改 catalog、生成資料、ID／aliases／semantic、UI 或儲存格式。

新增新句型的窄幅文字還原辨識，保留舊句型與最長色票／同衣物／A-B 歸屬規則。全色票反例驗出 detail-only 條紋會被既有最長片語排除；已讓新 `with {detail}` 直接對應完整色票變體，未放寬裸色字判定。

[規格](../../specs/wardrobe-runtime-color-a2-v1.md) · [決策](../../decisions/2026-10-27-a2-runtime-color-language.md) · [檔案清單](delivery-manifest.json)

## 固定版對照

[完整結果](acceptance/acceptance.json)與[基準、舊檔及逐案例 hash](acceptance/baseline-and-saved.json.gz)由固定 Git 原引擎建立，預期值只套獨立核准文字轉換，不呼叫候選 formatter 產生預期。

- 4,375 案，0 超出核准差異。只排除頂層 runtime id/date，選值、RNG 次數、control 全物件與正式資料相同。
- 1,970 完整造型×色系、498 全套裝代表主次色／材質、90 全色票、1,008 連身上下配色、330 景別、198 雙人、33 角色卡、14 固定構圖、44 外套、100 固定 seed 隨機；另有 30 保存案例與 60 抓拍重抽。
- 804 案完整物件逐字不變。其餘只允許三種 runtime 文法；GPT／Nano 各 3,508、胸上 2,429、全身 3,393、Z 1,526 案有核准文字變動，AI/MJ 0。
- 74 份正式來源／生成資料逐位元組相同，中文檔名以 NUL 分隔清單比對。全追蹤檔與歷史檔另有保護檢查。
- 30 份舊 JSON、60 次舊快照／無快照 Markdown、30 份新快照與新舊貼上文字驗證；原公開文字不改，新快照仍沿既有預設值正規化。
- 歷史抓拍 `importedPerson` 與全身參考文字不改；主輸出按同一保存選值重建時使用新 runtime 文法。明確重新匯入才更換全身來源。

## 完整門檻

| 檢查 | 結果 |
| --- | --- |
| 聚焦／新舊解析／inverse／E 還原 | 43／43；本批新增 7 項回歸 |
| 前端完整測試 | 1,936／1,936 |
| Prompt Quality | 818／818 |
| lint／build | 通過 |
| 同 seed strict audit | 200，`prompt-quality-baseline`；前後逐字一致，0 blocker／18 既有診斷 |
| Catalog | sync --check、歷史 1,050 ID、schema、strict、43 Python、32 目錄工具、207 公開資產通過 |
| 歷史回放 | 前批膠帶 1,321、PAGE1 快照、舊配色還原、40 套裝、24 連身、A1、四批 A5 原工具完整通過；A～E 封存／E 1,098 原 expectedHash 維持 |
| 瀏覽器 | 44 項、26 張畫面；桌面 1440×1000、手機 390×900，六工作區，0 console/page error／0 外部 POST／0 意外水平溢位 |
| 保護 | 2,574 原追蹤檔、1,183 歷史檔；其他 20 工作目錄／140 份未提交檔的狀態及 SHA 不變 |

[前端門檻](frontend-gates.json)、[資料門檻](catalog-gates.json)、[瀏覽器操作清單](browser/results.json)、[保護結果](protection.json)、[稽核比較](audit-comparison.json)。各命令完整 log 以 `.log.gz` 保存；隔離歷史結果位於 `history/`，不覆寫舊報告。

已檢視桌手機整頁與關鍵輸出／雙人／抓拍細部，原有 panel 捲動與欄位換行正常。畫面例：[桌面配色](browser/1440-runtime-2.png)、[手機配色](browser/390-runtime-2.png)、[雙人](browser/390-duo-colors.png)、[抓拍](browser/390-capture-reimport.png)。

## 已知限制與範圍

1. **特殊穿搭套用清色系仍另批。** 固定 main 的九種非全無色系仍在 Saved Card 套用時被清除；存檔／Markdown 原文與選值保留。桌手機銀灰案例重現，未修改 transition 規則。
2. **舊連身上下配色路徑與現行 UI 分開。** 本次無袖迷你洋裝＋上下配色案例在固定 main 就沒有可匯入的全身來源（十個完整色系狀態一致）。現行單人 UI 的完整造型／分件互斥亦會清除上下配色；瀏覽器驗證舊快照原文可保留與複製，套用維持既有互斥。一般連身來源可匯入並已驗證。不藉本次文字修訂擴充或修復此路徑。
3. 新生成文字的視覺內容與配色責任由 deterministic 比較驗收；未呼叫付費圖片／影片模型，沒有外部模型效果驗收或新 CI。

其他 Phase 4／P5b 未進入；前兩批資料與歷史封存沒有重錄。本批可交由 Cooper 驗收，再另行授權限定提交。

## 重跑

使用 Node 22 與既有 node_modules。歷史工具需要完整 Git objects；不對正式樹還原舊資料。

```bash
export REGISTRY_BASE_COMMIT=bd31bd34f0bfa8986193a6048fe1a69a265e3668
node --test webapp/src/lib/engine/runtimeWardrobeColor.test.js webapp/src/lib/engine/specialTapeControlLanguage.test.js webapp/src/features/saved-cards/wardrobeColorRecovery.test.js webapp/src/features/saved-cards/wardrobeColorRecoveryHistory.test.js webapp/src/lib/engine/outfitControlLanguage.test.js webapp/src/lib/engine/legacyMappings.test.js
node scripts/wardrobe_runtime_color_a2_acceptance.mjs /tmp/a2-runtime-acceptance
node scripts/wardrobe_runtime_color_a2_history.mjs /tmp/a2-runtime-history
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
python3 scripts/check_public_assets.py
python3 scripts/wardrobe_runtime_color_a2_protection.py Docs/reports/wardrobe-runtime-color-a2-2026-10-27/protection-before.json
```

在 `webapp/` 執行 `npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`、`npm run audit:prompts:strict`。瀏覽器需 5175 Vite 與 `PLAYWRIGHT_MODULE` 指向已安裝 Playwright，再從根目錄執行 `node scripts/wardrobe_runtime_color_a2_browser.mjs /tmp/a2-runtime-browser`。
