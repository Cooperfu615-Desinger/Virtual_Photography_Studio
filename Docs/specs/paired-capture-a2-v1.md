# A2 上下配色抓拍相容 v1

> 2026-10-28 現行狀態：本批與原先列為「另批」的 A2 相依工作已完成實作與交付；統一追溯見 [Phase 4 結案](../reports/phase4-completion-2026-10-28/README.md)。下方授權／待辦文字保留當時時點，現行行為以結案索引中各後續規格為準。P5b 暫緩。

2026-10-27。可信 main：`58516b20c6631b1a61faa48ee22abfb05ea29384`。Cooper 授權本機實作與完整驗收；不 stage／commit／push。舊連身結構化及純文字還原另批，其他項目與 P5b 排除。

本機驗收已完成，待 Cooper 驗收；固定 Git、完整測試、歷史回放與桌手機結果見本批報告。未 stage／commit／push。

## 問題與限定結果

42 組上下配色的方案有 ID，內部 `topColor`／`bottomColor` 只有 zh／en／hex。引擎把這些原始色塊放入已解析衣物配色欄位，舊快照驗證卻要求所有非空值都有 ID，導致合法人物來源整份被拒絕。影響目前可操作的單人分件及既有連身／套裝引擎相容路徑，不只舊連身。

本批只修改 `observationCaptureImport.js` 的驗證契約，不新增色塊 ID，不改色票、配色優先權、catalog、engine、renderer、穿搭互斥、UI、storage key 或 version 1 快照結構。

## 快照驗證契約

- 保留原本 null 與帶字串 ID 物件的相容分支。人物／衣物必要欄位、全身文字、版本及選值結構檢查保持。
- 新增無 ID 色塊只允許 `topColor`、`dressColor`、`bottomColor`、`outfitPresetColor`、`outfitPresetPrimaryColor`、`outfitPresetContrastColor` 及既有 A／B 對應欄位；A／B 是既有資料形狀，不開放雙人抓拍。
- 無 ID 色塊只含 zh、en、可選 hex；zh／en 為非空文字，hex 若存在須為六位十六進位色碼。
- 必須有同人物 `topBottomPalette`，具非空且非 none／random 的方案 ID；上衣／連身／套裝主色只對應其 topColor，下身／套裝對比色只對應 bottomColor。
- 色塊與來源的 zh／en／hex 及欄位存在性必須完全一致；不借其他人物、其他部位或不明欄位的色值。不補 ID、不替換色塊、不把精細顏色縮成一般色票。
- 正規化深拷貝原資料；未知或錯誤的新增無 ID 形狀原子拒絕，不部分匯入。既有帶 ID 分支的歷史容忍度不在本批重新收緊。

## 資料流與保留邊界

一般預覽使用原引擎一次解析；快照保存該次完整 character／wardrobe／wardrobeColors、resolved selection、rawSelection 與全身文字。原始 random 保留在休眠一般選值；匯入人物的 selection 與配色已固定。抓拍重抽不重新抽人或配色，明確重新匯入才換來源。

JSON、Markdown／ZIP、收藏套用及重載沿用原格式。保存的公開原文與全身 reference 不改寫。一般六輸出、選值與 RNG 不變；既有合法抓拍來源與生成保持。新來源的抓拍輸出沿用同一固定 Git 引擎。

`dressId + topBottomPaletteId` 可沿引擎既有相容路徑建立抓拍來源，但工作台還原仍按原互斥規則清除上下配色。純文字的同 ID 套裝／連身判定、顏色辨識及胸上區域投影均不修。不得藉本批新增 UI 組合或改選值優先權。

## 驗收與歷史

1. 保存 main、追蹤檔 SHA、其他工作目錄 HEAD／狀態／dirty SHA、200 同 seed strict audit；先加入失敗回歸再修改。
2. 固定 Git 普通引擎對照完整 Prompt／六輸出／選值／RNG，僅排除頂層 id/date。第二個隔離 oracle 只略過舊 ID-only 驗證一行以暴露可信生成案例的原始完整快照；不得把此略過帶入產品。實際快照須與原始來源完全一致，非法形狀由獨立負向回歸驗證。
3. 42 組 × 上衣、褲裝、裙裝、24 連身及套裝相容路徑，補上隨機解析、全無、景別、完整色系、雙人及角色卡排除。穿搭互斥與還原對照固定 main 保持。
4. 驗證抓拍生成／重抽／明確重新匯入、JSON／Markdown／重載、深拷貝、所有合法色塊欄位及畸形／錯配／缺來源拒絕。
5. 精確 inverse 先驗證全部來源與測試 SHA，再只寫隔離副本；缺檔、未知、混合或真實 Git checkout 原子拒絕。回放上一批特殊穿搭原工具及完整 A2／A1／A5 鏈，A～E 封存不重錄。前批已解決的抓拍 null 斷言更新為當前契約，舊版本由 inverse 還原後驗證。
6. Node 22 聚焦、完整前端、Prompt Quality、lint／build；200 同 seed audit；sync --check、歷史 ID／strict、Python、目錄工具、公開資產檢查。
7. 5175 桌面 1440×1000／手機 390×900：實際選上下配色、首次匯入、隨機／全無、回一般模式、重新匯入、重抽、來源切換、六輸出複製、收藏、單張／ZIP、重載及六工作區。確認 console／page error、溢位及圖片；不呼叫外部生成 API。

[決策](../decisions/2026-10-27-a2-paired-capture.md) · [驗收報告](../reports/paired-capture-a2-2026-10-27/README.md)。本機結果、使用者驗收及 Git／CI 交付分開記錄。
