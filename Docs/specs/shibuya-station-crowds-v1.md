# 澀谷站前：地標背景與三層流動人潮 v1

Last updated: 2026-10-07

Status: 本機實作及程式／瀏覽器驗證完成；2026-10-07 使用者授權本批 commit／push，交付狀態以 Git 遠端核對為準。未手動部署，外部模型圖片效果待實測。

## 範圍

- 原位修改 `戶外：澀谷站前廣場人潮邊緣`，ID 維持 `locations:城市與社群感-urban-social-snapshots:戶外-澀谷站前廣場人潮邊緣:11`。
- 不改中文名稱、分類、位置、既有 tags 等 metadata、隨機池、控制項或 storage schema；只追加舊完整來源的相容 alias。
- 場景定位只保留澀谷站前，不再限定八公廣場或人潮外緣。參考圖的 QFRONT 玻璃立面、TSUTAYA／STARBUCKS 招牌與大型廣告螢幕為背景主線，並保留周邊日文店家招牌。
- 參考圖只提供地標背景方向，不鎖相機高度、焦段、景別或人物朝向；建築、招牌及人群依所選鏡頭自然裁切，不強迫完整入鏡。
- 不加入斑馬線、路面、天空、固定光線或主角姿勢，也不變更其他場景的地面／天空投影。

## 核准來源

```text
Shibuya Station front plaza with the QFRONT glass facade carrying TSUTAYA and STARBUCKS signage and large advertising screens in the background, dense varied crowds walking in different directions around the subject through the foreground and midground into the background, nearby passersby partly cropped at frame edges, surrounding Japanese shop signs
```

逗號片語固定四段：

1. 地點與地標背景身份。
2. 主角周圍朝不同方向行走的人潮，包含前、中、後景；三層深度在同一片語內，避免被來源裁切拆散。
3. 近處路人局部切入畫面邊緣，不要求每個路人完整入鏡。
4. 次要的周邊日文店家招牌。

不指定固定人數、逐人穿著或統一面向；以物理位置與流動人群描述取代舊的靜態集合人群及非核心地面清單。知名店名是背景辨識線索，不等同精確畫面文字功能，也不保證模型逐字重現招牌。

## 各輸出與低機位

- GPT 仍由完整有效來源按既有景別／方向投影，保留原區段順序；不套用 Z 的壓縮組裝。
- Z 的前三片語同時保留地標、三層流動人潮及近前景路人，不新增 renderer 專用造景。
- 該 ID 的 `zImageSceneDetailPriority.js` 核准來源改為保留新版人潮及路人片語，不再於腰部／膝蓋／地面／蟲眼低機位替換成商業立面。其餘 44 個 runtime ID 與 fail-closed 邊界不變。
- MJ 沿用既有來源選取與精簡政策，不新增例外。兩組胸上從同一 resolved source 投影，仍各自固定 4:5；全身角色照仍不帶此場景。
- 不重新解析 selections、不新增亂數抽取、不改 pose、服裝、光線、焦段或 F 參數。

## 相容性與回歸

- 舊完整英文加入 `LOCATION_LEGACY_PROMPT_ALIASES`。舊文字回填可找回同一 ID；重新生成採新版來源，既有收藏原文不批次改寫。
- Markdown 為唯一場景來源，同步 `database.json`。
- Public output contract `1.46.0`；scene-detail priority source version `1.2.0`。
- `shibuyaCrowdScene.test.js` 直接驗證現行 renderer 的來源、七景別、四低機位、高位／背面／135mm、其他場景、selections/RNG、文字回填及收藏還原。
- 代表性 fixture 將低機位地標／人潮／近前景保留納入 Prompt Quality gate。
- 歷史 JSON baseline 保留不變；test-only bridge 只反轉這一個 ID 的精確核准場景片語，不遮蔽其他區段或任意新文字。

## 驗證界線

完成前需通過聚焦與全套前端、Prompt Quality、同 seed `200 / prompt-quality-baseline` strict audit、資料同步／Python／公開資產及 diff-check；桌面 1440×1000、手機 390×900 檢查生成、回填／收藏及五工作區。

程式與瀏覽器驗證只確認選項、來源與介面行為；人潮密度、建築辨識、自然遮擋及招牌文字的實際圖片效果仍由使用者於外部模型實測。
