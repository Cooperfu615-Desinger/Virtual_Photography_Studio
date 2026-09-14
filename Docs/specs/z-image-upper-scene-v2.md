# Z-Image 低機位上方場景 v2：十八個核准場景

日期：2026-09-13

狀態：首批四組及全身相機已隨 `71b4b20` commit／push；使用者已核准剩餘十四組，不再要求逐組 A／B 測試包。本批十四組為本機實作，未 commit／push／部署。

## 1. 已確認範圍

| 案例 | 決定 | 正式補充英文 |
| --- | --- | --- |
| V2-1 日式旅館緣側木廊 | B | `the underside of wooden eaves, exposed rafters` |
| V2-2 日式和室 | B | `a wooden lintel above the shoji doors` |
| V2-3 廢棄水泥工廠破碎輸送帶區 | B | `rusted steel beams overhead` |
| V2-4 草地與樹木 | B | `irregular branches and foliage overhead` |
| V2-5 城市遊艇碼頭欄杆旁 | A／B 相近，維持 A | 不補回桅杆 |
| V2-6 新宿歌舞伎町招牌下 | A／B 相同，維持現狀 | 不新增描述 |

使用者回報六組人物比例、景別、場景融合與上方細節皆無問題；此影像驗收範圍為 [實測包](z-image-upper-scene-v2-test-prompts.md) 的腰部高度＋中景。其他角度的程式驗證不代表影像品質已獲確認。

### 後續核准的十四組

以下按原 location ID 綁定，不改資料庫、UI 名稱或選項數量；正式英文以此表為準。

| 場景 | 正式補充英文 |
| --- | --- |
| 室內：精品飯店房間 | `an upper curtain track, the wall-to-ceiling junction` |
| 室內：現代高樓公寓客廳 | `the upper window frame, an adjacent ceiling edge` |
| 室內：臥室窗邊 | `the curtain rail and top of the window frame` |
| 室內：更衣室 / 試衣間 | `the curtain track overhead` |
| 室內：電梯內 | `the top of the elevator doors, the cabin ceiling edge` |
| 室內：木造圖書館閱讀桌旁 | `the upper tiers of nearby wooden bookshelves` |
| 室內：木造圖書館書車旁 | `the upper tiers of nearby wooden bookshelves` |
| 室內：木造圖書館借書台前 | `the upper tiers of nearby wooden bookshelves` |
| 戶外：日本住宅外樓梯間 | `the underside of the landing above, steel supports` |
| 室內：廢棄水泥工廠生鏽控制室 | `cable bundles along the wall-to-ceiling junction` |
| 室內：廢棄水泥工廠機具堆放區 | `steel beams overhead` |
| 室內：地下排洪道積水牆角 | `the concrete ceiling meeting the stained wall` |
| 戶外：霧感森林步道 | `overlapping branches and foliage overhead` |
| 戶外：森林營地帳篷營火 | `branches and foliage above the tree trunks` |

## 2. 生成規則

- Z-Image contract `1.10.0`；補充來源版本 `1.1.0`。沿用 [第一版](z-image-scene-direction-v1.md) 的一般 PAGE1 單人主 Z-Image 範圍，保留 `1.9.0` 的全身相機規則。
- 只在有效相機高度為腰部／膝蓋／地面／蟲眼時套用；肩部、平視、俯視、全無與未知角度不新增。依已解析 angle，不由景別文字或姿勢猜測高度。
- 先完成共用景別投影、Z 壓縮與第一版方向刪減，再從 `zImageUpperScene.js` 讀取按 location ID 綁定的已核准補充來源。額外比對留下的地點首句身份；空白／覆蓋掉的地點、未知 ID 不補寫。
- 補充來源是明確核准的新內容，不冒充原資料庫文字，也不由 renderer 猜測。原 Locations Markdown／JSON 不變；不回讀原資料庫中被裁切或壓縮移除的長句。
- 十八組各加入固定的一至兩個短片語，置於同一個 `The setting is ...` 場景開頭；相同片語已存在就不再追加。不新增隨機抽選或泛用 fallback。
- 不要求物件完整入鏡，不增加天空、時間、天氣或光源；第一版地面／天空刪減與人物受光規則不變。
- GPT、MJ、三組衍生、雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led 與獨立工作區不套用。UI、摘要、locks、Saved Cards、匯入與輸出欄位不變。
- [全局候選清單](z-image-upper-scene-v2-proposal.md) A 區十八組已接入；B／C 區保持原行為，沒有額外補寫。

## 3. 首批歷史驗證

- 先凍結 `fa22169` 的 230 組輸出／selection／RNG 聚合 hashes，再改 runtime：四場景 × 十角度 × 四景別＝160 組；四場景 × 十排除案例＝40 組；三個對照／全無 × 十角度＝30 組。
- `zImageUpperScene.test.js`：四個 ID 與來源身份、固定短句、未知／空來源、非低機位、逐片語去重；四組腰部中景輸出與使用者選定 B 版逐字一致。
- 230 組比較只從 eligible Z 第一場景句移除本批核准短句後，要求回到改前 hash；其他五輸出、排除／對照案例、selection 與 RNG 不做正規化，必須原樣相同。
- 既有 45 組 assembly baseline 與所有 historical expected snapshots 不改寫；聚焦四檔測試 73/73。
- Prompt Quality 240/240、lint、build 通過（保留原 Vite 大 chunk 提示）。修改前／後 strict audit：200 cases、seed `prompt-quality-baseline`，零 blockers、23 個既有 diagnostic-only findings，所有輸出字數統計不變；此 audit 的隨機案例未必抽中四個新場景，專屬覆蓋由上述 230 組負責。
- 完整 `npm test` 最新一次 907/908；未宣稱全通過。兩次非固定亂數執行分別觸發 `engineSceneBaseCleanup.test.js:314` 地面斷言與 `engineLightingPromptCleanup.test.js:120` 天空斷言。用只讀 Node load hook 載入 HEAD 的 engine.js、固定 Math.random LCG（1664525／1013904223），seed 123 的場景測試與 seed 1 的光線測試在 HEAD／工作區均同樣失敗。它們未固定 angle 卻要求地面／天空文字，與既有 v1 規則衝突；本批不修改這兩個舊測試或相關場景。

## 4. 影像實測邊界

後續決策：使用者接受目前方向，十四組改以內容細節確認後實作，不再逐組製作 A／B 包。以下首批測試材料保留作歷史證據，不是本批新增交付要求。程式／瀏覽器通過仍不等同十四組均有外部影像驗收。

正式 runtime 已支援四個低機位；使用者目前只驗收腰部高度＋中景。下一批可固定目前人物／服裝，分別測膝蓋高度、地面高度、蟲眼高度，觀察比例、景別、空間融合及是否被迫拉遠。未經影像實測，不把程式通過等同生成品質通過。

已從 runtime 匯出 [十二組其他低機位測試 Prompt](z-image-upper-scene-v2-low-camera-prompts.md)，逐組確認 resolved angle 與指定相機高度相同，未手動修飾文字。

## 5. 首批 Browser QA：PARTIAL（歷史紀錄）

- 本機 URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/`；1440×1000／390×900，五個工作區均完成導航與載入檢查。桌面截圖檢視正常；手機 PAGE1 有下述既有工具列問題，其他四區未觀察到 document overflow 或破圖。
- PAGE1 四個新場景皆在即時 Z 預覽出現正確短句。緣側由腰部切到高位俯視時移除上方補充、恢復第一版允許的木廊地面；切到地面高度時再次補入屋簷。GPT／MJ 預覽未加入上方短句；DLL source 能切換 Z-Image／Gpt，未呼叫外部圖像 API。
- 原生場景選單的 Playwright selectOption 在部分狀態逾時，改用原生 AX setValue 後完成室內場景驗證及還原，不使用 DOM／Storage 注入。
- 角色卡十張圖載入；動作卡選取與輸出可用；場景建模控制及輸出正常；Saved Cards 維持六張，空來源篩選與回到全部六張已核對。未新增、刪除或改寫任何卡片。
- 手機 PAGE1 D 工具列：clientWidth 375／scrollWidth 411；溢出節點是 `page1-section-header-actions` 及光線定位按鈕。還原到未改動的歌舞伎町場景仍同樣溢出，CSS／JSX 未改。另有說明被擠成窄直欄、三欄 Prompt 過窄的舊版面問題；本輪不混入 UI 修正。
- Browser warning/error logs 為空；截圖已於本次工具回應檢視，沒有另存 screenshot 檔。場景屬性／場景／相機高度／DLL source 已還原，暫時 viewport override 已清除。
- 未重新驗證 copy/download 端到端 bytes，也未送出外部影像生成。因此不能標記整體 browser acceptance 為 PASS。

## 6. 十四組擴充驗證（2026-09-13）

- 以 `71b4b20` 凍結 930 組比較：十四場景 × 十角度 × 四景別＝560、十四場景 × 十排除案例＝140，另保留首批 230 組。只允許 eligible 主 Z 場景開頭增加本表短句；其他輸出、selection、RNG 原樣一致。歷史 230／431 組與既有 snapshots 不改写。
- 新增三個 focused tests，納入 Prompt Quality：248/248。完整 frontend 最後一次 916/916；前一次 915/916 觸發既有未固定 angle 的 `engineSceneBaseCleanup.test.js:314` 地面斷言，保留歷史 flake 紀錄，不宣稱已修正。
- lint、build 通過；同 seed／200 cases strict audit 改前改後完全一致，零 blockers、23 個既有 diagnostics。Vite 大 chunk 提示維持。
- Saved Cards 十四組 selection 與文字保留；Markdown 匯出／匯入三版文字保留。但這批全無風格 fixture 的 Markdown 場景推導回到「全無」，只讀載入 `71b4b20` 舊模組已確認十四組同樣如此；屬既有推導限制，未改 codec，不宣稱 Markdown location ID 全通過。
- 本機 1440×1000／390×900 五工作區 smoke；十四組即時 Z 開頭、低／高機位切換、DLL Z／Gpt 切換完成。六張 Saved Cards 保留，未新增卡片或呼叫外部影像生成。手機 PAGE1 既有 375／411 橫向溢出仍在，未混入 CSS 修正；copy/download bytes 未重驗，整體 browser acceptance 維持 PARTIAL。
