# C1 Natsuki／Miku 身份對比與最小錨點補強 v1

> 2026-10-31 整體收尾核對：C1 本輪核准範圍已交付，最後一批 `bfa5311d` 的 [CI／部署](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/41191250250) 四作業成功。現行處置、保留理由與驗收限制見 [C 類結案總表](c-class-closeout-v1.md)。下文保留該批原規格及當時狀態；「未提交／未開始」等歷史文字由總表接續，不改原契約或驗收證據。

日期：2026-10-31。基準 main：`de1433351605d140d618e4e9ab81a9566733bc10`。
狀態：本機驗收通過，使用者已授權限定 commit／push；結果見[本批報告](../reports/c1-character-identity-2026-10-31/README.md)。CI與部署於交付時另行核對，生圖及瀏覽器限制保持。

## 目的與界線

把兩張正式角色已有、可由原圖核對的結構資訊帶入精簡輸出共同使用的四個永久身份錨點。不重設角色身份，也不以文字相似度下降作為成功條件。正式來源仍為 `webapp/src/lib/engine/characterProfiles.js`；測試審閱清單不是第二份產品資料來源。

只修改兩張卡各一個 `distinctiveFeatures` 片段，四錨點數量與排列保持。完整五官欄位、皮膚、妝容、身形、髮型、穿搭／圖層、photographicDirection、option.en、身份相容原文、ID、名稱、排序、參考圖片與 renderer 全部保留。C6、PAGE2 舊 Markdown／ZIP 匯入、J12、P5b 均不併入；艾爾莎隨機政策保持。

## 逐筆決策與來源

| ID／欄位 | 修改前錨點 | 修改後錨點 | 已存在的依據 |
| --- | --- | --- | --- |
| `character-natsuki`／第一錨點 | compact oval face with gently rounded cheeks | compact oval face with gently rounded cheeks and a smooth tapered jaw | 同卡 facialGeometry 的 smooth tapered jaw；圓下巴及既有眼鼻唇描述保留 |
| `character-miku`／第二錨點 | large wide-set dark-brown round-almond eyes | large slightly wide-set dark-brown round-almond eyes with soft lower-lid fullness | 同卡 eyeSignature 的 set slightly wide、soft lower-lid fullness；避免將 slightly 放大成更極端眼距 |

Natsuki 三份原圖位於 `source-assets/character-cards/natsuki/18_Natsuki_00.jpeg`、`18_Natsuki_01.png`、`18_Natsuki_02.png`；Miku 對應 `source-assets/character-cards/miku/36_Miku_00.jpeg`、`36_Miku_01.png`、`36_Miku_02.png`。已核對全部六份，四視角頁供幾何核對；場景／全身圖的光線、妝容、視角與遮擋不當作新永久身份。來源 SHA 記錄於本批報告，圖片本身不改。

## 保留理由與舊盤點判定

- 33 卡、528 配對的五個完整欄位 TF-IDF 指標，Natsuki／Miku 仍為 0.757。五個欄位不改，數值不應變動；這是文字近似而非生成圖片撞臉機率。
- 兩卡鼻型共通，neat／tidy 換字不是實質區分；鼻型保留。
- Natsuki 的 even lower lip 與 Miku 的 fuller lower lip 已有差異，保留，不以唇色或髮型代替身份。
- Natsuki／Miku 與 Rika／Yuri 的相同 skinSignature 均保留。不同角色可以有相同膚質；Rika／Yuri 已有臉型、眼型與臉頰痣等差別，不新造膚色、雀斑或痣。
- 其餘 31 卡保持。Amy／Natsuki、48_G／Yui、Emily／Bora、Philippa／Ji-Yoo 等具體眼距、眼瞼、下顎或唇形差異足供本批保留；整體分布與多樣性歸 C6。
- [2026-10-11 歷史盤點](../reports/database-analysis-2026-10-11/README.md)中的「幾乎是同一張臉」超出文字證據可支持範圍。本次補充判定為「文字高度接近，有既有結構差異可更清楚呈現；實際生成辨識尚未驗證」。歷史原件不改寫。
- 原有 13 組對比測試有正則與 notEqual 檢查，但不含 Natsuki／Miku。本批補這組的具體結構斷言，並逐一驗證六種 PAGE2 輸出，不能把六份串接後只找到一次視為完整覆蓋。

## 輸出與相容契約

PAGE1 的四主與胸上／全身輸出、PAGE2 六輸出若使用兩張卡，都可出現核准錨點替換。完整五官欄位不改；Z／AI 的同源四錨點直接得到補強。PAGE2 AI／Headshot／Four-View／Full-Body 仍使用舊 identityAndBody 加錨點，新句只是既有資訊補強，不與舊句矛盾。

`identityAndBody === legacyIdentityAndBody` 繼續成立且與基準逐位元相等。option.en、ID、舊英文匹配入口不動，不新增 catalog alias 或修改儲存 schema。舊 Saved Cards 的公開原文、複製、Markdown 與 ZIP 匯出文字保持；依同一 ID 再生成會採目前的錨點，兩種行為需分開驗收。PAGE2 舊匯入的既有限制仍在，不藉本批修復。

## 基準與驗收

1. 修改產品前核對所有追蹤 webapp/src 的 Git blob 與基準，封存 PAGE1 各景別、兩種穿搭模式、兩卡所有相容髮型／眼鏡／圖層、其他31卡、普通／雙人／特殊／固定模式，以及 PAGE2 六輸出。`--record` 限基準 Git、未改產品且檔案不存在時；不得覆寫。
2. 獨立預期僅在封存資料套用上述兩個精確片段替換，逐物件比較所有輸出與 metadata。選值、RNG 呼叫數與非核准內容必須不變。基準不取自修改後引擎。
3. 持續護欄驗證 33 卡、四錨點、兩卡具體差異、兩組相同膚質保留，以及全部 PAGE2 輸出的每一錨點。穿搭共用來源 33 卡／134 圖層仍通過當前來源檢查。
4. 舊收藏 JSON 往返、公開原文、Markdown 與 ZIP 內容保持；PAGE1 舊檔的可用還原契約不退化。PAGE2 只檢查既有儲存／匯出及重新生成，不擴充舊匯入。
5. 歷史回放只於隔離副本精確還原這兩個錨點，驗證可信 Git SHA、重入，以及 checkout／symlink／未知／混合／缺失來源拒絕；串接 C7、C2／C3／C4／B3／PAGE2／Phase4／A2／A1／A5。保留歷史基準與舊斷言正文。
6. 聚焦測試、前端完整 test／prompt-quality／lint／build、同 seed 200 筆 strict audit、唯讀同步／Python／目錄完整性／資產／正式 bundle 及原身份規格要求的 Functions gate。桌機1440×1000與手機390×900檢查 PAGE2 選卡／六種複製／髮型／圖層、匯回 PAGE1、收藏原文／下載，再做六個現行工作區 smoke。

## 視覺驗收邊界

原圖核對、文字對比、瀏覽器功能與生成模型結果是不同證據。本批不呼叫生成服務、不產生費用，不宣稱已證明生成臉部辨識提升。若要確認生成效果，另以固定模型／參數／多個固定seed、正面與45度、共同中性光線與可比較造型做前後對照。不能只憑換髮型／穿搭或一張成功圖宣稱角色已穩定區分。

## 重跑入口

設定 `REGISTRY_BASE_COMMIT=de1433351605d140d618e4e9ab81a9566733bc10`，使用既有 Node 22。

- `node scripts/c1_identity_acceptance.mjs`
- `node --test webapp/src/lib/c1Identity.test.js`
- `node scripts/c1_identity_history.mjs /tmp/c1-identity-history-rerun`
- `PLAYWRIGHT_MODULE=<既有 Playwright 路徑> node scripts/c1_identity_browser.mjs /tmp/c1-identity-browser-rerun`

完整指令及結果列於報告，不以本規格中的待執行項目代表驗收已通過。
