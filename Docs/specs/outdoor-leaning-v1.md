# 戶外背部／側肩倚靠 v1

2026-11-06，Cooper 已核准 71 場景清單與規則。程式基準 main `0217f9c6e76bfa6d1bfca00710173f41b36b775c`。

## 範圍與輸出

擴充目前背部倚靠／側肩倚靠的適用場景，沿用 D 區「靠在哪裡」單選。一般 PAGE1 單人、明確選定 71 個戶外選單場景（含三個其他專屬場景）與其中一個指定動作時啟用。完整候選及順序見[71 場景核准清單](outdoor-leaning-scenes-v1.md)。原場景英文、正式 catalog、ID／別名、室內 83 倚靠及室內外坐姿保持。

每欄都有未指定。選未指定時沿用現在的方向句，不抽物件、不寫接觸：

| 動作 | 未指定 |
|---|---|
| 背部倚靠 | She stands with her upper body angled slightly back. |
| 側肩倚靠 | She stands with her upper body tilted slightly to one side, one shoulder lower than the other. |

有選物件時用接觸句取代方向句，不重複兩句。背部使用 `She stands with her back resting against ….`，側肩使用 `She stands with one shoulder resting against ….`；不指定左右肩、不額外加手腳或承重。物件可由姿勢帶入，無需回寫場景描述。Grok Imagine 保留完整姿勢，其餘輸出沿用原投影，全身角色照維持自己的自然站姿。

## 基本名詞與接觸

| ID | 名稱 | 英文名詞 | 適用 |
|---|---|---|---|
| wall | 牆面 | a wall | 背部、側肩 |
| column | 柱子 | a column | 背部、側肩，建築柱 |
| doorframe | 門框 | a doorframe | 只側肩 |
| railing | 欄杆 | a railing | 只背部，接觸點為 her lower back |
| pole | 直桿 | a pole | 只側肩，街邊／建築直立桿件 |
| tree-trunk | 樹幹 | a tree trunk | 新增，背部、側肩 |
| rock-face | 岩壁 | a rock face | 新增，背部、側肩 |
| vending-machine | 販賣機 | a vending machine | 新增，背部、側肩 |
| train-car | 車廂 | a train car | 新增，背部、側肩，調車場車廂外側 |

欄杆完整句維持 `She stands with her lower back resting against a railing.`；中景／胸上／頭部主導近景仍不帶下背接觸，第七組保留。其餘物件的背部／肩部接觸沿用原可見性。七個場景兩姿勢都只提供未指定；另有僅背靠欄杆或僅肩靠直桿的場景，依清單處理，不用家具或其他物件補位。

## 狀態與還原

沿用可選欄位 `indoorLeanId`、既有動作 ID、清空／隨機與失效提示，不改 storage key、輸出欄位或舊收藏。有效選值在場景、動作、室內外切換時保留；無效值回未指定。重抽其他欄位保留有效值，不增加 RNG。新增物件可經收藏、Markdown、ZIP、套用與重載還原；未知／不相容 ID 清除但原公開文字保留。

排除雙人、固定構圖、匯入場景、角色卡／特殊主體、觀察式抓拍及舊動作卡。抓拍可保留已知休眠值，退出時重驗。隨機場景／動作不啟用人工倚靠。兩個動作仍為 pending、手動可選，不改隨機池或既有手勢、道具、頭部、視線及拍攝方式責任。

## 分步驗證與交付

1. 核對最新 main 與他人修改、封存修改前輸出。先提交規格與 71 筆未接 runtime 的對照資料。
2. 只擴充共用倚靠模型；逐欄驗證 71 × 2 候選、順序、空集合、各物件、十景別、手勢／道具／頭部與四種拍攝方式。驗證切換、清空、隨機、排除模式及收藏／Markdown／ZIP／參考人物／DLL。
3. 以相同種子對照室內倚靠所有有效物件 × 十景別、戶外坐姿所有場景／14 動作 × 十景別；室內坐姿沿用原 18,480 樣本封存。七輸出、穩定物件、選值與 RNG 不變；既有六組固定案例及原歷史 JSON 保持。
4. 專項、完整前端、Prompt Quality、lint、build、同 count／seed strict audit；桌面 1440×1000／手機 390×900 六工作區與保存還原驗收。每步通過後限定 commit／push 至 main，保留其他 session 的內容。

本輪不進行付費生圖、私人資料操作或 Firebase 部署。文字、相容與介面驗收不代表 Grok Speed／Quality 外部模型效果驗收。
