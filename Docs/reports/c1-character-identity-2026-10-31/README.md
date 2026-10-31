# C1 第一批：Natsuki／Miku 身份錨點補強驗收

日期：2026-10-31。基準 main：`de1433351605d140d618e4e9ab81a9566733bc10`；實作前及結束前遠端 main 讀回相同。狀態：本機功能、完整檢查、瀏覽器與歷史回放通過，使用者已授權限定提交／推送本批；新CI與部署於交付時核對。

## 本批結果與界線

正式內容只改 `characterProfiles.js` 的兩個永久身份錨點：Natsuki 第一錨點補入同卡已有的 `smooth tapered jaw`；Miku 第二錨點對齊原有稍寬眼距，補入 `soft lower-lid fullness`。兩者都來自原完整五官欄位，未新造身份特徵。

33卡的完整五官與皮膚欄位、四錨點數量／排列、ID、中文、option.en、legacyIdentityAndBody／identityAndBody、髮型／穿搭圖層、圖片與renderer保持。其餘31卡、Natsuki／Miku及Rika／Yuri兩組共用膚質保留。PAGE2舊匯入、J12、C6與P5b未併入，艾爾莎隨機政策不變。

舊收藏公開原文、複製、Markdown與ZIP保持；依原ID重新生成則使用目前身份錨點。未呼叫生成模型，不宣稱本批已證明生圖辨識提升。先前0.757是五個完整欄位的文字相似度，這些欄位未改，不能以數值下降或文字不同代表生成結果已穩定區分。

## 驗收結果

| 門檻 | 結果 | 證據 |
| --- | --- | --- |
| 修改前基準 | PAGE1 1,004組、PAGE2 219組、10筆舊收藏；以原Git產品來源建立，禁止覆寫 | before.json.gz、record-final.log.gz |
| 獨立預期 | PAGE1 192組、PAGE2 126組出現核准片段替換；其餘逐物件相同，選值與RNG呼叫數保持 | acceptance.log.gz |
| 身份持續護欄 | 33卡、逐個PAGE2輸出的四錨點、兩卡所有相容髮型／眼鏡／圖層、原身份相容字段通過 | focused-latest.log.gz |
| 穿搭共用來源 | 當前33卡／134圖層（118共用、16審閱差異）仍符合原契約 | focused-latest.log.gz |
| 舊收藏相容 | 10筆JSON、Markdown、ZIP原文保持；PAGE1原選值還原、PAGE2舊bundle儲存／匯出保持 | acceptance.log.gz |
| 聚焦測試 | C1、B3必要接點、C7整合與反轉共14/14 | focused-latest.log.gz |
| 前端／Prompt品質 | 2,089/2,089、853/853通過 | tests-final.log.gz、gates/rerun/quality.log.gz |
| Python／目錄工具／Functions | 59/59、32/32、119/119通過 | gates/initial/python.log.gz、tools.log.gz、gates/initial/functions-tests.log.gz |
| lint／build／正式bundle | 前端及Functions lint、正式build、bundle初始化通過；既有大chunk提醒保留 | lint-final.log.gz、gates/initial/ |
| 同seed strict | 200筆、0 blocker；與修改前報告逐位元一致，17份Prompt的18個既有診斷保持 | audit-before.log.gz、gates/initial/audit-after.log.gz |
| 正式資料檢查 | 唯讀sync、1,050歷史ID、8生成物、catalog strict與207資產通過 | gates/initial/sync.log.gz、catalog.log.gz、assets.log.gz |
| 完整歷史回放 | C7／C2／C3／C4／B3／PAGE2／Phase4／A2／A1／A5通過，舊基準不重錄 | history-final.log.gz、history/ |
| 桌機及手機 | 各38項流程檢查、14卡ZIP（10舊＋4新）、六個工作區通過 | browser/results.json、browser/ |

同seed稽核涵蓋13一般單人、13雙人、174固定構圖；角色卡細部覆蓋由本批1,223組固定矩陣與逐輸出測試負責，不將一般稽核誤稱為角色生圖驗證。舊收藏測試只用隔離測試儲存，未存取使用者Chrome資料。

## 基準、歷史接點與初次失敗紀錄

`--record`先驗證HEAD及所有已追蹤webapp/src的Git blob，並檢查基準不存在，才記錄修改前結果。獨立預期只套用審閱清單的兩個精確片段，不使用修改後引擎重錄預期。Natsuki／Miku結構差異測試在舊來源先確認失敗，再於修改後通過（red-contrast.log.gz）。完整初次紅燈測試也含當時尚未成立的反轉狀態，不將全部失敗都稱為預期產品缺陷。

舊B3全角色物件及C7全控制項的封存斷言涵蓋身份全文，因此只將相關歷史斷言放回可信Git的隔離副本執行。測試正文與舊基準保留；當前身份、穿搭與輸出由新護欄及基準驗證。C7外層回放先套用C1精確反轉，B3接點改檢查已準備的暫存前像。四份必要接點保存原Git正文及前後SHA。反轉工具拒絕正式checkout、symlink、未知／混合／缺失來源，並確認重複執行與Git原文一致。

初次基準建立遇到Git大量封存輸出超過緩衝區，改以blob SHA核對；另一初次失敗是舊Markdown期望未先經既有儲存正規化，改以當時原codec序列化往返建立。兩次均未產生封存檔，成功封存後未重錄。初次lint補上測試所需Buffer匯入；完整測試與歷史鏈在接點補齊前曾失敗，後以同一正式兩處修改重跑通過。初次結果保留於root失敗log及gates/initial、gates/rerun；目前有效結果以gates/results.json及acceptance-summary.json為準。

瀏覽器工具初次修正了動態圖層locator、儲存後工作區切換與Saved Cards延遲寫入等待。早期完成紀錄在寫入完成前讀到12卡，最終工具明確等待每次保存，驗證14卡與全部新卡錨點後才通過。沒有因此修改產品收藏邏輯。

## 瀏覽器與視覺限制

正式build預覽於 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，桌面1440×1000、手機390×900。兩卡的相容髮型、三種眼鏡狀態、純人物／單圖層、六種複製、PAGE1匯回與六輸出、PAGE2狀態保留、新舊收藏及ZIP均檢查。舊PAGE1另用乾淨環境套回原選值，確認新生成採當前錨點但已存原文保持。

六個現行工作區為Prompt工作台、角色建模、場景建模、DLL_PIC Pro、DLL_VIDEO Pro、Saved Cards；兩尺寸共12項smoke。沒有新增console／page error、破圖或非預期頁面溢出，已人工檢視桌手機角色、PAGE1與收藏截圖，保留輸出框及面板內既有捲動。這些檢查未驗證原生下拉popup滑鼠互動，不補記前批限制為已通過。

六份原始角色圖片已在C1分析逐張核對，其SHA見reference-review.json；圖片未改。本輪未生圖，實際角色辨識品質仍待另外授權，以固定模型／參數、多seed、正面／45度與共同中性光線作對照。

## 保護與後續

原4,861份追蹤檔只修改8個必要既有檔，其餘4,853份逐位元保持，包含3,168份歷史報告。其他20個現有工作目錄的140份未提交檔與Git狀態保持；另1個登記但不存在的目錄未清理。封存索引與檢查見protection.json、source-manifest.json、raw-artifacts.json、final-check.json。

使用者指定專案入口仍位於另一個已有未提交內容的工作目錄；本批沿用承接最新main的moss-optional-lora工作目錄，沒有搬移或覆寫其他工作。使用者已授權限定提交／推送本批，CI與部署於交付時另行核對。本批文字與相容性實作完成不等於C1生圖品質已結案；C6仍另批，PAGE2舊匯入、J12與P5b持續暫緩。

`acceptance-summary.json`、`protection.json`、`source-manifest.json`、`raw-artifacts.json`與`final-check.json`保留為提交前原始驗收快照，其狀態與雜湊不追寫交付結果。本輪僅更新本報告、規格、決策與current-state四份文件的交付狀態；程式、基準、測試結果與瀏覽器限制不變。

見[規格](../../specs/c1-character-identity-v1.md)、[決策](../../decisions/2026-10-31-c1-character-identity.md)與[原角色身份規格](../../specs/character-card-facial-identity.md)。

## 重跑方式

使用既有Node22與依賴，根目錄設定 `REGISTRY_BASE_COMMIT=de1433351605d140d618e4e9ab81a9566733bc10`。

- `node scripts/c1_identity_acceptance.mjs`。基準已封存，不再執行`--record`。
- `node --test webapp/src/lib/c1Identity.test.js webapp/src/lib/characterWardrobeSources.test.js webapp/src/lib/engine/c7CapturePairing.test.js`。
- `node scripts/c1_identity_history.mjs /tmp/c1-identity-history-rerun`。
- webapp：`npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`；Functions：`npm test`、`npm run lint`。
- 其餘strict／sync／Python／目錄工具／assets／bundle完整命令見gates/results.json。
- 5175啟動正式build預覽，設定`PLAYWRIGHT_MODULE`指向既有Playwright，執行`node scripts/c1_identity_browser.mjs /tmp/c1-identity-browser-rerun`；工具使用隔離browser context且不呼叫模型生成。
