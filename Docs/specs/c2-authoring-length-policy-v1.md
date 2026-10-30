# C2 英文來源長度診斷與例外 v1

2026-10-30；可信 main `cde8a470049dbcf0d7427bba552bb174317de668`。本批只新增唯讀診斷、測試及規範追溯，不修改公開英文、ID、metadata、排序、renderer、收藏或歷史基準；不 commit／push。

## 計詞與範圍

入口 `python3 scripts/check_authoring_lengths.py`，JSON 只輸出至 stdout，無自動寫入、修正或截斷。讀取 catalog/index.json 列管的 Wardrobe、Locations、CameraLighting、Regional 正式 JSON，僅計 en；中文 desc、legacyPromptAliases、其他欄位與 runtime 組裝句不計入。同一來源只計一次，全無不列入。

英文／數字串是 token；內部 ASCII 連字號、斜線、撇號、句點及 & 可連接同一詞。high-waisted、A/B、35mm、f/1.8、user's 各一詞；分隔標點、中文與空字串不計。en dash 與 × 是分隔符，C–D 兩詞、4×1 兩詞。這是來源診斷計詞，不是模型 tokenizer 或輸出 token 預算。

## 規範優先序

專屬核准來源／結構契約優先於一般長度建議；長度不授權刪除任何視覺事實。一般規則來源見 policy 每分類 spec。一般穿搭6–20、一般配件4–16（腰部配件依專屬指南6–16）、套裝／連身12–32、特殊穿搭35–85；依現行指南對齊，舊腳本鞋5–18／襪4–16等不再當成正式共用門檻。

複雜材質／剪裁可到24、複雜場景可到35、純色無縫棚景可到55是人工審閱條件，不因關鍵字自動升限。場景先依一般12–28作診斷，專屬場景10–30；是否適用較寬區間要記錄來源理由，不能將所有 Studio Sets 都當成純色攝影棚。

圖案、配色、外套版型／開合／穿法等未有一致一般區間者標 unclassified。相機與底片共用分類有不同責任及下限，本批不硬套同一範圍。unclassified 不是合格或錯誤。外套穿法三筆有專屬來源契約，即使沒有一般字數區間，仍驗證其來源指紋。

## 結果與例外

under／over／within／unclassified 都是診斷，不會因字數使 CLI 失敗。within 不代表沒有冗詞；over 不代表應縮短。例外不隱藏原計詞、範圍或診斷，而附加 reviewed 資訊。

scripts/lib/authoringLengthPolicy.json 的例外以永久 ID、完整英文 SHA256、審閱 commit、規格路徑、kind 與 reason 綁定。specific_contract 表示有專屬核准文字／例外；necessary_structure 表示有已記錄的結構保留理由，不宣稱規格另核准了數字上限。七筆初始清單為三項外套穿法、有線耳機、乳膠拉鏈洋裝、X形胸貼及創可貼造型胸貼；不是所有超長資料的完整豁免清單。

ID 不存在／重複、英文變更、規格檔缺失、空理由、非法 commit 格式、未知 kind、分類／範圍錯誤皆失敗。路徑必須在專案內。英文變更後先重新審查，不能機械更新 SHA。規格存在檢查不等於自動判斷文字支持性，仍須人工審閱；Git 來源追溯由本批保護證據與實際來源測試驗證。

## 維護與驗收

Python unittest discovery 自動包含本批測試，沿用既有 CI 的 Python 檢查入口，不改工作流程設定。驗證計詞邊界、空值、超長仍成功、未知分類、過期來源、失效依據、CLI非零失敗及執行前後來源位元組不變。

本批沒有產品輸出或 UI 改動，驗收為聚焦／完整Python、固定Git來源與產生物保護、唯讀sync、文件連結、diff-check。不以未執行的前端／瀏覽器／生圖驗收宣稱完成；無產品差異故不重跑這些閘門。

## 後續

下一批才逐項審閱五筆長腰鍊的泛稱尾句，保留層數、材質、吊飾與腰臀落點。套裝尾句及場景／光學各自另批；不全域刪 styling／silhouette，不以字數回填短名稱。其他 C 類、PAGE2 舊匯入、J12、P5b 不併入。

2026-10-30 後續：腰部下限與五筆審閱已由 [C2 腰鍊批次](c2-waist-wording-v1.md) 接續；原七筆例外保留，追加三筆必要結構，總數10。本文件第一批的範圍與驗收紀錄為當時狀態。
