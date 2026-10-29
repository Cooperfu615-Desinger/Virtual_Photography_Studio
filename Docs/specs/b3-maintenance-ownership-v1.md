# B3 維護責任與精準護欄收尾 v1

2026-10-29，基準 main `916cdc10fcf82380fd39481d414f46b9a5aa834f`。本批只新增維護文件與驗收護欄，不改 runtime、資料、Prompt、ID 或收藏；不 commit／push。

## 維護責任

| 內容 | 正式維護位置（專案相對路徑） | 消費者與修改責任 |
| --- | --- | --- |
| 角色身份、四個永久錨點、身形、髮型、完整相容文字 | `webapp/src/lib/engine/characterProfiles.js` | PAGE1 引擎與 PAGE2 經 `characterCardLab.js` 讀取同一 profile；`identityAndBody`、`legacyIdentityAndBody` 與完整 en 保留相容用途，不從穿搭重建身份。 |
| 角色穿搭原文及 profile 組合配方 | `webapp/src/lib/engine/characterWardrobeSources.js` | profile outfit/accessories 與 PAGE2 layer 共用；只允許同角色引用。依用途更新原文、配方及新的審閱依據，不覆蓋舊基準。 |
| PAGE2 圖層 metadata、髮型相容政策、接管與輸出組裝 | `webapp/src/lib/characterCardLab.js` | 屬工作區行為設定，不複製身份或共用穿搭原文。圖層鍵、順序、標籤及選值視為相容介面。 |
| 角色穿搭 MJ 簡稱 | `webapp/src/lib/engine/midjourneyCardItemNames.js` | 簡稱是獨立投影文字，需逐角色逐圖層對應正式來源；不能要求與完整描述逐字相等，也不由逗號切割生成。 |
| 角色參考圖片 | `knowledge_base/character_reference_manifest.json` | 負責資產 ID／目錄／來源圖／預覽圖。用 `scripts/check_public_assets.py` 驗證發布資產，不把圖片檔名或視覺推測當作 Prompt 來源。 |
| 選單角色順序 | `webapp/src/lib/engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER` | 控制顯示順序，不是第二份角色身份資料；保持 ID 與既有順序。 |
| 一般目錄及歷史映射 | `knowledge_base/catalog/index.json`、分類 JSON、`legacy_mappings.json` | 依 catalog README 維護，生成 Markdown/database 不手改；A～E 已有 schema、ID／歷史及同步護欄，不為 B3 重做搬移。 |

## 保留例外與不搬移理由

118 段同角色穿搭原文已共用；16 段例外依 `scripts/lib/b3CharacterWardrobeReview.json` 保留：6 joining、1 word-order、2 state-wording、7 extra-detail。這是用途差異記錄，不表示已確認額外視覺細節正確。內容修正須另訂範圍及新回歸。

完整 legacy en、身份相容欄位、MJ 簡稱、圖片 manifest 各自承擔不同責任，保留原位。禁止藉本批統一文字、裁切描述、改髮型政策或重寫收藏原文。PAGE2 舊匯入、J12、C 類、P5b 排除。

## 護欄分工

- 既有 catalog strict：五組角色 ID 集合、身份必填欄位、四個永久錨點；既有 B3 護欄驗證 33 角色、134 圖層、118 共用、16 例外及配方。
- 本批新增 `scripts/lib/b3MaintenanceChecks.mjs`：MJ 名稱角色集合及每角色圖層集合精確相同，名稱必須是非空字串。只檢查責任與完整性，不宣稱能自動判斷名稱語意是否正確。
- `webapp/src/lib/b3Maintenance.test.js` 正反案例覆蓋缺／多角色、缺／多圖層、空白／null，以及允許不同投影文字。檔名由既有 `npm test` 自動納入，既有 CI webapp-quality 執行並阻擋失敗；不另改已封存的 catalog 工具。
- 圖片沿用 public assets 檢查；正式打包沿用 `check_prompt_bundle.mjs`，不重複寫另一套弱檢查。

## 驗收與後續維護

本批應執行前端全套、品質、lint／build、catalog strict、同步檢查、Python 與資產檢查及正式產物初始化。正式來源與歷史檔對基準 Git 必須零差異，因此公開輸出、ID、收藏及 RNG 行為不因本批改變。沒有 UI/runtime 修改，不新增瀏覽器互動契約。

將來新增角色或圖層：先確認身份來源及 ID，再維護共用穿搭與 PAGE2 metadata，補 MJ 名稱及必要圖片 manifest，最後跑上述檢查。改名／增減 ID 必須另有遷移授權；不能刪測試或重錄歷史基準讓變更通過。

交付狀態補記：Cooper 已確認本批驗收通過，授權只提交／推送本批護欄、測試、文件與證據；上方未提交為驗收時點紀錄，實際 CI／部署結果於交付後核對。
