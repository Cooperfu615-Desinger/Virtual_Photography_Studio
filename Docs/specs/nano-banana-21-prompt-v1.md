# Nano Banana 2.1 專屬 Prompt v1

Status: local implementation and validation completed; external image acceptance pending

## 授權範圍

2026-10-12 使用者選擇「只新增 Nano Banana 2.1 專屬 Prompt」。PAGE1 新增可預覽、複製、收藏及還原的 `nanoBananaPrompt`，標籤 `Nano Banana 2.1`。DLL 僅新增這份文字的來源選項；生成模型、API 設定、金鑰、張數、解析度與供應商行為不變。

既有 `grokPrompt`、`zImagePrompt`、`midjourneyPrompt`、三份 `extraPrompts`、選值、summary 與 structured 資料逐欄保留。舊卡沒有新欄位時仍正常呈現，重新生成後才取得專屬 Prompt；不批次重寫已存文字。

## 組裝與來源

- 使用相同 resolved selections／共用 structured model，無額外抽選。直接組裝語意來源，不解析已完成的 GPT 或 MJ 字串。
- 英文自然段落依序呈現創作目的與構圖、人物、可見服裝、姿勢與場景、光線及成像；省略空段，不加模型名稱、操作說明、內部 guard 或 MJ 參數。
- 一般單人、雙人、固定構圖、角色卡、自訂身份及特殊主體均有主輸出。保持原景別、比例、有效相機方向、可見性投影、A/B 歸屬及 canonical pose。新輸出不帶入衍生照的固定裁切。
- 普通人物的六種有效五官使用下方 2026-10-12 核准的 Nano 專用幾何描述；未知來源仍保留現有英文，不新增未選角色身份。獨立 Body Type 使用共用模型中已投影的有效來源；GPT 專用省略不擴張到 Nano Banana。
- 角色卡直接使用 `facialGeometry`、`eyeSignature`、`noseSignature`、`mouthSignature`、`skinSignature`、`makeup`、投影後的 `body`，並保留一次完整 `distinctiveFeatures`。髮型、變體與穿搭沿用有效選值。只有缺少結構欄位的舊卡才退回相容身份描述。
- 各場景及拍攝處理沿用現有來源與可見性政策；不擅自補鏡頭、光源、背景運動、人物或道具。

官方依據：[Google Nano Banana 提示指南](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)、[Gemini image generation prompting guide](https://ai.google.dev/gemini-api/docs/image-generation#prompting-guide-and-strategies)。自然敘述與明確人物、動作、場景、構圖及攝影描述為本專案表達策略，並非 Google 強制的段數或特殊語法。

## 相容與驗證

新欄位為可選擴充，保持既有 public mappings、lock IDs、角色卡相容欄位及 storage keys；compact Saved Cards 使用未占用的獨立可選欄位 `nb`，版本維持 3，不遷移舊卡。各工作區沒有新文字時不顯示空的新增輸出。Public output contract 更新為 `1.55.0`，舊六項契約內容不變。

修改前保存固定種子六輸出與 selection／summary／structured 基線。focused checks 覆蓋角色卡完整五官與四錨點、一般與雙人歸屬、固定構圖、canonical pose、各景別、收藏匯出匯入、compact restore及舊卡。

完成門檻：完整前端 tests／Prompt Quality／lint／build、同 seed `200 / prompt-quality-baseline` strict audit、`git diff --check`，以及 1440×1000／390×900 的預覽、複製、DLL 來源、收藏還原與六現用工作區 smoke。外部 Nano Banana 實際生圖與審美接受情況不由文字或本機檢查代替，這次不提交外部生圖。

## 六種普通五官補充（2026-10-12）

使用者核准「只強化 Nano Banana 2.1 的六種五官描述，其他 Prompt、角色卡和原始資料保持不變」。此節取代初版普通五官逐字輸出共用 `en` 的規則，僅限 Nano；其餘來源與輸出契約不變。

- `nanoBananaFacialFeatures.js` 按六個既有 canonical ID 提供 51–55 字英文片語；單人與雙人 A/B 均只替換已解析且有效的普通五官。無額外抽選，雙人 role suffix 不新增選項 ID。
- 沿用 [A 區六種結構定案](character-section-a-authoring-guide.md#五官結構定案2026-08-09)，參考 [角色卡四種五官欄位](character-card-facial-identity.md#profile-schema) 的粒度補輪廓、眼瞼／眼距、鼻樑／鼻尖及唇峰／上下唇比例。這是新的核准 generic 描述，並非直接複製或即時抽取某張角色卡。
- 日系／甜美使用同一自然橢圓臉輪廓；甜美不加入圓臉、豐滿臉頰或圓下巴。混血保留深邃圓眼，不改杏仁眼。各類維持同一 20 歲成年身份。
- 不帶入角色名、身份錨點、眼色、膚色、痣／雀斑、妝容、髮型、表情、視線或攝影條件；既有膚質、髮型／髮色與表情來源獨立保留。
- 角色卡、自訂身份、特殊主體的 Nano 文字逐字保留；有效普通五官被身份接管省略時，不讀 latent lock 補回。普通 Special Outfit、固定構圖與 Pose Composer 只要仍有有效五官即沿用映射。
- 「全無」無五官文字；未知／舊來源無可辨識映射時回退原有效英文。原 Markdown、database、metadata／`mj.face`、33 張角色卡、選值、summary／structured、儲存契約與 UI 不變。舊收藏文字不批次改寫，重新生成才使用新描述。
- 單人的映射片段以 `Her facial features include ...` 呈現，雙人仍沿用 `The first/second woman has ...`；只改善新片段的句法，不改未知來源的導語。

| 選項 | 輪廓 | 眼眉 | 鼻唇 |
| --- | --- | --- | --- |
| 韓系偶像臉 | 小巧精緻橢圓臉、漸收下顎 | 杏仁眼、直眉、適中眼距、淺雙眼瞼 | 細長直鼻樑、圓潤鼻尖、柔和唇峰、下唇略飽滿 |
| 日系清透臉 | 自然橢圓臉、平順臉頰、柔和收束下顎 | 杏仁眼、自然眉、適中眼距、淺眼瞼 | 小巧直鼻、低鼻樑、柔和唇峰、平衡唇部厚度 |
| 甜美可愛臉 | 與日系相同的自然橢圓輪廓 | 圓眼、彎眉、自然眼瞼開口 | 小巧圓鼻、低鼻樑、淺唇峰、下唇適度飽滿 |
| 冷感高級臉 | 修長橢圓臉、適度高顴骨、明確下顎 | 上挑眼、直眉、明確外眼角、淺雙眼瞼 | 明確直鼻樑、俐落鼻尖、清晰唇峰與唇形 |
| 成熟性感臉 | 柔和明確橢圓臉、顴骨與下顎層次 | 上挑眼、拱眉、適中眼距、明確眼瞼 | 中等明確鼻樑、圓潤鼻尖、豐潤唇形及較飽滿下唇 |
| 混血立體臉 | 立體修長橢圓臉、明確顴骨與下顎 | 深邃圓眼、明確眉型、適中眼距、眼瞼深度 | 高而窄的直鼻樑、明確鼻尖、雕塑感唇形 |

補充驗證：保留初版 382 組舊六輸出基線，另在修改前凍結 Nano 本文，僅將有效普通五官片段替換成對應 ID 標記。新版本同樣正規化後全文須一致，角色卡／自訂／特殊主體／全無則要求 Nano 全文逐字一致；另覆蓋七五官值 × 十一景別及 49 組 A/B 組合，確認每一角色出現一次、歸屬正確。完整門檻與實際生圖驗收邊界沿用上節。

## 本機完成紀錄（2026-10-12）

- 專項 11/11：覆蓋 382 組凍結案例，其中 33 張角色卡 × 兩種穿搭模式 × 五種景別共 330 組，完整臉型／眼／鼻／嘴／膚質／妝容與四項身份錨點保留；全部既有六輸出、extraPrompts、selection、structured、summary 與 summaryFields 雜湊一致。基線沒有因新輸出而重製。
- 另檢查 90 套 Special Outfit × 全身／牛仔中景／近景共 270 組，移除新敘述中的舊分組標題並保留可見配件；補測角色卡帽子與表情的句子邊界，以及近景省略肩背包／腰間 keychain、保留可見眼鏡。修改僅作用於 Nano 文字。
- Node `22.22.3`：完整前端 1542/1542、Prompt Quality 696/696、lint、build、diff-check 通過。同 seed 200 組 strict audit 前後皆 0 blockers／22 既有診斷，沒有增加；build 仍有既有大型 chunk 提示。
- 完整測試及 Prompt Quality 使用 `NODE_OPTIONS='--test-reporter=tap'`，因兩個既有 QA CLI 測試依賴 TAP reporter 格式；相同 HEAD 快照在預設 reporter 下也會失敗。另確認既有 GPT duo 角色測試的隨機斷言在固定 seed 下 HEAD／目前同樣成功或失敗，未改動該測試或產品行為。本批最後兩套完整測試皆通過。核對證據：`/tmp/vps-nano-head-check.UTx99j/manifest.json`。
- `http://127.0.0.1:5175/Virtual_Photography_Studio/` 在桌面 1440×1000／手機 390×900 完成六工作區載入、既有收藏與 PAGE1 新預覽／複製／DLL 來源檢查，無 console error/warning、破圖或文件橫向溢位。長 Prompt 的捲動維持在既有文字框內。
- 收藏與跨角色還原在獨立 `5177` 來源驗證：Rika 匯回 PAGE1 → 保存含七份文字的收藏 → compact／detail 複製 Nano → 改選 48_G → 還原 Rika，Nano 原文逐字一致。5175 原本 9 張收藏與選值保留；5177 既有 1 張卡保留，新增本次測試卡 `#Z16EAN`。兩個來源均未登入或提交生圖。
- 瀏覽器紀錄 `/tmp/vps-nano-browser-checks.json`；主要截圖 `/tmp/vps-nano-desktop.png`、`/tmp/vps-nano-mobile.png`、`/tmp/vps-nano-mobile-dll.png`、`/tmp/vps-nano-saved-mobile-detail.png`。原工作台與剪貼簿還原，驗收分頁及臨時 5177 伺服器關閉；5175 本機預覽保留。
- 未 stage／commit／push／deploy；未修改 DLL provider、client 或 Functions。模型仍顯示既有 Nano Banana 2 Lite，此次新增的 `Nano Banana 2.1` 是 Prompt 輸出及來源標籤。實際生圖與五官審美改善待使用者用目標模型測試。

## 六種五官補充完成紀錄（2026-10-12）

- 本批增量僅六種 Nano 映射、Nano 組裝的單人／A/B 五官片段、專項測試／修改前基線與本規格。對本批開始時的 27 個既存檔案快照，只有 `engine.js`、Nano test 與本規格新增差異；原先其他未提交工作保持原樣。
- 專項 15/15：1,078 組固定案例的其他六份輸出、extraPrompts、selection、structured、summary／summaryFields 全部雜湊相同；Nano 正規化有效五官片段後全文相同。330 組既有角色卡加上 396 組角色卡帶明確普通五官鎖定的兩種穿搭案例，Nano 全文保持不變；自訂／特殊主體及全無亦維持原文。
- 覆蓋七五官值 × 十一景別共 77 組、49 組雙人 A/B，以及固定構圖、普通 Special Outfit、站姿／鏡子自拍／三種仰躺。原人物 Markdown、metadata／MJ、database、33 卡 source 與 Character Card Lab 五檔雜湊全部相同。初版 382 組 fixture／baseline 未重製；新 1,078 組 baseline SHA256 `ca401cd0b1fcab78b5cf6541de746a5427018326c6250dd1dbc80f2feb571548` 自修改前捕捉後未改。
- Node `22.22.3`：完整 tests 1546/1546、Prompt Quality 700/700、lint、build、diff-check 通過。完整兩套沿用前批 TAP reporter 設定。相同 seed `200 / prompt-quality-baseline` strict 前後報告逐字一致，0 blockers／22 既有診斷；既有 Vite 大型 chunk 提示保留。
- 瀏覽器 38 筆核對：原 `5175` 的 1200×1246 桌面六工作區 smoke；隔離 `5181` 的 1440×1000／390×900 六工作區、兩尺寸七五官值、雙人歸屬、Nano 複製、DLL 來源、收藏及角色卡切換後還原。無 console error/warning、破圖或文件橫向溢位；桌面／手機各六張導航畫面已逐張視覺檢視，手機 Nano detail／五官段落另行檢視。
- 隔離收藏流程：冷感高級臉 → 保存測試卡 `#5JZ30R` → 日系切換 → 收藏還原；桌面預覽與手機 detail 複製皆與存檔原文一致。另驗證雙人 A 冷感／B 混血、Rika 角色卡不混入普通五官，再還原同卡，全文一致。5181 原為零收藏，新增一張本機測試卡保留；5175 原設定與七份預覽逐字還原，原 9 張收藏保留。
- 紀錄 `/tmp/vps-nano-faces-browser-checks.json`，截圖 `/tmp/vps-nano-faces-desktop-0.png` 至 `-5.png`、`/tmp/vps-nano-faces-mobile-0.png` 至 `-5.png`、`/tmp/vps-nano-faces-mobile-detail.png`、`/tmp/vps-nano-faces-mobile-detail-face.png`。稽核／測試／lint／build 證據為 `/tmp/vps-nano-faces-*.log`；來源快照 `/tmp/vps-nano-faces-before/manifest.json`。
- 原工作台、剪貼簿及 viewport 還原；測試分頁與 5181 伺服器關閉，原 5175 預覽保留。未 stage／commit／push／deploy，未更動 provider 或提交外部生圖。實際五官審美改善仍待同條件的新舊影像比較。
