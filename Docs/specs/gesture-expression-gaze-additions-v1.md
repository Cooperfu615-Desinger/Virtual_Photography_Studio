# 手勢、表情與視線新增 v1

日期：2026-11-17。核准基準：main `fd3f3bb14e15ec556021791bdda71b8fe8d8731f`，亦為本批 `REGISTRY_BASE_COMMIT`。使用者已確認七格示意圖及 B1 微張嘴、B2／B3 露齒微笑的修訂，授權實作；不 commit、push、部署或操作真實使用者資料。

2026-11-17 後續授權與接手：使用者已明確要求將本批 commit／push 到 `main`，並由本 session 接手剩餘驗證與交付。原段落保留初始授權範圍；本次後續授權涵蓋本批提交與推送，未新增部署、付費出圖或私人資料操作。原實作來源保持不變，已補完桌面／手機及六工作區的瀏覽器驗收，詳見[接手驗證報告](../reports/gesture-expression-gaze-2026-11-17/takeover-2026-11-17/README.md)。

## 核准內容與來源

| 類型 | 名稱 | 穩定 ID／視覺責任 |
| --- | --- | --- |
| 手勢 | 單手比中指 | `gesture-middle-finger-single`：一手抬至肩胸附近，伸出中指，其餘手指收起、拇指覆住，另一手放鬆 |
| 手勢 | 雙手比中指 | `gesture-middle-finger-both`：兩手在肩胸附近各伸出中指，其餘手指收起 |
| 表情 | 閉眼享受 | `character:表情-facial-expression:eyes-closed-enjoyment`：雙眼輕閉、眉間放鬆、嘴唇微張、舒服滿足 |
| 表情 | wink微笑 | `character:表情-facial-expression:wink-toothy-smile`：一眼閉合、另一眼睜開，自然露出上排牙齒微笑，不綁左右眼 |
| 表情 | 瞇眼微笑 | `character:表情-facial-expression:squinting-toothy-smile`：雙眼瞇起但保留眼縫、臉頰上提、露出上排牙齒微笑 |
| 視線 | 斜眼看鏡頭 | `gaze-sideways-camera`：頭稍轉一側、眼睛側瞥回鏡頭，神情獨立 |
| 視線 | 低頭抬眼看鏡頭 | `gaze-chin-down-eyes-up`：下巴收低、眼睛抬起看鏡頭，不綁定攝影機俯仰角度 |

手勢／視線由 `gazeGesture.js` 維護，不加入退役 Pose Composer 控制項。三筆表情只新增於 index 列管的 Character 分類 JSON，登記 active 永久 ID、有序 aliases 與 index layout，再同步生成物；原十六筆與既有語意保持。新表情的語意為表情、嘴型、眼瞼，無頭部／視線／姿勢；沿用此分類的 `minVisibility:full`、`archetype:null` 與 `manual_only`。

## 適用、接管與相容

- 七項先供手動選取；手勢 `randomEligible:false`、表情 `manual_only`，新視線亦排除隨機。原選項順序、四個視線的抽樣順序／RNG、既有 ID／aliases／原文不變。
- 新手勢沿一般手勢 scope，適用手部 free 的站／坐／跪姿。蹲姿與躺姿仍使用原有專屬清單；固定手部、承重與手機自拍沿原接管規則。手勢不帶挑釁表情、前傾、近鏡頭透視或模糊，原「頂鏡頭挑釁手勢」保持。
- 新視線只描述頭與眼睛的關係。普通可見頭部的構圖使用現行 canonical pose 投影；臉部／頭肩等原本省略姿態的景別不額外開新例外。躺姿未審閱新變體，維持不適用；背面也不補造可見臉部。新增英文來源不寫入舊頭部隨機池。
- 有效「閉眼享受」暫停視線；保留原選值與快照，換回睜眼表情後恢復。動作接管表情時，不因暫存的閉眼選值而暫停有效視線。「低頭抬眼」沿既有低頭規則與下巴微抬、頭部後仰互斥；閉眼暫停視線時不額外清除頭部。
- GPT／Z／MJ／Nano 與 Grok Imagine 共用解析來源；胸上照重新投影同狀態。全身角色照保持 9:16 自然站姿參考用途，表情沿既有來源，手勢／視線不帶入。
- 主 MJ 對本批三個新表情保留同一份完整短描述，避免第一片語精簡刪除微張嘴或露齒。既有表情、角色卡與其他路徑的精簡政策保持；不新增第二份英文覆寫。
- 新 ID 使用原 selection 欄位與收藏／Markdown snapshot／ZIP 格式；不增加 storage key 或遷移私人資料。雙人、觀察式抓拍及動作／場景接管沿原模式契約。

## 驗證與歷史

修改前固定來源及案例封存，逐位元比較舊七輸出、selection、結構化來源及 RNG。新增聚焦測試驗證手形、三種眼睛／嘴型、視線方向、暫停／恢復、頭部衝突、裁切、接管、手動限定與收藏／Markdown／ZIP。

原歷史基準與 seals 不重錄；必要時只新增本批獨立 SHA256 精確逆向層，供隔離副本重播舊驗收，未知修改不反轉。

完成前執行 catalog sync/check、schema/history／E 工具／strict integrity、聚焦測試、完整前端、Prompt Quality、lint、build、相同 200 筆 `prompt-quality-baseline` strict audit，以及 1440×1000／390×900 的受影響流程與六工作區 smoke。文字與應用驗證不等於外部模型逐組出圖驗收。

既有 current-state／onboarding 修改、研究資料與另一 session 的室內坐姿驗證檔案保留，不併入本批。
