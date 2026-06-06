# A 人物設定新增與維護規格

Last updated: 2026-05-25

這份文件定義 PAGE1 `A. 人物設定` 的新增、修改、合併與測試規則。後續新增五官、體態、髮型、髮色、神情、姿勢、特殊動作或特殊角色時，請先依照本規格檢查責任邊界與 prompt 寫法。

## 1. 核心原則

A 區只負責「人物是誰、長什麼樣、當下表情與身體狀態」。它不應該偷渡場景、環境光、鏡頭焦段、攝影風格、服裝顏色或完整穿搭，除非該選項本身就是 `特殊角色` 或 `特殊動作` 必須成立的物件。

整體人物主線維持：

- 20 歲日系或韓系女性寫真人像。
- 年輕、漂亮、真實攝影感。
- 可以有性感、成熟、可愛、冷感或偶像感，但必須由對應欄位承擔，不要塞進人物數量或每一列 prompt。

Prompt 應使用短而準的英文片語，避免堆疊同義詞。中文描述用來幫助選項理解，英文 prompt 用來控制生成結果。

## 2. 資料來源

| 控制項 | 主要來源 | 備註 |
| --- | --- | --- |
| 人物數量 `subjectCount` | `webapp/src/lib/engine.js` 的 `SUBJECT_COUNT_OPTIONS` | 只決定 1 位、2 位、上傳人物，不承擔美感或性感描述。 |
| 特殊角色 `specialSubjectId` | `webapp/src/lib/engine.js` 的 `SPECIAL_SUBJECT_OPTIONS` | 直接 code-defined，不走 Markdown sync。 |
| 體態、五官、膚質、髮型、髮色 | `knowledge_base/character_design.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 神情、姿勢、特殊動作 | `knowledge_base/character_design.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 相容舊選項 | `webapp/src/lib/engine.js` | 合併、改名、移除時需加 legacy mapping。 |

Markdown 資料同步流程：

```bash
python3 scripts/sync_to_json.py
```

特殊角色與人物數量是直接寫在 `engine.js`，不需要跑 sync，但仍需要更新測試。

## 3. Prompt 寫法總則

英文 prompt 建議格式：

```text
core identity phrase, 1-3 concrete visual traits, restrained style or realism cue
```

描述應該：

- 使用正向描述，例如 `live-action photographic realism`、`realistic dyed hair texture`。
- 使用可以被畫面辨識的視覺資訊，例如 silhouette、hair length、gaze direction、hand contact。
- 控制在該欄位的責任範圍內。
- 優先用普通攝影語言，不用動畫、遊戲、cosplay 或 fantasy 語氣。

描述應避免：

- 負面堆疊：`not anime`、`not cosplay`、`without...`、`avoid...`。
- 場景詞：street、room、studio、forest、beach、castle、laboratory。
- 光線詞：sunset、neon light、softbox、rim light、blue sky。
- 攝影詞：35mm、film grain、cinematic lens、Dutch angle。
- 完整服裝詞，除非是 `特殊角色` 本身或 `特殊動作` 所需道具。
- 幼態或未成年暗示。可愛可以存在，但要寫成成人寫真中的甜美、親和、偶像感。

## 4. 人物數量

責任：只決定人物數量或上傳人物參考。

目前選項：

- `1 位`: one 20-year-old Japanese or Korean female portrait subject
- `2 位`: two 20-year-old Japanese or Korean female portrait subjects
- `上傳人物`: preserve attached reference identity and likeness

維護規則：

- 不加入 `beautiful`、`sexy`、`seductive`、`stunning` 這類美感預設。
- 不加入髮型、五官、表情、姿勢、服裝、場景。
- 若新增人物數量模式，必須確認 duo prompt、wardrobe role、selection lock 都能支援。

## 5. 身份基底

身份基底負責穩定的人物 DNA。它可以決定長期外觀特徵，但不決定當下表情、姿勢、衣服、場景或攝影。

### 5.1 體態

責任：人物身形輪廓、比例、體態氣質。性感要素主要放在這裡，以時裝寫真語氣呈現。

目前標準選項：

- `高挑時裝模特`
- `一般基本體型`
- `柔和沙漏身形`
- `性感曲線身形`
- `運動緊實身形`
- `小隻精緻身形`

新增規則：

- 新選項必須能帶出明顯 silhouette 差異。
- 英文 prompt 以 8-18 words 為目標。
- 可描述 `tall`、`petite`、`curvy`、`athletic`、`hourglass`、`long legs`、`defined waist`、`bust-waist-hip curves`、`rounded hips`。
- 避免 `underweight`、`bony`、`fragile`、`childlike`、過度誇張身材或不健康身形。
- 胸部與臀部曲線可以用比例與輪廓語氣描述，例如 `fuller bust-waist-hip curves`、`rounded hips`，避免露骨或過度物化。

範例語氣：

```text
fit toned athletic female body, healthy firm silhouette, subtle muscle definition, energetic balanced proportions
```

### 5.2 五官特徵

責任：臉型美感方向與辨識度。五官描述要簡短，目標是「臉的類型」而不是解剖清單。

目前標準選項：

- `韓系偶像臉`
- `日系清透臉`
- `甜美可愛臉`
- `冷感高級臉`
- `成熟性感臉`
- `混血立體臉`

新增規則：

- 英文 prompt 以 10-20 words 為目標。
- 可以寫 `young beautiful`，但不要每列都堆滿 beautiful synonyms。
- 每個選項只抓 2-3 個臉部氣質，例如 idol、transparent、sweet、cool editorial、seductive alluring、mixed editorial。
- 可愛選項要避免幼態，中文描述可明確寫「可愛但不幼態」。
- 不要加入表情、妝容、髮型、鏡頭或光線。

範例語氣：

```text
young beautiful Korean idol face, refined small face, clear bright eyes, polished youthful beauty
```

### 5.3 膚質特徵

責任：肌膚表面質感或少量臉部記憶點。

目前標準選項：

- `玻璃水光肌`
- `柔霧細緻肌`
- `自然雀斑`
- `淚痣／唇邊痣`
- `微曬陽光感膚質`

新增規則：

- 英文 prompt 以 6-14 words 為目標。
- 只描述皮膚質地、光澤、自然細節或小型記憶點。
- 不加入完整妝容、場景天氣或色溫。
- 皮膚色調應保持克制，避免變成角色種族或民族設定。

### 5.4 髮型

責任：頭髮長度、輪廓、瀏海、分線、綁法、質地。髮型不負責髮色。

目前標準選項：

- `帥氣濕亮油頭`
- `乾淨短鮑伯`
- `齊瀏海圓弧鮑伯`
- `不對稱濕感短鮑伯`
- `復古外翹短髮`
- `自然層次鎖骨髮`
- `韓系柔順中長髮`
- `側分柔波中長髮`
- `半濕感中長髮`
- `直髮：中分`
- `直髮：旁分`
- `直髮：日式瀏海`
- `直髮：濕感`
- `自然微彎：中分`
- `自然微彎：深側分`
- `自然微彎：瀏海`
- `自然微彎：濕感`
- `柔波：中分`
- `柔波：深側分`
- `柔波：瀏海`
- `濕潤感長波浪`
- `高位雙馬尾`
- `蓬鬆高馬尾`
- `低馬尾`
- `低包頭盤髮`
- `半綁公主頭`
- `柔和編髮造型`

新增規則：

- 英文 prompt 以 8-18 words 為目標。
- 長髮優先使用「質地：分線或瀏海」命名，例如 `直髮：中分`、`柔波：深側分`。
- 短髮、中長髮、綁髮可用輪廓命名，因為結構比分線更重要。
- 合併過近變體，不為髮尾微小差異新增選項。
- 不寫髮色，不寫服裝，不寫人物性格。
- 特殊質地如濕感可以保留，但要是髮型質感，不要變成整體畫面風格。

### 5.5 髮色

責任：頭髮顏色。髮色不負責髮型、妝容或角色類型。

目前標準選項：

- `自然黑`
- `柔霧黑茶`
- `深咖啡棕`
- `栗子棕`
- `奶茶棕`
- `亞麻米棕`
- `蜂蜜焦糖棕`
- `玫瑰可可棕`
- `淺金髮`
- `銀灰白`
- `亮桃粉`
- `寶石藍`
- `深森林綠`

新增規則：

- 英文 prompt 以 6-14 words 為目標。
- 自然色、日韓沙龍色、少量特殊色即可，不要變成顏色百科。
- 特殊色要保留真實染髮質感，例如 `realistic dyed hair texture`。
- 避免螢光、塑膠假髮感、過多挑染細節。
- 新增特殊色時，先檢查是否能被現有色系覆蓋。

## 6. 神情與姿勢

這一層分成三個責任：

- `神情與眼神`: 臉、視線、嘴型、情緒強度。
- `姿勢與肢體語言`: 身體結構、重心、肢體安排、動作狀態。
- `特殊動作`: 明確行為、道具互動、社群拍攝關係或完整身體動作。

### 6.1 神情與眼神

目前標準選項：

- `直視鏡頭｜柔和微笑`
- `直視鏡頭｜平靜淡然`
- `直視鏡頭｜無辜清透`
- `抿唇忍笑｜俏皮`
- `離鏡凝視｜若有所思`
- `低頭垂眼｜內斂`
- `回眸側看｜輕柔注意`
- `閉眼沉浸`
- `大笑｜自然喜悅`

新增規則：

- 英文 prompt 以 8-18 words 為目標。
- 只描述 face、eyes、gaze、mouth、emotion。
- 不描述站姿、坐姿、自拍、拿道具、服裝或場景。
- 如果只是微笑強弱差異，優先合併，不新增。
- 視線方向要明確：direct camera、looking away、eyes cast downward、glancing back、eyes closed。

範例語氣：

```text
looking away from the camera, distant sideward gaze, thoughtful quiet expression, reflective mood
```

### 6.2 姿勢與肢體語言

目前標準選項：

- `站姿｜自然站姿`
- `站姿｜單腳重心`
- `站姿｜雙手自然垂放`
- `站姿｜雙臂交疊`
- `坐姿｜自然坐姿`
- `坐姿｜微微前傾`
- `坐姿｜雙手後撐`
- `坐姿｜單腿放鬆`
- `坐姿｜雙腿自然伸展`
- `坐姿｜盤腿坐姿`
- `坐姿｜側身坐姿`
- `坐姿｜抱膝坐姿`
- `半躺低姿態｜側身半躺`
- `半躺低姿態｜正面仰躺`
- `半躺低姿態｜手撐半躺`
- `半躺低姿態｜微蜷放鬆`
- `半躺低姿態｜趴姿`
- `半躺低姿態｜側躺延伸`
- `蹲姿｜自然蹲姿`
- `蹲姿｜單膝蹲姿`
- `蹲姿｜手扶膝蓋蹲姿`
- `動態｜輕步移動`
- `動態｜整理頭髮`
- `動態｜整理衣襬`
- `動態｜抬手整理肩頸`
- `動態｜回身動作`
- `動態｜停步姿勢`

新增規則：

- 英文 prompt 以 8-24 words 為目標；複雜躺姿可略長，但要有測試保護。
- 只描述 body structure、weight、limbs、motion state。
- 不寫 `looking at camera`、`lowered gaze`、`over-the-shoulder gaze`，這些屬於神情。
- 不新增自拍或鏡子自拍姿勢，這些屬於特殊動作。
- 新姿勢必須改變身體輪廓或構圖效果；單純手的位置小差異不建議新增。

### 6.3 特殊動作

目前特殊動作全部保留，共 27 個非空選項：

- `塗口紅`
- `塗歪口紅`
- `喝冰咖啡`
- `咬著波板糖`
- `抽煙`
- `整理絲襪`
- `前傾抓住褲腰`
- `側坐單手後撐`
- `抱膝托腮坐姿`
- `仰躺雙手微抬`
- `跪坐回眸撩髮`
- `半脫上衣整理肩線`
- `隨性癱坐在雕花單人絨布沙發上`
- `趴臥滑手機`
- `靠牆站立`
- `靠牆坐姿`
- `靠牆後仰站姿`
- `靠牆仰躺抬腿`
- `側身斜躺伸腿`
- `跪姿前傾倚靠高背`
- `四足跪姿前傾`
- `抱枕俯臥回眸`
- `分腿跪坐仰視`
- `自然自拍感`
- `鏡子自拍`
- `男友視角拍攝`
- `閨蜜視角拍攝`

新增規則：

- 英文 prompt 必須 <= 55 words，且 <= 360 characters。
- 中文 `desc` 必須短，目標 <= 100 characters。
- 使用明確動詞與物件接觸，例如 `holding`、`biting`、`leaning`、`pulling`、`resting against`。
- 需要場景支撐的動作可以保留，但 prompt 只描述必要支撐物，不自動指定完整場景。
- 道具動作要明確道具可見性與接觸點。
- 全身動作要明確肢體結構，避免只寫情緒。

特殊動作類型：

- 社群拍攝關係：`自然自拍感`、`鏡子自拍`、`男友視角拍攝`、`閨蜜視角拍攝`。
- 道具或臉部互動：口紅、冰咖啡、波板糖、香菸。
- 穿搭整理：整理絲襪、半脫上衣整理肩線。
- 大型支撐物或場景物件：沙發、牆面、高背、抱枕。
- 完整身體動作：趴臥、跪姿、四足跪姿、分腿跪坐等。

社群拍攝動作規則：

- 必須加 `meta.tags` 的 `social_shooting_action`。
- 可以和一般 `poseId` 同時存在。
- 不應取代身體姿勢。

非社群特殊動作規則：

- 通常會取代一般 `poseId`。
- 如果行為本身已經決定全身姿勢，不要同時要求一般 pose。

## 7. 特殊角色

特殊角色是 A 區中唯一可以覆蓋身份基底與一般穿搭的欄位。它可以使用較長描述，因為它需要完整定義角色外觀、材質與真實世界融合方式。

目前固定選項與 id：

- `skeleton` / `黑骷髏`
- `white-skeleton` / `白骷髏`
- `sengoku-samurai` / `日本戰國武士`
- `european-knight` / `歐洲騎士`
- `female-android` / `女性人形機器人`

行為規則：

- 選中特殊角色時，人物數量強制為 1 位。
- 特殊角色會 suppress normal wardrobe output。
- 戰國武士、歐洲騎士不保留一般髮型與髮色控制。
- 女性人形機器人保留髮型與髮色控制。
- 神情與姿勢仍可和特殊角色共存。
- 場景、環境光、光線表現、攝影與成像仍由 B/C/D 區控制。

創作方向：

- 像一個未知角色突然出現在真實現代世界中。
- 自然融入選定場景，而不是自己帶出戰場、城堡、實驗室或博物館。
- 強調真實比例、接觸陰影、環境光影響、材質細節與 live-action photographic realism。

共享融合句應由 prompt assembly 加入，不要每列重複：

```text
an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings
```

長度建議：

- 骷髏類：45-85 English words。
- 歷史武士與騎士：80-130 English words。
- 女性人形機器人：100-160 English words。
- 共享融合句：25-45 English words。

負面詞規則：

- 避免 `not anime`、`not cosplay`、`not fantasy armor`、`not toy-like`。
- 改用 `live-action photographic realism`、`practical physical construction`、`documentary-real material detail`、`realistic robotics and synthetic material construction`。
- 若未來真的需要負面詞，必須先有明確 regression 測試。

## 8. 改名、合併與舊資料相容

多數 option id 會由 category、中文標籤與 row index 產生。因此改名、合併、調整排序都可能讓舊 favorite 或 saved lock 找不到選項。

維護規則：

- 優先 append 新選項，不任意插入中間。
- 改名、合併、移除時必須加入 legacy mapping。
- 舊選項應 map 到最接近的新選項，不要掉回 `全無`。
- 社群自拍類舊姿勢若被拆分，應同時保留身體姿勢與 `specialActionId`。

目前相關 mapping 區域：

- `CHARACTER_IDENTITY_LEGACY_OPTION_MAP`
- `CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP`
- `CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS`

特殊角色舊 subject count lock 也需要支援，例如舊的 `subjectCount: white-skeleton` 應轉為：

```js
{
  subjectCount: '1',
  specialSubjectId: 'white-skeleton'
}
```

## 9. 新增選項流程

新增一般 A 區選項：

1. 確認它屬於哪一個欄位，不跨欄位混寫。
2. 檢查現有選項是否已能覆蓋，能合併就不要新增。
3. 在 `knowledge_base/character_design.md` 新增或修改 row。
4. 跑 `python3 scripts/sync_to_json.py`。
5. 如果有改名、合併、刪除，更新 `engine.js` legacy mapping。
6. 更新對應測試的標準選項清單或 prompt 斷言。
7. 跑完整驗證。

新增特殊角色：

1. 在 `SPECIAL_SUBJECT_OPTIONS` 新增固定 id、zh、en、count、specialSubject 類型。
2. 確認是否需要新的特殊生成路徑或 sanitizer。
3. 不要讓特殊角色自帶場景。
4. 確認是否 suppress wardrobe、是否保留 hair controls。
5. 更新 `engineSpecialSubjects.test.js`。
6. 跑完整驗證。

## 10. 測試與驗證

依修改範圍更新或新增測試：

| 修改範圍 | 主要測試 |
| --- | --- |
| 身份基底、體態、五官、髮型、髮色 | `webapp/src/lib/engineCharacterIdentityBase.test.js` |
| 神情、姿勢、社群自拍相容 | `webapp/src/lib/engineExpressionPoseCleanup.test.js` |
| 特殊動作 prompt 與 meta tags | `webapp/src/lib/engineSpecialActionCleanup.test.js` |
| 特殊角色 | `webapp/src/lib/engineSpecialSubjects.test.js` |

完整驗證命令：

```bash
cd webapp
node --test src/lib/engineCharacterIdentityBase.test.js
node --test src/lib/engineExpressionPoseCleanup.test.js
node --test src/lib/engineSpecialActionCleanup.test.js
node --test src/lib/engineSpecialSubjects.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。

## 11. Review Checklist

送出前請確認：

- 選項是否真的屬於 A 區，而不是 B 場景、C 光線或 D 攝影。
- 英文 prompt 是否短、清楚、正向。
- 是否避免了動畫、cosplay、fantasy、plastic wig、childlike 等不穩定方向。
- 是否沒有在體態、五官、髮型、髮色中偷渡表情、姿勢、服裝、場景。
- 是否沒有在神情中偷渡姿勢，或在姿勢中偷渡視線。
- 特殊動作是否有必要的 meta tags，社群拍攝動作是否可與 pose 共存。
- 特殊角色是否自然融入現代真實場景，而不是自己指定場景。
- 改名或合併是否保留舊 saved lock 相容性。
- 測試是否覆蓋新行為與舊資料遷移。
