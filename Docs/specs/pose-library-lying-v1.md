# 動作庫：躺姿 v1（草案）

- 狀態：**草案**。驗收方式為 Cooper 目視確認（2026-10-19）；4.1、4.2 已驗收，4.3 待改寫。第一輪結果：[results.md](../reports/pose-library-lying-2026-10-19/results.md)。
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

## 3. 躺姿表面

可以躺的場景加一句表面描述，組句時接在核心子句後，例如 `She lies on her stomach on the sunlit wooden floor`。

- 例：床 `on the bed sheets`；木地板 `on the wooden floor`；灰色攝影棚 `on the seamless grey floor`；地毯 `on the rug`。
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

1. §2 機位與方向的相容性（△ 兩格）是否限制：未決，可由測試圖判斷。
2. 仰躺：等參考圖；現有「仰躺屈腿交疊・雙臂沿身側」先保留。
