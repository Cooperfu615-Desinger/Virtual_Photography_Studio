# 站姿動作目錄 v1

日期：2026-09-27。狀態：本機實作與驗證完成，尚未提交。Public output contract：`1.23.0`。

## 範圍與來源

本批整理 PAGE1 Pose Composer 的站姿肢體變化與其共用英文來源。來源位於 `webapp/src/lib/engine/poseComposerOptions.js`，不是知識庫 Markdown／JSON；不需要重新同步資料庫。保留既有 UI、鎖定欄位、Saved Cards schema 與三個 renderer。手部、頭部、表情、道具仍各自選擇。

蹲姿、跪姿與新的「動態姿勢」分類不在本批實作；跑步參考圖留待動態姿勢規劃。三張靜態參考只用於站姿身體結構，不把參考圖的手勢綁入選項。

## 公開目錄

| 名稱 | ID | 身體定義與本批處理 |
| --- | --- | --- |
| 自然站姿 | `standing-natural` | 保留放鬆直立來源 |
| 單腳重心 | `standing-one-leg-weight` | 保留單側承重與不對稱平衡 |
| 骨盆後推曲線站姿 | `standing-pelvis-back-curve` | 骨盆明顯向後，臀部位於軀幹後方，腰背至臀部形成連續曲線；上身僅輕微前傾，不強制單腿承重 |
| 向鏡頭探身站姿 | `standing-forward-lean` | 原「身體微前傾」同 ID 改名；從髖部明顯向鏡頭前傾，臉與肩比腰髖更接近鏡頭 |
| 交叉腿站姿 | `standing-crossed-legs` | 保留雙腿交叉與輕微移髖 |
| 側身窄站姿 | `standing-narrow-side` | 保留側身、窄站距與延伸身體線條 |
| 單腳屈膝抬腿站姿 | `standing-bent-leg-lift` | 新增：單腿支撐，自由腿屈膝抬起並略跨支撐腿前方，小腿後折、腳離地 |
| 併腿微屈站姿 | `standing-feet-together-soft-knees` | 新增：雙腳靠近、膝蓋柔和微屈，髖稍偏側，軀幹形成輕微側向曲線 |
| 開腿偏重心站姿 | `standing-wide-weight-shift` | 新增：雙腳分開，腳尖稍向外，一側承重、另一腿側伸，髖維持站立高度 |

## 景別與六組輸出

- 三組主輸出 `grokPrompt`／`zImagePrompt`／`midjourneyPrompt` 使用同一次解析的姿勢與既有 renderer 契約；不得各自重新抽選姿勢。全身、固定構圖及未限制景別保留完整來源。
- 骨盆曲線：牛仔中景保留完整來源；腰上中景改用腰背曲線與輕微上身前傾的可見片段，省略骨盆／臀部。主胸上仍按原下半身姿勢投影省略；兩組胸上衍生輸出沿用既有特例，抽取完全相同的 `upper torso only slightly inclined forward` 片語。
- 探身：腰上／胸上保留明顯向鏡頭前傾、臉肩靠近鏡頭，省略腰髖比較。半臉及全臉等更近裁切遵循既有隱藏規則。
- 屈膝抬腿：牛仔中景保留支撐腿、抬腿與膝部相對位置，刪除小腿／腳部；腰上及更近裁切不補造下半身。
- 併腿微屈：腰上／胸上只保留上身輕微側向曲線。
- 開腿偏重心：牛仔中景保留分腿、側向承重與站立髖高，不描述腳尖；腰上／胸上只保留上身偏側平衡。
- `chest-up-portrait`、`chest-up-mj-portrait` 不新增 renderer、專屬規則或格式，固定 `4:5`，依 [胸上同狀態規格](chest-up-same-state-v1.md) 消費來源。探身與新增選項的可見上身文字會自然反映新來源；「維持現況」指維持處理機制，不凍結已改寫來源的字面輸出。
- `full-body-character` 保持單人、自然站姿、完整頭至腳、固定 `9:16`，不套用本次姿勢變化。

## 舊資料相容性

`standing-back-lean`、`standing-back-facing-turn`、`standing-forward-toe-point` 設為 `uiHidden: true`、`randomEligible: false`。原 ID、英文、投影片段仍保留，舊卡／明確 restore 可正常回填，不批次改寫歷史文字。原先五個退役站姿也維持不變。

骨盆曲線與前傾的舊英文存於 `legacyPromptAliases`，純文字 Prompt 仍可辨認到同一 ID；新生成使用新來源。既有四個保留站姿的完整來源及投影不變。隨機站姿池只包含上述九個公開選項；具體相容性仍由既有 crop／orbit resolver 控制。

## 驗證紀錄

- 新增 `standingCatalog.test.js`，先確認修改前失敗，再驗證九個選項、三個退役 ID、舊英文別名、Saved Cards 序列化／還原、純文字回填、裁切投影與 200 次固定種子隨機池。
- 針對性測試：102/102。完整 `npm test`：1053/1053。`npm run test:prompt-quality`：323/323。lint、build 與 diff-check 通過；保留既有大 chunk 提醒。
- 前後嚴格稽核均為 200 筆、seed `prompt-quality-baseline`：0 阻擋、28 筆相同類別診斷（23 筆衣物／場景組合，5 筆近似重複）。不藉此修改範圍外搭配。
- 45 個固定案例（原九個姿勢 × 五個景別）前後比較：全部全身角色照不變；未改寫與新退役的七個姿勢六組文字不變；骨盆姿勢兩組胸上文字不變。改動集中於骨盆與探身來源及其已定義投影。
- IAB 1440×1000、390×900：檢查站姿九選項、五組更新來源、六組輸出、全無停用複製與重新選取；檢查五個必要工作區並額外檢查觀察式抓拍。未發現文件水平溢出、破圖或 console warn/error。保留既有窄版輸出工具列截短顯示。
- 瀏覽器回復原始蹲姿選擇，六組預覽與驗證前逐字一致。Saved Cards 相容往返由自動測試覆蓋；瀏覽器僅檢查既有清單，不新增收藏或呼叫外部生圖。

實際 GPT／Z-Image／Midjourney 生圖的姿勢命中率尚未評估，後續需固定人物、衣物、場景與種子進行影像比較。
