# 中景／牛仔中景：貼近人物蟲眼 v1

日期：2026-09-14。起點 `main / b74a432`。

## 核准範圍

使用者確認：中景與牛仔中景均採用近距離透視加強版，效果接近鏡頭幾乎緊貼人物、沿身體向上拍攝。這項修正補上之前只實作 fullBody、未接入中景測試稿的落差。

- 僅一般 PAGE1 單人主 GPT／Z-Image，`mediumWaist` 或 `cowboyKnee` ＋ `蟲眼視角鏡頭`。
- 沿用既有一般單人適用邊界；雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led、衍生輸出不变。MJ 與獨立工作區不改。
- 只替換 camera angle 文字。景別、比例、orbit、canonical pose、手部 modifier、場景／地面天空可見性、光線、服裝及所選焦段保持原樣。
- 全身、胸上／臉部與其他角度保持既有文字。不綁魚眼、不要求攝影器材出現在畫面、不新增 UI、選項或儲存欄位。
- 允許近處身體輪廓在左右邊緣裁切，不另加完整人物或自然比例要求。鏡頭幾乎貼近人物不等於手掌碰鏡頭，也不改手部動作。

## 正式英文

站姿中景：

> An extreme close-range worm’s-eye view, with the lens almost against her lower torso, looking steeply upward along her body. Her waist and lower torso dominate the immediate foreground, while her chest, shoulders, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.

站姿牛仔中景：

> An extreme close-range worm’s-eye view, with the lens almost against her thighs just above knee level, looking steeply upward along her body. Her thighs and hips dominate the immediate foreground, while her waist, upper torso, and head recede sharply above them. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.

非站姿／未指定姿勢（兩景別仍保留原 framing 句）：

> An extreme close-range worm’s-eye view, with the lens almost against the nearest visible part of her body, looking steeply upward along her body. The nearest body contours dominate the immediate foreground, while more distant body areas recede sharply. Pronounced foreshortening and perspective stretching near the frame edges emphasize the intimate camera distance. Nearby body contours may extend beyond the side edges of the frame.

非站姿不推導新的倚靠點、不強迫腳或大腿最近、不把坐／蹲／跪／躺重排為站立。同樣保留 near-contact、strong perspective 與 lateral cropping，不能回退到舊的泛用低機位句。

## 實作與回歸

- 共用純函式 `closeWormEye.js` v1.0.0；由既有主輸出入口控制適用性，不改泛用 camera geometry 的預設值，避免影響其他輸出。
- GPT 相機來源 v1.1.0，公開 output contract v1.14.0；Z contract v1.13.0。
- 修改 renderer 前凍結 6,370 組六輸出／selection／RNG hash：既有 6,320 組相機／場景／光線＋30 組兩景別、五姿勢、三方位＋20 組排除控制。
- 新增獨立逐字英文 oracle，核對正式輸出各出現一次；歷史測試只逆轉上述完整句，不重寫舊 snapshot，也不隱藏任意 Composition 變化。
- 檢查 Saved Cards／Markdown 文字與相機選項往返。自動化通過不代表外部模型影像品質已通過。

## 驗證狀態

- 新增 4 項聚焦測試通過，含 6,370 組獨立 before/after 六輸出、selection、RNG 比對及正式英文逐字驗證。修改前的正向測試確認舊 renderer 缺少核准句而失敗；凍結 baseline 生成完成後才用於完整比對。
- 完整前端 935/935、Prompt Quality 266/266、lint、build、`git diff --check` 通過。Build 僅既有大型 chunk 提醒。相同 seed `prompt-quality-baseline`、count 200 的 strict audit 前後均零阻擋、23 項既有診斷；不為壓低診斷數而改服裝等其他行為。
- 舊 fullBody 回歸中的「非全身無變化」断言現只排除本輪核准的精確相機句；舊 GPT/Z 契約版本斷言已更新。所有歷史 baseline JSON 保持原樣。

## Browser QA

- 本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，桌面 1440×1000／手機 390×900。五個工作區均載入及截圖檢視：Prompt、角色建模、動作姿勢、場景建模、Saved Cards。
- 實際切換中景／牛仔中景蟲眼：主 GPT/Z 各出現完整核准句，左側方位保留。切全身仍用原 fullBody 句；切地面不含 near-contact 句。跪姿使用 neutral 文案且 canonical 仍為 kneeling，未指定站姿腿部前景。手機亦確認兩主輸出中景句。
- DLL 來源 Gpt→Z-Image→Gpt；沒有生成外部圖片。六張既有 Saved Cards 保持原樣，檢查空來源過濾後還原全部來源；未新增、刪除或套用卡片。
- 五工作區已測 document client/scroll 桌面 1425/1425、手機 375/375；沒有觀察到 warning/error logs，角色圖片載入後無破圖。原工作台牛仔中景／腰部高度／左側／站姿、來源 Gpt、A 頁籤還原，viewport reset，測試分頁關閉。
- Browser **PARTIAL**：手機 PAGE1 既有三欄輸出過窄及按鈕截字仍存在；未修改 CSS/JSX，也未重驗先前 D 工具列問題。Z-Image copied toast 出現，但瀏覽器剪貼簿讀回為空，故不宣稱 clipboard bytes 驗收通過；下載未重驗。Saved Cards／Markdown codec 測試與瀏覽器端交付分開報告。
- 截圖由工具直接檢視，未新增圖片檔。外部模型實際貼近效果仍需使用者實測。

## CI 部署阻擋修正（2026-09-14）

- 本體已於 `1b69b8c` commit/push，但 [CI run 34818235192](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/34818235192) 的前端測試 934/935，一項失敗導致 build/deploy skipped。上一次成功部署為 `b74a432`，不能將 push 成功視為線上已更新。
- 失敗項 `enginePhotographyImagingCleanup.test.js` 的 worm-eye style/lens 測試未固定景別或 RNG，只接受舊 camera 句／直撇號 `worm's-eye view`；CI 抽到近距離牛仔中景的新 `worm’s-eye view`，因此失敗。本機舊 full suite 通過不代表此案例穩定。
- 先固定鏡面攝影棚＋中景重現相同失敗，再將測試改為中景／牛仔中景／全身 × 站姿／跪姿共六組固定控制與 seeded RNG。近距離 GPT/Z 必須各包含一次完整核准文案、不得退回舊句；全身保留原文案。原 style、105mm lens、前景遮擋散景驗證保留。
- 本輪只改測試及狀態文件，不改 production、Prompt 文案、baseline、workflow 或 UI；不需要因測試修正重做瀏覽器 UI 驗收。前一輪 Browser PARTIAL 限制仍保留，不代表線上新版已驗收。
- 本輪聚焦測試 13/13、Prompt Quality 266/266、lint、build、diff-check 通過。固定輸入的舊 assertion 先重現紅燈，再以完整核准句修正為綠燈；不透過放寬 regex 接受任意文案。
- 完整前端兩次均 934/935：第一輪為未修改的 `engineOutfitPresetDressCleanup.test.js` 鏡面鉻銀泳裝斷言；相同正式程式以 seed `chrome-ci-check-67` 可重現隨機外套組合失敗。第二輪該案例通過，改為未修改的 `engineSceneBaseCleanup.test.js` 鹽灘地面斷言失敗（隨機腰部高度已依法省略 `cracked salt crust ground`）。蟲眼案例兩輪皆通過。正式 engine/modules 與上述測試皆和 HEAD 相同；不擴大本輪修正、不反覆重跑直到綠燈掩蓋問題。
- 整體 CI gate 仍為 PARTIAL，其他隨機測試可能繼續阻擋部署。尚未 commit/push/deploy。使用者原有圖片資料夾未修改。

### 已核准的兩項測試穩定化後續

- 使用者要求先處理上述兩項測試，再與蟲眼修正一併提交。本輪仍僅測試與文件，不修改正式生成器、來源資料、UI、歷史 baseline 或 CI workflow。
- 鏡面鉻銀泳裝案例改用固定單人／全身／平視／正面、無外套與無其他完整造型的 isolated fixture，並注入 seed `chrome-ci-check-67`。保留原本材質必須接在泳裝之後的全部斷言，不放寬成任意地方有 silver 即通過。這只驗證單件服裝的 color syntax，不宣稱解決隨機同色外套搭配的描述歸屬問題。
- 場景原文測試的 13 組場景一律使用固定平視與 seeded fixture，避免隨機進入低機位或其他排除路徑；保留全部原文斷言。另新增鹽灘高度矩陣，主 GPT/Z 在平視／肩部／高位／鳥瞰／正上方保留地面，在腰部／膝部／地面／蟲眼省略地面，所有情況保留場景身份，最後切回平視再次確認恢復。
- 最終聚焦三個測試檔 49/49、獨立重跑四個指定案例 4/4、完整前端 936/936、Prompt Quality 重跑 266/266、lint、build、diff-check 通過。Build 僅既有 chunk 大小提醒。本輪未改 runtime/UI，不重做外部影像或瀏覽器視覺驗收。
- Prompt Quality 初跑曾於未修改的 `enginePromptDeduplication.test.js: generated prompts state a controlled outfit color without repeating its garment target phrases` 失敗（2 !== 1）；同一測試在完整 suite 與 quality 重跑皆通過，未固定的隨機輸入仍是已知穩定性限制。本輪不修改此第四項測試或聲稱所有 CI flakes 已消除。
- 三個測試修正與狀態文件一併提交；commit SHA 以 Git log 為準。本次要求為提交，未 push 或觸發遠端部署；線上更新須後續 push 並驗證 Actions。使用者圖片資料夾不納入提交。
