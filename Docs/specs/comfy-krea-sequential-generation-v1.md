# DLL：Krea 三版本與逐張生成 v1

日期：2026-10-08。使用者核准規格：所有 DLL 模型預設一張，張數只提供 1／2；第一張完成並取得最終圖片後，才提交第二張。本批本機實作與驗證完成，已 commit／push `162cd4f71aca7536f5398cf482499589c8eb2015`；使用者另行授權的三個 Functions 部署已完成。前端自動發布查核時仍在執行，尚未做付費生圖驗收。

本規格補充 [Comfy 整合](comfy-cloud-integration-v1.md)、[三模型擴充](comfy-cloud-model-expansion-v1.md) 與 [額度估算](comfy-cloud-quota-v1.md)。不更動 Prompt engine、來源 mappings、Saved Cards、舊模型 keys、Secrets、allowlist、runtime 或隱藏 BytePlus／Magnific 介面。

## Krea 模型

使用者來源：`/Users/cooperfu/Downloads/api_krea2_t2i.json`，API 格式只有 `Krea2ImageNode` → `SaveImage`，原檔是 Medium、1K／1:1、creativity=medium、空 Moodboard；原檔不修改。固定模板直接採用每次選定的原 Prompt，不新增 Prompt 改寫或風格／LoRA 控制。

| DLL 選項 | 後端 key | 節點 model |
| --- | --- | --- |
| Comfy Cloud · Krea 2 Medium | `krea2Medium` | `Krea 2 Medium` |
| Comfy Cloud · Krea 2 Medium Turbo | `krea2MediumTurbo` | `Krea 2 Medium Turbo` |
| Comfy Cloud · Krea 2 Large | `krea2Large` | `Krea 2 Large` |

- 各版本獨立 key，皆預設一張。只提供 1K；與既有 DLL 比例的交集為 1:1／4:3／16:9／9:16／4:5，3:4 不支援。後端拒絕未支援的尺寸，不靜默換模型、解析度或比例。
- Seed 範圍 0～2,147,483,647，最終圖片節點為 `2`。每個雲端任務一張，沿用 Partner Node 伺服端 `extra_data.api_key_comfy_org`，金鑰不進模板／前端／Firestore 任務記錄。
- 官方節點沒有各比例精確像素映射；要求 metadata 的 width／height 保持 null，介面顯示 1K／比例，放大預覽可依實際圖片尺寸呈現。不能將本機 latent 尺寸算法當作 Krea 回傳尺寸。
- Krea 只顯示剩餘 Credits／刷新及「此模型暫不估算張數」，不以 GPU 秒數猜合作夥伴費用。

## 張數與執行

- 共享請求上限改為 2，預設 1。所有可見 DLL 模型只提供 1／2，換模型回到 1；不新增張數 storage key。隱藏模型維持隱藏。
- 選 2 張時，每次供應商請求仍為一張。Comfy 分別使用兩個 request ID 與 job，latent batch_size 保持 1；Gemini／xAI 等 DLL 呼叫也逐張等待，不同時送出兩次或單次請求兩張。
- 第一張取得完整最終圖像後立即顯示，再提交第二張；進度顯示第 1／2 張。Comfy 第二張將已知的第一張 seed 傳給後端排除；其他 provider 僅保證逐張獨立請求，不控制或驗證 seed。
- 第一張失敗時不提交第二張；第二張失敗時保留第一張與明確錯誤。沒有自動重送失敗或不明的付費生成。

## Comfy 追蹤與恢復

- 保留 `dll_pic_pro_comfy_pending_v1` key；舊單任務資料仍可唯讀續查。新 version 2 記錄 uid、模型／尺寸、總張數與最多兩個固定 request ID、各張狀態，不保存 Prompt 或簽名圖片 URL。
- 先保存 planned 序列，再在每張 POST 前保存 attempted。成功取得一張完整圖片並保存 succeeded 後，才可保存第二張 attempted 並 POST。儲存失敗、回調失敗、缺圖、網路錯誤、uncertain 或逾時都阻止後續提交；已取得圖片仍保留在畫面或錯誤結果。
- 新生成、續查及結束追蹤使用同 origin Web Lock（ifAvailable），拒絕其他頁面的同時操作。無安全鎖或無法持久化時不提交。結束追蹤需比對使用者當下看到的 request ID，不能刪除另一批的新記錄。
- 每次 callable 核對這次操作開始時的 uid；伺服端在建立任務 store／認領／供應商操作前檢查 `expectedUid`，避免切換帳號後送錯。舊客戶端未提供此欄位時仍相容。
- 「查詢上次任務」只 GET 已 attempted／曾成功的 request ID，不會重新 POST，也不會代送尚未提交的第二張。若只回收第一張，明確提示剩餘尚未提交；使用者可在確認後另生成一張。這維持舊按鈕的唯讀與扣費邊界。
- 回收各個已提交任務；某張 URL／Asset 暫不可用，不阻止查另一張。仍有不明結果時保留整批追蹤，成功項的 URL 也從原任務重新取回，不信任舊簽名網址。
- 壞追蹤資料阻止新生成，仍提供結束追蹤入口。結束追蹤只刪本機追蹤，不取消／退款，不刪伺服端認領。

## 額度與相容性

每個 Comfy job 保持一張與原模板採樣設定，所以原 Z／Qwen／INT8 的單張成功樣本仍適用，無需把批次時間除張數。新 Krea 為合作夥伴模型不估算。未查詢真實費用／帳號限制，不宣稱 DLL 的兩張模式已在 Cloud 實測成功。

## 驗證範圍

- 聚焦：Krea 三模型參數／尺寸拒絕、原工作流一致性、Partner Secret／最終輸出／額度邊界；共享張數上限；逐張順序、第二張失敗保留、未知結果不重送、舊任務恢復、儲存／回調失敗、跨頁鎖與過期圖片回收。
- 完成閘門：Functions test／lint；前端 test／lint／build；桌面 1440×1000／手機 390×900 五工作區及 DLL 模型／張數／相容比例／進度／部分成功／續查／放大狀態。模擬不消耗額度，不代替部署與真實生成驗收。

驗證結果（2026-10-08）：Functions 72/72、前端聚焦 51/51、雙端 lint、前端 build、文件連結／diff-check 通過。完整前端 1372/1373；未修改的服裝隨機 fixture 在頭部近景要求完整裙身拉鍊，固定 `latex-fixture-1` 在 HEAD 與工作區重現同一失敗，保留既有例外，不改 Prompt engine。五工作區／四個 DLL 面板桌面與手機渲染、11 模型張數選擇、模擬兩張依序成功／第二張失敗保留第一張／回應遺失後 reload 只查詢、放大關閉及未登入保護通過；所查狀態無 console／page error、破圖或 document 橫向溢出，觀察到外部 POST 為 0。截圖 `/tmp/vps-krea-desktop-success.png`、`/tmp/vps-krea-mobile-recovered.png` 等與完整證據路徑見 [目前狀態](../current_project_state.md)。隔離瀏覽器與本次驗證服務已關閉。

發佈時須同步新版前端及 `comfyCloudSubmit`／`comfyCloudStatus`／`comfyCloudQuota` 的共用模型定義；submit／status 包含 uid guard。三個 Functions 已部署，前端自動發布尚待完成；真實節點權限、生成、下載、耗額與效果仍待驗收。

## 部署紀錄（2026-10-08）

- 使用者另行授權部署三個 Functions。來源 commit `162cd4f71aca7536f5398cf482499589c8eb2015`，`main`／`origin/main` SHA 一致；2026-10-08 16:28（台北）部署至 `virtualphotographystudio/us-central1`，CLI exit 0，三項 update 均成功。

| Function | 部署後 revision | 雲端狀態／流量 |
| --- | --- | --- |
| `comfyCloudSubmit` | `comfycloudsubmit-00007-jup` | ACTIVE／最新 revision 全量流量 |
| `comfyCloudStatus` | `comfycloudstatus-00008-buc` | ACTIVE／最新 revision 全量流量 |
| `comfyCloudQuota` | `comfycloudquota-00003-hek` | ACTIVE／最新 revision 全量流量 |

- 三者共用 build `9c76a8cd-159a-4146-9797-d4c89bd0ab64`；部署前後 code hash／revision 已更新。Secret `COMFY_CLOUD_API_KEY` version 1、環境設定、Node.js 20 與 allowlist 沿用，未讀取金鑰值。`bytePlusGenerate`、`magnificDownloadImage`、`magnificGenerate`、`magnificGenerateClassic` 的 CLI metadata 不變；未部署 Firestore rules／indexes。
- 不帶登入資訊、空 data 的三個 callable POST 均回 HTTP 401／UNAUTHENTICATED，CORS 回傳正式 Pages 來源 `https://cooperfu615-desinger.github.io`。請求在供應商操作前被拒絕，未查詢真實額度、認領生圖任務或消耗付費生成額度。
- 部署證據：`/tmp/vps-krea-functions-deploy.log`、`/tmp/vps-krea-cloud-{before,after}.jsonl`、`/tmp/vps-krea-deployment-verification.json`、`/tmp/vps-krea-deployment-smoke.json`。使用者已於 2026-10-09 授權此部署紀錄併 [Node 24 設定](firebase-functions-node24-v1.md) commit／push，交付狀態以遠端核對為準。
- 前端 Actions [37749256835](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/37749256835) 的 head SHA 與上述來源一致；查核時 Functions quality 成功，前端完整測試仍執行，Pages build／deploy 尚未開始。後端部署成功不代表新版介面已發布；待正式前端更新後再驗收 Krea 與逐張生成。
- CLI 提示 Node.js 20 將於 2026-10-30 停止支援部署，本次未升級 runtime／dependencies。原未追蹤參考資料夾保留。

官方依據（2026-10-08 查核）：[Krea 節點](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_krea.py)、[Krea API schema](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/apis/krea.py)、[Comfy 前端執行次數](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/scripts/app.ts)、[Partner 並行限制](https://docs.comfy.org/tutorials/partner-nodes/concurrency-limits)。重試後成功不構成已確認失敗根因。
