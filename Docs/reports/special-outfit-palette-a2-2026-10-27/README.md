# A2 單人特殊穿搭完整造型色系驗收

2026-10-27；基準 main `15580949ac1f00e7a2628209d91a301434504965`。本機驗收完成，待 Cooper 驗收；尚未 stage／commit／push，沒有本批新 CI。

## 結果

單人特殊穿搭接管時保留自身完整造型色系。手動選色、其他選項更新、預覽回填、收藏套用與重載不再意外清除；全無／整區隨機／整區清空／全域清空維持既有規則。其他服裝、鞋襪與配件仍被接管，雙人 A／B 各自色系保持隔離。

唯一 production 差異位於 `webapp/src/features/page1/lockTransitions.js`：清理名單排除 `completeLookPaletteId`，附一行歸屬註解。引擎、renderer、catalog、選項 ID、儲存格式、文法、固定色、裁切與 RNG 均未修改。

[規格](../../specs/special-outfit-palette-a2-v1.md) · [決策](../../decisions/2026-10-27-a2-special-outfit-palette.md) · [限定檔案清單](delivery-manifest.json)

## 自動驗收

- 修改前新回歸 7 項中，5 項因色系被清除失敗，2 項既有隔離／排除範圍通過。修正後聚焦 25／25 通過，包括兩項 inverse 安全檢查。
- 固定 Git transition oracle：6,957 次狀態轉換，4,462 次只有核准的單人色系差異；0 超出核准差異。涵蓋 90 款 × 九色系與全無、手動／切換／更新／回填／重載後更新、雙人、景別、完整造型／分件、角色卡、固定構圖及隨機／清空邊界。
- 2,564 次生成對照固定 Git 引擎，包含 1,030 次相同原 locks 的直接生成；完整 Prompt 物件、六輸出、選值與 RNG 一致，僅排除頂層 id/date。
- 30 份基準保存案例、90 次 JSON／Markdown 快照／無快照還原，以及 60 次抓拍快照生成。無快照舊檔依原有能力與舊 codec 比較，不宣稱能還原原本缺少的衍生輸出；完整快照保留全部原文與衍生輸出。
- 533 份既有正式資料／程式來源逐位元組保持（排除核准的 transition）；舊連身上下配色回填與抓拍限制在保護案例維持。

[固定版本結果](acceptance/acceptance.json)、[基準與舊卡片](acceptance/baseline-and-saved.json.gz)、[門檻結果](gates.json)、[同 seed 稽核](audit-comparison.json)。

| 門檻 | 結果 |
| --- | --- |
| 前端完整測試 | 1,945／1,945；新增 9 項 |
| Prompt Quality | 818／818 |
| lint／build | 通過，保留既有 Vite 大型 chunk 提示 |
| strict audit | 200 同 seed 前後逐字一致；0 blockers、18 既有 diagnostics |
| 資料檢查 | sync --check、歷史 ID、strict、43 Python、32 目錄工具、207 公開資產通過 |
| 歷史回放 | 上一批 runtime 4,375 案及完整 A2／A1／A5 原工具回放通過；A～E 封存與既有 expectedHash 保持 |
| 保護 | 2,656 原追蹤檔、1,256 歷史檔、其他 20 工作目錄／140 份 dirty 檔；狀態及 SHA 保持，無 staged 內容 |

[歷史回放結果](history/history.json)與[保護結果](protection.json)另列。本批 inverse 先驗證原 production 檔與兩份新測試 SHA，再於隔離副本還原；拒絕真實 Git checkout、未知／混合／缺檔狀態，兩項安全回歸已納入 npm test。

## 瀏覽器與畫面

`http://127.0.0.1:5175/Virtual_Photography_Studio/`；獨立 Chromium 儲存環境，1440×1000／390×900。

42 項操作、32 張全頁／局部畫面：手動銀灰／黑紅／全無、鍵盤選色、更換特殊穿搭、接管、預覽回填、重載、六輸出複製、收藏、實際單張 Markdown／ZIP 匯出匯入套用、本頁隨機／清空、全域全無、雙人 A／B 色系隔離、舊抓拍快照保持及明確重新匯入、抓拍重抽與收藏重載。六工作區導覽檢查通過。

0 console／page errors、0 外部 POST、無意外頁面水平溢位或破圖。已檢視主要桌手機畫面與局部文字／控制項，既有內部捲動、欄位換行與視覺風格保持。

[操作紀錄](browser/results.json) · [人工畫面檢視](visual-review.json) · [桌面](browser/1440-single-selected.png) · [手機選色](browser/390-single-selected-detail-0.png) · [人物 A](browser/390-duo-detail-0.png) · [人物 B](browser/390-duo-detail-1.png) · [抓拍](browser/390-capture-detail-0.png)。

驗收工具初次把無快照舊檔也當成完整衍生輸出快照，已修正為與固定舊 codec 比較；另一項修正是區分 UI 全域／本頁隨機的相同提示文字。均屬工具修正，沒有擴改產品或舊相容能力。

## 範圍與限制

- 已被舊版清掉的色系不推測補回；保存色系的舊卡片可正確套用。已收藏公開原文及已匯入人物保持；明確重新生成／重新匯入才使用當前選值。
- 上下配色抓拍相容、舊連身還原／純文字辨識與胸上連身區域投影另批，其他 Phase 4／P5b 未進入。
- 沒有呼叫外部圖片／影片生成；外部模型效果不列為本機驗收結果。
- 沒有 stage／commit／push／部署；使用者驗收與後續 Git／CI 交付分開。本次 5175 驗收服務已停止。

## 重跑

使用 Node 22、現有依賴與完整 Git objects。歷史回放只操作隔離副本。

```bash
export REGISTRY_BASE_COMMIT=15580949ac1f00e7a2628209d91a301434504965
node --test webapp/src/features/page1/specialOutfitPalette*.test.js webapp/src/features/page1/lockTransitions.test.js webapp/src/features/page1/wardrobeEditor.test.js
node scripts/special_outfit_palette_a2_acceptance.mjs /tmp/a2-special-palette-acceptance
node scripts/special_outfit_palette_a2_history.mjs /tmp/a2-special-palette-history
node scripts/special_outfit_palette_a2_browser.mjs /tmp/a2-special-palette-browser
python3 scripts/special_outfit_palette_a2_protection.py Docs/reports/special-outfit-palette-a2-2026-10-27/protection-before.json
```

瀏覽器工具需正確 main 的 5175 服務與 PLAYWRIGHT_MODULE 指向已安裝的 Playwright。從 webapp 執行 npm test、npm run test:prompt-quality、npm run lint、npm run build、npm run audit:prompts:strict；資料門檻完整命令保存在 gates.json。CI 沿用 npm test 的既有 glob 執行兩份新增回歸，不修改 workflow。
