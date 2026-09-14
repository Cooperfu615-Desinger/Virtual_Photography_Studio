# Z-Image 既有場景細節優先規則 v1

日期：2026-09-14。狀態：使用者核准十組審查方向後，七組實作、三組維持原樣；本次尚未 commit／push。前一批十八組新增來源已提交至 `f6a2ed9`。

## 1. 適用範圍

- 僅 PAGE1 一般單人主 `zImagePrompt`，沿用 scene-integrated assembly 的既有資格判斷。主 Z 契約 `1.11.0`，既有細節優先來源 `1.0.0`。
- 只讀有效角度：腰部、膝蓋、地面、蟲眼。全身自然組仍讀原始有效高度；半臉特寫若已被共用投影調整為肩部高度，不強行套低機位規則。
- 場景仍合併在構圖開頭；不追加獨立場景段、不指定新光源、不要求背景完整入鏡，不改人物比例、姿勢或焦段。
- GPT、MJ、衍生輸出、雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led 與獨立工作區保持既有路徑。
- Locations Markdown／JSON、UI、選項 ID、摘要、RNG、儲存／匯入契約不變。既有十八組上方新增來源保持 `1.1.0`，不納入本批重新改寫。

## 2. 七組低機位正式文字

以下替換場景身份後的優先細節，不改場景身份。除咖啡館省略 `as a visible object` 外，均逐字選自同一 location 的既有英文來源。

| 場景 | 原優先細節 | 新優先細節 |
| --- | --- | --- |
| 室內：倫敦老咖啡館角落 | `dark wood table, fogged window glass` | `fogged window glass, pendant lamp fixture` |
| 室內：辦公室茶水間 | `small sink counter, compact coffee machine` | `compact coffee machine, upper wall cabinets` |
| 室內：宮廷音樂廳 / 歌劇院 | `chandelier fixtures, velvet seat rows cropped from one side` | `chandelier fixtures, ornate balcony rail` |
| 室內：廢棄手術室 | `broken surgical table, metal tray stand` | `peeling tiled walls, ceiling rail` |
| 室內：九龍城寨內部狹窄走道 | `narrow wall-to-wall corridor, water-stained concrete walls` | `narrow wall-to-wall corridor, overhead pipes` |
| 室內：電車車廂正面長椅視角 | `slight offset view toward a blue fabric bench seat, window and sliding door panels behind the subject` | `slight offset view toward a blue fabric bench seat, overhead hand straps` |
| 室內：電車車廂坐滿與站滿乘客 | `seated passengers on bench seats, standing commuters around vertical grab poles` | `seated passengers on bench seats, standing commuters around vertical grab poles, overhead hand straps in use` |

咖啡館只保留吊燈形體，不增加點亮／照射描述。歌劇院不要求完整陽台。正面電車保留藍色長椅與既有偏置視角，避免失去場景辨識。擁擠電車保留坐、站乘客，`in use` 不綁定主角抓吊環。

三個對照場景完全不改：室內：鏡面地板攝影棚、室內：英式溫室 conservatory、室內：電車車廂側面走道視角。它們現有低機位輸出已具備天花、玻璃屋頂或吊環等適當線索，不重複追加。

## 3. 資料流與保守邊界

沿用既有投影及壓縮 → 第一版地面／天空刪減 → 本批既有細節優先選擇 → 十八組核准上方補充 → 場景開頭組裝。

本批是「不回補原始來源」的明確、有限例外：只有七個核准 ID 可從同一 location 的原始英文取回表內指定短片語，取代目前低機位優先片語；不復原整段 catalog，也不恢復被省略的地面、桌面或所有家具。

必須同時符合有效低機位、非空場景、原始身份相符、所有核准原句仍存在、目前投影後身份與舊細節前綴精確相符。缺片語、來源改寫、未知 ID、自訂身份或空場景一律保持原輸入。既有尾端條件保留，已選片語不重複。非低機位恢復原本投影／壓縮結果。

實作：[選擇器](../../webapp/src/lib/engine/zImageSceneDetailPriority.js)、[測試](../../webapp/src/lib/engine/zImageSceneDetailPriority.test.js)、[獨立 fixtures](../../webapp/src/lib/engine/zImageSceneDetailPriorityFixtures.js)、[修改前凍結基準](../../webapp/src/lib/engine/zImageSceneDetailPriorityBaseline.json)。既有規則見 [場景方向 v1](z-image-scene-direction-v1.md)、[上方來源 v2](z-image-upper-scene-v2.md)。

## 4. 驗證紀錄

- 基準 `f6a2ed9`；固定種子 `upper-scene-v2-test-01`。1,430 案＝本批十場景 × 十角度 × 四景別（400）＋本批排除路徑（100）＋既有 930 案。只允許七組有效主 Z 場景開頭差異；其他五組輸出、selection 與 RNG 雜湊一致。舊 snapshots 不覆寫。
- 最終 `npm test` 919／919；`npm run test:prompt-quality` 251／251；lint、build 通過，build 既有 chunk-size 提醒保留。
- strict audit 改前改後相同：200 案、`prompt-quality-baseline`，零 blockers、23 diagnostics。沒有為降低既有診斷數而修改服裝或其他規則。
- Saved Cards 測試保存 location ID 與六組文字；Markdown 匯出保留六組文字、既有 parser 恢復三個主要輸出。parser 本來不回填 `extraPrompts`，此批不改 codec，不宣稱完整 Markdown 選項／衍生結構 round trip。
- 瀏覽器 `http://127.0.0.1:5175/Virtual_Photography_Studio/`：十組低機位開頭、咖啡館高／低切換、擁擠乘客保留、DLL Z／GPT 切換；桌面 1440×1000 與手機 390×900 的五工作區巡檢，未觀察到 warning／error 或破圖。六張既有 Saved Cards 保留，原控制項與 viewport 已恢復，沒有新增卡片或生成外部圖片。
- Browser acceptance 仍標示 PARTIAL：手機 PAGE1 D 既有工具列溢出／窄文字欄（375 client／411 scroll）仍在；其他工作區沒有文件水平溢出。複製按鈕成功提示可見，但 browser clipboard readback 為空，下載檔案 bytes 未重驗。UI／CSS 未改，不混入修復。
- 以上為技術回歸，不等於外部圖像模型生成品質驗收；本批依使用者決定不再製作 A／B Prompt 包。
