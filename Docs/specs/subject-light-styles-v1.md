# 主體光線表現英文描述 v1

日期：2026-09-14。狀態：已接入資料流並完成本地回歸與瀏覽器驗證；2026-09-18 合併審查與 Git 交付狀態見 `Docs/current_project_state.md` 及 Git log。

## 1. 目的與範圍

本規格記錄 `光線表現 (Light Style)` 的 25 組非「未指定」選項之英文來源文字重寫。目標是讓每個選項只描述人物受到的光線方向、品質、色溫、投影／反射與陰影行為，避免把場景、環境天空、姿勢、服裝、鏡頭、焦段或底片模擬混進主體光線欄位。

本次不改：

- 公開選項 ID、中文名稱、UI 顯示、隨機池、相容性標籤的資料結構。
- `knowledge_base/camera_and_lighting.md` 以外的原始選項內容；同步產物只更新相同 25 筆的 `database.json` 欄位。
- GPT 的完整保真契約、Z-Image 的既有精簡契約、MJ／AI 的模式專屬契約，以及 Saved Cards／匯入匯出欄位。
- 場景可見性、相機空間、地面／天空投影與所有排除路徑。

兼容性判斷保留歷史片語並加入新版片語。`normalizeSubjectLightForLegacy()` 僅供測試將新版來源還原成凍結基準文字；runtime 輸出使用下表新版文字，不得把測試正規化器帶入公開 prompt。

## 2. 核准來源文字

| 中文選項 | 英文來源文字 |
| --- | --- |
| 柔和順光 | `soft frontal subject light, even illumination across face and upper body, gentle shadow modeling, low contrast` |
| 均勻平光 | `flat even subject light, balanced face and clothing exposure, minimal shadow modeling, neutral contrast` |
| 側向柔光 | `soft side light across the subject, gentle cheek and shoulder contour, gradual shadow transition, natural dimension` |
| 側向硬光 | `hard side light across the subject, crisp facial-plane shadows, sculpted body contrast, sharp highlight separation` |
| 側逆光 | `soft diagonal rear-side light, narrow rim along hair and shoulder, partial facial fill, separated subject edge` |
| 逆光輪廓光 | `strong back rim light, bright outline along hair shoulders and body edges, restrained shadow-side detail` |
| 頂部照明 | `overhead subject light, downward illumination across face and torso, defined eye-socket and nose shadows, vertical falloff` |
| 下方反射光 | `upward reflected fill on the subject, subtle lift under the face, softened chin and neck shadows, gentle lower-body bounce` |
| 漫射霧光 | `diffused wraparound light, broad soft fill across the subject, softened shadow edges, low-contrast detail` |
| 硬質晴光 | `hard direct sunlight on the subject, crisp cast-shadow edges, strong side contrast, bright specular highlights` |
| 低光高反差 | `low-key subject light, deep face and body shadows, selective highlight accents, strong tonal contrast` |
| 高調亮光 | `high-key subject light, bright even exposure across face and clothing, pale soft shadows, clean highlights` |
| 暖金黃昏色溫 | `warm golden-amber subject color, honey-toned highlights on skin and clothing, gentle warm shadow bias, controlled saturation` |
| 冷白日光色溫 | `cool clean daylight subject color, pale neutral highlights, restrained cool shadows, clear skin and clothing detail` |
| 室內暖白燈色溫 | `warm-white indoor subject color, neutral-warm highlights, gentle household warmth, restrained amber saturation` |
| 冷藍夜色光 | `cool blue night-toned subject light, restrained cyan fill or rim, cool shadow tint, subdued highlight intensity` |
| 混合色溫光 | `mixed warm and cool subject light, layered highlight temperatures across face and clothing, controlled color separation` |
| 霓虹染色光 | `saturated neon color spill across the subject, vivid colored edge highlights on skin hair and clothing, controlled chromatic cast` |
| 窗格投影光 | `window-frame pattern light across the subject, geometric daylight bands on face and clothing, defined shadow edges` |
| 百葉窗條紋投影光 | `window-blind stripe light across the subject, horizontal slatted bands on face and clothing, crisp alternating light and shadow` |
| 冷調窗邊輪廓光 | `cool window-side edge light, clean illumination along hair and shoulder, soft shadow-side falloff, subtle contour separation` |
| 斑駁樹影光 | `dappled leaf-shadow light across the subject, irregular sunlight patches on skin and clothing, broken branch-and-leaf pattern` |
| 潮濕反射光 | `wet-surface reflected fill on the subject, soft upward bounce from nearby surfaces, cool glossy highlights along lower contours` |
| 局部暖光 | `localized warm subject light, concentrated amber highlight zone across face and hands, gentle warm falloff, soft surrounding shadows` |
| 深夜邊緣微光 | `minimal nocturnal rim light, faint cool edge tracing hair shoulders and body outline, mostly shadowed subject mass` |

## 3. 資料流與輸出規則

1. 編輯來源：`knowledge_base/camera_and_lighting.md` 的 Light Style 區段。
2. 執行 `python3 scripts/sync_to_json.py`，只同步上述 25 筆至 `webapp/src/data/database.json`。
3. 所有 renderer 仍由同一個 resolved selection 取值；不得在 GPT、Z-Image、MJ 或 AI 另外維護第二份來源文字。
4. GPT 保留完整有效來源；Z-Image 依既有 compact 規則保留光線核心；MJ／AI 只依各自既有模式契約壓縮，不可因本次重寫擴大場景或相機內容。
5. 來源文字不得包含控制器、fallback、完整性檢查、隨機池或選取狀態等內部語句。

## 4. 驗證

- 固定 oracle：`webapp/src/lib/engine/subjectLightFixtures.js` 的 `SUBJECT_LIGHT_SOURCE_CASES`（25 筆）以及歷史相容性正規化器。
- 直接來源與 renderer 回歸：`engineLightingPromptCleanup.test.js`、`enginePromptPipeline.test.js`、`engineFixedCompositionSet.test.js`、`ambientLightDescriptions.test.js`、`sceneIntegratedAssemblyBaseline.test.js`。
- 原始批次局部驗證 137/137；2026-09-18 合併審查通過 `npm test` 963/963、`npm run test:prompt-quality` 275/275、lint/build、`git diff --check`、資料同步／Python／public-asset 檢查與 strict same-seed audit（200，零 blocking、23 diagnostic-only）。瀏覽器在 1440x1000 與 390x900 檢查五個目前啟用的工作區，無 console error 或 document-level horizontal overflow。外部模型成像品質與部署另行驗證。
