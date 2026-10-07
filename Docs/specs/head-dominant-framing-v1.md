# 頭部主導近景 v1

日期：2026-10-07。使用者核准新增景別、頭部占幅及相容視角；Public output contract `1.48.0`。

## 核准範圍

- 在主景別清單尾端追加「頭部主導近景」，來源 ID `camera:景別構圖-framing:頭部主導近景:10`。保留全部舊來源、ID、順序與隱藏舊款還原；新增選項進入原主景別隨機池。
- 英文來源：`head-dominant close portrait, close camera distance, head from hair crown to chin occupying 50–60% of frame height, full face and chin within the crop, little headroom, shoulders, upper torso and arms visible below, recognizable scene around the head and body`。
- 50–60% 指頭頂至下巴占畫面**高度**，不是臉部面積。保留完整臉部／下巴、少量頭頂空間，以及下方上身、手臂及周邊場景。
- 主 GPT／Z／AI 保留同一英文構圖來源；使用既有 `chestUp` 可見範圍保留上身與姿勢／場景投影，不增加 bucket、不當成五官裁切。Body Type 仍遵守 v2 完整來源規則。
- 不綁比例、鏡頭、服裝、人物姿勢或頭部角度。魚眼等鏡頭沿原選項。正上方由使用者選頭部角度，不自動增加抬頭、眼神或改變身體姿勢；真實圖片仍需模型實測。

## 視角相容

- 開放高位俯視鏡頭、平視高度鏡頭、正上方俯視鏡頭。「全無」保留省略視角的既有用途；隨機只抽這三個實際視角。
- 肩部、腰部、膝蓋、地面、蟲眼、鳥瞰及荷蘭角停用。UI 顯示原因；既有不相容選值暫顯全無，原 lock 及完整收藏 selection 保留，切回其他景別恢復。
- Engine 與摘要共用相容規則，明確不相容值也不能繞過；有效輸出省略該視角，不擅自改成另一個視角。純文字不包含已省略的 latent 視角，只有完整收藏能還原它。
- 限定新主景別，高位使用 `At close portrait distance, the camera is positioned above her and angled downward toward the head and upper body.`；正上方使用 `At close portrait distance, the camera is directly above her and points vertically downward at a 90-degree angle.`。一般單人主 GPT 與主 Z 共用近距離來源，替代此新景別的舊公尺距離；其他模式沿既有角度文案，構圖來源仍有近距離提示。不改其他景別／衍生的距離文字。
- 固定構圖、表情與姿勢等既有較高優先規則仍有效，不擴大改寫其相容性。

## 六輸出及儲存

- 三主輸出使用新景別；兩個胸上衍生保持胸上／4:5，同一有效視角與原相機距離政策，不帶頭部 50–60% 文案。全身角色照保留 9:16、完整人物與既有用途。
- 標準文字回填辨識新來源／景別及三個開放視角。近距離高位／正上方的展開句與 MJ 短句只在新景別已辨識時補認角度；不改舊景別解析。完整 Saved Card 保留來源 ID 及 latent 視角，重新生成走同一相容規則。Storage schema、六欄名稱與 public mappings 不變。
- `fixedFramingDerivedPromptContract` v5 僅追加主景別清單；GPT camera spatial v1.3.0 新增新景別身份限定近距離句；舊景別規則不變。

## 驗證

- 專項：主來源、三個有效視角、全部停用視角、隨機池、latent 恢復、頭部／鏡頭保留、六輸出、文字回填及收藏還原。
- 修改前 10 景別 × 11 視角，共 110 組明確舊選项，seed `head-legacy-v1`；檢查舊 ID／名稱／英文及 selection 與六輸出 SHA256。
- Same-seed strict `200 / prompt-quality-baseline` 前後比較；資料同步／check、Python、公開資產、完整前端／Prompt Quality／lint／build、五工作區桌面 1440×1000 與手機 390×900、相容控制及收藏／回填驗收。完成結果補於 current_project_state。

## 瀏覽器驗收紀錄

- 正常 `5175` 來源驗證新景別抑制蟲眼、停用鳥瞰等七個不相容選項，以及切回全身後恢復原蟲眼選值；結束時構圖景別與俯仰角度均還原原本的「全無」。9 張既有收藏只讀，不新增或刪除。預覽會沿原行為重新生成，因此不宣稱原六個預覽逐字還原。
- 獨立 `5179` 來源以正式文字回填、實選三個開放視角、頭部微微側傾／摸下巴、魚眼及試衣間場景。三主輸出保留 50–60% 與頭部姿勢；兩個胸上輸出／全身角色照不帶新景別來源。儲存一張測試收藏，切換為全身／蟲眼後在桌面與手機還原，確認新景別、正上方、鏡頭、姿勢與場景保留。完整收藏另有專項測試覆蓋 latent 視角。
- 桌面 `1440×1000`、手機 `390×900` 完成 Prompt 工作台、角色建模、動作姿勢、場景建模及 Saved Cards 的載入／畫面檢查。所檢查狀態無破圖、console warning/error；新 E 構圖區無 document 橫向溢出。手機 D 場景標題操作列的既有溢出已由前批規格記錄，本次未擴改其 UI。
- GPT 複製的剪貼簿文字包含新占幅来源。剪貼簿與 viewport 已還原，測試分頁及兩個服務已關閉。最終截圖 `/tmp/vps-head-desktop.png`、`/tmp/vps-head-mobile.png`；未呼叫外部圖像模型，頭部比例與身體／場景效果由使用者後續實測。
