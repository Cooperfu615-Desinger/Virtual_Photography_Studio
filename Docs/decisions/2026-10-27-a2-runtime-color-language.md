# 2026-10-27 A2 runtime 配色句決策

Cooper 核准將後續順序 2＋3 合併，依序驗證後一次交付；基準 main 為 `bd31bd34f0bfa8986193a6048fe1a69a265e3668`。本批只改完整造型色系、通用主／次色與連身上下區域三種 runtime 句型。

- 完整色系保留九個原始 `en` 全文，使用 `outfit palette:`，刪除 shift／preserving 生成操作指示。既有 Z 縮寫及 AI 精簡政策追加新句型辨識，舊句型仍支援。
- 主／次色明確描述 `primary/secondary garment in` 或 detail-only `with`。不推斷通用套裝哪件是上衣或下身，也不將 secondary 改成固定細節。
- 連身改用 `dress palette from top to bottom:`；原上／下區域、顏色、次序保留。最初縮成 `dress palette:` 的候選被固定 Git 對照拒絕，因原 bottom 字樣參與裁切分類，會使胸上新增配色片段；最終句型保留空間描述與既有分類責任。沒有更改分類器或放寬 oracle。
- 已具體化的 `target set to color`、固定金屬／飾邊、材質消費、固定黑色下身、襯衫專用色系分支都不改；它們已承載衣物目標責任，全面刪除會破壞前批 40 套裝約定。
- 新舊 Markdown 只增加新句型入口；原公開全文、舊別名、JSON／快照版本、優先序、A/B 歸屬及矛盾色票處理保持。正式 catalog 與生成物零差異。
- 抓拍原始來源與重新組裝輸出分開：保存的全身文字／快照不改，使用相同選值重建的主輸出採新 runtime 描述；明確重新匯入才換來源。不可用「舊快照保持」誤稱所有重建輸出逐字不變。
- 特殊穿搭 Saved Card 套用時完整色系回到全無，是基準 main 的既有 UI 行為；本批以反例保護並列為下一項獨立修復，未處理。
- 舊連身＋上下配色固定案例在 main 即無法取得抓拍全身來源；現行 UI 亦保有完整造型／分件配色互斥。本批保護引擎相容路徑及舊快照文字，不把此限制當成本次回歸或額外修復。
- 新歷史 inverse 只針對六份已審查程式／測試／回放入口變動，先驗證全部來源再寫隔離副本；前批工具與 A～E 封存保持原版。舊 recovery fixture 取精確前版來源，再接原 immutable hash 檢查，現行行為由新回歸另驗。

實際驗收數字與命令以[本批報告](../reports/wardrobe-runtime-color-a2-2026-10-27/README.md)為準。Cooper 已驗收通過並授權限定提交／push 本批；實際 Git 與對應 CI 另行核對。特殊穿搭色系套用與舊連身相容限制另批，不進入其他項目或 P5b。[完整規格](../specs/wardrobe-runtime-color-a2-v1.md)。
