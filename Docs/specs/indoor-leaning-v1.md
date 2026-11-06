# 一般單人室內站姿倚靠 v1

2026-11-06，Cooper 已核准實作。基準 main `1e7935bd5a12c35958475b85168966e836ffbe88`。

## 使用流程與範圍

B 區站姿新增「背部倚靠」「側肩倚靠」；D 區一般場景下，沿用「坐在哪裡」單選樣式顯示「靠在哪裡」。只在明確選擇具名室內場景與這兩個動作之一時提供物件。不改場景英文；姿勢本身可以帶入核准物件。坐姿流程保持。

首版依[83 場景核准清單](indoor-leaning-scenes-v1.md)提供選項，名稱採基本名詞。攝影棚與背景 13 筆只有牆面，CRT 電視牆攝影棚只有電視牆。其他白色床鋪與生活感日式榻榻米房間只有未指定；室內日式和室仍有牆面、柱子。尚未審閱的新室內場景只提供未指定。

雙人、固定構圖、匯入場景、角色卡、特殊主體、觀察式抓拍、舊動作卡不使用這份支撐。觀察式抓拍的原鎖值可以休眠，返回時重新驗證，不參與抓拍生成。

## 動作與組句

| 動作 | 未指定 | 選牆面 |
|---|---|---|
| 背部倚靠 | `She stands with her upper body angled slightly back.` | `She stands with her back resting against a wall.` |
| 側肩倚靠 | `She stands with her upper body tilted slightly to one side, one shoulder lower than the other.` | `She stands with one shoulder resting against a wall.` |

有選物件時以接觸句取代原方向句；不再附加第二個方向句。不自選物件、不補手腳、不指定左右肩。手部為 free，沿用目前站姿可選手勢。兩筆動作先標 pending，手動可選，未驗收前不加入隨機池。

| 選項 ID | 名稱 | 接觸片語 | 限制 |
|---|---|---|---|
| wall | 牆面 | against a wall | 兩姿勢 |
| tv-wall | 電視牆 | against the TV wall | CRT 專用，兩姿勢 |
| column | 柱子 | against a column | 兩姿勢 |
| cabinet | 櫃子 | against a cabinet | 高櫃側板，兩姿勢 |
| bookcase | 書櫃 | against a bookcase | 書櫃側面，兩姿勢 |
| doorframe | 門框 | against a doorframe | 只側肩 |
| railing | 欄杆 | against a railing | 只背部，接觸部位為 lower back |
| pole | 直桿 | against a pole | 只側肩 |

穩定動作 ID 為 `specified-standing-back-lean`、`specified-standing-shoulder-lean`。完整句先共用解析；第七組 Grok Imagine 不依景別裁切。其他輸出沿用目前姿勢投影：中景／胸上可保留可見背部或肩部接觸；欄杆的下背接觸只在全身／牛仔中景等完整姿勢中保留，近景用未指定的軀幹方向；頭肩／臉部依現行規則省略姿勢。全身角色照維持自己的自然站姿，不帶場景物件。

## 狀態與相容

用可選的 `indoorLeanId` 保存人工選值，不加入舊預設鎖值、不啟用退役 poseAnchorId、不改 storage key 或輸出欄位。有效選擇由 UI 與引擎共用同一個模型判定。切換場景或這兩種姿勢時仍適用則保留，不適用則回未指定並提示一次原因。D 清空、全無、隨機、全域重設使選值失效；重抽無關欄位保留有效選值，不增加 RNG 呼叫。

選擇快照、結構化收藏、Markdown、ZIP 保存明確有效 ID；舊卡缺值、未知或不相容 ID 視為未指定，舊公開原文保留。參考人物預覽沿用同次姿勢來源。新增的指定動作不改既有 54 個動作、隨機池與原七組輸出。

## 驗證與交付

1. 核對 83 × 2 候選集合、順序、基本名詞及兩個無物件場景；逐個物件驗證接觸句與適用姿勢。
2. 兩姿勢／所有物件 × 10 現有景別，以相同種子核對七組文字、選值及抽選次數；驗證手勢／道具保留、排除模式、場景與姿勢切換、清空與隨機。
3. 收藏、Markdown、ZIP、套用／重載／參考人物／DLL 來源驗證；舊卡與未知選值保留原文。
4. 修改前後固定案例逐字比對，保留歷史基準，只新增精確雜湊可逆的測試銜接。前端全測試、品質、lint、build、同 seed strict audit 及桌面 1440×1000／手機 390×900 六工作區瀏覽器驗收。

完成門檻為文字、選項、保存還原、介面與交付驗證；外部模型出圖與 Grok Speed／Quality 成效仍需另外實測。
