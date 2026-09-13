# Z-Image 場景與環境光的鏡頭方向生成規則 v1

Last updated: 2026-09-13

狀態：使用者已核准第一版並要求實作；本機 runtime 已接入，Git 尚未提交。影像生成效果需另行實測，不以程式測試代替。

## 1. 目的與範圍

減少低機位同時要求呈現人物、地面細節與上方景物的構圖壓力；這是生成策略，不是相機高度必然決定可見範圍的攝影定律。

- 僅 PAGE1 一般單人主 `zImagePrompt` 的 scene-integrated 分支，契約 `1.7.0`。
- 沿用同一份 resolved selections，不增加隨機抽選。
- GPT、Midjourney、三組衍生、雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led 與獨立工作區不變。
- 不改資料庫、UI、摘要、locks、Storage、Saved Cards 或輸出欄位映射；省略文字不代表清空選項。
- 不新增天空、屋簷、木樑、樹冠等上方場景。這些屬於後續另行核准的來源補充。

## 2. 相機分組

| 已解析的相機角度 | 地面細節 | 天空畫面描述 |
| --- | --- | --- |
| 高位俯視鏡頭、鳥瞰視角、正上方俯視鏡頭 | 允許保留 | 省略已審查片語 |
| 肩部高度鏡頭、平視高度鏡頭 | 允許保留 | 允許保留 |
| 腰部高度鏡頭、膝蓋高度鏡頭、地面高度鏡頭、蟲眼視角鏡頭 | 省略已審查片語 | 允許保留 |
| 全無、未知或未指定 | 不額外刪除 | 不額外刪除 |

允許保留不是強制可見；不能補回既有景別或 Z 壓縮已排除的內容。使用已解析 angle，不以 framing 中的「腰上」等詞代替相機高度。既有角度／景別相容性可能先解析出不同有效 angle，本輪不修改該機制。

## 3. 可追溯來源邊界

`webapp/src/lib/engine/zImageSceneDirection.js` 維護版本化的精確來源片語 reduction map。地面及天空片語直接取自現有 Locations／CameraLighting 英文；測試確保每個 key 仍存在於 catalog。

- 地面：地板材質、地面物件、鋪面、低處台階／平台邊緣等已核對來源。
- 混合片語只移除相關部分，例如 `balcony floor edge and wall corner` → `wall corner`；`mirrored floor and mirrored ceiling` → `mirrored ceiling`。
- 保護地點首片語，包含 beach、engawa、grassland 或 floor-led 場所身份。
- 不呼叫此規則處理姿勢、服裝、subject light direction、鏡頭幾何、精確畫面文字。腳跟／膝蓋落地、手肘倚膝、反射補光均不受影響。
- 俯視時省略直接的天空、雲、地平線片語；保留既有時間、季節、天氣與冷暖／明暗資訊。
- 少數天空與環境混合首句有明確縮寫：`clear blue-sky daylight` → `clear daylight`；`deep azure summer sky` → `deep azure summer atmosphere`；`charcoal-gray pre-rain sky` → `charcoal-gray pre-rain atmosphere`。不是新增光源或推導色光。
- `sky and treetop fragments outside` 只保留 `treetop fragments outside`；skyline、floor-to-ceiling window、grounded posture 等不能靠單字誤刪。
- 未審查／自訂／匯入文字僅在片語精確吻合時套用，其他內容保守保留。這不是任意自然語言的通用地面辨識器；新增或重寫來源時需同步審查 map。

## 4. 組裝

1. 共用景別投影保持原樣。
2. 沿用 Z 既有 compact source 選擇：地點通常前三片語及既有條件例外；ambient 仍為前兩片語。
3. 對留下的 location／world scene／scene accent 與 ambient 來源做鏡頭方向刪減。
4. 場所身份與全部剩餘場景細節合併到構圖開頭，一次輸出 `The setting is ...`，再接既有景別、角度與有效自拍。
5. 人物、姿勢、服裝維持既有來源與順序。後置 scene 區只保留 opt-in 精確畫面文字，不再散落場景細節。
6. 保留的 ambient 與既有 subject lighting 相鄰輸出；不補回先前 compact 已省略的光感片語。

全無或刪除後為空的來源直接略過，不輸出 none、no floor、no sky、空 setting 或內部規則。

例：日式旅館緣側＋低機位：

```text
The setting is traditional Japanese ryokan engawa veranda, sliding door frames. Waist-up portrait. ...
```

例：藍調傍晚＋俯視：

```text
Blue hour environment, [existing subject-light description].
```

方括號只用於規格解釋，不是公開 Prompt。

## 5. 驗證與交付

- `zImageSceneDirection.test.js`：高度矩陣、全部 authored map 的 catalog 追溯、混合片語、未知來源保留、木廊／和室／街道 runtime、ambient 全選項、光線與其他 renderer 隔離。
- `sceneIntegratedAssemblyBaseline.test.js`：沿用 45 組不變 inputs／selection／RNG；35 組 eligible Z 使用 additive `sceneDirectionalZImageExpected.json`。原歷史 baseline、Z 1.6 expected 與 MJ expected JSON 保留不變；排除案例六輸出及所有其他 renderer hashes 不變。
- MJ parameter fixtures 只更新三筆 eligible Z hash，GPT／MJ／排除模式不更新。既有 scene 斷言改成新開頭結構；與角度無關的場景測試明確指定平視，避免不固定角度的舊測試隨機失敗。
- 完整前端 `npm test`：904/904；`npm run test:prompt-quality`：236/236；lint、build、`git diff --check` 通過。Build 保留既有大於 500 kB chunk 警告。
- 修改前／後均執行 `npm run audit:prompts:strict`，200 cases、seed `prompt-quality-baseline`：0 blockers；23 diagnostic-only findings 不變（19 wardrobe/scene、4 near-duplicate）。Z 平均字數 316.9 → 316.8，其他輸出統計不變。
- 本機 browser：`http://127.0.0.1:5175/Virtual_Photography_Studio/`；1440×1000 與 390×844。五工作區導航／載入及現有 Saved Cards 六張顯示已檢查，無觀察到 console error/warning 或破圖。未新增／刪除卡片或呼叫外部圖像 API。
- PAGE1 互動：緣側木廊＋腰部機位只保留身份與 sliding door frames；改高位俯視後 raised wooden deck edge 恢復。藍調傍晚＋高位俯視省略 deep blue dusk sky、保留 blue hour environment 與霓虹 subject light；改回腰部後天空恢復。GPT/MJ 原來源維持，DLL Prompt 來源可切 Z-Image 後切回 Gpt。驗證用場景、角度、光線及來源選項已還原。
- Browser acceptance 為 **PARTIAL**：手機 PAGE1 場景工具列擠壓說明、輸出三欄過窄（本次觀察 Z textarea 約 83 px）。現有 `page1-section-header-actions` 不收縮與 `page1-generation-grid` 三欄規則仍在；CSS／JSX 與起始 HEAD 無差異，本輪不混入版面修正。文件寬度未超出 clientWidth，仍不能視為所有內部控制皆無裁切。既有 copy/download 端到端限制本輪未重驗，不能宣稱整體 Browser QA 全數通過。
- 外部 Z-Image／Grok 影像測試待使用者確認。不能宣稱所有姿勢比例或透視問題已解決。
