# 丹寧吊帶褲低掛／單邊解扣驗證

2026-11-17；需求與範圍見 [規格](../../specs/denim-overalls-low-hips-v1.md)。

## 結果與範圍

兩款 catalog 英文改為核准新來源；主 MJ 保留衣物配色、完整低掛／單邊解扣穿法及 She wears。特殊配色整段留在同一衣物；雙人配色獨立。只有高腰與正常腰線暫停，儲存選值不刪除，換回相容褲款即恢復。

其他單品沒有資料改動。來源 ID、順序、語意標籤與圖片不變；舊全文追加 alias。無 Saved Cards 資料遷移，舊公開文字不改寫。C2 舊字數報告與歷史 prompt seals 保留，新增精確來源逆向處理僅供隔離測試副本，未知修改不被接受。

主要檔案：

- Catalog：`knowledge_base/catalog/Wardrobe/褲裝-pants.json`；sync 生成 `knowledge_base/wardrobe_and_styling.md`、`webapp/src/data/database.json`。
- Runtime：`webapp/src/lib/engine.js`、`engine/denimOveralls.js`、`engine/bottomRiseCompatibility.js`、`engine/midjourneyNaturalPrompt.js`。
- 測試：`engine/denimOveralls.test.js` 與 Prompt Quality 清單；`scripts/lib/denimOverallsHistory.json`、`denimOverallsHistoricalReplay.mjs`、`videoReferenceReplay.mjs`；`scripts/tests/test_c2_rendering_classification.py` 的兩筆精確歷史對照。
- 文件：本批規格、穿搭維護指南、主 MJ 規格及本報告。

## 驗證紀錄

- Catalog sync 及唯讀 check：通過；歷史 registry 基準 `5e896979331421fe567807067ce490bb16f6b3de`。
- Python schema／歷史／來源工具：60/60。
- Catalog integrity／semantics／legacy 工具：32/32；strict integrity 0 blockers，兩筆既有精確 allowlist 保留。
- 公開資產：207 檔通過。
- Focused：8/8，含兩款七輸出、無色／深藍色、所有下身色票、雙人、腰線暫停／收藏恢復、新舊 alias、MJ 文法及 inverse 信任邊界。
- 額外景別／固定構圖：50 組通過；新英文匯入與配色還原 4 組通過。
- 其他褲款：64 組固定 seed，全部輸出、選值、structured、summary 雜湊與修改前相同。
- 最終完整 frontend：2,319/2,319（544 秒）；Prompt Quality：956/956（493 秒），包含特殊配色補強。
- lint、build、git diff --check：通過；build 保留既有大型 chunk 提示。
- strict audit：前後相同 seed `prompt-quality-baseline`、200 組，皆 0 blockers／24 項既有診斷，無新增回歸。

驗證使用 Node 22.22.3。初次 npm 的子程序誤選到 PATH 上的 Node 25，舊 runner reporter 斷言失敗；其後以只調整暫存 shell PATH 的方式使用 Node 22 重跑，未變更專案 dependency 或 runner。

## 瀏覽器

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/`；獨立瀏覽器資料，不使用／改動使用者現有收藏。

1440×1000、390×900：兩款切換、無配色／深藍、高腰／正常腰線停用、保留 latent 選值、換回直筒牛仔褲恢復高腰、主 MJ 預覽／實際剪貼簿、加入最愛／套用還原、DLL 完整版主 MJ 與來源逐字一致。六工作區導航 smoke 共 12 項，加桌面衝突狀態共 13 項；手機另操作短褲切換與停用選項。

全部頁面無 console error、page error、破圖或 document 水平溢位。已檢視六工作區桌面／手機截圖與兩張穿搭設定局部畫面。保留 [桌面](desktop-overalls-conflict.png)、[手機](mobile-overalls-conflict.png) 截圖及 [幾何檢查](browser-checks.json)。

未送外部生圖、未執行部署、未 stage／commit／push。原有 109 個修改／未追蹤檔案已比對 SHA-256，內容不變。分支 main，HEAD 同開發基準。

## 實際 Prompt

[四組 × 七輸出全文](actual-prompts.md) 使用固定 seed `denim-overalls-v1`、一位人物、全身鏡頭、無額外表情與其他可選設定全無；無配色及深藍色各兩款。公開參數沿用引擎結果，不手工調整。

## 本批交付授權

使用者已驗收本批並授權只提交及推送兩款吊帶褲來源、主 MJ 配色／穿法、腰線相容處理及必要測試文件；其他未提交內容保持原樣。上方未提交／未部署記錄為本機驗證當下狀態，實際 Git 交付與部署結果以本次提交及其 Actions 執行紀錄為準。
