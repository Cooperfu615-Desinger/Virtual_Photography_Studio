# 主 Midjourney 自然精簡輸出 v1

> **2026-10-14 更新：** `chest-up-mj-portrait`（MJ 胸上特寫照）已依 Cooper 決定完全移除，引擎不再產生、畫面與 DLL 來源不再顯示，F 區參數只作用於主 MJ；既有 Saved Cards 資料保留不改寫。見 [官方規範修正 v1](prompt-official-fixes-v1.md)。本文中關於 MJ 胸上的段落僅供歷史參考。

日期：2026-10-11。範圍：使用者核准僅更換 PAGE1 主 `midjourneyPrompt`。驗證完成後已另行授權 commit／push；不手動部署。

## 核准補充：保留原長度並加入體態簡述

使用者確認取消對話中的 CRT 極短測試版，維持原先已實作的段落結構與描述長度規則；另核准下表六種 Body Type 簡易描述。已套用至主 MJ 產生器及機器可讀契約；僅本機修改，未部署。最末的體態補充完成紀錄與先前自然段落改版驗證分開記載。

### 長度與場景／光線／成像

- 取消把場景與光線壓成一句、風格與成像再壓成一句的文字測試方案；該方案從未寫入程式，無須回退 renderer。
- 維持最多四段自然英文及原有場景、光線、風格、鏡頭、底片／濾鏡的描述強度。CRT 保留原實際輸出的電視與復古螢幕組合、雜訊／掃描線、白棚環境與柔和順光，以及蜷川色彩層次與跨沖霓虹成像細節。
- 不新增更低字數目標或硬性裁字。原 `aiPromptLengthContract.js` 的 normal 110／130、completeLook 115／130、characterCard 150／170、duo 160／180（目標／軟上限）仍僅供診斷，不是必須刪除描述以符合的輸出限制。

### 六種體態核准文字

| 既有體態選項 | 繁體中文對照 | 主 MJ 英文描述 |
| --- | --- | --- |
| 高挑時裝模特 | 身形高挑纖長，雙腿修長，整體比例勻稱優雅。 | A tall, slender figure with long legs and elegant, balanced proportions. |
| 柔和沙漏身形 | 身形柔和勻稱，腰線自然收束，曲線圓潤流暢。 | A soft, balanced hourglass figure with a gently defined waist and naturally rounded curves. |
| 性感曲線身形 | 身體曲線鮮明，腰肢纖細，雙腿修長，整體線條優美。 | A well-defined curvy figure with a slender waist, long legs and graceful lines. |
| 運動緊實身形 | 身形精實勻稱，腰腹緊緻，四肢線條自然有力。 | A lean, toned figure with a firm waist and naturally athletic limbs. |
| 小隻精緻身形 | 身形嬌小纖細，比例勻稱，整體線條輕盈柔和。 | A petite, slender figure with balanced proportions and soft, delicate lines. |
| 豐胸纖腰沙漏身形 | 身材豐滿勻稱，腰肢纖細，身體曲線自然優美。 | A full, well-proportioned figure with a slender waist and naturally graceful curves. |
| 全無 | 不輸出體態描述。 | 不加入英文體態句。 |

### 套用邊界

- 只調整主 `midjourneyPrompt`：將已生效的獨立 Body Type 對應為上表短句，放入人物段落一次；不讀取未生效或被角色模式取代的潛在體態選值。其他五種輸出維持現行行為。
- 雙人使用各自有效的 A/B 體態，維持人物歸屬；可調整主詞連接語法，描述內容不擴寫。A/B 相同體態合併為一句 `Both women have ...`，不同體態使用 first／second woman 分別描述。「全無」保持安靜，不補預設體態。
- 使用核准的整體身形、腰線與比例描述，仍不加入罩杯、身高數字、三圍、布料擠壓或皮膚受力描述。穿搭仍只留可見單品名稱，姿勢及身體位置的幾何來源不改寫。
- 本表定義六個獨立目錄選項，不將 Character Card body、自由文字身份或特殊主體自動歸類到其中一種；這些來源的現行政策不在本輪擴充。
- 原始目錄英文、ID、順序、選值、structured、summary、Saved Cards 與 storage 不改。英文作主 MJ 輸出，繁體中文僅作規則對照。
- 實作時新增六種體態／全無、雙人 A/B、CRT 與模式排除案例；以同一 seed 核對場景／光線／成像文字及其他五種輸出未改，再執行專案要求的 prompt、完整前端、strict audit 與瀏覽器驗證。不得沿用下方先前完成紀錄宣稱本次體態簡述已驗證。

## 現行已實作規則

由原本共用解析結果建立主 MJ 專用文字投影，不更動選項解析、隨機選擇、資料庫、角色資料或儲存格式。

1. 英文自然敘述，最多四個非空段落：影像類型／構圖／人物／姿勢；可見穿搭名稱；場景與光線；風格與成像。無區段標籤，空段省略。
2. 有效獨立 Body Type 及雙人 A/B 體態使用上表六種短句，各人物只描述一次；「全無」不補預設體態。角色卡 body 及舊混合身份來源中的體態、罩杯、身高與三圍子句仍省略，不將自由文字或特殊主體自動套入六種體態。保留成年身份、臉部、膚質、髮型、表情；角色卡四個永久身份錨點保留。姿勢中的腰、臀或身體位置屬於幾何描述，不能對成品全文套用身體詞刪除。
3. 服裝、鞋襪與配件只列單品名稱，省略獨立配色／圖案／版型／腰線／穿法／開合／布料受力等細節。品名必要的材質、款式與品牌型號可保留，例如 lace-top thigh-high stockings、Dr. Martens 1460 Round Toe Lace-Up Boots。
4. 一般目錄使用穩定 ID 對應的短名稱；33 張角色卡使用既有 layer 對應的經檢閱名稱。完整造型、特殊主體及未對應的匯入來源，只從有效英文來源擷取已知單品名詞，不以整段長文回補，也不臆造來源沒有的衣物。後續新增目錄／角色層須同步維護短名稱及案例；未知自由文字不保證完整辨認。
5. 沿用有效景別可見性、閉合外套遮蔽、完整造型優先權與角色層選擇。隱藏鞋款不能為了保留選值重新塞入近景；全身景別恢復可見鞋款。雙人各自穿搭維持 A/B 歸屬，相同名稱可寫成 Both wear。
6. 既有 composition 與 projected canonical pose 保留；不重寫支撐物、接觸面、自拍來源、人物相對位置或固定場景幾何。
7. 場景與光線沿用既有主 MJ 核心壓縮；風格、底片／濾鏡重新使用已選來源的精簡描述，鏡頭、光圈、快門及光學效果沿用既有適用政策。不得為追求短字數刪掉選中的核心單品、姿勢或身份錨點。
8. MJ 參數尾綴仍由原組裝器負責，版本、比例、Raw、Stylize、Chaos、Weirdness、解析度與順序均維持既有選值；不自行增加負面指令、比例、風格或個人化參數。英文以外的對照文不是新介面輸出。

## 適用及隔離

適用主 MJ 的一般單人、上下身單件、連身、套裝、特殊穿搭、角色卡／匯入、雙人、特殊主體及固定構圖。

其他五個輸出逐字保持：主 GPT、主 Grok/Z-Image、GPT 胸上、MJ 胸上、全身角色照。MJ 胸上繼續使用原 `renderAiPrompt`、同狀態投影及其參數政策，不繼承新的主 MJ 體態／穿搭／成像精簡規則。其他工作區 AI 輸出也維持原狀。

既有 public mappings、按鈕標籤、選項 ID、原英文、summary、structured、Character Card `identityAndBody`、Saved Cards、匯入還原及 storage keys 不改。已儲存的舊文字不批次重寫；套用結構化選值後重新生成主 MJ 時使用新版。精簡的純 MJ 文字不提供體態短句反向解析，亦無法反推已省略的配色，結構化 Saved Cards 才能完整還原。

## 實作位置

- `webapp/src/lib/engine.js`：主 MJ 專用 subject／wardrobe／paragraph 組裝，只有主 `midjourneyPrompt` 呼叫改用新 renderer。
- `webapp/src/lib/engine/midjourneyNaturalPrompt.js`：文字與單品名稱工具。
- `webapp/src/lib/engine/midjourneyBodyDescriptions.js`：六個穩定 Body Type ID 的核准短句，僅主 MJ 讀取。
- `webapp/src/lib/engine/midjourneyItemNames.js`、`midjourneyCardItemNames.js`：主 MJ 名稱投影，原始目錄保持不變。
- `midjourneyDescriptionContract.js`、`aiPromptLengthContract.js`、`promptOutputContracts.js`：新版主 MJ 契約；歷史字數門檻僅供診斷。
- `midjourneyNaturalPrompt.test.js`、`midjourneyNaturalFixtures.js`：CRT、名稱表及 986 組模式／選值／其他輸出隔離案例。

## 驗證方法

- 修改前先擷取 986 組固定 seed 的其他輸出、selection、structured、summary 雜湊。修改後逐欄核對，基準不可由新版程式重新產生。
- 歷史跨輸出合併雜湊以修改前引擎重新擷取「排除主 MJ」的保護基準；原歷史資料保留，主 MJ 另立新版文字基準。只調整主 MJ 相關預期，其他版本的細節斷言保留。
- 體態補充使用修改前的 `midjourneyBodyPreservationBaseline.json`：986 組主 MJ 移除新增核准體態句後，全文雜湊必須與前版相同；保護場景／光線／成像、姿勢、穿搭及尾綴。
- CRT 摘要檢查體態短句僅一次、fit／rise 省略、三件可見服裝名稱、雀斑／柔波瀏海／黑髮、CRT 電視牆／白棚光／柔和順光、蜷川色彩／跨沖霓虹，以及 cowboy 隱藏鞋款／全身恢復鞋款。
- 完整前端測試、Prompt Quality、lint、build；strict audit 固定 200 組與 `prompt-quality-baseline` seed，對照修改前 0 阻擋／22 既有診斷。
- 瀏覽器 1440×1000 與 390×900：六個現用工作區導航與版面、CRT 主 MJ 預覽／複製、Saved Card 儲存／套用，檢查所有其他輸出、錯誤、破圖及橫向溢位。

本機字串與瀏覽器驗證不代表外部 Midjourney 已接受 Prompt；本次不提交真實生圖。


## 先前自然段落改版本機完成紀錄（體態補充前）

2026-10-11，使用 Node 22.22.3 完成；修改留在本機 `main`，未 stage／commit／push／deploy。

| 項目 | 結果 |
| --- | --- |
| 新版 focused cases | 6/6，內含 986 組固定案例的其他五輸出及資料逐欄雜湊比對 |
| 完整前端測試 | 1,523/1,523 |
| Prompt Quality | 680/680 |
| lint／build／diff-check | 通過；保留既有 Vite 大型 chunk 提示 |
| strict audit | 同 seed 200 組，前後皆 0 blockers／22 項既有診斷 |
| 瀏覽器 | 1440×1000、390×900，18 項檢查通過 |

瀏覽器涵蓋 CRT 新格式與 MJ 胸上隔離、主 MJ 實際複製、切換體態後主 MJ 不變、收藏及套用後六組文字完全還原，以及 Prompt 工作台、角色建模、動作姿勢、場景建模、觀察式抓拍、Saved Cards 的桌面／手機呈現。無 console error、page error、失敗圖片或橫向頁面溢位；已逐張檢視截圖。驗證使用隔離的瀏覽器儲存空間。

證據位於 `/tmp/vps-mj-natural-browser/results.json`，CRT 截圖為 `/tmp/vps-mj-natural-browser/desktop-CRT.png` 與 `/tmp/vps-mj-natural-browser/mobile-CRT.png`；測試紀錄為 `/tmp/vps-mj-suite-delivery.log`、`/tmp/vps-mj-quality-delivery.log`、`/tmp/vps-mj-audit-delivery.log`、`/tmp/vps-mj-lint-delivery.log` 與 `/tmp/vps-mj-build-delivery.log`。這些是本機暫存驗證產物，未納入 Git。


## 體態簡述補充完成紀錄

2026-10-11，Node 22.22.3；僅主 `midjourneyPrompt` 增加六種核准體態短句，保留原場景／光線／成像長度。Public contract `1.54.0`，MJ description／AI length `2.1.0`。未 stage／commit／push／deploy。

- focused 9/9：六種體態與全無 × 五種景別、49 組雙人體態組合、全目錄角色卡／特殊主體／特殊穿搭／套裝／固定構圖、自訂身份排除及 CRT 案例。
- 986 組修改前主 MJ 基準：移除新增核准體態句後全文相同；其他五種輸出、selection、structured、summary 逐欄雜湊仍通過原保護基準。新增體態不消耗隨機選擇。
- 完整前端 1,526/1,526、Prompt Quality 683/683、lint／build／diff-check 通過。保留既有 Vite 大型 chunk 提示。
- strict audit 同 seed `prompt-quality-baseline`、200 組前後皆 0 blockers／22 項既有診斷；報告差異僅主 AI 新增短句造成的字數變化。
- 瀏覽器 1440×1000 與 390×900，24 項檢查通過：六種體態與全無切換、CRT 主 MJ 複製、MJ 胸上既有來源保留、GPT 三組輸出不受體態切換影響、Saved Card 還原六組文字及體態 ID、六個現用工作區呈現。14 張截圖已檢視，無 console/page error、破圖或頁面橫向溢位。使用隔離儲存空間。

本輪修改位置為 `engine.js`、新增 `midjourneyBodyDescriptions.js`、`midjourneyNaturalPrompt.test.js` 及新增 `midjourneyBodyPreservationBaseline.json`；同步主 MJ 字串基準、三份機器契約及其版本斷言與三份規範文件。原目錄、角色卡、UI 及其他輸出 renderer 未修改。

證據：`/tmp/vps-mj-body-focused.log`、`/tmp/vps-mj-body-suite.log`、`/tmp/vps-mj-body-quality.log`、`/tmp/vps-mj-body-audit-before.log`、`/tmp/vps-mj-body-audit-after.log`、`/tmp/vps-mj-body-lint.log`、`/tmp/vps-mj-body-build.log`；瀏覽器 `/tmp/vps-mj-body-browser/results.json` 與同目錄桌面／手機截圖；實際 CRT `/tmp/vps-mj-body-CRT.txt`。以上暫存產物未納入 Git。未送出真實外部生圖。

## Git 交付授權

使用者確認體態簡述及 CRT 實際輸出後，已授權提交並推送本批主 MJ 自然段落、單品名稱、六種體態簡述及對應測試／文件。上方未提交註記是驗證當下的歷史狀態；最終提交與遠端 SHA 以 Git 核對為準。Firebase／Krea 部署文件及參考素材不納入本批。
