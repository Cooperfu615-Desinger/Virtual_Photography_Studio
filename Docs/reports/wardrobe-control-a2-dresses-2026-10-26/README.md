# A2 第一批：24 筆連身控制語驗收

> 2026-10-27: [Latest main integration and authorized scoped delivery](integration-2026-10-27/README.md). The original 2026-10-26 record below is retained as historical evidence.

狀態：2026-10-26，本機驗收通過；尚未 commit、push 或部署。

## 結果與範圍

以 main `4e35912f82280c058d0c86b6de3f44fcb019f9df` 為固定基準。24 筆連身 `en` 移除色票選擇控制句；一字領哥德迷你洋裝另移除對比色控制句，保留 ruffle trim。原英文完整追加為最後一個 legacyPromptAlias，所有原 alias／ID／semantic／中文／desc／圖片／順序保持。正式變更為一份分類 JSON，及其同步產生的 database.json、wardrobe_and_styling.md。引擎、renderer、UI、Storage schema、依賴與 CI 設定未改。

24 筆在無配色全身基準的 GPT、Nano、胸上與全身角色照均清除本批控制語；主 Z／MJ 在這組基準原本已無漏出，文字不變。其他場景的變化以固定 Git 加核准資料差異的 oracle 為準，沒有擴增 renderer 規則。完整造型、上下配色的 runtime 句、40 筆套裝及 1 筆特殊穿搭控制語仍屬後批。

[規格](../../specs/wardrobe-control-a2-dresses-v1.md) · [決策](../../decisions/2026-10-26-a2-dresses-control-language.md) · [逐筆原文及核准差異](../../../scripts/lib/a2DressControlReview.json)

## 獨立比較與保存契約

[驗收工具](../../../scripts/wardrobe_control_a2_acceptance.mjs) 從固定 Git 分別載入 before 與只施加核准資料變動的 expected engine，對照目前全部輸出、structured、summary、selection 與 RNG。只排除動態 ID／時間。

3,545 組涵蓋：24 筆單筆基準、792 景別／三色、984 全色票、1,032 上下配色、240 完整造型色系、24 獨立連身、24 雙人、72 固定車廂、48 外套開閉、24 收藏還原、24 舊抓拍、24 新抓拍、48 重抽，以及 185 非目標保護案例。三色固定為全無、淡藍、鏡面鉻銀，額外斷言配色實際解析；不以不存在的色票 fallback 代表材質色驗收。

24 份舊 JSON／24 份 Markdown 的公開原文與已選 ID 保留。既有 codec 會依 ID 重建目前 structured 來源；瀏覽器仍會補齊舊收藏缺少的空鎖欄位，因此不宣稱存檔容器逐位元組不變。舊卡複製原文不變，「套用目前預覽」會立即依現行資料重新生成。舊抓拍人物／全身 reference 保持歷史快照，重抽不換人；明確重新匯入才採新來源。

證據：[acceptance.json.gz](acceptance.json.gz)、[baseline-and-saved.json.gz](baseline-and-saved.json.gz)。

## 歷史保護

新的 test-only 精確 inverse 驗證 24 筆的全文、aliases 及 metadata，拒絕混合狀態、未知變更、遺失或重複 ID，僅作用於隔離副本。具名 frozen tests 接線回放，其他現行測試仍讀新資料；兩個舊 GPT regression 的 dress 控制句期待依本次規格改成不得出現，preset 與有效配色期待維持。

[歷史回放工具](../../../scripts/wardrobe_control_a2_history.mjs) 原樣執行 A1 與四批 A5 工具。A1 保持 1,273 案例、99/99 成年身份；西門町、CRT、commercial 與最初三筆修正的原始 oracle 通過。A～E 原封存回放由完整前端 suite 驗證；既有基準、封存工具與舊證據未重錄。各次原始工具輸出見 [history/](history/) 與 [logs/history.txt](logs/history.txt)。

## 驗收矩陣

| 項目 | 結果 |
| --- | --- |
| 固定 Git oracle | 3,545 組，0 核准外差異；267 份正式檔案保持 |
| 完整前端 | 1,855/1,855 |
| Prompt Quality | 763/763 |
| Python schema／sync／歷史 ID | 41/41；1,050 個歷史 ID、8 份生成物同步 |
| Catalog 工具 | 32/32 |
| Strict 完整性 | 0 blocker／0 stale；原 J12 兩項例外保持 |
| lint／build／公開資產 | 通過；207 個公開資產，既有 bundle 大小提示保持 |
| 200／prompt-quality-baseline audit | 0 blocker／18 既有診斷；去除動態 promptId 後逐項相同 |
| 桌機／手機 | 1440×1000、390×900，共 44 項／18 張畫面 |
| 未提交內容及歷史檔 | 詳見 final-protection.json；其他 20 工作目錄的 140 份原有檔案保持 |
| Git／CI | 未 stage／commit／push；本批無新 CI run |

audit 只因去除控制句縮短 GPT／胸上／全身字數，Z／MJ 字數統計不變。來源同步等結果在 [logs/](logs/)，診斷比較見 [audit-comparison.json](audit-comparison.json)。

[專用瀏覽器結果](browser/results.json)包含三種連身及配色、36 次剪貼簿比對、舊卡原文複製、套用／重生成、收藏／reload／還原，以及舊抓拍→明確重新匯入→再收藏。另有[五工作區 smoke](browser-workspaces/results.json)，現行五工作區為 Prompt、角色建模、場景建模、DLL_PIC Pro、Saved Cards；Pose／抓拍為 Prompt 內模式。18 張畫面已檢視，無新增 console/page error、破圖、意外 document 橫向溢出或控制項重疊。長頁與 textarea 內捲動為既有行為。全部採獨立瀏覽器、本機 DLL 模擬，外部 POST 0；不代表模型出圖品質已驗收。

## 重跑

先設 `REGISTRY_BASE_COMMIT=4e35912f82280c058d0c86b6de3f44fcb019f9df`，使用 Node 22。專用工具在 repo 根目錄執行：

```sh
node scripts/wardrobe_control_a2_acceptance.mjs /tmp/a2-acceptance
node scripts/wardrobe_control_a2_history.mjs /tmp/a2-history
node --test webapp/src/lib/engine/dressControlLanguage.test.js
```

通用 gate 依 AGENTS。瀏覽器需要先啟動本目錄的 5175 服務；`PLAYWRIGHT_MODULE` 可指向既有安裝，不需新增套件。執行 `scripts/wardrobe_control_a2_browser.mjs <output-dir> <baseline-and-saved.json.gz>` 與原 `catalog_baseline_browser.mjs`。報告的舊歷史基準不可重錄。

## 並行工作與後續

實際實作目錄為 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio` 的 main，原始 Projects 工作目錄保留。驗收後遠端 main 仍為上述固定 SHA。「APIKEY分析」最近可讀紀錄停在 DLL_VIDEO Pro 示意圖，當時 main 沒有影片 UI 未提交改動；這只是當次核對，不代表另一個 session 永久暫停。

影片分頁可在導覽、頁面、影片流程的獨立範圍並行；若碰 engine、穿搭資料、Saved Cards／匯入、共用文件、package.json，或也要使用 5175，需先協調。不得覆寫本批文件或將另一個 session 的工作一起交付。

本批待使用者驗收及另行授權提交。後續依原分批策略審查 A2 套裝配色 metadata 與特殊穿搭，不預先實作；A3／A4、其他 Phase 4 與 P5b 均未進入。

本次啟動的 5175 服務已停止並釋放，未停用其他 session 服務。最終變更清單與雜湊見 [delivery-manifest.json](delivery-manifest.json)。
