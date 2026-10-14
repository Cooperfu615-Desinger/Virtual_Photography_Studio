# GPT 獨立 Body Type 省略 v1

Last updated: 2026-10-14

Status: 使用者核准範圍已實作，本機自動檢查與桌面／手機瀏覽器驗證通過；Git 交付依分支紀錄核對，未手動 deploy。

Public output contract: `1.52.0`。Z／AI 的獨立體態來源政策及其他專屬契約版本不因這次 GPT 省略而變更。

## 目標與範圍

GPT 的人物描述不再輸出 A 區獨立「體態 (Body Type)」選項所提供的身形、罩杯、比例、身高或三圍來源。成年人物身份與原有五官、膚質、髮型、髮色、神情、穿搭及姿勢保留；這是 GPT 完整保留規則的限定例外，不是其他來源的壓縮或重寫授權。

所有輸出仍從同一次 resolved selection 與共用結構化模型建立。只在 GPT 呈現層省略獨立 Body Type 來源，不清空、替換或重新抽選選值，不從完成的 Prompt 以通用身體詞彙刪除內容。

| 輸出 | 獨立 Body Type 規則 |
| --- | --- |
| 單人 `Gpt` → `grokPrompt` | 省略已解析的獨立 Body Type；包括使用相同 GPT renderer 的既有單人模式。 |
| `胸上特寫照` → `chest-up-portrait` | 省略獨立 Body Type；保留同一拍攝狀態與胸上姿勢、服裝、場景及攝影政策。 |
| `全身角色照` → `full-body-character` | **2026-10-14 例外：保留**獨立 Body Type，放回省略前的原位置（主體句之後、五官之前）；保留單人、`9:16`、自然站姿及完整頭到腳的服裝／配件用途。見下方「全身角色照例外」。 |
| 雙人主 `Gpt` → `grokPrompt` | 分別省略 Woman 1／Woman 2 的獨立 Body Type，保留人物歸屬、成年身份與姿勢。 |
| `Grok/Z-Image` → `zImagePrompt` | 保留同一獨立 Body Type 完整英文，沿用 [體態目錄 v2](body-type-catalog-v2.md)。 |
| `AI` → `midjourneyPrompt` | 保留同一獨立 Body Type 完整英文，不因這次 GPT 變更恢復舊短正向 anchor。 |
| ~~`MJ 胸上特寫照` → `chest-up-mj-portrait`~~ | 2026-10-14 已移除（[官方規範修正 v1](prompt-official-fixes-v1.md)）。 |

雙人模式原本不產生三組單人衍生輸出，此限制不變。「全無」仍維持無體態來源，不產生 `none`、通用身材替代句或新的模型操作說明。

## 全身角色照例外（2026-10-14）

Cooper 核准：全身角色照的用途是「組出好造型時匯出的角色備份」，缺少體態會讓備份無法重現人物身形，因此全身角色照恢復輸出獨立 Body Type。

- 只有 `full-body-character` 恢復；主 `Gpt` 與 `chest-up-portrait` 維持省略，雙人主 GPT 維持各角色省略。
- 位置與省略前相同：`Subject Count`／`Reference Guidance` 之後、`Facial Features` 之前；文字為該選項的完整英文來源，不改寫。
- 「全無」仍不輸出體態；角色卡、特殊角色沿用原本的路徑。
- 實作：`buildGptPromptSectionSources(..., { includeBodyType: true })` 只由全身角色照呼叫。
- 驗證：304 組 fixtures＋隨機組合中只有全身角色照變動（206 份），全部是在 Subject 段插入體態來源，其他段落一字未改。詳見 [官方規範修正 v1](prompt-official-fixes-v1.md)。

## 保留邊界

- 只省略獨立 Body Type 欄位（單人的 `bodyTypeId`、雙人的 `bodyTypeAId`／`bodyTypeBId` 及其已解析來源）。不刪除人物成年身份，也不改人物數量、主體稱呼或年齡語義。
- Character Card 的結構化 `profile.body`、permanent identity anchors、歷史相容 `identityAndBody` 與匯入身份片段維持原契約。角色卡內建的身體描述不屬於此獨立欄位省略範圍。
- Pose Composer canonical pose、姿勢中的軀幹／骨盆／四肢幾何、承重與接觸，以及胸上投影後仍有效的姿勢描述不變。全身角色照維持原本自然站姿，沒有引入主 Prompt 的姿勢或場景。
- 服裝的版型、剪裁、材質、罩杯、貼合、緊繃、覆蓋或衣料效果屬於服裝來源，不能因含有身體詞彙而一併省略。特殊主體、特殊造型或其他已選來源內建的人物描述同樣保留。
- 不改資料庫英文、中文名稱、stable IDs、選項順序、抽選、UI 控制、Generation Summary、公開欄位／labels／按鈕、browser-storage keys 或 storage schema；不新增替代 Body Type 描述。
- 其他 GPT 已核准的 Scene／Lighting 可見性、Composition 與胸上同狀態例外繼續適用；這次沒有擴大其模式或來源範圍。

## 收藏與文字匯入相容性

結構化 generated selection、Saved Cards 與相同資料的匯入／還原仍保存 `bodyTypeId`、`bodyTypeAId`、`bodyTypeBId`。重新生成時，GPT 採用本省略規則，Z／AI／MJ 胸上繼續使用同一選值的完整來源。已存卡片的舊 Prompt 文字不批次改寫。

省略後的純 GPT 文字不再包含可用來反推出獨立 Body Type 的來源，不能保證僅憑此文字恢復原體態選項；缺失值沿用既有文字匯入流程，不用姿勢、穿搭、數值或角色卡 body 猜測原選值。需要保留選擇時使用已包含結構化 selection 的既有收藏／匯出格式，無須新增 storage migration。

歷史 GPT 文字中仍存在的 Body Type 正式英文與 `legacyPromptAliases` 保持可解析；舊基本體型、柔和沙漏及其他歷史來源的 ID 映射不變。匯入成功後重新生成的 GPT 省略獨立來源，其他模型保留來源。不得為了讓新 GPT 純文字還原得到體態而把來源藏回其他段落。

## 回歸與驗證範圍

聚焦回歸須先覆蓋六種體態與全無、各景別、衣襬遮蓋、單人三組 GPT 輸出、雙人逐人來源，以及 Character Card／特殊主體隔離。相同 resolved selection 下，GPT 只移除本契約列出的獨立來源與其專用格式；成年身份、canonical pose、服裝及其他有效描述不變。Z、AI 與 MJ 胸上需逐字不變。

相容性回歸覆蓋結構化 Saved Cards／selection 還原、舊 GPT 完整體態來源與 alias 解析、新 GPT 純文字缺乏體態證據，以及沒有修改資料庫、UI 或 storage schema。原歷史 fixture 留作追溯，不以重新錄製全量預期隱藏未核准差異。

完成門檻依 [根目錄 AGENTS.md](../../AGENTS.md)：相關 renderer／Body Type／import-restore tests、Prompt Quality、完整前端 tests／lint／build、同 seed `200 / prompt-quality-baseline` strict audit，以及桌面／手機受影響輸出與全部六個現用工作區 browser smoke。知識庫來源未改時不執行資料生成作為本變更；資料同步檢查可確認來源與生成資料仍一致。

本機驗證（2026-10-11，前端 Node 22.22.3）：

- 完整前端 `npm test -- --test-concurrency=4`：1517/1517；`npm run test:prompt-quality -- --test-concurrency=4`：674/674。聚焦回歸覆蓋六體態／全無、單人三 GPT、雙人 A/B、成年身份、姿勢、33 張角色卡及新舊文字／結構化還原。
- `npm run lint`、`npm run build`、`python3 scripts/sync_to_json.py --check` 與 `git diff --check` 通過。知識庫、生成資料、角色卡及原歷史 JSON fixtures 未改；Vite 既有大型 chunk 提示保留。
- 修改前後以相同 `200 / prompt-quality-baseline` 執行 strict audit：均為 0 blockers，19 項既有服裝／場景診斷及 3 項近似重複，沒有新增診斷。沒有為降低診斷數量改寫其他行為。
- 同 seed `gpt-body-omission-oracle-v1` 的 410 組前後案例（200 隨機、210 控制）比較：1181 份非 GPT 輸出逐字相同；1132 份 GPT 中 936 份按預期改變，其餘來源、選值、結構化 pose 與 summary 不變。以測試專用 helper 精確補回省略來源後，1132 份 GPT 與原基準逐字相同；24 份歷史 JSON fixture 雜湊維持原值。
- 瀏覽器 `http://127.0.0.1:5175/Virtual_Photography_Studio/`：1440×1000、390×900，28 項檢查通過。確認六體態在 GPT 主／胸上／全身省略、其他模型保留、雙人逐人歸屬、實際 GPT 複製、Saved Card 套用、舊 GPT 回填，以及角色卡複製／匯回 PAGE1。六個工作區（Prompt 工作台、角色建模、動作姿勢、場景建模、觀察式抓拍、Saved Cards）均檢查並留存畫面；沒有非預期頁面橫向溢位、失敗圖片、console／page error 或外部 POST。原生選單使用現有 DOM change event 驗證 React 操作路徑；沒有重新驗收 OS 下拉選單鍵盤行為。

本機證據：`/tmp/vps-gpt-body-{full,quality,lint,build}-complete.log`、`/tmp/vps-gpt-body-audit-{before,after}.log`、`/tmp/vps-gpt-body-sync-check.log`；410 組比較與 inverse 結果在 `/tmp/vps-gpt-body-oracle-20261011/`；瀏覽器狀態與 16 張桌面／手機畫面在 `/tmp/vps-gpt-body-browser-20261011/results.json` 及同目錄 PNG。

實際 GPT／ChatGPT 生圖接受情況尚未以外部生圖測試驗收。
