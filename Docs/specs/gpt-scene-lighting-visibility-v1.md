# GPT Scene／Lighting 場景可見性第一版

Last updated: 2026-09-14

## 核准範圍

起點 `main / 1209e18`。僅一般 PAGE1 單人主 GPT（公開欄位 `grokPrompt`），從完整的共用景別投影來源，再依有效鏡頭方向處理場景可見內容。這是 GPT full-fidelity 契約的限定可見性例外，不是語意壓縮。

保留 `Image Type → Composition → Subject → Wardrobe → Pose and Composition → Scene → Lighting → Camera Look`。只改 Scene 與 Lighting 的來源視圖，不把場景移到開頭，不從 Z 成品反推 GPT。

排除雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺表面主導；Z、MJ、胸上 GPT／MJ、全身角色照與獨立工作區不變。未選環境光時，場景仍會投影。

## 可見性規則

| 有效鏡頭高度／方向 | Scene | Lighting |
| --- | --- | --- |
| 腰部、膝蓋、地面、蟲眼 | 省略已審查地面細節；混合片語保留牆面／天花板等部分 | 保留光線核心；surface 僅保留已撰寫的 lowText |
| 高位俯視、鳥瞰、正上方 | 省略已審查天空細節；保留其他環境內容 | 保留光線核心，省略 sky 細節 |
| 平視、肩部、荷蘭角、全無、未知 | 不做本層額外省略 | 保留全部已撰寫細節 |

- 相機高度為生成規則，不宣稱是普遍的攝影物理定律；使用已解析 angle，不由景別、焦段或姿勢猜測高度。
- 對 `Location`、`World Scene Architecture`、`Scene Accent` 的有效來源操作；Location／World 每行首片語作身份保護。未知／自訂片語原樣保留，只匹配既有精確審查表，不用 floor／sky 全文搜尋刪除。
- `mirrored floor and mirrored ceiling` 只保留 `mirrored ceiling`；`sky and treetop fragments outside` 只保留 `treetop fragments outside`。地點本身是榻榻米／草地／沙灘，不因此消失。
- 已經被景別投影省略的內容不回補。GPT 保留其餘完整來源，沒有 Z 的前兩片語限制或七組細節優先替換。
- 環境光仍採 [36 組共同描述](ambient-light-shared-descriptions-v1.md)，核心時段／天氣／明暗／色調不刪除；不修改 25 組人物受光，因此雪反射亮度、人物反射補光不等同地面造景。
- 不改姿勢／肢體／手部／頭部／接觸支撐，不移除 canonical pose 內的腳跟落地、手肘撐地或倚靠點。
- 不新增上方場景；相機距離、全身六組鏡頭呈現是下一階段，尚未合併 GPT。

## 程式與相容性

- `gptSceneVisibility.js` v1.0.0：clone Map，來源層投影；共享 `zImageSceneDirection.js` 的審查表，不改 Z 行為。
- `ambientLightDescriptions.js` 新增顯式 `directional` render target；舊 default 完整來源保持原樣，Z 結果不變。
- 四輸出契約 v1.12.0；Z 仍 v1.12.0，非同一個版本指標。
- DB／Markdown catalog、UI、摘要、ID、selection、RNG、storage、Saved Cards 與匯入格式不變。欄位 Copy 仍是 catalog 原文，主 Prompt Copy 是實際投影結果。歷史卡片不重寫。

## 驗證規格

- 修改前以 `scripts/capture_gpt_scene_visibility_baseline.mjs` 凍結 5,614 組：所有目前室內／戶外 location 選項 × 11 角度 × 3 景別，加上 720 環境光與 10 排除案例。角度含荷蘭角及全無，景別含近景／中景／全身。
- 每例只允許 GPT Scene／Lighting 的明確片語投影；其他 GPT 區塊、其他五輸出、selection、RNG 全文或 hash 一致。基準檔記錄原 SHA、場景／光線原文與 indices。
- 舊 snapshot 不重寫。test-only bridge 只識別凍結原場景的精確核准投影並還原以比對歷史 hash，其他文字變動仍失敗；無任意區塊刪除或 broad hash 更新。
- 聚焦測試含混合片語、未知來源、身份、標點、不變 source Map、接觸支撐、人物受光與 Saved Cards／Markdown 主文字往返。
- 外部影像品質需使用者實測，不以程式測試替代。

## 實際驗證結果

- 先加入回歸並確認舊實作在低機位 mirrored floor 案例失敗，再接入投影；最終 5,614 組完整比較通過。
- Frontend `npm test`：927/927；`npm run test:prompt-quality`：258/258；lint、build、`git diff --check` 通過。build 僅既有 chunk 大小提醒。
- 同種子 strict audit：200 / `prompt-quality-baseline` 修改前後皆零阻擋、23 項既有診斷；GPT 平均字數 577.9 → 577.8，其餘輸出統計不變。
- 早期全測曾遇到既有隨機 Z 鹽地測試：低機位已省略地面，但舊斷言仍要求地面。以 seed 123、floor angle 唯讀載入 `1209e18` engine，比對新舊 Z 文字完全相同且皆無地面；未修改該測試或 Z 行為。最終綠燈不代表此歷史 flake 已修復。
- Saved Cards／Markdown 主輸出文字、額外輸出文字及本階段的場景／鏡頭／光線選項往返通過；不宣稱 codec 的所有 inactive/default 欄位逐位元不變，既有正規化未修改。

### Browser QA

- 本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，桌面 1440×1000／手機 390×900，五工作區皆已載入並檢視截圖：Prompt 工作台、角色建模、動作姿勢、場景建模、Saved Cards。
- 緣側木廊低機位：省略木廊邊緣／石階，保留 sliding door frames、polished timber posts；高位俯視恢復地面，省略 deep blue dusk sky，但完整 blue-hour 光感與 high-key 人物受光保留。切回低機位恢復天空，來源選項不丟失。
- 雨後低機位保留 reflective wall textures，沒有回補地面；DLL 的 Gpt／Z-Image 來源切換正常。六張既有 Saved Cards 保留，未新增、刪除或套用改寫卡片。角色圖片載入後沒有破圖；未觀察到 warning/error console 記錄。
- 原始 PAGE1 場景、鏡頭、環境光、人物受光、DLL 來源與 viewport 已還原。截圖透過工具檢視，沒有新增影像資產。
- 整體瀏覽器驗收仍為 **PARTIAL**：既有手機 PAGE1 D 固定場景工具列溢出（375 client / 435 scroll；先前另一 D 狀態為 411），輸出欄偏窄；其他已測手機工作區 375/375。這次沒有 CSS／JSX 修改，不將舊版面問題混入本次修正。未重新驗證系統剪貼簿／下載檔案 bytes；codec 文字往返測試不等於瀏覽器下載驗收。

本批未 stage／commit／push／deploy；未更動資料庫與使用者圖片資料夾。下一階段才討論 GPT 鏡頭距離／全身呈現，不能視為已完成。
