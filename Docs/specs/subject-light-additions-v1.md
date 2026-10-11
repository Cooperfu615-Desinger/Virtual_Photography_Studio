# 六款人物主光新增 v1

日期：2026-10-11。狀態：實作及本機驗證完成；使用者已授權本批 commit／push，Git 交付狀態以遠端核對為準；未另行手動部署。

## 1. 範圍與成功條件

在既有光線表現清單尾端新增六款，不覆寫原 25 款或全無。新增後共 31 款有效光線與全無（32 個選項）。

- 正面強硬光描述人物前方主光；機頂直閃描述近鏡頭軸線閃光，兩者不要求人物轉身。
- 方向、硬度及主要布光身份在第一片語完成，主要亮暗特徵在前兩片語完成。
- 僅描述人物受光，不指定過曝、背景變黑、燈架、攝影棚、服裝、人物姿勢或鏡頭參數。
- 支援室內、戶外、棚內、日間補光、夜間與全身景別。臉部布光在臉可見時呈現其特徵，不改選中的背面、側面或頭部方向。
- GPT／Z-Image／MJ 及胸上兩組共用同一次選擇與來源，沿用各自格式與精簡政策。
- 全身角色參考照仍固定 clean even lighting，不繼承這些主攝影光線。

## 2. 唯一英文來源

編輯來源為 `knowledge_base/camera_and_lighting.md`。新增列的 index 為 26–31：

| 名稱 | 英文 | ID 尾碼 |
| --- | --- | --- |
| 正面強硬光 | `strong hard key light from in front of the subject, bright frontal highlights and compact crisp shadows, preserved skin and clothing detail` | `正面強硬光:26` |
| 機頂直閃 | `hard direct flash from near the camera axis, bright highlights on the visible subject and crisp compact shadows, natural light falloff` | `機頂直閃:27` |
| 蝴蝶光 | `raised frontal butterfly key light on the subject, a small centered shadow beneath the nose, defined cheekbone highlights` | `蝴蝶光:28` |
| 倫勃朗光 | `raised oblique Rembrandt key light on the subject, a small light triangle on the shadowed cheek, pronounced facial modeling` | `倫勃朗光:29` |
| 分割光 | `side split key light on the subject, one facial half illuminated and the other in shadow, clear light-dark separation` | `分割光:30` |
| 下方硬質主光 | `hard upward key light on the subject, upward-cast nose and brow shadows, bright lower facial planes` | `下方硬質主光:31` |

ID 前綴維持 `camera:光線表現-light-style:`，舊選項原位不動。

## 3. 相容性與資料流

獨立主光的 metadata 由 `knowledge_base/item_metadata.json` 維護，再經 `scripts/sync_to_json.py` 同步。`subjectLight.independentKey`、核准名稱與 `subjectLight.sourceEn` 必須共同吻合才使用窄範圍豁免；`sourceEn` 只是來源一致性 pin，renderer 不由此取得第二份英文。

新款可主動補光，因此不套用舊的「日光不能配人工光」及 portrait-only 景別限制；室內外支援範圍仍由 supports tags 決定。改寫英文時必須同步審查 pin，未知或改文來源 fail closed。舊 25 款、窗光／陽光／雨夜限制不放寬。

新增款不重寫使用者的 Ambient Light Conditions，不移除原場景，也不自動附加快門、曝光、焦段或光學濾鏡。手動主光可以與環境形成有意的照明差異，不能以此聲稱任何組合都能在外部模型完美呈現。

Runtime 保持：GPT 完整有效來源；Z 取前兩片語；MJ 依模式及長度保留原核心；胸上 GPT/MJ 同狀態；全身角色照固定均勻光。公開映射、輸出欄位、Saved Cards、匯入還原、storage schema 與 UI 結構不變。Public output contract `1.49.0`。

## 4. 回歸與驗證計畫

- 先寫 focused red tests，再追加來源與局部相容性。
- 舊 26 選項 ID／英文／metadata 不變；固定 seed、182 組既有選擇的 1092 個輸出與 selection 雜湊前後比對。
- 六款逐字來源、來源責任邊界、三主與胸上輸出、全身參考照隔離、None 沉默、背面／側面、固定場景、雙人與匯入還原。
- 室內／戶外／棚內、日／夜、全身的選單矩陣，及未知來源不能取得豁免的反例。
- 專項與代表性 fixtures、完整 frontend suite、Prompt Quality、lint／build、同步 check、Python 測試、公開資產、diff-check。
- `200 / prompt-quality-baseline` strict 前後稽核；隨機池因新增選項會改變合法抽樣，既有診斷與新阻擋須分開比較。
- 桌面 1440×1000、手機 390×900 實選六款、檢查輸出／回填／收藏消費者，並 smoke 五工作區、console、破圖與 overflow。

以上僅驗證本機功能及 Prompt 來源，外部模型的光效區隔仍需使用者實測。

## 5. 本機驗證結果

- 新增來源與相容性專項：28/28 通過；獨立唯讀審查未發現需修正事項。
- 既有 182 組固定選擇、1092 個六組輸出及 182 個 selection 雜湊全部不變；排除新增六列後，生成資料庫與 HEAD 全庫一致。
- `npm run test:prompt-quality`：627/627；`npm test`：1470/1470。使用 TAP reporter 記錄完成狀態。
- `npm run lint`、`npm run build`、`git diff --check` 通過；build 只有既有的大型 chunk 提醒。
- `sync_to_json.py --check` 通過；Python unit tests 2/2；公開資產檢查 206/206。
- strict 同 seed 前後：200 prompts、blocking 0、contract 0、leakage 0、contradiction 0；22 個非阻擋診斷前後不變。
- 隔離瀏覽器：桌面 1440×1000／手機 390×900。桌面六款逐一比對三主輸出及兩組胸上輸出，確認全身角色照仍為固定均勻光；室內／戶外日夜矩陣、文字回填、Saved Cards 套用與手機六款選取通過。五工作區均待實際內容載入後檢查，無 console／page error、破圖或頁面水平溢位。
- 介面測試工具原生 select 操作遇到判定錯誤；先確認 select 與 option 均未停用，再以選單 change 事件驗證狀態及實際輸出。未改 UI 原始碼或繞過產品相容性規則。
- 瀏覽器證據保存在 `/tmp/vps-subject-light-v2-vurUuO/`，使用獨立瀏覽器資料，不接觸使用者收藏或 API 設定；未觸發外部圖像生成。
