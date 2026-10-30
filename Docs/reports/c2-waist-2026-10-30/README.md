# C2 五筆腰鍊：兩筆微調、三筆保留

基準為本機及遠端 main `2b60e6f605792b0e8c82a8573358105ce51e87e2`。本機完整驗收通過，Cooper已驗收並授權限定提交／推送。以下為提交前驗收證據；CI與部署結果於交付時另行核對。正式產品改動限兩筆腰鍊 en／舊英文 alias 及其 schema／欄位映射和生成物；三筆整筆保留，腰部來源診斷下限4→6。英文細節、逐筆理由及詞數見 [規格](../../specs/c2-waist-wording-v1.md) 與 [決策](../../decisions/2026-10-30-c2-waist.md)。

## 核准差異

- 雙層銀鏈水晶腰鍊29→27詞；金色細鏈鑽石腰鍊25→22詞。只刪重複泛稱、調整句法，保留層數／材質／色彩／吊飾與腰臀落點；完整舊英文新增為 alias。
- 雙層銀鏈愛心30詞、愛心垂墜銀腰鍊36詞、銀色水鑽蝴蝶腰鍊32詞原樣保留，加入指紋綁定的 necessary_structure 記錄。原七筆例外保持，總數10。
- 全部仍 over。全庫來源診斷為659 within／71 over／22 under／106 unclassified；範圍不是刪字指令。沒有變更任何 ID／排序／中文／圖片／semantic／renderer／舊收藏原文。

## 證據

| 項目 | 結果／證據 |
| --- | --- |
| 360組修改前封存 | before.json.gz；acceptance 執行只允許兩筆完整英文及既有句首大寫替換，選值、RNG、正規化與舊收藏原文相同 |
| 90組補充對照 | c2-visible-final.log；60組明確配色×六代表景別（含牛仔／全身）與30組A／B×中景／牛仔／全身；斷言色系實際套用，與360組合計450 |
| 聚焦護欄 | c2-visible-final.log，6/6；整筆保留、舊／新英文、Markdown、結構化A／B與收藏優先權、固定Git反轉、八檔歷史背景隔離 |
| 全部前端 | tests-delivery.log，2,055/2,055；最後新增可見景別由c2-visible-final.log的6/6護欄覆蓋 |
| Prompt品質 | quality.log，853/853 |
| Python | python-final.log，52/52；5／6／16／17詞邊界及失效例外 |
| schema／同步／ID | sync-check.log，1,050現行／歷史ID、8生成物；catalog.log strict通過，原allowlist診斷保持 |
| 目錄工具 | catalog-tools-final.log，32/32 |
| lint／build／打包初始化 | lint-delivery.log、build.log、bundle.log；33角色正常初始化；build既有大chunk提示保留 |
| 同seed診斷 | audit-before.log／audit-after.log，200筆同seed、0 blocker；原17筆有診斷，未新增。只有平均詞數減少：GPT479.9→479.7、Z332.9→332.8、全身角色251.2→251.1 |
| 資產 | assets.log，207檔 |
| 歷史來源保護 | protection.json，2,406檔原報告／registry／核心renderer全等；本批反轉前後SHA與固定Git吻合 |
| 瀏覽器 | browser-standard/results.json、workspaces/results.json；詳下節 |

360組原第二情境命名為color，但當時未設到有效色系欄位。沒有重錄基準；改名default-second-seed，如實視為另一組固定seed預設情境，另外補60組明確配色及30組雙人可見腰部，避免誇大涵蓋範圍。

## 歷史回放

`node scripts/c2_waist_history.mjs /tmp/c2-waist-history` 先在隔離副本精確反轉本批，再執行原C3的624、C4的216／558／90生成案例與1,098還原案例，以及B3／PAGE2／Phase 4／胸上／A2／A1／A5鏈。所有原基準與歷史斷言保持。

初次B3及胸上歷史工具停在既有DLL全檔保護，對比來源證明與本次腰鍊無關。最新main `be18a875`的GPT Image 2及`84749c3f`的Pika對舊檔造成背景差異；`c2WaistHistoryContext`只在暫存副本依固定提交與雙指紋還原八檔。沒有編輯正式DLL檔，也沒有放寬舊斷言；原VideoWorkspace沿用既有Pika inverse。未知來源及正式checkout拒絕，先核對全部檔案再套用。

最終完整歷史鏈已通過，見 history-complete2.log 與 history/ 目錄。artifact-index.json 記錄所有本次回放產物的路徑、大小與 SHA256；這些是新產物，原封存未被重寫。先前history.log／history-final.log／history-complete.log保留定位過程；不能以中間失敗或尚未跑完的檔尾當成最終通過。

## 瀏覽器與限制

本機正式build preview，隔離Chromium；1440×1000及390×900，另補390×1000。各尺寸逐一選五筆，核對六輸出及來源英文、新增收藏與舊收藏套用。舊卡公開文字、ID、日期及既有選值保持；UI重載會補12個既有預設選值，完整記錄於results，這不是本批資料改寫。六工作區桌手機12項smoke通過，無console／page error／意外document溢位／壞圖。

已目視檢查桌面與手機選值區畫面。原生下拉部分選項需程式化change事件fallback，先確認control／option未停用，結果與實際儲存選值一致；未宣稱原生popup直接滑鼠操作通過。這是文字／流程驗收，未付費出圖，不宣稱模型影像品質等價。測試未操作真實Chrome收藏；本次5175預覽服務已停止。

## 重跑入口

使用Node22與既有node_modules，根目錄選定 `REGISTRY_BASE_COMMIT=2b60e6f605792b0e8c82a8573358105ce51e87e2`。

- `node scripts/c2_waist_acceptance.mjs`；不要再傳--record。
- `node --test webapp/src/lib/engine/c2WaistWording.test.js`
- `python3 scripts/c2_waist_protection.py`、`python3 scripts/check_authoring_lengths.py`
- `python3 scripts/sync_to_json.py --check`、`python3 -m unittest discover -s scripts/tests`
- webapp：`npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`、`npm run audit:prompts:strict`
- 根目錄：`node scripts/check_catalog_integrity.mjs --strict`、既有三組catalog工具test、`python3 scripts/check_public_assets.py`、`node scripts/check_prompt_bundle.mjs`
- 啟動5175正式preview後，`PLAYWRIGHT_MODULE`指向既有Playwright；執行 `node scripts/c2_waist_browser.mjs /tmp/c2-waist-browser` 及 `scripts/check_production_browser.mjs`。

中間focused／tests-initial的配色前置及舊句序斷言已修正；browser初次使用錯誤壓縮ID欄位及忽略既有預設值補齊，最終browser-standard為準。catalog-tools初次缺少REGISTRY_BASE_COMMIT，最終32/32。保留失敗紀錄以便追溯，不重寫舊證據。

其他C類、PAGE2舊匯入、J12、P5b未併入。這是本機驗收交付；CI／部署未觸發。

提交前格式檢查：原始終端log保留工具輸出的行尾空白，不正規化或改寫；非log程式／資料／文件的staged diff-check通過。瀏覽器限制紀錄與歷史產物指紋原樣保留。
