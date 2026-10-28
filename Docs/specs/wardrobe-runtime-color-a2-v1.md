# A2 runtime 穿搭配色描述 v1

> 2026-10-28 現行狀態：本批與原先列為「另批」的 A2 相依工作已完成實作與交付；統一追溯見 [Phase 4 結案](../reports/phase4-completion-2026-10-28/README.md)。下方授權／待辦文字保留當時時點，現行行為以結案索引中各後續規格為準。P5b 暫緩。

2026-10-27；Cooper 核准順序 2＋3 合併實作，依序驗證後統一交付。可信 main：`bd31bd34f0bfa8986193a6048fe1a69a265e3668`。Cooper 已驗收通過，並授權限定提交／push 本批；實際 Git 與對應 CI 結果另行核對。

## 1. 結果與責任

只調整共用穿搭 builder 的三種 runtime 描述，以及消費新句型所需的窄幅 Z／AI 與舊文字還原辨識。資料、配色解析、選值與 RNG 不變；不重新解釋衣物主色、對比色或固定色責任。

| 所有權 | 舊句型 | 新句型與必須保留的資料 |
| --- | --- | --- |
| 完整造型色系 | `complete outfit palette direction: shift … preserving …` | `outfit palette: {原 palette.en 全文}`；九種色系包含逗號及 dark accent balance，不能扁平化成單色 |
| 通用套裝主色／次色 | `primary/secondary garment color …`、`expressed as …` | `primary/secondary garment in …`；只有圖樣 detail 時用 `with …`，材質 prefix 與 detail 都保留 |
| 連身上下配色 | `coordinated top-to-bottom palette: upper/main dress area …, lower hem or skirt area …` | `dress palette from top to bottom: upper/main dress area …, lower hem or skirt area …`；上下區域名稱、顏色、次序均不變 |

`describeWearableColorTarget` 繼續負責顏色／材質文法，不拼出 `in none`。不存在的色票不新增句子；僅主色、僅次色、兩者全無、primary material 消費配色等既有分支不改。通用套裝的 primary／secondary 不假定等於上衣／褲裙。

`colorTextBindings` 已具體化的 `target set to color`、`colorTargets`、固定金／銀／黑／白／藏青、乳膠／鏡面／條紋、原衣物細節、襯衫固定黑色下身及 `shirt palette inspired by …` 均保護原樣。特殊穿搭 Saved Card 套用會清除完整色系的既有問題另批處理。本批不改 UI、儲存格式、正式 catalog、生成 Markdown／database、公開欄位映射、其他 Phase 4 或 P5b。

## 2. Renderer 與裁切

GPT 主輸出、胸上、全身與其他消費共用 builder 的路徑只允許以上三種文字轉換，保留全部有效色彩／材質描述。Z 原有完整色系縮寫政策仍適用新舊句型；AI 原有完整造型省略／精簡政策維持。不啟用 deprecated GPT compactor，不在最後輸出做廣泛字串清理。

連身標題保留 `top to bottom` 的空間描述：原分類器會將含 bottom 的整段上下配色視為下身投影，胸上原本隱藏的片段仍隱藏。不得以改句為由改裁切責任或增加胸上內容；固定 Git 全輸出比較包含此限制。此歷史分類政策是否值得另行調整不屬本批。

> 2026-10-28 後續核准：上一段為本 runtime 批的歷史裁切邊界。單人 `chest-up-portrait` 的有效連身＋上下配色，現另依 [胸上連身區域配色 v1](chest-dress-region-a2-v1.md) 保留可見上區色並服從外套遮蔽。主工作台近景與其他輸出仍保持原分類，舊 runtime 基準不重錄。

## 3. 新舊存檔與抓拍

- 舊 JSON／Markdown／ZIP 保存的公開原文維持逐字；不批次改寫。PAGE1 快照仍優先，單張與 ZIP 沿用同一編碼。
- 無快照 Markdown／貼上還原增加新 `outfit palette` 與角色句辨識，保留所有舊句型、最長色票、同角色／同衣物、矛盾不猜等規則；不靠裸露顏色字猜配色。
- 歷史抓拍的 `importedPerson`、`fullBodyPrompt` 及全身參考文字保持。抓拍主輸出由同一保存選值重新組裝時使用新 runtime 文法；此生成文字與保存的原始全身參考分開驗收。明確重新匯入才更新來源快照。
- 舊連身＋上下配色固定案例在現行 UI 仍受完整造型／分件互斥限制；本次案例在固定 main 的全身來源匯入也不可用。保留原政策，以舊快照原文及引擎相容路徑驗證上下區域句，不擴充 UI。
- 重新生成／套用是依保存選值產生目前文法，不能要求全部重新生成文字與舊版逐字相同。特殊穿搭套用清色系仍須按固定 main 重現，不宣稱修復。

## 4. 順序與驗收

1. 核對 main／共享範圍與未提交內容；保存固定 SHA、全追蹤檔／其他工作目錄 SHA、同 seed audit。
2. 先建立聚焦失敗案例，完成完整造型句與必要 renderer 新句型支援；再完成通用角色／連身句與文字還原。
3. 固定 Git 引擎輸出經獨立核准文字轉換，與候選全物件（僅排除 runtime id/date）比較；不以候選函式產生預期值。涵蓋所有完整造型與九色系、所有套裝代表配色、所有色票、所有連身上下色系、所有景別、雙人 A/B、固定構圖、外套、角色卡與固定 seed 隨機案例。選值、資料、controls、RNG 必須相同。
4. 舊 JSON／快照／無快照 Markdown／貼上／新快照、抓拍與已知 UI 限制分別驗證；瀏覽器桌面 1440×1000／手機 390×900 操作生成、複製、收藏、下載、ZIP、還原、抓拍與六工作區。檢查 console／page error、圖片、水平溢位，不呼叫付費 API。
5. Node 22：聚焦、`npm test`、`npm run test:prompt-quality`、lint、build、同 seed 200 strict audit；catalog sync `--check`／歷史 ID／schema／strict／Python／工具／assets。
6. 新測試專用精確 inverse 只寫隔離副本，逐檔 SHA／唯一 patch、缺檔、未知／混合狀態及所有新測試都先驗證才寫入。回放前批膠帶及其完整 A2／A1／A5 鏈；A～E 封存與既有 expectedHash 不重錄。常駐 CI 透過既有 npm test glob 接新測試，不需改 workflow。
7. 比對本批 allowlist、其他工作目錄與歷史檔，完成後回報本機驗收；Git／CI 交付須另獲授權。

[決策](../decisions/2026-10-27-a2-runtime-color-language.md) · [本批報告](../reports/wardrobe-runtime-color-a2-2026-10-27/README.md)

## 2026-10-28 Phase 4 主工作台可見區域補充

主 GPT／Z／Nano 的有效連身上下配色，在肩頸／胸上／腰上景別只投影可見上區色並服從外套遮蔽；不把上區主色當整件衣物前綴，不把下區色當成可見事實。雙人各自 resolved 配色保持隔離，完整來源不變。MJ、兩組衍生、臉部／膝上／全身及固定完整構圖保持原契約。見 [整體規格](phase4-completion-v1.md) 與 [決策](../decisions/2026-10-28-phase4-a2-main.md)。
