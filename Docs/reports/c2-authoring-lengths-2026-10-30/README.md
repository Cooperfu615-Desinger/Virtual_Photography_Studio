# C2 第一批：長度規範與診斷護欄驗收

2026-10-30；main 基準 `cde8a470049dbcf0d7427bba552bb174317de668`。本機驗收通過，未 stage／commit／push。

## 完成內容

新增唯讀 scripts/check_authoring_lengths.py、authoringLengthPolicy.json、8項聚焦測試及三份指南的政策銜接。資料只從正式 catalog 讀取；只計 en，不改產品資料或產生物。七筆初始例外保存永久ID、英文SHA256、固定Git版本、規格與理由，不自動豁免其診斷。

新政策涵蓋858筆非全無來源：659 within、71 over、22 under、106 unclassified；詳細逐筆結果見 diagnostics.json。範圍含穿搭／場景／攝影／風格，與舊穿搭456筆的48超標／18過短不可直接比較；不是冗詞數量或缺陷數量。七筆例外不是完整超長清單的逐筆審查結果。

## 驗收

- python-final.log：51/51（既有43＋本批8）；初次 focused.log為加入Git來源檢查前7項，最終以完整日誌為準。
- 計詞涵蓋空白、連字號、縮寫、數字、標點、中文；不計desc及aliases。
- 過長僅診斷且CLI成功；過期SHA、缺ID、重複例外、失效／越界文件、空理由、非法版本／commit、錯誤區間會失敗。
- 真實例外的固定Git來源與en指紋逐筆核對；在臨時測試資料執行CLI前後檔案位元組完全一致。
- sync.log：唯讀同步／schema／1,050歷史ID及8份產生物通過。
- protection.json：正式來源、webapp/src及既有歷史報告與固定Git逐檔一致；沒有staged files。
- 既有CI使用完整Git歷史且已執行Python unittest discovery，所以護欄自動納入；未修改CI設定，尚未推送，無新CI結果。
- 文件連結與git diff --check通過。

本批只有工具、測試與文件，未改renderer、資料、UI或收藏；未執行前端全套、瀏覽器或外部生圖，不以過往結果代替本批驗收。C4既有原生選單操作限制保持。

## 下一批與排除

五筆腰鍊的英文精簡尚未開始。套裝尾句、場景／光學及其他C類另批；PAGE2舊匯入、J12與P5b繼續暫緩。歷史報告不回寫，短句不為達下限補字，長句不自動截斷。

[規格](../../specs/c2-authoring-length-policy-v1.md) · [決策](../../decisions/2026-10-30-c2-authoring-lengths.md)
