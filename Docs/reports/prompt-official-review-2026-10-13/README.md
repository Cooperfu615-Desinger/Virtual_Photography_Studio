# 七種 Prompt 輸出 × 官方規範檢視報告

- 日期：2026-10-13
- 樣本版本：`codex/specified-actions-v1` @ `e86703e`。五組代表性 fixtures，其餘欄位一律「全無」，seed 固定。見 [samples.md](samples.md)。
- 性質：唯讀檢視。官方文件只採用各家官方來源，存取日期一律為 2026-10-13。**沒有實際送出任何生圖**，凡涉及「出圖效果」的判斷都是依官方文件推論，必須實測才能確認。
- 各模型的完整稽核（含官方來源 URL、樣本片段、改寫前後範例）：
  - [audits/gpt.md](audits/gpt.md)
  - [audits/z-image.md](audits/z-image.md)
  - [audits/midjourney.md](audits/midjourney.md)
  - [audits/nano-banana.md](audits/nano-banana.md)

> 判定分類
>
> - **違反官方**：與官方明文建議相反。
> - **可優化**：官方沒有規定，但可以改善。
> - **核准取捨**：Cooper 已核准或實測決定的設計，只提醒它的代價。

---

## 0. 結論

1. **四個模型各自的格式方向，大致都符合官方建議。**
   - GPT 的「分段＋小標題」、Z-Image 的「場景在前、分段敘述」、主 MJ 的「自然段落＋參數尾綴」，官方都允許，或屬於你實測後的決定。
   - 研究員沒有找到與你實測結論衝突的地方。
2. **問題集中在三種「跨模型共通」的毛病。** 它們來自共用的資料與串接函式，所以一次修正就能同時改善多種輸出。
   - 行內否定句堆疊。
   - 招牌文字沒加引號。
   - 串接造成的文法、標點瑕疵。
3. **各模型各有一個最需要注意的具體風險：**
   - **主 MJ 沒帶 `--ar`**：預設會用 1:1 生成。全身人像實際上是畫在方形畫布上。
   - **Z-Image 長度**：真實分詞後，約一半超過官方 pipeline 預設的 512 token。如果 Magnific 也在 512 截斷，尾段的服裝描述會被切掉。Magnific 的實際行為官方沒有說明（not_stated），需要實測。
   - **全身角色照**：用途是角色備份，但因為已核准的「GPT 省略獨立體態」規則，裡面沒有體態描述。
   - **MJ 胸上**：寫法沒有跟上已核准的主 MJ 精簡規則。

---

## 1. 依據的官方文件

| 模型 | 實際依據 | 版本說明 |
| --- | --- | --- |
| GPT Image | OpenAI API 文件〈Image prompting〉，含 GPT Image 2.5 prompting guide；輔以參數頁與 Help Center | 頁面沒有標示發布日（not_stated）。Cookbook 舊指南只寫到 gpt-image-2，已封存 |
| Z-Image Turbo | Tongyi-MAI 的 HF model card、GitHub README、官方改寫模板 `pe.py`、技術報告 arXiv 2511.22699 v5、diffusers pipeline、Magnific API `post-z-image` | Magnific 網頁介面的設定說明查不到（not_stated） |
| Midjourney | 官方 Help Center 的 Prompt Basics、Parameter List、Version 相容表、各參數頁，以及 V8／V8.1／V8.2 更新公告 | V8.2 是目前預設版本（2026-07-24），但沒有 V8.2 專屬的寫法文件 |
| Nano Banana 2.1 | 模型頁與 Model Card（2026-10-06）、Legacy 圖像生成頁、Cloud best practices 頁 | Google 沒有為 2.1 寫專屬 prompting guide。專案引用的 Cloud Blog 指南寫的是 Nano Banana 2 / Pro |

---

## 2. 跨模型共通問題（建議優先處理）

| # | 問題 | 影響的輸出 | 官方立場 | 證據 | 來源與修正方向 |
| --- | --- | --- | --- | --- | --- |
| X1 | **行內否定句堆疊**，例如純色棚一句連寫 8 個 `no wall corner, no floor seam…` | GPT、胸上、MJ、MJ 胸上、Nano | MJ 與 Nano **違反官方**（只寫想要的內容；MJ 要排除的元素改用 `--no`）。GPT、Z 沒有明文規定 | samples：normal-single | 來源在場景資料，而 C 規範 §5.2 **要求**純色棚寫這些排除語。資料規範本身與官方建議衝突。可選擇：(a) 改成正向描述，例如「單一連續的無縫黑色色場」；(b) 依輸出分流：MJ 改用 `--no`，其他輸出改成正向描述 |
| X2 | **招牌文字沒加引號**，例如 `TSUTAYA and STARBUCKS signage` | GPT、Z、MJ、Nano | 四家都建議：要畫出的文字放進引號，並說明位置與只出現一次 | samples：shibuya-moving-crowds | 場景資料或 renderer 加引號，範圍小 |
| X3 | **串接造成的文法與標點瑕疵**：`where visible., soft`、`line. dark blue`（句號後小寫）、句首小寫、缺冠詞（`wears white cotton camisole top`）、`aspect ratio, Chest-up` | GPT、胸上、Nano、Z | 官方沒有規定，屬**可優化**；AGENTS.md 允許 GPT 做格式整理 | samples：normal-single 等 | 共用串接函式（Nano 研究員推斷是 `engine.js` 的 `joinNaturalPromptValues`，未實跑確認）。修一次就能多處受益，風險最低 |
| X4 | **Z 的 `She wears,` 多一個逗號** | Z | **可優化**（文法錯誤） | 已重現：上身有版型選擇、但 Z 不輸出版型字句的組合，見 `tools/tops_probe.mjs` | 屬確定的 bug，範圍很小 |
| X5 | **壓縮後出現的語意矛盾**：主 MJ 刪掉 `where visible`，於是「黑色虛空」和「明亮白天天空」同時無條件成立；頭部主導近景同時寫 front view 與 90° 正俯拍 | MJ、Nano、GPT | **可優化** | samples：normal-single、head-dominant-top-down | 壓縮規則要保留限定詞；另需要「光線 × 場景」相容規則（資料庫報告 A6） |
| X6 | **族裔寫成 `Japanese or Korean`**，讓模型每次自己二選一 | GPT、胸上、全身角色照、Nano（MJ 已改成 `Japanese`） | **可優化**：官方強調一致性 | `engine.js:155` | 要不要鎖定族裔、怎麼鎖定，由你決定 |

---

## 3. 各輸出的重點

### 3.1 GPT（主輸出、胸上、全身角色照）

| 嚴重度 | 判定 | 重點 |
| --- | --- | --- |
| 高 | 核准取捨 | **全身角色照沒有體態描述。** 它是角色備份用，而官方建議可重用的角色描述應寫到身形比例；這和已核准的「GPT 省略獨立體態」衝突。如果你備份角色的方式是「把生成圖當參考圖」，就不受影響；如果是「把文字貼回去重新生成」，體態就會遺失 |
| 中 | 可優化 | 全身角色照沒有指定背景與表情。官方建立角色的範例使用素色背景 |
| 中 | 可優化 | 代名詞在主體出現之前就先使用；`Composition` 與 `Pose and Composition` 兩個標籤語意重疊；雙人構圖句裡有重複的 `loose`，語氣也像操作指令 |
| — | 待實測 | 標籤小標題格式符合官方規範，但**還沒有外部實測**。你目前實測接受的 ChatGPT 版本是沒有標籤的散文段落（integrated-regression V-02）。改格式前，建議先做 A/B 實測（audits/gpt.md §6） |

### 3.2 Z-Image

| 嚴重度 | 判定 | 重點 |
| --- | --- | --- |
| 高 | 違反官方預設長度 | 用真實 Qwen 分詞重算 200 筆 audit：平均 501 token、最高 676，有 97 筆超過 512。專案原本的估算低估了約 12%。雙人模式被截掉的會是場景與光線。**需要在 Magnific 實測**：在 prompt 尾端放一個明顯的元素，看它會不會出現在圖上 |
| 中 | 可優化 | 人物段是約 30 個逗號串起來的長鏈，屬性歸屬不清，例如 `jewelry accent, I–K cup bust`。可以改成依「身體／臉／髮／配件」分句 |
| 中 | 違反官方改寫模板的「客觀具象」原則 | `airy fresh beauty`、`transparent face`（「透明感」直譯）；`seductive stunning` 屬已核准的身份句，只提醒取捨 |
| 低 | 可優化 | 車廂固定構圖帶有說明句，例如「selected crop…may omit」 |
| — | 核准取捨 | 場景放在前面、空行分段、數值描述都和官方範例不同，但屬於你的實測決定，維持現狀 |

### 3.3 Midjourney（主 MJ、MJ 胸上）

| 嚴重度 | 判定 | 重點 |
| --- | --- | --- |
| 高 | 可優化 | **主 MJ 預設沒有 `--ar`。** 它跟隨 PAGE1 的比例設定，但 PAGE1 的比例欄位已退役成 none，所以會落到官方預設 1:1 |
| 高 | 違反官方 | 行內否定句（X1）。MJ 有專用的 `--no` |
| 中高 | 可優化 | **MJ 胸上沒有跟上主 MJ 的精簡規則**：仍有 `seductive stunning`、罩杯／身高／三圍數字，以及胸上畫面看不到的 `long legs`、`hips`；場景也被拆成兩段。另外，`chest-up-same-state-v1.md:19` 寫「不帶腰臀 anchor」，但 `chestUpSameState.test.js:79` 要求完整體態原文，**規格和測試互相矛盾**，需要你確認哪個才對 |
| 低 | 可優化 | `--c 0`、`--w 0` 等於官方預設值，是多餘的；`--s 25` 是你核准的設定，但會壓低 V8.2 的個人化效果，屬取捨 |
| — | 符合 | `--v 8.2`、`--raw`、`--sd` 在 V8.2 都有效；不使用 `--q`、`--oref`、`--turbo` 是正確的 |

**MJ 胸上要不要移除（由你決定）：**

- **支持移除**
  - 你很少使用。
  - 寫法已經和主 MJ 分歧。
  - 維護面廣。
  - 可以用「主 MJ 加 `--ar 4:5`」或官方的 Edit Model 重新取景來替代。
- **支持保留**
  - Saved Cards 等相容面需要處理。
  - 它保留了主 MJ 省略的細節，例如上衣圖案。
  - 和 GPT 胸上成對。
- **可選路徑**
  - (a) 維持現狀。
  - (b) 改寫成主 MJ 的風格。
  - (c) 只在 UI 隱藏，資料與存檔照舊。
  - (d) 完全移除。

### 3.4 Nano Banana 2.1

| 嚴重度 | 判定 | 重點 |
| --- | --- | --- |
| 高 | 違反官方 | 行內否定句（X1） |
| 中 | 違反官方 | 服裝、鏡頭、構圖大多是「開頭句加關鍵詞清單」，例如 `Shot on fisheye lens, …`。官方建議用敘事段落描述場景 |
| 中 | 部分違反官方精神 | 雙人輸出：開頭 `Two … subjects.` 是沒有動詞的不完整句；兩人沒有可區分的稱呼。官方建議替角色取名，Model Card 也說明多人一致性與左右定位仍是弱項 |
| 中 | 可優化 | 沒有選比例時，prompt 裡沒有任何比例訊號，官方說明此時預設 1:1 |
| 中 | 核准取捨 | 保留三圍、罩杯、身高數字。官方對此沒有說明；數字可能和既有形容詞重複，需要 A/B 實測 |

---

## 4. 建議處理順序（由你拍板）

| 優先 | 項目 | 風險 | 需要實測嗎 |
| --- | --- | --- | --- |
| 1 | X3、X4：文法與標點修正（共用串接函式） | 低。只整理格式，不改語意 | 不需要；用 fixture 前後比對即可 |
| 2 | X2：招牌文字加引號 | 低 | 建議抽查 |
| 3 | 主 MJ 預設 `--ar`，Nano 補比例訊號 | 低到中。會改變畫布比例 | 需要確認預設比例要用哪一個 |
| 4 | Z-Image 長度實測，再決定是否控制長度 | 中 | **必須先在 Magnific 實測** |
| 5 | X1：否定句改成正向描述，或 MJ 改用 `--no` | 中。要同時修改 C 規範 | 需要 |
| 6 | MJ 胸上的去留或改寫 | 中 | 看你選哪條路徑 |
| 7 | 全身角色照的體態、背景、表情；X6 族裔鎖定 | 中。牽涉已核准的設計 | 需要 |
| 8 | GPT 標籤格式 vs 散文段落；Nano 改成敘事段落；Z 人物段分句 | 高。屬結構性改寫 | 必須先做 A/B 實測 |

這些都會改變公開 Prompt，屬於「Phase 4」性質的工作。依 AGENTS.md，每一項都要經過：先補 fixture、同 seed 前後比對、strict audit、瀏覽器驗收。和[目錄資料架構規格](../../specs/catalog-data-architecture-v1.md)的 Phase 1–3 互不衝突；兩者都會改到 `engine.js` 時，再決定先後。

---

## 5. 需要你決定

1. **優先 1、2**（文法標點修正、招牌加引號）：風險低、不改語意，要不要先做？
2. **主 MJ 預設比例**：要預設哪一個？或依景別自動帶入，例如全身 2:3、胸上 4:5？
3. **MJ 胸上**：要走 (a)、(b)、(c)、(d) 哪一條？另外，規格和測試對「胸上帶不帶腰臀描述」的矛盾，哪一邊才是你要的？
4. **全身角色照**：要不要讓它例外帶回體態描述，並加上素色背景與中性表情？
5. **族裔寫法**：維持 `Japanese or Korean`、鎖定其中一個，還是開放成 UI 選項？
6. **Z-Image 長度**：你方便在 Magnific 做一次截斷實測嗎？做法見 [audits/z-image.md](audits/z-image.md)。

---

## 6. 檔案與重現

- [samples.md](samples.md)：七種輸出 × 五組 fixtures 的實際樣本
- `audits/`：四份逐項稽核
- `tools/`：
  - `official_samples.mjs`：重新產生樣本
  - `tops_probe.mjs`：上身組合實跑，可重現 X4
  - `z_scan.mjs`、`qwen_bpe.mjs`：Z-Image token 計數
- 腳本內有寫死的 scratchpad 或 repo 絕對路徑，重跑時請改成你的輸出位置；在 `webapp/` 目錄執行
- 研究員下載的官方文件原文副本屬版權內容，**沒有**收進 repo
