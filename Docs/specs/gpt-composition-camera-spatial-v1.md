# GPT Composition：相機空間關係第一版

日期：2026-09-14；起點 `main / 17cc411`。

## 核准邊界

只影響一般 PAGE1 單人主 GPT（`grokPrompt`）的 Composition。沿用 Scene／Lighting 階段的排除：雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺 surface-led。Z、MJ、三個衍生輸出、獨立工作區、資料庫、UI、selection／RNG／storage 不變。

保持 Image Type → Composition → Subject → Wardrobe → Pose and Composition → Scene → Lighting → Camera Look；不將場景提前，也不改既有左右方位、canonical pose、接觸支撐或服裝。有效 angle 與景別不變，因此已完成的地面／天空可見性也不改。

## 相機呈現

- Composition 保留比例、景別、方位及既有手部構圖 modifier；只將可辨識的角度短句替換成相機空間敘述。未知 angle／全無與 unconstrained framing 保持原樣。
- 全身自然組保留平視／肩部／腰部／膝蓋高度短句，追加自然比例完整人物；荷蘭角保留傾斜，不指定新高度。
- 地面全身：近地、相對退後、仰拍完整人物。蟲眼全身：貼地靠近、陡峭仰拍、近大遠小；站姿用腳／小腿，其他姿勢不指定腳部最近。
- 高位俯視全身：人物主導的斜向俯拍；非站姿使用一般近遠身體區域，不強制頭肩最近。鳥瞰：高處斜向俯看人物與空間。正上方：垂直頂視完整人物。
- 非全身沿用既有 crop-aware 高位／地面／蟲眼／正上方相機語意，不新增更強烈蟲眼變形；鳥瞰只描述高處斜向俯拍與保留所選裁切，不要求地面入鏡或擴大成全身。平視／肩／腰／膝／荷蘭角的非全身短句保持原樣。
- 不指定公尺數，不綁魚眼或改焦段，不新增自拍衝突規則；極端視角／焦段／自拍組合仍需使用者實測。本次沒有自動相容性修正。

## 實作與驗證設計

- `gptCameraSpatial.js` v1.0.0：共用已確認的 angle-only 語意與全身六組，不取得 Z 完整輸出或 orbit 語意。
- renderer 以顯式 main-only option 啟用，不修改共享 context 或將結果傳至其他 renderer。
- 修改前凍結姿勢 × 角度 × 景別、方位、焦段、排除案例及既有全部場景／光線矩陣。只允許主 GPT Composition 核准差異，其餘五輸出、selection、RNG hash 一致。
- 歷史 snapshot 不重寫；測試 bridge 只逆轉凍結 Composition 的精確核准版本，六種既有比例前綴逐字保留。另有獨立語意斷言確認近遠、裁切、未知值與非站姿邊界。
- 執行聚焦、Prompt Quality、完整前端、lint/build、同種子 strict audit 與五工作區桌面／手機 smoke。技術通過不等於外部影像模型品質通過。

## 程式驗證

- 修改前凍結 6,320 組及 372 組原始 Composition 記錄；先確認新增地面全身 runtime 斷言在舊實作失敗，再接入 renderer。
- 最終矩陣確認每個 eligible 案例實際出現對應新句，排除案例維持原文；所有非核准差異、其他五輸出、selection、RNG hash 不變。Saved Cards／Markdown 主 GPT 文字與相機選項往返通過，extraPrompts 不變。
- 完整前端 931/931，Prompt Quality 262/262；build 通過（僅既有 chunk 提醒）。同種子 strict 200 / `prompt-quality-baseline` 前後皆零阻擋、23 項診斷；GPT 平均字數 577.8 → 578.3，其餘輸出統計相同。
- 舊 GPT 角度短句斷言及「GPT 不得包含 Z 全身文案」斷言已依核准範圍調整；MJ、衍生與其他文字仍維持歷史斷言，不重寫舊 hash。最終 lint 與 `git diff --check` 通過。

## Browser QA

- 本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/`；桌面 1440×1000、手機 390×900。五個工作區皆已載入並檢視：Prompt 工作台、角色建模、動作姿勢、場景建模、Saved Cards。
- 主 GPT 全身地面出現 set back／完整人物；蟲眼出現近距離／近大遠小；高位、鳥瞰、正上方分別為斜俯拍、較高的空間關係、垂直頂視。自然膝蓋高度保留高度短句，荷蘭角保留傾斜。左側方位沒有變成 Z 的 strict-side 人物幾何。
- 切回中景蟲眼，主 GPT 恢復 waist-up 與可見身體區域的原有近遠語意，没有全身完整要求；胸上衍生 GPT 仍保留舊角度短句。DLL 來源 Gpt／Z-Image 切換後已還原 Gpt。
- 五工作區已測桌面寬度 1425/1425、手機 375/375；未觀察到 warning/error console 記錄、角色圖片載入後無破圖。六張既有卡片保留，不新增／刪除／改寫卡片。原始牛仔中景、腰部高度、左側、A 人物頁籤及 viewport 已還原。
- 截圖由工具檢視，未新增檔案。Browser **PARTIAL**：既有手機 PAGE1 三欄輸出偏窄／按鈕截字仍存在；本輪未修正或重測先前 D 工具列溢出。未重驗系統剪貼簿／下載 bytes，不把 codec 往返測試當作瀏覽器下載驗收。本次沒有 CSS／JSX 修改。

本批尚未 stage／commit／push／deploy。
