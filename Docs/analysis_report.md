# Virtual Photography Studio 分析與驗證報告

## 報告日期

- 2026-03-15

## 分析範圍

- 專案結構與目前可執行內容
- 前端 webapp 建置與靜態檢查
- prompt 生成邏輯驗證
- 資料同步腳本檢查
- 可維護性、效能與測試覆蓋狀況

## 專案概況

目前專案以 `webapp/` 的 React + Vite 前端為主，搭配 `knowledge_base/` 作為資料來源，並透過 `scripts/sync_to_json.py` 同步成前端使用的 JSON。  
專案另有一支 `scripts/validate_prompt_logic.mjs` 可對 prompt 生成結果進行規則驗證，但尚未建立正式的單元測試或整合測試框架。

## 本次執行的驗證

### 1. 前端靜態檢查

執行：

```bash
cd webapp
npm run lint
```

結果：

- 通過

### 2. 前端正式建置

執行：

```bash
cd webapp
npm run build
```

結果：

- 通過
- build 產物摘要：
  - `dist/index.html`：0.55 kB
  - `dist/assets/index-BLOkGGcE.css`：10.10 kB
  - `dist/assets/index-Dub_5Zah.js`：463.74 kB

### 3. 資料同步腳本

執行：

```bash
python3 scripts/sync_to_json.py
```

結果：

- 通過
- 成功解析所有知識庫 markdown 並同步到 `webapp/src/data/database.json`
- 本次同步後未產生額外 git diff

### 4. Prompt 邏輯驗證

執行：

```bash
node scripts/validate_prompt_logic.mjs 500
```

結果：

- 共生成 500 筆 prompt
- 其中 33 筆存在規則異常
- 異常率約 6.6%

Issue summary：

- `廢墟場景抽到棚燈`：29
- `泳裝仍抽到褲裝`：3
- `古典服裝落在強都市街頭場景`：1

為了確認是否為偶發問題，另外補做 5000 筆抽樣檢查：

- `廢墟/地下場景 + High Key Studio`：241 筆，約 4.82%
- `泳裝 + 褲裝`：23 筆，約 0.46%
- `古典服裝 + 都市街景`：5 筆，約 0.10%

結論：異常不是偶發，而是生成規則本身存在可重現的邏輯漏洞。

## 主要發現

### 1. 高優先級：場景與光線的相容規則過寬

涉及檔案：

- `webapp/src/lib/engine.js`

關鍵位置：

- `locationSupportsLighting()`
- `getSceneDependentOptions()`

問題說明：

目前 `locationSupportsLighting()` 的判斷採用「只要命中任一支援條件就通過」的模式。  
這會讓同時帶有 `indoor` 標記的廢墟類場景，誤通過 `supports_indoor` 的棚燈，例如 `棚內商業平光 (High Key Studio)`。

實際影響：

- 會產生明顯不合理的 prompt 組合
- 前端下拉選項與實際生成都會同步受到影響
- 驗證腳本已確認此問題具有穩定重現性

建議：

- 把規則改為「硬性排除優先」而不是「命中任一支援即放行」
- 對 `ruin`、`underground`、`subterranean` 等場景先明確排除 `studio_light`
- 將 `場景主類型` 與 `環境補充標記` 分開處理，避免 `indoor` 把廢墟誤當成一般室內

### 2. 高優先級：服裝組合缺乏互斥約束

涉及檔案：

- `webapp/src/lib/engine.js`

關鍵位置：

- `wardrobeFitsLocation()`
- `buildWardrobe()`

問題說明：

目前服裝邏輯主要只驗證「單件服裝是否適合該場景」，但沒有驗證「服裝與服裝之間是否互斥」或「整體造型家族是否一致」。

這導致以下問題：

- 泳裝仍可能搭配褲裝
- 古典服裝可能落在強都市街景
- 多種風格家族可能被拼接成不自然組合

建議：

- 增加 wardrobe family conflict matrix
- 先決定主 outfit family，再限制可搭配的下身、外套、鞋款與配件
- 對 `swimwear`、`victorian`、`baroque`、`lolita`、`schoolgirl` 等高語意類別加上明確互斥規則

### 3. 中優先級：核心邏輯集中在超大型檔案，維護風險高

涉及檔案：

- `webapp/src/lib/engine.js`
- `webapp/src/App.jsx`

現況：

- `webapp/src/lib/engine.js` 約 1904 行
- `webapp/src/App.jsx` 約 746 行

問題說明：

生成規則、資料推斷、prompt 組裝、選項過濾與 UI state 高度集中，會造成：

- 修改一段規則時難以掌握回歸風險
- 功能拆分與重用困難
- 測試不易聚焦
- 新增規則時容易互相干擾

建議：

- 將 `engine.js` 至少拆成以下模組：
  - catalog/data normalization
  - meta inference
  - compatibility rules
  - prompt builders
  - validation helpers
- 將 `App.jsx` 拆出 storage hooks、prompt actions、filters 與 export utilities

### 4. 中優先級：批次生成存在可見效能浪費

涉及檔案：

- `webapp/src/lib/engine.js`

問題說明：

`generateSinglePrompt()` 每次生成 prompt 都會重新呼叫 `buildCatalog(customLibrary)`。  
這在小量互動時不明顯，但在大量抽樣或未來 batch generation 擴充時，會成為可見瓶頸。

觀察：

- 本次 5000 筆抽樣執行時間明顯拉長
- 問題很可能與重複建立 catalog 有關

建議：

- 在 `generatePrompts()` 外層先建一次 runtime/catalog，再傳入單筆生成函式
- 或針對 `customLibrary` 做 memoization / cache

### 5. 低優先級：有重複工具函式，增加維護成本

涉及檔案：

- `webapp/src/App.jsx`
- `webapp/src/components/PromptCard.jsx`

問題說明：

`buildMarkdownExport()` 在兩個檔案中各自存在一份相同邏輯。  
目前功能仍可運作，但之後若修改 markdown 匯出格式，很容易出現兩邊不同步。

建議：

- 抽成共用 utility，例如 `webapp/src/lib/exporters.js`

## 測試與品質現況評估

### 已有優點

- `lint` 可正常執行
- `build` 可正常完成
- 有一支可用的 prompt 邏輯驗證腳本
- markdown 資料同步流程清楚，且本次可正常重建 JSON

### 目前缺口

- 沒有正式測試框架
- 沒有單元測試
- 沒有整合測試
- 沒有針對 prompt 規則的 CI 驗證
- 沒有 deterministic 測試機制，難以對生成行為做穩定回歸驗證

## 建議優先處理順序

### 第一階段：先修 correctness

1. 修正 `locationSupportsLighting()` 的硬性排除規則
2. 為 wardrobe 建立 family 互斥約束
3. 把 `scripts/validate_prompt_logic.mjs` 裡已經存在的規則持續擴充，作為修正驗證基準

### 第二階段：補測試基礎建設

1. 導入 Vitest
2. 將場景/光線、服裝互斥、style/location 相容性拆成可測函式
3. 針對已知錯誤案例建立固定測試
4. 將 prompt 驗證腳本納入 CI 流程

### 第三階段：改善維護性與效能

1. 拆分 `engine.js`
2. 拆分 `App.jsx`
3. 移除重複 utility
4. 避免每筆 prompt 重建 catalog
5. 評估 bundle 大小，必要時做拆包或延遲載入

## 總結

目前專案在「可以建置、可以執行、可以生成內容」這個層面是健康的，基本工作流可用。  
但從 correctness 角度來看，prompt 組合規則仍有明顯漏洞，尤其是場景與光線、以及服裝互斥邏輯，已經能穩定重現不合理結果。

換句話說，現在最大的風險不是專案跑不起來，而是「生成結果品質不穩定」。  
如果接下來要提升整體可信度，最值得優先投資的方向是：

- 先修核心相容規則
- 再補可自動化驗證
- 最後做模組化與效能優化

## 附註

- 本次分析未修改專案程式碼
- 本次分析期間工作樹中原本就存在一個未追蹤檔案：`Docs/DUO_MODE_DESIGN_BRIEF.md`
