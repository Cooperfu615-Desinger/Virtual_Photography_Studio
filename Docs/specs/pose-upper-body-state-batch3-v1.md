# 指定動作中景與胸上基本姿態第三批

2026-11-12，使用者確認第二批六個動作測試通過，核准接續實作本批六個一般跪姿。基準為 main `03f2664465351d06abe890445f55b0e1f6791f3d`。正式維護來源為 `webapp/src/lib/engine/specifiedActions.js`；不是 catalog JSON 變更。Public output contract 更新為 `1.68.0`。

## 核准文字

| 動作 ID | 動作 | 中景／胸上片段 |
|---|---|---|
| `specified-kneeling-seiza` | 跪坐 | `She is kneeling with her torso upright.` |
| `specified-kneeling-wide` | 分腿跪坐 | `She is kneeling with her torso upright.` |
| `specified-kneeling-forward-lean` | 前傾跪姿 | `She is kneeling. Her torso leans forward from the hips.` |
| `specified-kneeling-upright-poised` | 直立端正跪姿 | `She is kneeling. Her upper body is tall and relaxed.` |
| `specified-kneeling-side-sit` | 側坐跪姿 | `She is kneeling with her torso relaxed and upright.` |
| `specified-kneeling-one-knee-forward` | 單膝前跨跪姿 | `She is half-kneeling.` |

前傾與直立端正兩筆保留原上身片段，只在前面補 `She is kneeling.`。其他四筆原本省略，補回原 clauses 已有的跪姿身分及軀幹方向；單膝沿用原 `half-kneels` 身分，不新增腿腳幾何。跪坐與分腿跪坐的上身片段相同，兩者原完整腿部與髖部差異仍保存在共用來源及選值。

## 適用與保護

四個主輸出的中景與明確胸上，以及 GPT 胸上衍生輸出使用上述片段，均由同一次有效指定動作投影。胸上衍生比例仍為 `4:5`。一般室內外場景及 PAGE3 場景建模匯入沿用同一姿態投影。

頭部主導近景保留原輸出：四個原省略動作繼續省略，兩個原有片段保持逐字。其他臉部／肩頸近景沿原規則。全身、牛仔及無景別使用原完整 canonical 動作；Grok Imagine 保留完整有效動作，全身角色照仍為自然站姿及 `9:16`。

原 ID、名稱、說明、clauses、完整英文、順序、驗收狀態與隨機資格保持。前兩批全部坐／蹲姿、三個固定手部跪姿、躺姿、站姿、倚靠與非目標動作列入保護。手勢、手機、頭部、視線與道具先依現行條件解析；雙人、固定人物位置、觀察式抓拍、角色／其他接管沿用原優先權。

## 場景支撐與收藏

「跪在哪裡」沿用 83 室內／71 戶外的現行候選、順序、有效條件及 `indoorKneelId`。支撐先解析，景別不改抽、不清除有效選值。本批只補上身基本姿態，不在中景／胸上新增家具、表面、膝蓋接觸或承重文字；完整姿勢與 Grok Imagine 繼續使用同一次有效表面，分腿跪坐的膝蓋與臀部仍對應同一表面。

不改 storage key、Saved Cards／Markdown／ZIP 格式或舊收藏公開原文。明確還原選值並重新生成才採用本批新片段；舊卡既有七組輸出保持。場景／動作切換、失效表面、手機暫停及其他既有還原邊界列入驗證。

## 驗證與交付

先封存修改前同 seed 的七組輸出、解析選值、structured 來源、摘要與 RNG，排除執行期 ID／日期。新增聚焦案例並確認修改前未符合新規則，再修改 runtime。比較六動作全部景別、一般室內／戶外、全部有效場景支撐、PAGE3 匯入、手勢與模式接管；非核准差異逐字保護。

驗證合成收藏的 JSON／Markdown／ZIP 保存、套用及重新生成。原歷史 baselines、seals 與前兩批修改前證據保持；本批歷史矩陣差異獨立記錄 revision，並由精確 inverse 回放前兩批原始斷言。

完成 gates：聚焦測試、前端完整測試、Prompt Quality、lint／build、200 筆相同 `prompt-quality-baseline` seed 的 strict audit，以及 5175 桌面 1440×1000／手機 390×900 六工作區、七輸出、支撐與收藏流程檢查。每步驗證通過後依授權限定 commit／push 至 main，沿用前兩批的 `[skip ci]` 交付方式。保留其他 session 修改，不部署或操作真實收藏；外部圖像模型效果由使用者另行實測。
