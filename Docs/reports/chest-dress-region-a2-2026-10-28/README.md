# A2 單人胸上連身區域配色：本機驗收

日期：2026-10-28。固定 main／最後遠端核對：`9a0c4f2df7790d2728701e384b9dfc635d428a73`。本批未 stage、commit、push 或部署；沒有本批新 CI，使用者驗收與交付仍為獨立門檻。

## 結果與範圍

單人胸上特寫照現在明確表達可見的上區配色，例如 `sleeveless dress, …, upper/main dress area in cherry blossom pink`，不把上區色當整件衣色，也不帶入下襬奶油黃。不透明全扣外套依舊遮蔽內搭色；透膚且內搭可見時保留。原衣物細節、固定作者色、完整造型色系保持。

只有 `engine.js` 的胸上衍生模型有效連身分支改變。主 GPT、Z-Image、MJ、Nano Banana、全身角色照五組文字、其餘完整資料結構、選值與 RNG 保持。舊卡公開原文保持，套用重新生成才使用新胸上規則。未改 catalog、ID、parser、storage、UI、外套判定或全域 fragment 分類。

[規格](../../specs/chest-dress-region-a2-v1.md) · [決策](../../decisions/2026-10-28-a2-chest-dress-region.md)

## 固定 Git 對照

見 [acceptance.json](acceptance.json)、[baseline-and-saved.json.gz](baseline-and-saved.json.gz)、[oracle-mismatches.json](oracle-mismatches.json)。

- 24 連身 × 42 配色 = **1,008 組**。
- **407 組邊界**：所有主景別、外套開合、9 組完整造型色系疊加、單色、套裝、特殊穿搭、雙人 A／B、既有胸上固定 fixtures 及固定構圖。
- **48 次抓拍／重抽**：24 連身各兩次；原 frozen 人物及全身 Prompt 保持。
- **36 次存檔往返**：代表舊／新 JSON、Markdown 完整快照、ZIP；六輸出原文與配色選值保持。
- **4,086 次生成**，只有 1,184 組符合條件的胸上 Wardrobe 改變；0 核准外差異。候選版去除唯一核准上區子句後，須逐字等於固定 Git 引擎的同衣物無配色可見來源；不是以新 helper 建立 expected。
- 其餘 **328 份正式來源／程式**逐字等於固定 main。

`regression-before.log` 記錄修正前 3 個預期失敗與 1 個保護案例通過；`regression-after.log` 4／4 通過。另有 2 個 exact-inverse 回歸，完整套件已納入。

## 完整 gates

| 檢查 | 結果／證據 |
| --- | --- |
| 前端全測試 | 1,985／1,985，`frontend-test-final.log` |
| Prompt Quality | 829／829，`prompt-quality-final.log` |
| lint／build | 通過，`lint-final.log`、`build.log` |
| 200 同 seed strict audit | 前後逐字一致；0 blocker／18 既有診斷，`audit-before.log`、`audit-after.log` |
| sync／歷史 ID／strict | 通過，指定本批完整 `REGISTRY_BASE_COMMIT`；`sync.log`、`catalog-strict.log` |
| Python | 43／43，`python-tests.log` |
| 目錄完整性／語意／舊映射工具 | 32／32，`catalog-tools-final.log` |
| 公開資產 | 207 檔通過，`assets.log` |
| diff／文件連結 | 最終交付檢查另記 `final-review.json` |

最初 gates 中的歷史直接入口失敗已透過本批精確 inverse 接入修正，前端／品質全套重新通過；第一次目錄工具缺少 `REGISTRY_BASE_COMMIT`，補齊後 32／32。`gates.json` 與 `final-gates.json` 保留各輪原始狀態，最終結果以上表及 final log 為準。

驗收工具開發紀錄 `failure-*.json` 保留：隔離引擎的 WeakMap 來源必須由同版模組取得；JSON codec 有既有正規化欄位，因此以固定舊版 codec 對照及逐一保護六輸出原文。兩者均已修正驗證方式，未修改產品邏輯或刪除原失敗證據。

## 瀏覽器與畫面

[操作紀錄](browser/results.json)：5175、桌面 1440×1000／手機 390×900，**34 項操作、28 張畫面**，0 console／page error／外部 POST／意外水平溢位。

已實際完成：舊 Saved Card 胸上複製、套用／生成、六輸出複製、配色保留提示、單張 Markdown 下載、ZIP 匯入／套用、重載、不透明／透膚全扣外套、抓拍匯入與重抽，並巡覽六工作區。Import 仍只接受 ZIP；沒有新增單張 Markdown 上傳入口。

已檢視桌手機胸上局部、手機不透明／透膚外套局部、桌面穿搭提示與 Saved Cards，以及手機六工作區主要畫面；文字可讀、按鈕正常，textarea 的內部捲動為既有設計。測試採獨立瀏覽器儲存，未使用實際使用者資料或呼叫生圖服務。專用 5175 服務已停止。

- [桌面胸上文字](browser/1440-chest-output-detail.png)
- [手機胸上文字](browser/390-chest-output-detail.png)
- [不透明外套](browser/390-opaque-detail.png)
- [透膚外套](browser/390-sheer-detail.png)
- [保留配色提示](browser/1440-retained-palette.png)

## 隔離歷史回放

**完整歷史鏈已通過。** 見 [history/history.json](history/history.json) 與 [完整回放紀錄](history-run.log)：上一批純文字還原原工具完成 6,120 次還原、8,172 次生成；更早的結構化連身、抓拍配色相容、特殊穿搭色系、runtime 配色、膠帶、Markdown 快照／配色還原、40 套裝、24 連身、A1 及四批 A5 原工具亦全部通過。核准差異仍按各批原規格核對，未改動舊 expectedHash 或歷史封存。

本批 inverse 先驗證所有來源及新增測試，再原子還原，拒絕真實工作區、Git checkout、未知／缺失／混合版本。最終 **8 份來源**還原後已逐字比對固定 Git（[inverse-final.json](inverse-final.json)）。先回到 `9a0c4f2d` 再執行原本上一批純文字還原驗收及其歷史工具，不修改它們的內容與 expected 值。

## 保護與延後範圍

保護快照涵蓋 **3,124 個原追蹤檔、1,684 份歷史檔**。其他 **20 個工作目錄／140 份既有未提交檔**與狀態均保持；一個既存失效 worktree 登記也保持。見 [保護結果](protection-after.json)。實際 main 位於 `~/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`；原專案路徑是另一個有既有工作的分支，未修改。

主工作台近景／腰部區域投影另批處理。外套原有 `Lower portion of the dress` 措辭保持，不在本批順手修正。其他 Phase 4／P5b 未進入。程式與瀏覽器驗收不代表外部影像模型實際生成效果已驗證。

## 重現

使用 Node 22（專案現有依賴），從 repo root 執行下列工具；預設輸出為隔離暫存位置，亦可指定本批報告目錄。不要將輸出指向其他批的報告。

```sh
node scripts/chest_dress_region_a2_acceptance.mjs /tmp/a2-chest-dress-acceptance
node scripts/chest_dress_region_a2_history.mjs /tmp/a2-chest-dress-history
# 啟動 5175 後，以 PLAYWRIGHT_MODULE 指向本機 Playwright：
node scripts/chest_dress_region_a2_browser.mjs /tmp/a2-chest-dress-browser /tmp/a2-chest-dress-acceptance/baseline-and-saved.json.gz
python3 scripts/chest_dress_region_a2_protection.py Docs/reports/chest-dress-region-a2-2026-10-28/protection-before.json /tmp/a2-chest-dress-protection.json
```
