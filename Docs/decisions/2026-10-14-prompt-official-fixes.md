# 2026-10-14 官方規範修正：決策紀錄

- 規格：[prompt-official-fixes-v1.md](../specs/prompt-official-fixes-v1.md)
- 前置報告：[七種 Prompt 輸出 × 官方規範檢視](../reports/prompt-official-review-2026-10-13/README.md)

## Cooper 的決定（2026-10-14）

| 項目 | 決定 |
| --- | --- |
| 文法標點、招牌加引號 | 先修 |
| MJ 比例 | 依景別自動帶入；F 區設定的 `--ar` 實測有效，維持優先 |
| 景別比例對照 | 採建議組：近景與胸上 4:5、中景 3:4、牛仔中景／全身／未選 2:3、固定構圖沿用 |
| MJ 胸上特寫 | 完全移除 |
| 全身角色照 | 帶回體態；素色背景與中性表情維持現況 |
| 族裔 | 主體句移除，改「20 歲成年女性」；由五官特徵承接 |
| 五官選「全無」 | 不指定族裔 |
| 無族裔字樣的五官 | 甜美可愛→日系、冷感高級→韓系、成熟性感→韓系（2026-10-14 確認文案） |
| 角色卡成年身份句 | 這次不動 |
| Z-Image 長度 | Comfy Cloud 不截斷，不處理 |

## 技術路線決策（可逆，限本專案）

| 決策 | 理由 | 放棄的方案 |
| --- | --- | --- |
| 在獨立 worktree（`.worktrees/prompt-official-fixes`，分支 `claude/prompt-official-fixes`）實作，基於 `main` | 主 checkout 停在 Codex 進行中的 `codex/specified-actions-v1`，不可干擾 | 在主 checkout 實作：會改到 Codex 的分支；基於 Codex 分支：依賴未合併的工作 |
| 文法標點用出口統一整理（`polishPublicPromptText`） | `She wears,`、`.,` 的產生路徑分散多處，逐一修源頭容易漏；統一整理只動標點大小寫，可用規則證明零內容差異 | 逐一修各 renderer 的串接：改動點多、難驗證 |
| 不補冠詞 | 需處理單複數與不可數名詞，容易引入錯誤文法 | 一併補冠詞 |
| 凍結基準以「由舊值轉換」或「精確反向函式」更新 | 保留「只改了預期內容」的可證明性 | 直接用新輸出覆蓋基準：失去保護作用 |
| `CAUTION` 不加引號 | 是印刷字不是招牌，且有 3 處正規式綁定原文 | 一併加引號：範圍超出核准 |
| 匯入時把「等於景別自動比例」的 `--ar` 視為自動帶入 | 否則匯入會讓 PAGE1 憑空多出比例，連帶改變 GPT 等輸出 | 不處理：破壞 Saved Cards 還原的相容性 |
| 全身角色照的體態放回省略前的原位置 | 與歷史輸出一致，風險最低 | 放在主體段尾端：與舊版不一致 |
| 即時調整 F 區時從 selection 重算景別比例，與 Saved Cards 匯入共用同一函式 | 否則一改 stylize 等參數，自動帶入的 `--ar` 就消失 | 把景別比例存進 selection：會改變 selection schema（相容面） |
| MJ 胸上移除後，舊 Saved Cards 資料保留、畫面不顯示 | 符合「完全移除」，同時不刪任何使用者資料 | 繼續顯示舊卡的 MJ 胸上：不符合「完全移除」；刪除舊資料：不可逆 |
| `renderAiPrompt` 舊渲染鏈暫以 lint 例外保留 | 整串清除屬大型重構，AGENTS.md 要求不與功能移除合併 | 一併刪除：diff 過大、風險高 |
| Nano 五官描述也補族裔 | Nano 以自己的五官幾何取代原文、原本無族裔；主體句拿掉族裔後會完全失去族裔線索，補上才符合「族裔由五官承接」 | 只改共用 `en` 與 `mj.face`：Nano 會沒有族裔 |
| 主體句與 3 條五官的舊英文登記為 `legacyPromptAliases` | 舊卡片匯入時仍能辨識人數（尤其雙人）與五官 | 不登記：雙人舊卡可能被誤判為單人 |
| 接受冷感、成熟的推論 `archetype` 由 `null` 變 `korean` | 推論函式看到 Korean 字樣會設此標籤；它只在「抽五官」時篩選候選，而抽五官前只抽體態、所有體態 archetype 皆為空，因此對抽選與輸出零影響，只改變 structured 內部值。凍結雜湊以反向函式還原 | 為避免標籤而改寫推論規則：擴大修改範圍，且之後的目錄資料化（catalog-data-architecture-v1 Phase 3）本來就會處理推論標籤 |

## 已知、未處理

- `enginePromptPipeline.test.js:934`（雙人、無固定 seed）在未修改的 `main` 上 20 次失敗 4 次，屬既有不穩定測試，未擴修。
- `chestUpSameStateBaseline.json` 沒有任何測試引用（測試基準更新時發現），未同步，留待 Cooper 決定是否刪除。（2026-10-20 P5a 刪除：沒有任何測試讀取，見 `Docs/specs/expression-pose-v2-p5-cleanup-scope.md`；內容保留在 git 歷史。）
- `scripts/tests/prompt_audit.test.mjs` 第 153 行的測試在未修改的 `main` 上就失敗（16 過 1 失敗），且沒有任何 CI 或 npm 指令執行它；本次修改後維持相同結果，未擴修。
- `fixedFramingDerivedPromptFixtures.js` 的 `mjSemanticReuse` 在 MJ 胸上移除後已無人使用，未刪除，列入後續清理。
- `renderAiPrompt` 與其舊渲染鏈的刪除，列入後續專門的舊程式碼清理。
- `enginePromptDeduplication.test.js:58` 沒有固定 seed，隨機頸飾抽到「蕾絲緞帶頸圈」時會失敗（抽 400 次約 0.25%），與本次無關，未修改。
- `scripts/prompt_generator.py` 是未被引用的舊腳本，仍含舊主體句，未修改。
