# 體態目錄 v2

Status: implemented and validated locally, 2026-10-03; commit/push authorized; no manual deployment

2026-10-11 GPT 限定後續：使用者核准在主 GPT、GPT 胸上、全身角色照與雙人主 GPT 省略獨立 Body Type。Z／AI／MJ 胸上仍完整保留同一來源；選值、資料庫、角色卡及歷史匯入相容性不變。此後續取代下方原六輸出全部保留的 GPT 部分，已實作並通過本機自動與瀏覽器驗證，見 [GPT 獨立體態省略 v1](gpt-standalone-body-omission-v1.md)。上方 Status 與下方既有驗證證據屬於 2026-10-03 體態目錄批次。

## 已定案範圍

一般基本體型與柔和沙漏身形合併，名稱統一為柔和沙漏身形。目錄為六種體態加「全無」。英文來源採「胸部與局部特徵、比例與整體輪廓；身高、三圍」的精簡格式；中文說明同步表達相同特徵。正式文字見 [人物資料庫](../../knowledge_base/character_design.md)，不在 renderer 另建一份描述。

| 體態 | 區隔特徵 | 身高 | 胸–腰–臀 |
| --- | --- | --- | --- |
| 高挑時裝模特 | A–B Cup、窄腰、高腰線、短上身與長腿 | 170–175 cm | 80–58–88 cm |
| 柔和沙漏身形 | C–D Cup、柔和勻稱、腰線略低、上身略長、圓臀與適度豐滿大腿 | 165–170 cm | 90–62–94 cm |
| 性感曲線身形 | F–G Cup、精瘦四肢、窄腰、圓臀與長腿 | 168–173 cm | 94–58–92 cm |
| 豐胸纖腰沙漏身形 | I–K Cup、纖臂窄腰、寬臀與較豐滿上段大腿；合身衣料緊繃、緊貼邊緣帶柔和溢肉感 | 163–168 cm | 103–60–98 cm |
| 運動緊實身形 | 水平肩線、明顯鎖骨、纖細輕微肌肉手臂、纖細緊實腰腹、適中圓翹臀、稍粗結實大腿與緊實小腿，輪廓偏直線 | 165–170 cm | 86–64–92 cm |
| 小隻精緻身形 | A–B Cup、窄腰、纖細四肢、緊湊平衡比例，四肢長度適中 | 150–155 cm | 78–58–84 cm |

數值是使用者核准的生成描述，不在程式內換算罩杯或推導額外外觀。運動型以使用者參考圖左側人物為方向：手臂肌肉量少，線條緊實，不另補厚實肩臂或健美式肌肉體積。

## 六組輸出來源契約

獨立 Body Type 從同一 resolved catalog item 取得完整英文。自 2026-10-11 核准的 GPT 例外起，`grokPrompt`、`chest-up-portrait`、`full-body-character` 省略此獨立來源；`zImagePrompt`、`midjourneyPrompt`、`chest-up-mj-portrait` 逐字保留。保留來源的渲染器可加段落、連接語及句尾標點，但不得刪除、改寫、補充或重新排列來源內的片語。省略只作用於 GPT 呈現，不移除共用結構化來源或選值。

- Z／AI／MJ 胸上不因景別、相機方向或衣襬遮住部分下身而刪除體態特徵、罩杯、身高或三圍；GPT 的獨立來源省略不依景別或衣襬觸發。
- AI 不再使用短正向 anchor、量測刪除或前四片語截取；Z 壓縮先保護完整體態來源，最後逐字還原。既有字數／估算 token 指標僅供診斷，不是體態截斷條件，也不是平台實際生成上限的保證。
- 雙人主 GPT 分別省略 A/B 獨立 Body Type；Z／AI 主輸出分別保留 A/B 來源。原本不適用雙人的三組衍生輸出維持空值。
- 「全無」維持無體態文字，不輸出 `none`，也不回填其他體態。
- 服裝單品、穿法與服裝可見性沿用既有來源與投影；不新增逐服裝的緊繃或遮蓋描述。I–K 體態本身的合身衣料效果與其整段獨立來源一起在 GPT 省略，其他三輸出保留；服裝自己的貼合與衣料效果不因這次 GPT 變更而刪除。
- Character Card 的 `profile.body`、permanent identity、專用主體，以及服裝內刺青等人物片段，沿用原有投影；這次來源契約僅處理獨立 Body Type。
- 兩組胸上維持同一拍攝狀態與 `4:5`，全身角色照維持單人、完整服裝與 `9:16`。Public fields、labels、按鈕與 storage schema 不變。

本規則取代歷史普通體態的景別投影、衣襬體態刪除及 AI 短句政策，也擴大先前僅 I-cup 三主輸出的例外。原有其他輸出規則持續生效。

## 舊資料相容性

`knowledge_base/item_metadata.json` 固定六種體態與「全無」的既有 `stableId`。刪除基本體型資料列不使後續 ID 改號。舊基本體型 ID `character:體態-body-type:一般基本體型:1` 及更早的優雅曲線模特 ID 都映射到 `character:體態-body-type:柔和沙漏身形:2`。

各體態原完整英文與原 AI 短句保留為 `legacyPromptAliases`，供文字匯入比對；合併組保留基本與柔和兩組來源。Saved Card 原 Prompt 文字維持原值，還原選項後重新生成才使用新來源，不批次改寫已存卡片或 browser storage。

GPT 省略後，結構化 selection／Saved Cards 中的 `bodyTypeId`、`bodyTypeAId`、`bodyTypeBId` 仍保留，重新生成只在 GPT 呈現層省略。純新 GPT 文字沒有獨立體態來源，不能由其反推出原選值；舊 GPT 含完整正式來源或 alias 的文字仍可解析。缺失值沿用既有匯入流程，不從角色卡、服裝或姿勢推測獨立體態。

## 驗證

2026-10-11 GPT 後續驗證通過：三組 GPT 單人輸出與雙人逐人省略、成年身份與姿勢保留、Z／AI／MJ 胸上逐字隔離，以及結構化還原／舊文字解析均有回歸覆蓋。完整測試 1517/1517、Prompt Quality 674/674、lint／build／同 seed strict audit 與桌面／手機六工作區檢查通過，詳細證據見上述 GPT 省略規格。以下保留原體態目錄批次的測試責任與歷史基準。

`bodyTypeCatalog.test.js` 固定獨立審閱文字，檢查六種／所有景別／衣襬遮蓋的六輸出、雙人角色歸屬、stable IDs、舊來源匯入、Saved Cards 與比例。原 Character Card、特殊穿搭投影及服裝關係測試維持原責任。

歷史功能快照不重寫：`bodyTypeLegacyFixtures.json` 保存變更前來源與舊投影片語，`bodyTypeLegacyTestSupport.js` 只將完整匹配的已解析體態來源替換回歷史文字，供舊功能快照繼續檢查非體態內容與抽選。新完整來源行為由實際 renderer 測試另行檢查。

`bodyTypeIsolationBaseline.json` 另固定變更前 HEAD `6027041` 實際產生的六體態 × 十景別，共 60 組六輸出與 selection hashes；只逆轉核准的體態文字後，其他 bytes 與選擇必須完全相同。基準由變更前 renderer 建立，不從新 renderer 回填預期。（2026-10-20 P5a 刪除：沒有任何測試讀取，見 `Docs/specs/expression-pose-v2-p5-cleanup-scope.md`；內容保留在 git 歷史。）

完成門檻依根目錄 AGENTS.md：資料同步／Python／公開資產、focused tests、Prompt Quality、完整前端 tests／lint／build、同 seed `200 / prompt-quality-baseline` strict audit，以及桌面／手機的目錄、六輸出與五工作區 browser smoke。實際圖像生成品質由後續模型實測確認。
