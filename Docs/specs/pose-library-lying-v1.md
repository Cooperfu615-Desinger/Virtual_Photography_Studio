# 動作庫：躺姿 v1（機制與動作驗收紀錄）

- 狀態（2026-10-24 整理）：**機位與表面機制已於 P3 實作；動作文案／出圖按個別紀錄驗收**，不再將整份文件統稱為尚未實作的草案。P3 的範圍與當時驗證見 §7。
- 原始動作驗收紀錄（2026-10-19）：Cooper 目視確認；4.1、4.2 已驗收，4.3 待改寫。第一輪結果見 [results.md](../reports/pose-library-lying-2026-10-19/results.md)。本次只整理標示，不改這些紀錄或宣告新增動作通過。
- 本文保留初版英文草稿、相容性提案與實作註記；§7 的數量及測試結果是 P3 當時證據，不是本次重跑結果。原始草稿可由 Git `6d07242` 恢復，查核方式見[歸檔索引](../archive/2026-10-24-expression-pose-drafts/README.md)。
- 上位規格：[神情姿態 v2](expression-pose-v2.md)（資料格式 §4、子句規則 §5、手部 §6、姿勢選單 §3.1）
- 參考圖：`Docs/動作庫參考/躺姿/`、`Docs/lie_on_back/`

## 1. 已確定（Cooper 2026-10-19）

| 項目 | 決定 |
| --- | --- |
| 方向 | 仰躺、側躺、趴躺三種；半躺歸坐姿 |
| 機位 | 躺姿有專屬機位選項（§2），取代站姿用的「角度＋方位」 |
| 畫面比例 | 由使用者自己選，不自動帶出 |
| 道具 | 不放 |
| 場景 | 只有標註「躺姿表面」的場景可以搭配躺姿；「隨機」會過濾掉不能躺的組合（§3） |
| 手勢 | 每個動作可有專屬手勢，另有家族共用手勢（§5） |
| 參考圖 | `Docs/動作庫參考/躺姿/` 的 4 張也做成動作（§4）；仰躺參考圖之後再補 |
| 第一批範圍（2026-10-19） | 先做側躺與趴躺；仰躺待參考圖 |
| 手勢清單（2026-10-19） | §5 草稿清單照用 |

## 2. 躺姿專屬機位

選了躺姿動作時才出現。英文為草稿。

| 機位 | 英文草稿 | 參考 |
| --- | --- | --- |
| 正上方俯拍 | `shot from directly overhead, the camera looking straight down at her` | lie_on_back 系列 |
| 斜上方俯拍 | `shot from a high angle beside her, looking down across her body` | HT08Tcia8AAikhz |
| 貼地／床面平視 | `shot from surface level beside her, the lens at the height of the surface she lies on` | HUGKFGubsAAmv7x、HQ4zehHaIAAFby1 |
| 從腳底方向拍 | `shot from beyond her feet, looking along her body toward her head` | — |
| 從頭頂方向拍 | `shot from above her head, looking along her body toward her feet` | — |

待確認的相容性（提議）：

| 機位 | 仰躺 | 側躺 | 趴躺 |
| --- | --- | --- | --- |
| 正上方俯拍 | ✓ | ✓ | ✓ |
| 斜上方俯拍 | ✓ | ✓ | ✓ |
| 貼地平視 | ✓ | ✓ | ✓ |
| 從腳底方向 | ✓ | ✓ | △ 鏡頭前景是腳底和臀部 |
| 從頭頂方向 | △ 臉會上下顛倒 | ✓ | ✓ 臉在前景，經典趴姿構圖 |

### 2.1 介面（Cooper 2026-10-19 依示意圖確認）

1. 躺姿機位放在 E 攝影成像「構圖與視角」：選了躺姿動作時，俯仰角度與環繞角度暫時收起，改顯示躺姿機位；取消躺姿動作後恢復原選值。
2. 以按鈕格呈現（同景別），選項：全無、隨機、正上方俯拍、斜上方俯拍、貼地平視、從頭頂方向、從腳底方向（△ 不建議但可選）。
3. 預設為全無（不寫機位）。
4. 在沒有躺姿表面的場景手動選躺姿動作：允許，不寫表面，B 區與 D 區顯示提醒；隨機不抽躺姿。

## 3. 躺姿表面

可以躺的場景加一句表面描述，組句時接在核心子句後，例如 `She lies on her stomach on the sunlit wooden floor`。

- 例：床 `on the bed sheets`；木地板 `on the wooden floor`；灰色攝影棚 `on the seamless grey floor`；地毯 `on the rug`。
- 審核清單（2026-10-19 定案，47 個可躺）：[scene-surfaces/README.md](../reports/pose-library-lying-2026-10-19/scene-surfaces/README.md)。
- 每個場景的實際文字要從該場景現有描述取用，不另外編造；沒有可用表面的場景不標註。
- 引擎已有床面、海面躺姿的處理方式（supine surface-led 路徑），實作時評估能否沿用。

## 4. 第一批動作草稿

格式依 v2 §4。`lower` 子句在參考圖沒拍到時，標為「提議」，需要 Cooper 確認。

### 4.1 側躺・臉靠枕頭・上手輕握枕邊

- 參考圖：`HQ4zehHaIAAFby1.jpeg`（床面平視近景）
- 方向：側躺；表面：床（需要枕頭）
- 中文幾何：側躺在床上，頭側靠在枕頭上，上方那隻手彎曲、手指輕輕抓著臉旁的枕頭邊；肩膀微微往前收；雙腿上下疊放、膝蓋微彎（參考圖未拍到下半身，此段 2026-10-19 Cooper 採用）。

| region | join | en |
| --- | --- | --- |
| core | | `She lies on her side with the side of her head resting on the pillow` |
| upper | `, ` | `her upper arm bent and her hand loosely gripping the edge of the pillow beside her face, her shoulders gently rounded forward` |
| lower | `. ` | `Her legs rest stacked with her knees softly bent` |

- 臉部特寫摘要：`lying on her side, cheek on the pillow`
- 手部：fixed（手抓枕頭）
- 備註：參考圖的被子蓋到肩膀，屬場景或穿搭，不寫進動作。

### 4.2 趴躺・前臂撐起・雙腳交叉翹起

- 參考圖：`HT08Tcia8AAikhz.jpeg`（斜上方俯拍）
- 方向：趴躺；表面：床、地板
- 中文幾何：趴在床上，前臂平放在身體前方撐起上身，胸口離開床面、背部微拱；骨盆貼著床面；膝蓋彎曲，小腿往上翹起，兩腳腳踝交叉。

| region | join | en |
| --- | --- | --- |
| core | | `She lies on her stomach with her chest lifted and her back gently arched` |
| upper | `, ` | `propped on her forearms resting flat in front of her` |
| lower | `. ` | `Her hips rest on the surface, her knees are bent and her lower legs are raised, crossed at the ankles` |
| support | `; ` | `her forearms and hips carry her weight` |

- 臉部特寫摘要：`lying on her stomach, propped on her forearms`
- 手部：free（前臂撐，手本身空著）；未搭手勢時，預設手勢為「雙手輕放在前方」（專屬，見 §5）

### 4.3 趴躺・前臂撐起・單腿屈起

- 參考圖：`HUGKFGubsAAmv7x.jpeg`（貼地平視，從前側方）
- 方向：趴躺；表面：地板、床
- 中文幾何：趴在地上，前臂撐起上身，雙手放在前方地面；一腿伸直貼地，另一腿膝蓋彎曲、小腿往上抬到接近垂直。
- 參考圖手上的書屬道具，不寫入。

| region | join | en |
| --- | --- | --- |
| core | | `She lies on her stomach with her upper body raised` |
| upper | `, ` | `propped on her forearms with her hands resting on the surface in front of her` |
| lower | `. ` | `One leg stretches straight along the surface while the other knee bends and lifts its lower leg nearly upright` |
| support | `; ` | `her forearms, hips and straight leg carry her weight` |

- 臉部特寫摘要：`lying on her stomach, propped on her forearms`
- 手部：free（手沒有承重）；預設同 4.2

### 4.4 參考圖 `HSFgmRSbEAACfs6.jpeg`：歸跪姿（2026-10-19 Cooper 決定）

這張看起來是**膝蓋著床、上身往前傾、手臂往前伸**的姿勢，比較接近現有的「四足跪姿」，並且是自拍拍法，不是躺姿。歸到跪姿家族，之後處理跪姿時再做成動作；自拍交給既有的自拍拍攝模式。

## 5. 手勢（草稿）

| 範圍 | 手勢 | 英文草稿 | 適用 |
| --- | --- | --- | --- |
| 趴躺共用 | 下巴靠在交疊的雙手上 | `her chin resting on her stacked hands` | 前臂撐起的趴姿 |
| 趴躺共用 | 雙手托腮 | `her cheeks cupped in both hands` | 前臂撐起的趴姿 |
| 趴躺共用 | 一手撥頭髮 | `one hand lightly tucking her hair behind her ear` | 前臂撐起的趴姿 |
| 趴躺共用 | 雙手輕放在前方 | `her hands resting loosely in front of her` | 4.2、4.3 的預設 |
| 仰躺共用 | 雙臂舉過頭頂 | `both arms stretched loosely above her head` | 仰躺 |
| 仰躺共用 | 一手放腹部、一手在身側 | `one hand resting on her stomach and the other at her side` | 仰躺 |
| 仰躺共用 | 一手放在額頭 | `one forearm resting across her forehead` | 仰躺（會遮住部分臉） |
| 側躺共用 | 頭枕在彎曲的手臂上 | `her head resting on her bent lower arm` | 側躺 |
| 側躺共用 | 上手放在腰側 | `her upper hand resting on her hip` | 側躺 |

## 6. 待決

> 初版待決紀錄，不表示 P3 機制尚未完成。機位目前記錄為「△ 不建議但可選」（§2.1／§7）；下列是否進一步限制屬另外的產品／實測決策，本次沒有改成禁止選取或新增驗收結論。

1. §2 機位與方向的相容性（△ 兩格）是否限制：未決，可由測試圖判斷。
2. 仰躺：等參考圖；現有「仰躺屈腿交疊・雙臂沿身側」先保留。

## 7. P3 實作紀錄（2026-10-20，分支 `claude/pose-v2-p3-lying`）

**Cooper 決定（2026-10-19）**
- 躺姿表面清單：13 筆審核項照目前判定；5 個廢墟／頹廢風場景開放；攝影棚兩筆片語（`gradient ground-and-background plane`、`ground-and-background color surface`）接受。結果 47 個場景可躺、107 個不可躺。
- 介面依 §2.1。

**資料**
- `knowledge_base/item_metadata.json` 的 `Locations.<分類>.<中文名>` 新增 `lyingSurface: { type, en }`，`en` 逐字取自場景英文；`type` 為 bed／floor／tatami／rug／grass／sand／ground／other。同步到 `webapp/src/data/database.json`，`buildEntries` 帶到場景選項。
- 產生工具：`Docs/reports/pose-library-lying-2026-10-19/scene-surfaces/tools/`（`build.py` 產生清單、`export_metadata.py` 只插入或取代 Locations 區塊、`verify.mjs` 檢查片語逐字存在）。重跑 exporter 結果不變。

**行為**
- 表面：躺姿動作的 `She lies on her (left |right )?(side|stomach|back)` 後面插入 `on the {表面}`。主 GPT、Z-Image、MJ、Nano、胸上都會帶到；全身角色圖不含姿勢，因此不帶。
- 不插入的情況：場景沒有表面；動作原文已寫 `on the ground`（v1 的側躺、仰躺動作卡）。
- 機位：E「構圖與視角」新增「躺姿機位」（`lyingCameraId`）：全無／隨機／5 個機位，從腳底方向標 △。選了躺姿動作時，俯仰與環繞角度收起並不寫入 Prompt，機位句接在景別後（例：`Full-body portrait, shot from directly overhead, the camera looking straight down at her.`）。快照保留原本的俯仰與環繞選值，取消躺姿後恢復。
- 「隨機」機位在生成時抽一個，快照記實際機位；全無時快照不寫這個欄位（舊卡形狀不變）。構圖區塊隨機與全域「全部隨機」會把躺姿機位設為隨機。
- 姿勢「隨機」：只有鎖定的場景有躺姿表面時才把已驗收躺姿動作加入候選；需要床的 4.1 只在 bed 類表面出現；場景本身也是隨機時無法事先判斷，不抽躺姿。
- 提示：D 場景區顯示「可躺：{表面}」或沒有表面的提醒；B 區在躺姿動作下說明表面是否寫入。

**驗證**
- 代表性 fixture 104 組、隨機樣本 200 組：與 P2 逐字相同。
- 躺姿相關輸出 110 組：把 P2 重播的俯仰與環繞設為全無後，差異只有 35 處表面插入，沒有其他改變。
- 同 seed strict audit 與 P2 相同；`npm test` 1718/1718、Prompt Quality 738/738、lint、build、sync check、Python、公開資產、diff-check 通過。
- 瀏覽器（1440×1000、390×900）：機位按鈕格、隨機構圖、Saved Card 存取與套用、取消躺姿恢復角度欄位、D 區提示；五個工作區無水平溢出、無破圖、無主控台錯誤。
- 回歸測試：`webapp/src/lib/engine/lyingSurface.test.js`。
