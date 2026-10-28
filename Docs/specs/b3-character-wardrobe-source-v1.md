# B3 角色穿搭共用來源 v1

2026-10-28；已授權實作，本機驗收通過，不 stage／commit／push。固定 main：`887b149a42047bbc3bc1adbb45aa0f68c9e5487e`。

## 範圍與契約

33 張角色、134 段 PAGE2 圖層；118 段可在同角色 profile.outfit/accessories 逐字找到，16 段用途差異保持。新 `webapp/src/lib/engine/characterWardrobeSources.js` 維護圖層文字與同角色 profile 組合配方；兩個既有模組引用新來源，對外資料形狀及序列化次序不變。配方只允許同角色圖層引用及原文字片段，禁止跨角色借用或依逗號即時推斷圖層。

角色 profile 的完整 en、成年身份、永久四錨點、身形、髮型、攝影方向不改。PAGE2 髮型適用設定、圖層鍵／標籤／次序、眼鏡與穿搭接管保持。PAGE1 full-default 與 selected-layers 原行為保持，兩頁全部六輸出、選值、RNG、收藏原文與結構化變體逐字等價。MJ 名稱表與圖片 manifest 不搬。

## 逐筆責任與例外

完整 134 筆來源表及修改前角色資料：`scripts/lib/b3CharacterWardrobeReview.json`，綁定本批 Git 基準。每筆有角色 ID、圖層、來源欄位、原文 SHA、原 profile、類別與保留理由。

16 段差異：6 段 joining（Sakura/Yuri 上身、Yuna/Nana/Miku 鞋襪、Kaori 頸飾）；1 段 word-order（Miku 領結）；2 段 state-wording（Yui/Grace 赤腳 default/locked）；7 段 extra-detail（Rei 外套、Amy 上身及鞋、Minji 上身、Manami 外套、Kaori 外套及戒指）。不裁定額外細節的視覺真偽、不合併兩份文案、不修改赤腳政策。後續內容修正需另有規格及新回歸。

角色完整 en 是既有相容文字，本批不重建。共用來源不是要求所有用途字串相同；原標點、順序、連接詞保留。外部使用者取得獨立 layer map，來源深度凍結，避免消費者互相污染。

## 護欄與維護

CI 現有 strict 入口增加 CHARACTER_WARDROBE_SOURCE 檢查：角色集合、同角色引用、欄位／圖層集合、118 共用引用、16 明示差異與完整原文核對；失敗不能降成 possible。原 CARD_LAYER_DUPLICATION 提示改成同角色 outfit/accessories 比對，不再搜尋其他角色或完整 en。J12 兩個允許值不改。

後續有意修改穿搭時，須先決定用途、更新此來源與當批審閱表／測試；原歷史基準不可重錄來掩蓋差異。不能只改組裝後字串或把 source ref 改回重複 literal。

## 驗收與邊界

固定 Git 對照全部角色物件／圖層順序、PAGE2 六輸出、PAGE1 各景別與單雙人、抓拍／重抽、JSON 原文／重載；測純人物、單層、全套、眼鏡與 override。新護欄測缺角色、缺圖層、跨角色引用、文字漂移、重複 literal、配方順序與偽造例外。測歷史 inverse 缺失／竄改／混合時原子拒絕，接回原 PAGE2／Phase 4／A2／A1／A5 鏈。前端全套、品質、lint/build、同 seed 200 audit、sync/schema/ID、strict、目錄及資產閘門；桌手機六工作區與角色選層／帶回 PAGE1／收藏操作。

PAGE2 Markdown/ZIP 與 J12 依 Cooper 指示暫緩，維持既有結果；C 類與 P5b 不在範圍。只驗證保存相容，不修上述匯入缺口，不呼叫外部生圖模型。

## 可重跑的正式驗證路徑

使用 Node 22；先在根目錄執行：

```sh
node scripts/b3_character_wardrobe_acceptance.mjs
node --test webapp/src/lib/characterWardrobeSources.test.js webapp/src/lib/characterWardrobeHistory.test.js webapp/src/lib/page2AdultIdentityHistory.test.js webapp/src/lib/engine/phase4History.test.js webapp/src/lib/engine/chestDressRegionHistory.test.js
node scripts/b3_character_wardrobe_guard_acceptance.mjs
python3 -B scripts/b3_character_wardrobe_gates.py
node scripts/b3_character_wardrobe_history.mjs
```

瀏覽器工具 `node scripts/b3_character_wardrobe_browser.mjs` 讀取本批 acceptance baseline，需先啟動 5175 專用 Vite 服務，並以 `PLAYWRIGHT_MODULE` 指向安裝的 Playwright。歷史工具只操作隔離副本，不覆寫正式來源。驗收結果預設寫入 `/tmp/vps-b3-wardrobe/`；正式報告是本批獨立目錄，不覆蓋過往證據。

修改前另存所有 tracked 檔案雜湊、其他工作目錄 HEAD／status／dirty 雜湊後，以 `python3 -B scripts/b3_character_wardrobe_protection.py <修改前快照> <本批輸出.json>` 驗證。這是當次工作區保護紀錄，不是可對任意未來 HEAD 套用的通用快照。

本批結果與原始證據見 [驗收報告](../reports/b3-character-wardrobe-2026-10-28/README.md)。
