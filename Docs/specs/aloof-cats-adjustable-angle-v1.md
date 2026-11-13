# 低坐貓群冷淡氛圍・角度可調 v1

2026-11-13。使用者核准新增，並明確補充注視方向可設置；保留原版，不 commit／push。基準 main `f4cf8a81ee6ff5d27dda56c4b7ab38665530c82c`。

## 來源與行為

- 新增 `specified-sitting-low-aloof-cats-adjustable-angle`，名稱「低坐貓群冷淡氛圍・角度可調」。正式來源為 `webapp/src/lib/engine/specifiedActions.js`，列在原版之後；不新增退役 Pose Composer 或 catalog registry 條目。
- 原版 `specified-low-seated-aloof-cats-street-mood`、原卡 `low-seated-aloof-cats-street-mood`、舊卡對應、英文、相機限制及隨機資格保持。新項不共用 `legacyCardId`。
- 同樣低坐地面，雙腿鬆放、軀幹微傾、手臂自然靠近腿部，身旁小貓安靜停留。新項保留疏離、冷淡、微微低落的表情。
- 完整／上半身／臉部片段移除固定「抬眼望向上方鏡頭」，以 `She has an aloof, distant, slightly moody expression` 表達神情。`ownsExpression:true`；`ownsHead:false`，視線與頭部沿用現有選項、裁切、相互衝突及保存規則。「全無」不補固定注視方向。
- 俯仰角度由 E 區決定；不擴充既有景別與角度相容性，包含頭部主導近景的原限制。環繞維持前方範圍：全無、正面、左右前斜角、男友／閨蜜視角；側面／背面保留選值並暫停動作。用新項專屬 `meta.cameraOrbit:'front-facing'` 將這條規則與頭部接管分開，所有舊項的資料形狀與行為保持。
- 手部維持 fixed，不新增通用手勢或手機自拍能力。新項明確 pending，只供手動選擇，不加入隨機池；出圖品質另由使用者試圖驗收。
- 加入 `indoorSeating.js` 的坐地清單，沿用現行室內／戶外地面、榻榻米、草地、沙地等接觸替換及床鋪場景提示，不開放椅子／床上等新坐具。

## 相容與輸出

- 四主、胸上及 Grok Imagine 讀同一份新姿勢來源，按各自既有投影規則輸出。半臉／全臉特寫沿用僅輸出 faceEn 情緒的既有規則，不補獨立視線、下半身或貓；視線選值保留，退出裁切後恢復。Grok Imagine 保留完整來源；全身角色照維持自然站姿、9:16。
- 新舊動作用獨立 ID 保存／還原；沿用收藏、Markdown snapshot 及 ZIP 格式，不改 storage key、schema 或舊卡原文。純完整英文回填必須分辨新舊兩個完整來源；僅裁切片段不保證可反推出完整選值。
- 雙人、固定場景人物位置、觀察式抓拍、專用主體沿原接管邊界。不要為新增項改寫其他路徑。
- 原歷史封存與 seals 不重錄。新增精確雜湊逆轉層供舊測試回放；只有核准 before／after bytes 可還原。

## 驗證

先封存原版全部俯仰／環繞 × 六公開景別，以及既有動作與固定種子隨機輸出的七輸出、selection、摘要及 RNG 呼叫數。修改後逐位元比較。新增測試涵蓋視線／頭部／角度、全無、原版限制、固定手部／手機、坐地表面、新舊完整英文及收藏／Markdown／ZIP 還原、排除模式與角色照。

完成前執行聚焦測試、完整前端、Prompt Quality、lint、build、相同 200 筆 seed `prompt-quality-baseline` strict audit，並依根 AGENTS 完成桌面 1440×1000／手機 390×900 的受影響流程及六工作區驗證。若 catalog 未改，不執行生成同步；只讀檢查仍可用於來源確認。

`Docs/current_project_state.md` 與 `Docs/session_onboarding.md` 的既有未提交修改及研究檔案不在本批範圍。文字／相容／瀏覽器驗證不代表外部圖像模型已驗收；不操作真實收藏或付費生成。
