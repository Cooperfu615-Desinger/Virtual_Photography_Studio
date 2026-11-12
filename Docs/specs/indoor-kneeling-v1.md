# 室內六個一般跪姿的場景表面 v1

2026-11-12 第三批核准補回六個一般跪姿的中景／胸上基本姿態，見[第三批規格](pose-upper-body-state-batch3-v1.md)。此更新取代下方歷史省略規則；候選表面、接觸替換、有效選值及保存契約保持，中景／胸上不新增家具或膝蓋接觸。

2026-11-09 起，戶外六個一般跪姿沿用本介面與收藏欄位。戶外適用範圍以[71 場景清單](outdoor-kneeling-scenes-v1.md)為準；以下保留室內版推出時的規格與驗收基準。

2026-11-07，Cooper 已核准清單、補充物件與實作。基準 main `c56d893b38e7f2cd7897d4dc945c2d027ef8a06a`。

## 範圍

沿用 D 區現有單選樣式，在一般單人、明確手動選定核准室內場景及下列動作時提供「跪在哪裡」：跪坐、分腿跪坐、前傾跪姿、直立端正跪姿、側坐跪姿、單膝前跨跪姿。穩定動作 ID 與原始 clauses、驗收／隨機資格、手勢、道具、頭部、視線及拍攝方式保持。

[83 場景清單](indoor-kneeling-scenes-v1.md)為候選與順序的核准來源。全部六姿勢共用候選，使用者可手動試用家具，不因尺寸預先排除。原場景英文、catalog／registry 不變。固定手部三跪姿、戶外、未知未審閱場景、雙人、固定構圖、匯入場景、角色卡／特殊主體、觀察式抓拍及舊動作卡排除。隨機場景／動作不啟用人工表面。

## 名稱與接觸

| ID | 名稱 | 接觸片語 |
|---|---|---|
| bed-top | 床上 | on the bed |
| floor | 地板 | on the floor |
| tatami | 榻榻米 | on the tatami floor |
| carpet | 地毯 | on the carpet |
| mat | 墊子 | on a mat |
| ground | 地面 | on the ground |
| sofa | 沙發 | on a sofa |
| reading-table | 閱讀桌 | on a reading table |
| bench | 長椅 | on a bench |
| aisle | 走道 | on the aisle floor |
| train-seat | 椅子 | on a train seat |

未指定保留原本完整動作，不補表面；必要著地與承重仍保留。有選值時，跪坐／側坐跪姿在原 kneels 後插入表面；其他四姿勢將原 knee(s) grounded 改為 knee(s) resting 加接觸片語。分腿跪坐的臀部 on the ground 同步改成相同表面，保留雙腿、髖部高度、軀幹與附加手勢／道具，不改寫其他來源中的 ground。所有輸出先用同一次有效選值與共用完整來源。

第七組 Grok Imagine 不依景別裁切；其他六組沿原姿勢投影。原中景／胸上省略的姿勢繼續省略；前傾與直立的上半身片語保持，不為展示表面新增下半身接觸。全身角色照維持自然站姿與 9:16。

## 狀態與相容

新增可選 `indoorKneelId`，不加入 createEmptyLocks 的舊預設、不改 storage key、輸出欄位或格式版本，不共用坐具／倚靠的選值。有效值跨六姿勢及相容場景保留；失效回未指定並沿用提示模式。其他欄重抽保留有效值，不增加 RNG。D 清空／隨機、離開適用模式清除失效值；抓拍可保留已知休眠值，退出時重驗。

收藏、Markdown v1 可選欄位、ZIP、套用／重載、參考人物預覽與 DLL 使用同一有效狀態。未知或不相容 ID 清除，但舊卡公開原文保持。沒有此欄位的所有舊資料與輸出不變，不恢復退役 Pose Composer 控制。

## 驗證與分步交付

1. 核對最新 main／既有修改，封存原輸出。先提交規格及未接 runtime 的 83 筆資料，驗證清單完整、來源相符及規則。
2. focused regression 先於 runtime 變更：83 × 六姿勢 × 十景別，全部有效候選與未指定、11 個名詞、附加手勢／頭部／道具及四種拍攝方式。核對有效選值與 RNG，不讓近景改抽表面。
3. 保存／Markdown／ZIP／還原／重生成，場景／動作／室內外切換、隨機／清空／排除模式；保護三固定跪姿、戶外跪姿、室內外坐姿及倚靠。1,686 原六輸出及代表／固定種子七輸出比較。原歷史 JSON／seals 保持，新增精確可逆測試來源層。
4. 完整前端、Prompt Quality、lint、build、bundle、200／prompt-quality-baseline 同 seed strict audit；5175 桌面 1440×1000／手機 390×900，六工作區、六公開景別與保存還原驗收。每步通過後依授權限定 commit／push 至 main，保留其他 session 修改。

本輪不進行私人資料操作、付費生圖或 Firebase 部署。文字／相容／介面驗收與 Grok Speed／Quality 真實出圖分開。
