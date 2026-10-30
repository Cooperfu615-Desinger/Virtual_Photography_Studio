# C2 套裝尾句：一筆微調、19筆保留

可信 main `043418f9c169e2e5848d23aaae15c1a32e34588f`。正式來源只改泳裝度假套裝尾句 `clean resort swimwear silhouette` → `clean resort silhouette`（18→17詞），追加完整舊英文alias。其餘19筆保留原樣，逐筆理由見[規格](../../specs/c2-outfit-tails-v1.md)、[決策](../../decisions/2026-10-30-c2-outfit-tails.md)與scripts/lib/c2OutfitReview.json。

本批本機完整驗收通過；完整歷史鏈、產品及瀏覽器閘門均已完成。本報告與acceptance.json記錄提交前的本機驗收狀態。Cooper已驗收並授權限定提交／push；CI與部署結果於交付時另外核對，保留本機證據原始狀態。

## 驗收結果

| 項目 | 結果／證據 |
| --- | --- |
| 修改前基準 | before.json.gz，1440組，建立於正式資料修改前；baseline-record-final.log。僅允許排他建立，封存不重錄 |
| 本批固定比較 | focused-delivery.log，4/4；20筆×單人／A／B×六景別×無色／主對比色／完整色系／外套。四主及適用衍生僅允許泳裝尾句替換；選值／RNG／normalize／原收藏保持 |
| 保留投影詞的反例 | projection-review.json：固定案例28的corset排序、1260的skirt落點；候選刪字會改變既有近景投影，最終原文與基準逐字相同 |
| 舊英文與收藏 | 20筆新／本次舊／更早alias全部回相同ID；Markdown保持公開原文，結構化A／B優先；1440組serialize往返不改舊公開輸出 |
| 前端全套 | tests.log，2059/2059；最後只新增測試的process import，聚焦4/4與lint重跑通過 |
| Prompt品質 | quality.log，853/853 |
| Python與目錄工具 | python.log，52/52；catalog-tools.log，32/32 |
| schema／同步／歷史ID | sync-check.log、catalog.log：1050現行／歷史ID、8生成物，strict通過 |
| lint／build／正式初始化 | lint-final.log、build.log、bundle.log通過；既有大型chunk提示保留 |
| 同seed稽核 | audit-before.log／audit-after.log，200筆prompt-quality-baseline、0 blocker；17筆既有診斷案例保持，僅胸上平均詞數283.3→283.2，其餘報告文字一致 |
| 資產 | assets.log，207檔通過 |
| 歷史基準保護 | protection.log，2535原報告／registry／核心renderer檔位元組相同；新基準SHA見該檔 |
| 其他工作目錄 | other-worktrees-protection.json：20個工作目錄、140份既有未提交檔之狀態與SHA保持 |
| 桌手機 | browser/results.json，1440×1000／390×900，各20筆選值、六輸出、空搜尋／Escape、儲存及舊卡套用通過 |
| 工作區 | workspaces/results.json，1440×1000／390×1000，現行六工作區共12項通過，無console／page error、壞圖或意外document溢位 |

## 審閱與調整紀錄

初步三筆重複名詞候選經固定基準比較後，只保留泳裝一筆修正。皮革馬甲移除corset造成264個輸出欄位比較差異，開扣襯衫包臀裙移除skirt造成120個差異；數字非案例數。已撤回兩個候選，記錄於review，並用獨立自訂目錄重現兩個代表反例。未擴修renderer、放寬比較或重錄基準來接受額外差異。

最初基準前置斷言誤要求臉部裁切保留套裝選值，於正式資料修改前修正為全身案例檢查，近景保留既有隱藏行為；baseline-record.log保留此失敗，before.json.gz只在成功時首次建立。初次聚焦的Markdown案例缺AI區段，已補正完整格式；歷史patch產生初次誤用Markdown檔名，修正為wardrobe_and_styling.md；初次lint缺Node process import已補齊。中間紀錄保留，最終結果以focused-delivery／lint-final為準。

## 歷史回放

新入口 `node scripts/c2_outfit_history.mjs /tmp/c2-outfit-history` 只在隔離副本精確還原本批五個非文件變更檔，先跑原腰鍊360組，再接原腰鍊歷史鏈至C3／C4／B3／PAGE2／Phase4／A2／A1／A5。原patches、斷言及封存不變；必要的既有DLL背景還原沿用原工具，正式DLL檔不改。

首次history.log因工作階段中斷停止，未視為整鏈通過；重跑後完整歷史鏈通過，見history-resumed.log及history/。本次回放產生56份證據，原始路徑、位元組數及SHA見history/artifact-index.json；log採無損gzip存放，不改寫原封存。前批腰鍊360組及其90組補充回歸亦通過。

## 瀏覽器限制與保留界線

隔離Chromium使用本機正式build，沒有操作使用者Chrome收藏、沒有付費生圖。桌手機畫面已目視檢查。套裝圖片面板這次全部直接點選，未使用程式化change fallback；這不代表前批原生下拉popup限制被修復，既有紀錄保持。手機「關閉」按鈕沿用既有兩行排版，可操作，本批未改UI。

舊卡儲存原文、日期、ID及原有選值保持；重載時既有程式補入的10個預設欄位如實記錄在browser/results.json。重新生成使用新版來源，不能宣稱模型圖像效果已驗收。本次5175預覽服務已停止。

## 重跑

Node22、既有node_modules；根目錄指定 `REGISTRY_BASE_COMMIT=043418f9c169e2e5848d23aaae15c1a32e34588f`。

- `node --test webapp/src/lib/engine/c2OutfitTails.test.js`
- `node scripts/c2_outfit_acceptance.mjs`（不得再次--record）
- `node scripts/c2_outfit_projection_review.mjs`
- `node scripts/c2_outfit_history.mjs /tmp/c2-outfit-history`
- `python3 scripts/c2_outfit_protection.py`
- 同步、Python、catalog strict／三組目錄工具及public assets；webapp的test／test:prompt-quality／lint／build／audit:prompts:strict；根目錄check_prompt_bundle。
- 啟動5175正式preview，PLAYWRIGHT_MODULE指向既有Playwright，執行scripts/c2_outfit_browser.mjs及scripts/check_production_browser.mjs。

場景／光學、其他C類、PAGE2舊匯入、J12與P5b未併入。

交付檢查：原始驗收log保留工具輸出的尾端空白與空行，不為通過空白檢查改寫證據；程式、資料與文件的staged diff --check另行通過。
