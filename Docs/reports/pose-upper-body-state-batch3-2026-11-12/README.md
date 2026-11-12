# 六個一般跪姿的中景／胸上基本姿態：第三批

2026-11-12。基準 main `03f2664465351d06abe890445f55b0e1f6791f3d`；使用者核准六個一般跪姿、七輸出／場景支撐／收藏還原驗證，並授權每步通過後 commit／push 至 main。規則及修改前證據已先交付 `9ffbe80b`。正式文字與排除範圍見[第三批規格](../../specs/pose-upper-body-state-batch3-v1.md)。

## 行為與來源

跪坐、分腿跪坐、側坐跪姿及單膝前跨跪姿原本在中景／胸上省略，本批補回來源已有的跪姿身分與軀幹方向。前傾、直立端正兩筆保留原上身片段，只補 `She is kneeling.`。來源仍由 `specifiedActions.js` 的六筆既有動作提供，沿用現有共用投影器，沒有修改 renderer 或新增 UI。Public output contract 為 `1.68.0`。

頭部主導近景保持原省略／原片段。全身、牛仔及無景別保留完整動作；Grok Imagine 保留完整有效姿勢，全身角色照維持自然站姿及 `9:16`，胸上衍生維持 `4:5`。原 clauses、ID、名稱、說明、排序、驗收、隨機資格、手勢／手機／模式接管及選值保持。

普通 Z 因補回姿勢而啟用既有同場段落時，沿用[版本 C](../../specs/z-image-scene-first-tidy-v1.md) 的組裝。405 個固定案例中，四個原省略跪姿 × 兩個主景別 × 一般／巴黎，共 16 個主 Z 開頭由 `Photorealistic editorial portrait.` 成為既有 `Photorealistic editorial portrait of one young adult woman.`。測試以精確案例白名單與 before／after 開頭鎖定此既有連動，再逐字比對其餘公開文字；未新增 renderer 例外。

## 場景支撐、快照與保存

實際資料表為 84 室內／72 戶外，共 156 個既有場景；相較原 83／71 歷史清單，各多一筆既有 LAWSON。共 218 個候選、22 個表面名詞，另有每場景的未指定。本批沒有修改場景或表面資料。中景／胸上不新增表面或膝蓋接觸；有效 `indoorKneelId` 保持，完整姿勢與 Grok Imagine 沿用同一次有效表面。

[修改前快照](before.json.gz) 在 runtime 變更前擷取，包含 405 個一般／接管／非目標案例及 24,684 個完整場景支撐案例，共 25,089 案／175,611 份公開輸出；雙人依原契約為五組，其餘一般案例為七組。每案同 seed 比較解析選值、structured 來源、摘要、RNG 與非核准差異。

330 張合成收藏涵蓋六動作 × 11 個景別選項 × 室內／戶外／巴黎三種情境，加上六動作 × 22 種表面名詞。JSON／Markdown／ZIP 公開原文及有效選值還原後，重新生成須對應同一七組輸出。舊公開文字另有測試，保持直到使用者明確重新生成。

## 歷史保護

原基準、seals 及前兩批的 gzip 證據保持。[獨立 revision](baseline-revision.json.gz) 直接計算原 1,528 列／17,220 個樣本，只記錄六個一般跪姿的 924 列核准差異，其餘 604 列保持。此歷史矩陣仍使用原 83／71 場景，兩筆既有 LAWSON 由本批完整場景矩陣覆蓋。

新 inverse 封存 11 個明確既有來源／測試入口的精確 before／after 與 SHA256，先還原第三批，再回放前兩批原始斷言。未知來源不套用 inverse；負例驗證缺列、非目標變更及核准列的未審查變更均會失敗。

## 驗證結果

| 檢查 | 結果 |
|---|---|
| 第三批聚焦測試 | 6／6 通過；25,089 案／175,611 份公開輸出 |
| 收藏及匯入 | 330 張合成卡的 JSON／Markdown／ZIP、有效選值及七輸出重新生成通過 |
| B3／B2／B1 inverse 與 revision 負例 | 5／5 通過 |
| 前兩批原始測試及手勢 | 47／47 通過 |
| 完整前端測試 | 2,292／2,292 通過，並行度 2 |
| Prompt Quality | 947／947 通過，並行度 2 |
| ESLint／build／production bundle 載入 | 通過，保留既有大型 chunk 提示 |
| strict audit | 前後各 200 筆、`prompt-quality-baseline` seed，報告逐位元相同，0 blocking、24 既有 diagnostic |
| 文件連結／`git diff --check` | 通過 |

聚焦檢查的第一輪捕捉到上述 Z 開頭連動，核對既有版本 C 後，以精確 16 案白名單鎖定，沒有修改 renderer。修改前預期失敗、首次差異與最終成功 log 均保存在 `validation-logs/`。歷史 guard 第一次執行早於新 revision 產生，待檔案完成後已全部重跑通過。完整前端及 Prompt Quality 均取自最終成功輪次。

各 log 解壓正文與截圖的 SHA256、案例數及影像像素尺寸見 [validation.json](validation.json)。

## 桌面與手機

在 5175 的隔離預覽，以 CUA 操作 IAB，實測桌面 CSS viewport 1440×1000、手機 390×900。六動作 × 中景／胸上 × 兩 viewport 共 24 狀態，逐一確認五組適用輸出的跪姿片段、七組輸出、有效支撐，以及同分頁重新整理後七組文字一致。六種實際支撐為地板、沙發、閱讀桌、木板、榻榻米及沙地。

另外完成：前兩批坐姿／蹲姿與側躺各中景／胸上，共 12 個桌手機保護狀態；沙地切未指定及切到教室時失效清除、再選地板；窗邊日光＋側向柔光＋左側機位；新增一張含七組原文的合成收藏、七個詳情分頁、套用與重新整理；PAGE3 巴黎場景建立／匯入後保留單膝跪姿，且不出現手動表面。

桌手機各切換 DLL 的七個來源，共 14 次文字一致檢查；沿用「套用目前預覽」及「帶入 Prompt 工作台來源」流程，桌面另確認胸上來源 `4:5`、全身角色照 `9:16`。六工作區在桌手機各完成載入與版面檢查，共 12 次，未發現 document 橫向溢位、破圖或 console error／warning。觀察紀錄見 [observations.json](browser/observations.json)。

截圖包括[桌面七輸出](browser/desktop-seven-outputs.jpg)、[桌面支撐](browser/desktop-initial.jpg)、[手機支撐](browser/mobile-half-kneeling.jpg)、[手機收藏](browser/mobile-saved-grok.jpg)與各工作區。CUA 回傳 JPEG 的可視範圍像素尺寸與 CSS viewport 不完全相同，實際尺寸逐檔記錄於 validation.json；版面寬度判斷使用頁面 DOM 的 viewport／client／scrollWidth。

預覽只使用 18 張預載合成收藏、記憶體 local/session storage、同分頁 window.name 與獨立 IndexedDB 命名空間，Firebase 停用；操作時新增的兩張亦為合成資料。隔離測試 1／1 通過。Chrome 驗證連線未成功後改用 IAB 完成全部驗收，兩個自有測試分頁均已清理；5175 驗證服務亦已關閉。

## 保留內容與限制

其他 session 的兩份文件及 100 份未追蹤研究／參考檔，連同歷史 baselines、seals 與前兩批 gzip，共 353 個已記錄原檔均核對 SHA256 保留。未改 catalog、registry、資料格式、私有收藏或正式 provider 設定。

本批沒有外部 Speed／Quality 付費生圖，實際模型效果仍待使用者驗收；剪貼簿內容未重測。桌手機頁面及文字檢查不代替圖像模型品質驗收。提交使用 `[skip ci]`，本批交付範圍為 main commit／push，不部署。
