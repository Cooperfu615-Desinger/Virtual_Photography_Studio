# Phase 4 A5：11 筆 commercial 修正與 4 筆保留 v1

日期：2026-10-26。Cooper 已確認本批驗收通過，授權只提交並 push 本次資料、文件、回歸案例與驗收工具；實際 Git／CI 結果另行核對。基準為已核對遠端 main `22d1103e2f88984af7ed33249b08b4e2729ba466`。

## 範圍與判準

正式來源為 catalog index 指定的分類 JSON。僅從 11 筆 `meta.semantic.tags` 移除 `commercial`，另外 4 筆明確保留。`small` 命中 `mall` 是歷史推論原因，不能直接當作刪除標籤的語意依據。

本批 commercial 判準：原文需呈現零售、餐飲營業空間、商品展示或商業立面；旅宿客房用既有 hospitality 表達，不因營利性額外標為 commercial。這是核准 15 筆的審查決策，不授權全目錄重新分類。旅館客房與既有精品飯店房間一致；黑膠聆聽角不臆測成唱片行。

| 永久 ID | commercial 決策 | 本批後有序 tags |
| --- | --- | --- |
| `locations:其他專屬場景-other-dedicated-scenes:其他-生活感日式榻榻米房間:2` | 移除 | other_scene, indoor |
| `locations:地下與廢墟風格-abandoned-underground:室內-廢棄校舍保健室:13` | 移除 | ruin, indoor, institutional |
| `locations:城市與社群感-urban-social-snapshots:室內-無人月台長椅區:4` | 移除 | urban, indoor, transit |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8` | 移除 | urban, indoor, transit, institutional |
| `locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10` | 移除 | urban, indoor, transit |
| `locations:城市與社群感-urban-social-snapshots:戶外-八公銅像旁行人區:12` | 保留 | urban, outdoor, commercial, transit |
| `locations:城市與社群感-urban-social-snapshots:戶外-目黑川旁的櫻花隧道:14` | 移除 | urban, outdoor, waterfront |
| `locations:城市與社群感-urban-social-snapshots:戶外-新宿歌舞伎町販賣機旁:31` | 保留 | urban, outdoor, commercial |
| `locations:生活感室內-indoor-lifestyle:室內-臥室窗邊:6` | 移除 | indoor, residential |
| `locations:生活感室內-indoor-lifestyle:室內-更衣室-試衣間:10` | 保留 | indoor, commercial |
| `locations:生活感室內-indoor-lifestyle:室內-英式小旅館房間:18` | 移除 | indoor, hospitality, heritage |
| `locations:生活感室內-indoor-lifestyle:室內-傳統酒吧二樓包廂:19` | 保留 | indoor, commercial |
| `locations:生活感室內-indoor-lifestyle:室內-黑膠唱片聆聽角:21` | 移除 | indoor |
| `locations:生活感室內-indoor-lifestyle:室內-女高生房間:24` | 移除 | indoor, residential, institutional |
| `locations:生活感室內-indoor-lifestyle:室內-狹小都會旅館房間:38` | 移除 | indoor, hospitality |

逐筆理由、原文及來源見 [決策紀錄](../decisions/2026-10-26-a5-commercial-review.md)及[固定案例](../../scripts/lib/a5CommercialReview.json)。名稱、英文、中文描述、ID、有序 aliases、列序、其他 semantic、lyingSurface、index／registry／schema、圖片、renderer 和推論相容退路不變。僅同步 database；六份 Markdown 與 legacyMappings 副本應逐位元組不變。

CRT 包含 outdoor 的現狀保持，窗光、服裝與支撐物政策另批決策；A6、其他 A 項、J12、B3、P5b 均未授權。學生房間／車廂等其他標籤不順便修正。

## 行為與相容契約

候選有序 ID、解析 selection、公開六輸出、summary、RNG 次數應與基準一致；完整 structured 只允許本批已核准場景 metadata 的精確標籤差異。固定場景、雙人、角色卡、專用主體、仰躺、場景匯入與觀察式抓拍沿用原契約。

舊 JSON 收藏保持原文字及 ID，不批次重寫；還原時重新解析的場景 metadata 只反映核准差異。Markdown 沿用全文比對及既有投影解析限制，不保證每段短句都可恢復原地點，但前後解析必須一致。直接引擎明確光線鎖定與 UI transition 的可用性清除是不同政策，本批兩者均保持。

## 基準與驗收順序

1. 修改前固定 main SHA、其他工作樹未提交檔案 SHA、A～E／前批 A5 歷史檔及生成工具；先新增回歸並證明舊資料未符合核准 after tags。
2. 正式來源僅改四份 Locations JSON 的 11 個 tags，依規範同步後檢查整份 database 差異；4 保留筆、CRT、前批三場景及其他紀錄完全不變。
3. 全 15 筆 × 11 景別 × 全無／有效場景屬性 × 隨機及全部環境光鎖值，比較有序場景／環境光／主體光／支撐候選；同種子比較單人／雙人、全無、有效與不相容手動光線及額外隨機案例。
4. 獨立從固定 Git archive 載入舊引擎，另在記憶體只移除 11 標籤作為 oracle；當前完整 stable prompt 必須等於 oracle，舊版與當前公開輸出／selection／RNG／summary 必須一致。比較全部非本批場景、既有多模式案例、收藏 codec、UI transition 與匯入 API。
5. 新增本批精確 inverse，先回復到 22d1103e，再用未修改的前批 inverse 還原三筆 tags。歷史測試只接換輸入；A～E 與前批 A5 原始基準、manifest、generator seals、報告證據與前批驗收工具不改寫。前批 A5 驗收在隔離還原到 22d1103e 的資料上重跑，不能把新正式資料誤當成前批零差異輸入。
6. 跑 sync／schema／歷史 ID／strict integrity／Python／catalog 工具、前端全套、Prompt Quality、lint、build、同 seed 200 strict audit、公開資產與 diff／文件連結檢查。既有非本批問題留證，不擴大修復。
7. 桌面 1440×1000、手機 390×900 驗證 15 場景的選取、候選、生成六輸出及收藏保存／重載／套用；通用五工作區、Prompt 整合姿勢／抓拍、場景匯入、DLL 明確帶入。無 console/page error、破圖或 document 橫向溢出；不送外部生成。

本機結果記於[本批報告](../reports/scene-semantic-a5-commercial-2026-10-26/README.md)。本機驗收、使用者驗收、Git 交付與遠端 CI 分開記錄。
