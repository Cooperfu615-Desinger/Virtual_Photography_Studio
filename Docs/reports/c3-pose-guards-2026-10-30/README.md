# C3 現行說明護欄與六筆隱藏狀態驗收

基準 `3127c66d2f64dacc3d3fe9bcaa1015435c0670fa`，包含最新 GPT Image 2／Pika 相關提交；本批沒有變更那些產品功能。本機驗收通過；未 stage／commit／push。

產品來源只改 poseComposerOptions.js 六個 uiHidden:true。英文／ID／名稱／說明／排序／其他 metadata、現行 UI、舊鎖值解析及收藏原文保持。95 筆舊未標隱藏缺說明不批次補寫；加標後統計變 90，是分類改變，不是補齊五筆說明。

## 驗收證據

| 項目 | 結果／證據 |
| --- | --- |
| 固定修改前基準 | before.json.gz，624 組：54 動作、六 anchor 各適用 base、頭部×視線、拍攝方式、各 base 隨機 anchor，乘六景別 |
| 六輸出／選值／RNG／舊收藏 | c3_pose_acceptance 與 guard-final.log：完全一致；收藏沿用修改前公開原文 |
| 本批與 C4 相鄰回放／執行器 | focused-final3.log：24/24 |
| 完整前端 | tests-complete.log：2,049/2,049 |
| 最後追加全基底隱藏護欄 | guard-final.log：5/5；產品程式未再改動 |
| Prompt Quality | quality-complete.log：853/853 |
| lint／正式建置 | lint-complete.log、build-final.log；初次 lint-final.log 的 process import 錯誤已修正 |
| 同 seed audit | audit-before.log 與 audit-after.log 逐位元組一致，200 筆，0 blocking |
| 同步與目錄 strict | sync.log、catalog.log 通過；既有 allowlist／診斷保留 |
| Python／資產 | python.log：43/43；assets.log：207 檔 |
| 正式打包啟動 | bundle.log：33 角色、無反向 engine 依賴 |
| 歷史資料保護 | protection.json；固定 Git 前後 SHA 核對、歷史報告／目錄／registry 不變、無 staged files |
| 逐筆清單 | inventory.json：現行動作說明、現行頭部借用及各舊陣列狀態 |

初次 tests.log、tests-final.log 為遇到歷史來源不符後中止的排查紀錄，focused-final.log／focused-final2.log 保留中間銜接失敗；最終以 tests-complete.log 與 focused-final3.log 為準。歷史鏈先精確反轉 C3 產品來源與兩個銜接檔，再依既有 C4 規則處理；未重錄封存或放寬未知來源／正式工作目錄拒絕條件。

## 瀏覽器

使用本機正式版 preview、隔離 Chromium，1440×1000／390×1000。各尺寸逐類檢查54筆動作的非空說明，實際點擊六分類各一筆，以及全無／隨機／任意；確認全無的手勢停用提示、舊七欄位未出現、無 document overflow／console／page errors。browser/results.json 保存結果，browser/*-dialog-detail.png、*-none.png、*-standing-dialog.png 保存畫面。已目視檢查手機對話框及桌面全無狀態，內容可讀；對話框內部捲動保留。

六工作區桌手機共12檢查通過，見 browser/workspaces.json。沒有觸及真實收藏或付費生圖。現有 C4 原生下拉滑鼠操作限制仍保留；本批按鈕／對話框驗收不等於解除該限制。指定動作本身 pending／accepted 等出圖狀態完全不改，本批不聲稱影像品質驗收。

[規格](../../specs/c3-pose-description-visibility-v1.md) · [決策](../../decisions/2026-10-30-c3-pose-guards.md)
